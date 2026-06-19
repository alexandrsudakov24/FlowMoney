import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { useAuth, AuthProvider } from '../context/AuthContext';

// ── Firebase mocks ────────────────────────────────────────────────────────────

let triggerAuthState: (user: unknown) => void = () => {};

vi.mock('../firebase', () => ({ auth: {}, db: {} }));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
        triggerAuthState = cb;
        return vi.fn();
    }),
    signInAnonymously: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    EmailAuthProvider: { credential: vi.fn() },
    GoogleAuthProvider: vi.fn(() => ({})),
    signInWithPopup: vi.fn(),
    linkWithCredential: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
    setDoc: vi.fn(),
}));

// ── Fake Firebase users ───────────────────────────────────────────────────────

const anonFbUser = {
    uid: 'anon-1',
    isAnonymous: true,
    email: null,
    displayName: null,
    photoURL: null,
};

const makeFbUser = (overrides: object = {}) => ({
    uid: 'user-1',
    isAnonymous: false,
    email: 'user@test.com',
    displayName: 'Test User',
    photoURL: null,
    getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    ...overrides,
});

// ── Helper component ──────────────────────────────────────────────────────────

const Consumer = () => {
    const { user, isAuthenticated, isGuest, isAdmin, authReady } = useAuth();
    if (!authReady) return <div>loading</div>;
    return (
        <div>
            <span data-testid="ready">ready</span>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <span data-testid="guest">{String(isGuest)}</span>
            <span data-testid="admin">{String(isAdmin)}</span>
            <span data-testid="email">{user?.email ?? 'none'}</span>
        </div>
    );
};

const renderWithAuth = () => render(<AuthProvider><Consumer /></AuthProvider>);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows loading until auth state resolves', () => {
        renderWithAuth();
        expect(screen.getByText('loading')).toBeInTheDocument();
    });

    it('anonymous user → isGuest true, isAuthenticated false', async () => {
        renderWithAuth();
        await act(async () => triggerAuthState(anonFbUser));
        await waitFor(() => expect(screen.getByTestId('ready')).toBeInTheDocument());

        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('guest').textContent).toBe('true');
        expect(screen.getByTestId('admin').textContent).toBe('false');
    });

    it('signed-in user → isAuthenticated true, isGuest false', async () => {
        const { getDoc } = await import('firebase/firestore');
        (getDoc as Mock).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ language: 'en' }),
        });

        renderWithAuth();
        await act(async () => triggerAuthState(makeFbUser()));
        await waitFor(() => expect(screen.getByTestId('ready')).toBeInTheDocument());

        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('guest').textContent).toBe('false');
        expect(screen.getByTestId('email').textContent).toBe('user@test.com');
    });

    it('user with admin claim → isAdmin true', async () => {
        renderWithAuth();
        await act(async () => triggerAuthState(makeFbUser({
            getIdTokenResult: vi.fn().mockResolvedValue({ claims: { admin: true } }),
        })));
        await waitFor(() => expect(screen.getByTestId('ready')).toBeInTheDocument());

        expect(screen.getByTestId('admin').textContent).toBe('true');
    });

    it('logout → all flags false', async () => {
        renderWithAuth();
        await act(async () => triggerAuthState(makeFbUser()));
        await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('true'));

        await act(async () => triggerAuthState(null));
        await waitFor(() => {
            expect(screen.getByTestId('authenticated').textContent).toBe('false');
            expect(screen.getByTestId('guest').textContent).toBe('false');
            expect(screen.getByTestId('admin').textContent).toBe('false');
        });
    });
});
