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
    linkWithPopup,
    signInWithCredential,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
    fetchUserLanguage,
    createUserProfile,
    ensureUserProfile,
    updateUserLanguage,
    saveCurrencyPreference,
} from '../services/auth';
import type { User } from '../types/auth';

// When a guest (anonymous) account is upgraded to a real one, carry over the
// currency they picked — it only ever lived in localStorage until now.
async function migrateGuestCurrency(uid: string): Promise<void> {
    const currency = localStorage.getItem('currency');
    if (!currency) return;
    try {
        await saveCurrencyPreference(uid, currency);
    } catch (e) {
        console.warn('Failed to migrate guest currency to Firestore:', e);
    }
}

const DEFAULT_LANGUAGE = 'en';

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

// isAuthenticated/isGuest are fully determined by `user` — deriving them here
// (instead of setting all 3 fields by hand at every call site) means they can
// never drift out of sync with it.
function deriveAuthFlags(user: User | null): Pick<AuthStore, 'isAuthenticated' | 'isGuest'> {
    return {
        isAuthenticated: !!user && !user.isAnonymous,
        isGuest: !!user?.isAnonymous,
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
                    const user: User = { id: fbUser.uid, name: '', email: '', isAnonymous: true };
                    set({ user, isAdmin: false, authReady: true, ...deriveAuthFlags(user) });
                    return;
                }
                try {
                    // Load language preference and admin claim in parallel
                    const [language, tokenResult] = await Promise.all([
                        fetchUserLanguage(fbUser.uid),
                        fbUser.getIdTokenResult(),
                    ]);
                    const user = buildPublicUser(fbUser, language);
                    set({ user, isAdmin: tokenResult.claims['admin'] === true, authReady: true, ...deriveAuthFlags(user) });
                } catch (e) {
                    console.warn('Failed to load auth profile from Firestore', e);
                    const user = buildPublicUser(fbUser);
                    set({ user, isAdmin: false, authReady: true, ...deriveAuthFlags(user) });
                }
            } else {
                // Logged out
                set({ user: null, isAdmin: false, authReady: true, ...deriveAuthFlags(null) });
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
                    language: data.language || DEFAULT_LANGUAGE,
                });
                await migrateGuestCurrency(linked.user.uid);
                const publicUser: User = {
                    id: linked.user.uid,
                    name: data.name,
                    email: data.email,
                    language: data.language || DEFAULT_LANGUAGE,
                };
                set({ user: publicUser, ...deriveAuthFlags(publicUser) });
                return publicUser;
            } catch (linkErr: unknown) {
                const code = (linkErr as { code?: string })?.code;
                if (code === 'auth/email-already-in-use') {
                    throw Object.assign(new Error('email_already_in_use'), { code: 'email_already_in_use' });
                }
                // Any other failure while upgrading the guest account is fatal here —
                // falling through to createUserWithEmailAndPassword would silently
                // create a second account and orphan the guest's existing data.
                throw linkErr;
            }
        }

        // Normal registration (no anonymous account to upgrade)
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(cred.user, { displayName: data.name });
        await createUserProfile(cred.user.uid, {
            name: data.name,
            email: data.email,
            language: data.language || DEFAULT_LANGUAGE,
        });
        const publicUser: User = {
            id: cred.user.uid,
            name: data.name,
            email: data.email,
            language: data.language || DEFAULT_LANGUAGE,
        };
        set({ user: publicUser, ...deriveAuthFlags(publicUser) });
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
        set({ user: publicUser, ...deriveAuthFlags(publicUser) });
        return publicUser;
    },

    loginWithGoogle: async () => {
        const provider = new GoogleAuthProvider();

        // Finishes a Google sign-in once we have a Firebase user, whether that
        // came from a fresh popup sign-in or from upgrading a guest account.
        const finishGoogleLogin = async (fbUser: FirebaseUser, language?: 'en' | 'ru' | 'he') => {
            await ensureUserProfile(fbUser.uid, {
                name: fbUser.displayName || '',
                email: fbUser.email || '',
                language: DEFAULT_LANGUAGE,
            });
            const publicUser = buildPublicUser(fbUser, language);
            set({ user: publicUser, ...deriveAuthFlags(publicUser) });
            return publicUser;
        };

        // Same as register — try to upgrade anonymous account first
        if (auth.currentUser?.isAnonymous) {
            try {
                const linked = await linkWithPopup(auth.currentUser, provider);
                await migrateGuestCurrency(linked.user.uid);
                return await finishGoogleLogin(linked.user);
            } catch (linkErr: unknown) {
                console.warn('Failed to link Google to anonymous account:', linkErr);
                const credential = GoogleAuthProvider.credentialFromError(
                    linkErr as Parameters<typeof GoogleAuthProvider.credentialFromError>[0],
                );
                if (!credential) throw new Error('Failed to extract Google credential');
                const result = await signInWithCredential(auth, credential);
                await migrateGuestCurrency(result.user.uid);
                return await finishGoogleLogin(result.user);
            }
        }

        const cred = await signInWithPopup(auth, provider);
        const language = await fetchUserLanguage(cred.user.uid);
        return await finishGoogleLogin(cred.user, language ?? DEFAULT_LANGUAGE);
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
