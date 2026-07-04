import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AppRole } from '../types/auth';
import { useAuthStore } from '../stores/authStore';
export type { User, AppRole };

type AuthContextType = {
    user: User | null;
    role: AppRole | null;
    authReady: boolean;
    register: (data: { name: string; email: string; password: string; language?: 'en' | 'ru' | 'he' }) => Promise<User>;
    login: (data: { email: string; password: string }) => Promise<User>;
    loginWithGoogle: () => Promise<User>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
    updateLanguage: (lang: 'en' | 'ru' | 'he') => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider is now a thin wrapper — all logic lives in authStore.
// It starts the Firebase listener on mount and passes the store values to context
// so that all existing useAuth() calls continue to work without changes.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const store = useAuthStore();

    // Start the Firebase Auth listener once when the app loads
    useEffect(() => {
        const unsub = store._init();
        return unsub;
    }, []);

    const role: AppRole | null = !store.user
        ? null
        : store.isAdmin ? 'admin' : store.isGuest ? 'guest' : 'user';

    return (
        <AuthContext.Provider value={{
            user: store.user,
            role,
            authReady: store.authReady,
            register: store.register,
            login: store.login,
            loginWithGoogle: store.loginWithGoogle,
            loginAnonymously: store.loginAnonymously,
            logout: store.logout,
            updateLanguage: store.updateLanguage,
        }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;
