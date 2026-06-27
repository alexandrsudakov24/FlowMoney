import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { db } from '../firebase';
import {
    doc, collection, onSnapshot,
    query, where,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
import type { Family, Invitation } from '../types';
import * as familySvc from '../services/family';

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
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [family, setFamily] = useState<Family | null>(null);
    const [familyLoading, setFamilyLoading] = useState(true);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    // undefined = not yet resolved, null = no family, string = has family
    const [familyId, setFamilyId] = useState<string | null | undefined>(undefined);

    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;

    // Effect 1: subscribe to userDoc (→ familyId) + pending invitations
    useEffect(() => {
        const hasAccount = isAuthenticated && userId && !!userEmail;
        if (!hasAccount) {
            setFamilyId(null);
            setFamilyLoading(false);
            setInvitations([]);
            return;
        }

        const userUnsub = onSnapshot(
            doc(db, 'users', userId),
            (snap) => setFamilyId(snap.exists() ? (snap.data()?.familyId ?? null) : null),
            () => setFamilyId(null),
        );

        const q = query(
            collection(db, 'invitations'),
            where('invitedEmail', '==', userEmail),
        );
        const invUnsub = onSnapshot(q, (snap) => {
            setInvitations(
                snap.docs
                    .map((d) => ({ id: d.id, ...(d.data() as Omit<Invitation, 'id'>) }))
                    .filter((inv) => inv.status === 'pending'),
            );
        }, () => setInvitations([]));

        return () => { userUnsub(); invUnsub(); };
    }, [isAuthenticated, userId, userEmail]);

    // Effect 2: subscribe to family doc once familyId is known
    useEffect(() => {
        if (familyId === undefined) return; // userDoc not yet resolved
        if (!familyId) {
            setFamily(null);
            setFamilyLoading(false);
            return;
        }
        setFamilyLoading(true);
        const unsub = onSnapshot(
            doc(db, 'families', familyId),
            (snap) => {
                setFamily(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Family, 'id'>) } : null);
                setFamilyLoading(false);
            },
            () => { setFamily(null); setFamilyLoading(false); },
        );
        return () => unsub();
    }, [familyId]);

    const createFamily = async (name: string): Promise<void> => {
        if (!user || !user.email) return;
        try {
            const newFamily = await familySvc.createFamily(user, name);
            setFamily(newFamily);
        } catch (err) {
            console.error('Failed to create family', err);
            showToast(t('save_error'));
        }
    };

    const inviteMember = async (email: string): Promise<InviteResult> => {
        if (!user || !family) return { success: false, error: 'not_in_family' };
        try {
            return await familySvc.inviteMember(user, family, email);
        } catch (err) {
            console.error('Failed to send invitation', err);
            showToast(t('save_error'));
            return { success: false, error: 'send_failed' };
        }
    };

    const acceptInvitation = async (invitationId: string): Promise<void> => {
        if (!user || !user.email) return;
        try {
            const newFamily = await familySvc.acceptInvitation(user, invitationId);
            if (newFamily) setFamily(newFamily);
        } catch (err) {
            console.error('Failed to accept invitation', err);
            showToast(t('save_error'));
        }
    };

    const declineInvitation = async (invitationId: string): Promise<void> => {
        try {
            await familySvc.declineInvitation(invitationId);
        } catch (err) {
            console.error('Failed to decline invitation', err);
            showToast(t('save_error'));
        }
    };

    const leaveFamily = async (): Promise<void> => {
        if (!user || !family) return;
        try {
            await familySvc.leaveFamily(user, family);
            setFamily(null);
        } catch (err) {
            console.error('Failed to leave family', err);
            showToast(t('save_error'));
        }
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
