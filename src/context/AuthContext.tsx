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
};

type RegisterData = { name: string; email: string; password: string; language?: 'en' | 'ru' | 'he' };
type LoginData = { email: string; password: string };

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    register: (data: RegisterData) => Promise<User>;
    login: (data: LoginData) => Promise<User>;
    loginWithGoogle: () => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        (async () => {
            try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            } catch (anonErr) {
                console.warn('AuthContext: anonymous sign-in failed', anonErr);
            }
        })();
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                    const language = userDoc.exists() ? (userDoc.data()?.language as 'en' | 'ru' | 'he' | undefined) : undefined;
                    setUser({
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email || '',
                        email: fbUser.email || '',
                        language,
                        photoURL: fbUser.photoURL || undefined,
                    });
                } catch (e: unknown) {
                    console.warn('failed to load auth profile from firestore', e);
                    setUser({
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email || '',
                        email: fbUser.email || '',
                    });
                }
            } else {
                setUser(null);
            }
        });
        return () => unsub();
    }, []);

    const register = async (data: RegisterData) => {
        if (auth.currentUser && (auth.currentUser as any).isAnonymous) {
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
            } catch (linkErr) {
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
        try {
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
        } catch (err) {
            throw err;
        }
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();

            // если текущий юзер анонимный — линкуем аккаунт Google к нему
            if (auth.currentUser && (auth.currentUser as any).isAnonymous) {
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
                } catch (linkErr) {
                    console.warn('Failed to link Google to anonymous account:', linkErr);
                    // fallthrough — войдём обычным способом
                }
            }

            const cred = await signInWithPopup(auth, provider);
            const fbUser = cred.user;

            // создаём профиль в Firestore если его нет
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
        } catch (err) {
            throw err;
        }
    };

    const logout = async () => {
        await fbSignOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, loginWithGoogle, logout }}>
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
