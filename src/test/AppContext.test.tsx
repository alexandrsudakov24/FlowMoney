import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';

// ── Hoist mock fns so vi.mock factory can reference them ──────────────────────

const { mockAddDoc, mockUpdateDoc, mockDeleteDoc, mockGetDocs, mockSetDoc, mockOnSnapshot } =
    vi.hoisted(() => {
        let expensesCb: ((snap: unknown) => void) | null = null;

        const mockOnSnapshot = vi.fn(
            (ref: { path?: string }, cb: (s: unknown) => void) => {
                // Categories ref has 'settings' in the path → document snapshot
                if (ref?.path?.includes('settings')) {
                    cb({ exists: () => false, data: () => null });
                } else {
                    expensesCb = cb;
                    cb({ docs: [] });
                }
                return vi.fn();
            }
        );

        (mockOnSnapshot as unknown as { _getExpensesCb: () => typeof expensesCb })
            ._getExpensesCb = () => expensesCb;

        return {
            mockAddDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
            mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
            mockDeleteDoc: vi.fn().mockResolvedValue(undefined),
            mockGetDocs: vi.fn().mockResolvedValue({ docs: [] }),
            mockSetDoc: vi.fn().mockResolvedValue(undefined),
            mockOnSnapshot,
        };
    });

// ── Stable user reference ─────────────────────────────────────────────────────
// Must not be recreated on each render — useEffect([user]) would loop infinitely.

const { stableUser } = vi.hoisted(() => ({
    stableUser: { id: 'user-1', name: 'Test', email: 'test@test.com', isAnonymous: false },
}));

// ── Firebase mocks ────────────────────────────────────────────────────────────

vi.mock('../firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join('/') })),
    doc: vi.fn((_: unknown, ...parts: string[]) => ({ path: parts.join('/') })),
    onSnapshot: mockOnSnapshot,
    addDoc: mockAddDoc,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    getDocs: mockGetDocs,
    setDoc: mockSetDoc,
}));

// ── Context mocks ─────────────────────────────────────────────────────────────

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: stableUser,
        isAuthenticated: true,
        isGuest: false,
    }),
}));

vi.mock('../context/FamilyContext', () => ({
    useFamily: vi.fn(() => ({ family: null })),
}));

vi.mock('../context/ToastContext', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k }),
}));

// ── Helper component ──────────────────────────────────────────────────────────

const Consumer = () => {
    const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
    return (
        <div>
            <span data-testid="count">{expenses.length}</span>
            <button onClick={() => addExpense({
                amount: 10, category: 'Food',
                date: '2025-01-01', type: 'expense',
            })}>add</button>
            <button onClick={() => updateExpense('e-1', { amount: 20 })}>update</button>
            <button onClick={() => deleteExpense('e-1')}>delete</button>
        </div>
    );
};

const renderWithApp = () => render(<AppProvider><Consumer /></AppProvider>);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppContext', () => {
    beforeEach(() => vi.clearAllMocks());

    it('initialises with empty expenses', async () => {
        renderWithApp();
        await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));
    });

    it('addExpense calls Firestore addDoc with correct data', async () => {
        renderWithApp();
        await userEvent.click(screen.getByRole('button', { name: 'add' }));
        await waitFor(() => expect(mockAddDoc).toHaveBeenCalledOnce());
        const [, data] = mockAddDoc.mock.calls[0];
        expect(data.amount).toBe(10);
        expect(data.category).toBe('Food');
    });

    it('updateExpense calls Firestore updateDoc with correct data', async () => {
        renderWithApp();
        await userEvent.click(screen.getByRole('button', { name: 'update' }));
        await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledOnce());
        expect(mockUpdateDoc.mock.calls[0][1]).toEqual({ amount: 20 });
    });

    it('deleteExpense calls Firestore deleteDoc', async () => {
        renderWithApp();
        await userEvent.click(screen.getByRole('button', { name: 'delete' }));
        await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledOnce());
    });

    it('updates expenses list when snapshot fires new data', async () => {
        renderWithApp();
        await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('0'));

        const expensesCb = (mockOnSnapshot as unknown as {
            _getExpensesCb: () => ((s: unknown) => void) | null
        })._getExpensesCb();

        act(() => expensesCb!({
            docs: [{
                id: 'e-1',
                data: () => ({ amount: 55, category: 'Food', date: '2025-01-01', type: 'expense' }),
            }],
        }));

        await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    });

    it('uses family expenses collection when family is active', async () => {
        const familyModule = await import('../context/FamilyContext');
        (familyModule.useFamily as Mock).mockReturnValue({ family: { id: 'fam-1', name: 'Fam' } });

        const firestoreModule = await import('firebase/firestore');
        renderWithApp();

        await waitFor(() => expect(firestoreModule.collection).toHaveBeenCalled());
        const paths = (firestoreModule.collection as Mock).mock.calls
            .map((c: unknown[]) => (c as string[]).slice(1).join('/'));
        expect(paths.some((p: string) => p.includes('families/fam-1'))).toBe(true);
    });
});
