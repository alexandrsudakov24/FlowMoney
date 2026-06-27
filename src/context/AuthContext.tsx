import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { auth } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as fbSignOut,
    onAuthStateChanged,
    updateProfile,
    signInAnonymously,
    EmailAuthProvider,
    linkWithCredential,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import {
    fetchUserLanguage,
    createUserProfile,
    ensureUserProfile,
    updateUserLanguage,
} from '../services/auth';

import type { User } from '../types/auth';
export type { User };

type RegisterData = { name: string; email: string; password: string; language?: 'en' | 'ru' | 'he' };
type LoginData = { email: string; password: string };

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isAdmin: boolean;
    authReady: boolean;
    register: (data: RegisterData) => Promise<User>;
    login: (data: LoginData) => Promise<User>;
    loginWithGoogle: () => Promise<User>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
    updateLanguage: (lang: 'en' | 'ru' | 'he') => Promise<void>;
};

import type { User as FirebaseUser } from 'firebase/auth';

function buildPublicUser(fbUser: FirebaseUser, language?: 'en' | 'ru' | 'he'): User {
    return {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email || '',
        email: fbUser.email || '',
        language,
        photoURL: fbUser.photoURL || undefined,
    };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                if (fbUser.isAnonymous) {
                    setUser({ id: fbUser.uid, name: '', email: '', isAnonymous: true });
                    setIsAdmin(false);
                    setAuthReady(true);
                    return;
                }
                try {
                    const [language, tokenResult] = await Promise.all([
                        fetchUserLanguage(fbUser.uid),
                        fbUser.getIdTokenResult(),
                    ]);
                    setUser(buildPublicUser(fbUser, language));
                    setIsAdmin(tokenResult.claims['admin'] === true);
                } catch (e: unknown) {
                    console.warn('failed to load auth profile from firestore', e);
                    setUser(buildPublicUser(fbUser));
                    setIsAdmin(false);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    const loginAnonymously = async () => {
        await signInAnonymously(auth);
    };

    const register = async (data: RegisterData) => {
        if (auth.currentUser?.isAnonymous) {
            try {
                const credential = EmailAuthProvider.credential(data.email, data.password);
                const linked = await linkWithCredential(auth.currentUser, credential);
                await updateProfile(linked.user, { displayName: data.name });
                await createUserProfile(linked.user.uid, {
                    name: data.name,
                    email: data.email,
                    language: data.language || 'en',
                });
                const publicUser: User = {
                    id: linked.user.uid,
                    name: data.name,
                    email: data.email,
                    language: data.language || 'en',
                };
                setUser(publicUser);
                return publicUser;
            } catch (linkErr: unknown) {
                const code = (linkErr as { code?: string })?.code;
                if (code === 'auth/email-already-in-use') {
                    throw Object.assign(new Error('email_already_in_use'), { code: 'email_already_in_use' });
                }
                console.warn('Failed to link anonymous account, falling back to createUser:', linkErr);
            }
        }
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(cred.user, { displayName: data.name });
        await createUserProfile(cred.user.uid, {
            name: data.name,
            email: data.email,
            language: data.language || 'en',
        });
        const publicUser: User = {
            id: cred.user.uid,
            name: data.name,
            email: data.email,
            language: data.language || 'en',
        };
        setUser(publicUser);
        return publicUser;
    };

    const login = async (data: LoginData) => {
        const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
        let language: 'en' | 'ru' | 'he' | undefined = undefined;
        try {
            language = await fetchUserLanguage(cred.user.uid);
        } catch (profileErr) {
            console.warn('failed to load profile from firestore:', profileErr);
        }
        const publicUser = buildPublicUser(cred.user, language);
        setUser(publicUser);
        return publicUser;
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();

        if (auth.currentUser?.isAnonymous) {
            try {
                const { linkWithPopup } = await import('firebase/auth');
                const linked = await linkWithPopup(auth.currentUser, provider);
                const fbUser = linked.user;
                await ensureUserProfile(fbUser.uid, {
                    name: fbUser.displayName || '',
                    email: fbUser.email || '',
                    language: 'en',
                });
                const publicUser = buildPublicUser(fbUser);
                setUser(publicUser);
                return publicUser;
            } catch (linkErr: unknown) {
                console.warn('Failed to link Google to anonymous account:', linkErr);
                const { GoogleAuthProvider: GA, signInWithCredential } = await import('firebase/auth');
                const credential = GA.credentialFromError(linkErr as Parameters<typeof GA.credentialFromError>[0]);
                if (!credential) {
                    throw new Error('Failed to extract credential from Google error');
                }
                const result = await signInWithCredential(auth, credential);
                const fbUser = result.user;
                await ensureUserProfile(fbUser.uid, {
                    name: fbUser.displayName || '',
                    email: fbUser.email || '',
                    language: 'en',
                });
                const publicUser = buildPublicUser(fbUser);
                setUser(publicUser);
                return publicUser;
            }
        }

        const cred = await signInWithPopup(auth, provider);
        const fbUser = cred.user;
        const language = await fetchUserLanguage(fbUser.uid);
        await ensureUserProfile(fbUser.uid, {
            name: fbUser.displayName || '',
            email: fbUser.email || '',
            language: 'en',
        });
        const publicUser = buildPublicUser(fbUser, language ?? 'en');
        setUser(publicUser);
        return publicUser;
    };

    const updateLanguage = async (lang: 'en' | 'ru' | 'he') => {
        if (!user || user.isAnonymous) return;
        setUser((prev) => prev ? { ...prev, language: lang } : prev);
        try {
            await updateUserLanguage(user.id, lang);
        } catch (e) {
            console.warn('Failed to save language to Firestore:', e);
        }
    };

    const logout = async () => {
        await fbSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user && !user.isAnonymous,
            isGuest: !!user?.isAnonymous,
            isAdmin,
            authReady,
            register,
            login,
            loginWithGoogle,
            loginAnonymously,
            logout,
            updateLanguage,
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
