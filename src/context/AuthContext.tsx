/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, updateProfile, signInAnonymously, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export type User = {
    id: string;
    name: string;
    email: string;
    language?: 'en' | 'ru' | 'he';
};

type RegisterData = { name: string; email: string; password: string; language?: 'en' | 'ru' | 'he' };
type LoginData = { email: string; password: string };

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    register: (data: RegisterData) => Promise<User>;
    login: (data: LoginData) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Ensure anonymous auth for guests so app can persist data to Firestore even before explicit login
        (async () => {
            try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                    console.log('AuthContext: signed in anonymously');
                }
            } catch (anonErr) {
                console.warn('AuthContext: anonymous sign-in failed', anonErr);
            }
        })();
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                    const language = userDoc.exists() ? (userDoc.data()?.language as string | undefined) : undefined;
                    setUser({
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email || '',
                        email: fbUser.email || '',
                        language,
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
        // If current user is anonymous, link the anonymous account to the provided email/password
        if (auth.currentUser && (auth.currentUser as any).isAnonymous) {
            try {
                const credential = EmailAuthProvider.credential(data.email, data.password);
                const linked = await linkWithCredential(auth.currentUser, credential);
                // set display name
                await updateProfile(linked.user, { displayName: data.name });
                // save extra profile data in Firestore
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
                // fallthrough to create new account
            }
        }
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        // set display name
        await updateProfile(cred.user, { displayName: data.name });
        // save extra profile data in Firestore
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
            console.log('AuthContext.login: starting, email:', data.email);
            console.log('AuthContext.login: auth object:', auth);
            const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
            console.log('signInWithEmailAndPassword success, uid:', cred.user.uid);
            // onAuthStateChanged listener will update state — but return resolved user for callers
            let language: string | undefined = undefined;
            try {
                const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
                language = userDoc.exists() ? (userDoc.data()?.language as string | undefined) : undefined;
                console.log('profile loaded, language:', language);
            } catch (profileErr) {
                console.warn('failed to load profile from firestore:', profileErr instanceof Error ? { message: profileErr.message, code: (profileErr as any).code } : profileErr);
                // continue without profile data if it fails
            }
            const publicUser: User = {
                id: cred.user.uid,
                name: cred.user.displayName || cred.user.email || '',
                email: cred.user.email || '',
                language,
            };
            setUser(publicUser);
            return publicUser;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            const errCode = err instanceof Error && 'code' in err ? (err as any).code : 'UNKNOWN';
            console.error('AuthContext.login FAILED:', { message: errMsg, code: errCode, fullError: err });
            throw err;
        }
    };

    const logout = async () => {
        await fbSignOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, logout }}>
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


