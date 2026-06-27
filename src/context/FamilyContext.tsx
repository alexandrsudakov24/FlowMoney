import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useFamilyStore } from '../stores/familyStore';
import type { InviteResult } from '../stores/familyStore';

export type { InviteResult };

type FamilyContextType = {
    family: import('../types').Family | null;
    familyLoading: boolean;
    invitations: import('../types').Invitation[];
    createFamily: (name: string) => Promise<void>;
    inviteMember: (email: string) => Promise<InviteResult>;
    acceptInvitation: (invitationId: string) => Promise<void>;
    declineInvitation: (invitationId: string) => Promise<void>;
    leaveFamily: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

// FamilyProvider is now a thin wrapper — all logic lives in familyStore.
// Keeps useFamily() working across the app without any changes.
export const FamilyProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const store = useFamilyStore();

    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;

    // Wire Firestore listeners into the store whenever the user changes
    useEffect(() => {
        const unsub = store._subscribe(userId, userEmail, isAuthenticated, user, showToast);
        return unsub;
    }, [userId, userEmail, isAuthenticated]);

    return (
        <FamilyContext.Provider value={{
            family: store.family,
            familyLoading: store.familyLoading,
            invitations: store.invitations,
            createFamily: store.createFamily,
            inviteMember: store.inviteMember,
            acceptInvitation: store.acceptInvitation,
            declineInvitation: store.declineInvitation,
            leaveFamily: store.leaveFamily,
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
