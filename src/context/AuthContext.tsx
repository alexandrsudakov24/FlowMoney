/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { auth, db } from '../firebase';
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
import { doc, setDoc, getDoc } from 'firebase/firestore';

export type User = {
    id: string;
    name: string;
    email: string;
    language?: 'en' | 'ru' | 'he';
    photoURL?: string;
    isAnonymous?: boolean;
};

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
                    const [userDoc, tokenResult] = await Promise.all([
                        getDoc(doc(db, 'users', fbUser.uid)),
                        fbUser.getIdTokenResult(),
                    ]);
                    const language = userDoc.exists() ? (userDoc.data()?.language as 'en' | 'ru' | 'he' | undefined) : undefined;
                    setUser({
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email || '',
                        email: fbUser.email || '',
                        language,
                        photoURL: fbUser.photoURL || undefined,
                    });
                    setIsAdmin(tokenResult.claims['admin'] === true);
                } catch (e: unknown) {
                    console.warn('failed to load auth profile from firestore', e);
                    setUser({
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email || '',
                        email: fbUser.email || '',
                    });
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
                await setDoc(doc(db, 'users', linked.user.uid), {
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
                    // Email taken — throw so RegisterPage shows "sign in" prompt
                    // without creating a new UID and losing anonymous data
                    throw Object.assign(new Error('email_already_in_use'), { code: 'email_already_in_use' });
                }
                console.warn('Failed to link anonymous account, falling back to createUser:', linkErr);
            }
        }
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(cred.user, { displayName: data.name });
        await setDoc(doc(db, 'users', cred.user.uid), {
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
            const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
            language = userDoc.exists() ? (userDoc.data()?.language as 'en' | 'ru' | 'he' | undefined) : undefined;
        } catch (profileErr) {
            console.warn('failed to load profile from firestore:', profileErr);
        }
        const publicUser: User = {
            id: cred.user.uid,
            name: cred.user.displayName || cred.user.email || '',
            email: cred.user.email || '',
            language,
            photoURL: cred.user.photoURL || undefined,
        };
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
                    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, 'users', fbUser.uid), {
                            name: fbUser.displayName || '',
                            email: fbUser.email || '',
                            language: 'en',
                        });
                    }
                    const publicUser: User = {
                        id: fbUser.uid,
                        name: fbUser.displayName || '',
                        email: fbUser.email || '',
                        photoURL: fbUser.photoURL || undefined,
                    };
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
                    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                    if (!userDoc.exists()) {
                        await setDoc(doc(db, 'users', fbUser.uid), {
                            name: fbUser.displayName || '',
                            email: fbUser.email || '',
                            language: 'en',
                        });
                    }
                    const publicUser: User = {
                        id: fbUser.uid,
                        name: fbUser.displayName || '',
                        email: fbUser.email || '',
                        photoURL: fbUser.photoURL || undefined,
                    };
                    setUser(publicUser);
                    return publicUser;
                }
            }

            const cred = await signInWithPopup(auth, provider);
            const fbUser = cred.user;
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', fbUser.uid), {
                    name: fbUser.displayName || '',
                    email: fbUser.email || '',
                    language: 'en',
                });
            }
            const language = userDoc.exists()
                ? (userDoc.data()?.language as 'en' | 'ru' | 'he' | undefined)
                : 'en';
            const publicUser: User = {
                id: fbUser.uid,
                name: fbUser.displayName || '',
                email: fbUser.email || '',
                language,
                photoURL: fbUser.photoURL || undefined,
            };
            setUser(publicUser);
        return publicUser;
    };

    const updateLanguage = async (lang: 'en' | 'ru' | 'he') => {
        if (!user || user.isAnonymous) return;
        setUser((prev) => prev ? { ...prev, language: lang } : prev);
        try {
            await setDoc(doc(db, 'users', user.id), { language: lang }, { merge: true });
        } catch (e) {
            console.warn('Failed to save language to Firestore:', e);
        }
    };

    const logout = async () => {
        await fbSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user && !user.isAnonymous, isGuest: !!user?.isAnonymous, isAdmin, authReady, register, login, loginWithGoogle, loginAnonymously, logout, updateLanguage }}>
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
