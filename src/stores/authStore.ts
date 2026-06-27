import { create } from 'zustand';
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
import type { User as FirebaseUser } from 'firebase/auth';
import {
    fetchUserLanguage,
    createUserProfile,
    ensureUserProfile,
    updateUserLanguage,
} from '../services/auth';
import type { User } from '../types/auth';

type RegisterData = { name: string; email: string; password: string; language?: 'en' | 'ru' | 'he' };
type LoginData = { email: string; password: string };

type AuthStore = {
    // --- state ---
    user: User | null;
    isAdmin: boolean;
    authReady: boolean; // true once Firebase has resolved the initial auth state
    isAuthenticated: boolean; // true for real (non-anonymous) logged-in users
    isGuest: boolean; // true for anonymous users

    // --- actions ---
    register: (data: RegisterData) => Promise<User>;
    login: (data: LoginData) => Promise<User>;
    loginWithGoogle: () => Promise<User>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
    updateLanguage: (lang: 'en' | 'ru' | 'he') => Promise<void>;

    // --- internal setup (called once from AuthProvider) ---
    _init: () => () => void; // returns unsubscribe function
};

// Build our app User object from a Firebase user
function buildPublicUser(fbUser: FirebaseUser, language?: 'en' | 'ru' | 'he'): User {
    return {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email || '',
        email: fbUser.email || '',
        language,
        photoURL: fbUser.photoURL || undefined,
    };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    isAdmin: false,
    authReady: false,
    isAuthenticated: false,
    isGuest: false,

    // Start listening to Firebase Auth state changes.
    // Called once when AuthProvider mounts — runs for the entire app lifetime.
    _init: () => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                if (fbUser.isAnonymous) {
                    // Anonymous user — no Firestore profile needed
                    set({
                        user: { id: fbUser.uid, name: '', email: '', isAnonymous: true },
                        isAdmin: false,
                        authReady: true,
                        isAuthenticated: false,
                        isGuest: true,
                    });
                    return;
                }
                try {
                    // Load language preference and admin claim in parallel
                    const [language, tokenResult] = await Promise.all([
                        fetchUserLanguage(fbUser.uid),
                        fbUser.getIdTokenResult(),
                    ]);
                    set({
                        user: buildPublicUser(fbUser, language),
                        isAdmin: tokenResult.claims['admin'] === true,
                        authReady: true,
                        isAuthenticated: true,
                        isGuest: false,
                    });
                } catch (e) {
                    console.warn('Failed to load auth profile from Firestore', e);
                    set({
                        user: buildPublicUser(fbUser),
                        isAdmin: false,
                        authReady: true,
                        isAuthenticated: true,
                        isGuest: false,
                    });
                }
            } else {
                // Logged out
                set({ user: null, isAdmin: false, authReady: true, isAuthenticated: false, isGuest: false });
            }
        });
        return unsub;
    },

    loginAnonymously: async () => {
        await signInAnonymously(auth);
        // onAuthStateChanged above will update the store automatically
    },

    register: async (data) => {
        // If the user is currently a guest, link their account instead of creating a new one.
        // This preserves any expenses they added before signing up.
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
                set({ user: publicUser, isAuthenticated: true, isGuest: false });
                return publicUser;
            } catch (linkErr: unknown) {
                const code = (linkErr as { code?: string })?.code;
                if (code === 'auth/email-already-in-use') {
                    throw Object.assign(new Error('email_already_in_use'), { code: 'email_already_in_use' });
                }
                console.warn('Failed to link anonymous account, falling back to createUser:', linkErr);
            }
        }

        // Normal registration (no anonymous account to upgrade)
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
        set({ user: publicUser, isAuthenticated: true, isGuest: false });
        return publicUser;
    },

    login: async (data) => {
        const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
        let language: 'en' | 'ru' | 'he' | undefined;
        try {
            language = await fetchUserLanguage(cred.user.uid);
        } catch (err) {
            console.warn('Failed to load profile from Firestore:', err);
        }
        const publicUser = buildPublicUser(cred.user, language);
        set({ user: publicUser, isAuthenticated: true, isGuest: false });
        return publicUser;
    },

    loginWithGoogle: async () => {
        const provider = new GoogleAuthProvider();

        // Same as register — try to upgrade anonymous account first
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
                set({ user: publicUser, isAuthenticated: true, isGuest: false });
                return publicUser;
            } catch (linkErr: unknown) {
                console.warn('Failed to link Google to anonymous account:', linkErr);
                const { GoogleAuthProvider: GA, signInWithCredential } = await import('firebase/auth');
                const credential = GA.credentialFromError(linkErr as Parameters<typeof GA.credentialFromError>[0]);
                if (!credential) throw new Error('Failed to extract Google credential');
                const result = await signInWithCredential(auth, credential);
                const fbUser = result.user;
                await ensureUserProfile(fbUser.uid, {
                    name: fbUser.displayName || '',
                    email: fbUser.email || '',
                    language: 'en',
                });
                const publicUser = buildPublicUser(fbUser);
                set({ user: publicUser, isAuthenticated: true, isGuest: false });
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
        set({ user: publicUser, isAuthenticated: true, isGuest: false });
        return publicUser;
    },

    logout: async () => {
        await fbSignOut(auth);
        // onAuthStateChanged will clear the user from the store automatically
    },

    updateLanguage: async (lang) => {
        const { user } = get();
        if (!user || user.isAnonymous) return;
        set({ user: { ...user, language: lang } });
        try {
            await updateUserLanguage(user.id, lang);
        } catch (e) {
            console.warn('Failed to save language to Firestore:', e);
        }
    },
}));
