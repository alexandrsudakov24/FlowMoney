import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { auth } from '../firebase';
import { saveCurrencyPreference, createUserProfile, ensureUserProfile } from '../services/auth';

vi.mock('../firebase', () => ({ auth: { currentUser: null } }));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInAnonymously: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    EmailAuthProvider: { credential: vi.fn(() => ({})) },
    linkWithCredential: vi.fn(),
    GoogleAuthProvider: Object.assign(
        vi.fn().mockImplementation(function GoogleAuthProvider() { /* noop */ }),
        { credentialFromError: vi.fn(() => ({})) },
    ),
    signInWithPopup: vi.fn(),
    linkWithPopup: vi.fn(),
    signInWithCredential: vi.fn(),
}));

vi.mock('../services/auth', () => ({
    fetchUserLanguage: vi.fn(),
    createUserProfile: vi.fn().mockResolvedValue(undefined),
    ensureUserProfile: vi.fn().mockResolvedValue(undefined),
    updateUserLanguage: vi.fn(),
    saveCurrencyPreference: vi.fn().mockResolvedValue(undefined),
}));

describe('authStore — guest currency migration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        (auth as { currentUser: unknown }).currentUser = null;
    });

    it('register() migrates the guest currency to Firestore when upgrading an anonymous account', async () => {
        const { linkWithCredential, updateProfile } = await import('firebase/auth');
        (auth as { currentUser: unknown }).currentUser = { isAnonymous: true };
        localStorage.setItem('currency', 'EUR');
        (linkWithCredential as Mock).mockResolvedValue({ user: { uid: 'uid-1' } });
        (updateProfile as Mock).mockResolvedValue(undefined);

        await useAuthStore.getState().register({ name: 'Bob', email: 'bob@test.com', password: 'pw123456' });

        expect(createUserProfile).toHaveBeenCalledWith('uid-1', expect.objectContaining({ email: 'bob@test.com' }));
        expect(saveCurrencyPreference).toHaveBeenCalledWith('uid-1', 'EUR');
    });

    it('register() does not touch Firestore currency when the guest never picked one', async () => {
        const { linkWithCredential, updateProfile } = await import('firebase/auth');
        (auth as { currentUser: unknown }).currentUser = { isAnonymous: true };
        (linkWithCredential as Mock).mockResolvedValue({ user: { uid: 'uid-2' } });
        (updateProfile as Mock).mockResolvedValue(undefined);

        await useAuthStore.getState().register({ name: 'Bob', email: 'bob@test.com', password: 'pw123456' });

        expect(saveCurrencyPreference).not.toHaveBeenCalled();
    });

    it('register() does not migrate currency for a brand-new (non-guest) sign-up', async () => {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        localStorage.setItem('currency', 'EUR');
        (createUserWithEmailAndPassword as Mock).mockResolvedValue({ user: { uid: 'uid-3' } });
        (updateProfile as Mock).mockResolvedValue(undefined);

        await useAuthStore.getState().register({ name: 'Alice', email: 'alice@test.com', password: 'pw123456' });

        expect(saveCurrencyPreference).not.toHaveBeenCalled();
    });

    it('loginWithGoogle() migrates the guest currency when linking succeeds', async () => {
        const { linkWithPopup } = await import('firebase/auth');
        (auth as { currentUser: unknown }).currentUser = { isAnonymous: true };
        localStorage.setItem('currency', 'ILS');
        (linkWithPopup as Mock).mockResolvedValue({
            user: { uid: 'uid-4', displayName: 'A', email: 'a@test.com', photoURL: null },
        });

        await useAuthStore.getState().loginWithGoogle();

        expect(ensureUserProfile).toHaveBeenCalledWith('uid-4', expect.objectContaining({ email: 'a@test.com' }));
        expect(saveCurrencyPreference).toHaveBeenCalledWith('uid-4', 'ILS');
    });

    it('loginWithGoogle() migrates the guest currency via the fallback path when linking fails', async () => {
        const { linkWithPopup, signInWithCredential } = await import('firebase/auth');
        (auth as { currentUser: unknown }).currentUser = { isAnonymous: true };
        localStorage.setItem('currency', 'RUB');
        (linkWithPopup as Mock).mockRejectedValue(new Error('link failed'));
        (signInWithCredential as Mock).mockResolvedValue({
            user: { uid: 'uid-5', displayName: 'B', email: 'b@test.com', photoURL: null },
        });

        await useAuthStore.getState().loginWithGoogle();

        expect(saveCurrencyPreference).toHaveBeenCalledWith('uid-5', 'RUB');
    });
});
