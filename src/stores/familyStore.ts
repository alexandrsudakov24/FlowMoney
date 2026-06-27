import { create } from 'zustand';
import { db } from '../firebase';
import {
    doc, collection, onSnapshot,
    query, where,
} from 'firebase/firestore';
import type { Family, Invitation } from '../types';
import type { User } from '../types/auth';
import * as familySvc from '../services/family';

export type InviteResult = { success: boolean; error?: string };

type FamilyStore = {
    // --- state ---
    family: Family | null;
    familyLoading: boolean;
    invitations: Invitation[];

    // --- actions (called from components) ---
    createFamily: (name: string) => Promise<void>;
    inviteMember: (email: string) => Promise<InviteResult>;
    acceptInvitation: (invitationId: string) => Promise<void>;
    declineInvitation: (invitationId: string) => Promise<void>;
    leaveFamily: () => Promise<void>;

    // --- internal setup (called from FamilyProvider when user changes) ---
    _subscribe: (
        userId: string | null,
        userEmail: string | null,
        isAuthenticated: boolean,
        user: User | null,
        showToast: (msg: string) => void,
    ) => () => void;
};

export const useFamilyStore = create<FamilyStore>((set, get) => {
    // Plain variables — updated on every _subscribe call, not reactive
    let _user: User | null = null;
    let _showToast: (msg: string) => void = () => {};

    // Unsubscribe function for the family doc listener.
    // Stored here so we can cancel it when familyId changes.
    let _familyUnsub: (() => void) | null = null;

    return {
        family: null,
        familyLoading: true,
        invitations: [],

        // Called from FamilyProvider whenever the user or auth state changes.
        // Sets up two independent listeners:
        //   1. userDoc → reads familyId, then subscribes to the family doc
        //   2. invitations collection → keeps pending invites in sync
        _subscribe: (userId, userEmail, isAuthenticated, user, showToast) => {
            _user = user;
            _showToast = showToast;

            // Not a real (non-anonymous) logged-in user — reset everything
            if (!isAuthenticated || !userId || !userEmail) {
                set({ family: null, familyLoading: false, invitations: [] });
                return () => {};
            }

            // Listener 1: watch the user doc to get the current familyId
            const userUnsub = onSnapshot(
                doc(db, 'users', userId),
                (userSnap) => {
                    const familyId = userSnap.exists() ? (userSnap.data()?.familyId ?? null) : null;

                    // Cancel the previous family listener before starting a new one
                    if (_familyUnsub) { _familyUnsub(); _familyUnsub = null; }

                    if (!familyId) {
                        set({ family: null, familyLoading: false });
                        return;
                    }

                    // Listener 2: watch the family doc in real time
                    set({ familyLoading: true });
                    _familyUnsub = onSnapshot(
                        doc(db, 'families', familyId),
                        (snap) => {
                            set({
                                family: snap.exists()
                                    ? { id: snap.id, ...(snap.data() as Omit<Family, 'id'>) }
                                    : null,
                                familyLoading: false,
                            });
                        },
                        () => { set({ family: null, familyLoading: false }); },
                    );
                },
                () => { set({ family: null, familyLoading: false }); },
            );

            // Listener 3: watch pending invitations for this user's email
            const invUnsub = onSnapshot(
                query(collection(db, 'invitations'), where('invitedEmail', '==', userEmail)),
                (snap) => {
                    set({
                        invitations: snap.docs
                            .map((d) => ({ id: d.id, ...(d.data() as Omit<Invitation, 'id'>) }))
                            .filter((inv) => inv.status === 'pending'),
                    });
                },
                () => { set({ invitations: [] }); },
            );

            // Cleanup: stop all listeners
            return () => {
                userUnsub();
                invUnsub();
                if (_familyUnsub) { _familyUnsub(); _familyUnsub = null; }
            };
        },

        // Create a new family and set it as the current one
        createFamily: async (name) => {
            if (!_user || !_user.email) return;
            try {
                const newFamily = await familySvc.createFamily(_user, name);
                set({ family: newFamily });
            } catch (err) {
                console.error('Failed to create family', err);
                _showToast('save_error');
            }
        },

        // Send an invite to another user by email
        inviteMember: async (email) => {
            const { family } = get();
            if (!_user || !family) return { success: false, error: 'not_in_family' };
            try {
                return await familySvc.inviteMember(_user, family, email);
            } catch (err) {
                console.error('Failed to send invitation', err);
                _showToast('save_error');
                return { success: false, error: 'send_failed' };
            }
        },

        // Accept a pending invitation and join the family
        acceptInvitation: async (invitationId) => {
            if (!_user || !_user.email) return;
            try {
                const newFamily = await familySvc.acceptInvitation(_user, invitationId);
                if (newFamily) set({ family: newFamily });
            } catch (err) {
                console.error('Failed to accept invitation', err);
                _showToast('save_error');
            }
        },

        // Decline a pending invitation
        declineInvitation: async (invitationId) => {
            try {
                await familySvc.declineInvitation(invitationId);
            } catch (err) {
                console.error('Failed to decline invitation', err);
                _showToast('save_error');
            }
        },

        // Leave the current family
        leaveFamily: async () => {
            const { family } = get();
            if (!_user || !family) return;
            try {
                await familySvc.leaveFamily(_user, family);
                set({ family: null });
            } catch (err) {
                console.error('Failed to leave family', err);
                _showToast('save_error');
            }
        },
    };
});
