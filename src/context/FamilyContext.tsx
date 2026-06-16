/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../firebase';
import {
    doc, collection, addDoc, updateDoc, getDoc, onSnapshot,
    query, where, arrayUnion, arrayRemove, deleteField, writeBatch, getDocs, deleteDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Family, FamilyMember, Invitation } from '../types';

export type InviteResult = { success: boolean; error?: string };

type FamilyContextType = {
    family: Family | null;
    familyLoading: boolean;
    invitations: Invitation[];
    createFamily: (name: string) => Promise<void>;
    inviteMember: (email: string) => Promise<InviteResult>;
    acceptInvitation: (invitationId: string) => Promise<void>;
    declineInvitation: (invitationId: string) => Promise<void>;
    leaveFamily: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [family, setFamily] = useState<Family | null>(null);
    const [familyLoading, setFamilyLoading] = useState(true);
    const [invitations, setInvitations] = useState<Invitation[]>([]);

    // Load family when user is authenticated (non-anonymous)
    useEffect(() => {
        const hasAccount = isAuthenticated && user && !!user.email;
        if (!hasAccount) {
            setFamily(null);
            setFamilyLoading(false);
            return;
        }

        setFamilyLoading(true);
        let cancelled = false;
        let familyUnsub: (() => void) | null = null;

        getDoc(doc(db, 'users', user!.id)).then((userSnap) => {
            if (cancelled) return;
            const familyId = userSnap.exists() ? userSnap.data()?.familyId : null;
            if (familyId) {
                familyUnsub = onSnapshot(doc(db, 'families', familyId), (snap) => {
                    if (cancelled) return;
                    if (snap.exists()) {
                        setFamily({ id: snap.id, ...(snap.data() as Omit<Family, 'id'>) });
                    } else {
                        setFamily(null);
                    }
                    setFamilyLoading(false);
                });
            } else {
                setFamily(null);
                setFamilyLoading(false);
            }
        }).catch(() => {
            if (cancelled) return;
            setFamily(null);
            setFamilyLoading(false);
        });

        return () => {
            cancelled = true;
            if (familyUnsub) familyUnsub();
        };
    }, [isAuthenticated, user]);

    // Subscribe to pending invitations for current user's email
    useEffect(() => {
        const hasAccount = isAuthenticated && user && !!user.email;
        if (!hasAccount) {
            setInvitations([]);
            return;
        }

        // Single-field query to avoid composite index requirement; filter status client-side
        const q = query(
            collection(db, 'invitations'),
            where('invitedEmail', '==', user!.email)
        );

        const unsub = onSnapshot(q, (snap) => {
            const invs: Invitation[] = snap.docs
                .map((d) => ({ id: d.id, ...(d.data() as Omit<Invitation, 'id'>) }))
                .filter((inv) => inv.status === 'pending');
            setInvitations(invs);
        }, () => {
            setInvitations([]);
        });

        return () => unsub();
    }, [isAuthenticated, user]);

    const createFamily = async (name: string): Promise<void> => {
        if (!user || !user.email) return;
        const member: FamilyMember = { uid: user.id, email: user.email, name: user.name };
        const docRef = await addDoc(collection(db, 'families'), {
            name: name.trim(),
            ownerId: user.id,
            members: [member],
        });
        await updateDoc(doc(db, 'users', user.id), { familyId: docRef.id });
        setFamily({ id: docRef.id, name: name.trim(), ownerId: user.id, members: [member] });
    };

    const inviteMember = async (email: string): Promise<InviteResult> => {
        if (!user || !family) return { success: false, error: 'not_in_family' };
        const trimmedEmail = email.trim().toLowerCase();

        if (family.members.some(m => m.email.toLowerCase() === trimmedEmail)) {
            return { success: false, error: 'already_member' };
        }

        // Single-field query to avoid composite index; filter client-side
        const existingQ = query(
            collection(db, 'invitations'),
            where('invitedEmail', '==', trimmedEmail)
        );
        const existing = await getDocs(existingQ);
        if (existing.docs.some(d => d.data().familyId === family.id && d.data().status === 'pending')) {
            return { success: false, error: 'already_invited' };
        }

        await addDoc(collection(db, 'invitations'), {
            familyId: family.id,
            familyName: family.name,
            invitedEmail: trimmedEmail,
            invitedByUid: user.id,
            invitedByName: user.name,
            status: 'pending',
            createdAt: Date.now(),
        });

        return { success: true };
    };

    const acceptInvitation = async (invitationId: string): Promise<void> => {
        if (!user || !user.email) return;
        const invRef = doc(db, 'invitations', invitationId);
        const invSnap = await getDoc(invRef);
        if (!invSnap.exists()) return;
        const inv = invSnap.data();

        const member: FamilyMember = { uid: user.id, email: user.email, name: user.name };
        const batch = writeBatch(db);
        batch.update(doc(db, 'families', inv.familyId), { members: arrayUnion(member) });
        batch.update(doc(db, 'users', user.id), { familyId: inv.familyId });
        batch.update(invRef, { status: 'accepted' });
        await batch.commit();

        const familySnap = await getDoc(doc(db, 'families', inv.familyId));
        if (familySnap.exists()) {
            setFamily({ id: familySnap.id, ...(familySnap.data() as Omit<Family, 'id'>) });
        }
    };

    const declineInvitation = async (invitationId: string): Promise<void> => {
        await updateDoc(doc(db, 'invitations', invitationId), { status: 'declined' });
    };

    const leaveFamily = async (): Promise<void> => {
        if (!user || !family) return;
        const member = family.members.find(m => m.uid === user.id);
        if (!member) return;

        const remainingMembers = family.members.filter(m => m.uid !== user.id);
        const batch = writeBatch(db);

        if (remainingMembers.length === 0) {
            // Will delete family after batch
        } else {
            const updateData: Record<string, any> = { members: arrayRemove(member) };
            if (family.ownerId === user.id) {
                updateData.ownerId = remainingMembers[0].uid;
            }
            batch.update(doc(db, 'families', family.id), updateData);
        }

        batch.update(doc(db, 'users', user.id), { familyId: deleteField() });
        await batch.commit();

        if (remainingMembers.length === 0) {
            await deleteDoc(doc(db, 'families', family.id));
        }

        setFamily(null);
    };

    return (
        <FamilyContext.Provider value={{
            family,
            familyLoading,
            invitations,
            createFamily,
            inviteMember,
            acceptInvitation,
            declineInvitation,
            leaveFamily,
        }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const ctx = useContext(FamilyContext);
    if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
    return ctx;
};
