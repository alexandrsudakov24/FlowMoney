import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenseStore } from '../stores/expenseStore';
import type { CollectionReference } from 'firebase/firestore';

const { mockFireScheduledExpense, snapshotCallbacks } = vi.hoisted(() => {
    const mockFireScheduledExpense = vi.fn().mockResolvedValue(undefined);
    const snapshotCallbacks: Array<(snap: unknown) => void> = [];
    return { mockFireScheduledExpense, snapshotCallbacks };
});

vi.mock('firebase/firestore', () => ({
    onSnapshot: vi.fn((_col: unknown, cb: (snap: unknown) => void) => {
        snapshotCallbacks.push(cb);
        return () => {};
    }),
}));

vi.mock('../services/expenses', () => ({
    fireScheduledExpense: mockFireScheduledExpense,
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    clearAllExpenses: vi.fn(),
}));

function makeSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) };
}

describe('expenseStore — scheduled payment firing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFireScheduledExpense.mockResolvedValue(undefined);
        snapshotCallbacks.length = 0;
    });

    const col = {} as CollectionReference;
    const user = { id: 'u1', name: 'Alex', email: 'alex@test.com' };

    it('fires a due scheduled payment', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'due', data: { amount: 10, category: 'Food', date: today, type: 'expense', scheduled: true } },
        ]));

        expect(mockFireScheduledExpense).toHaveBeenCalledWith(col, 'due', today);
    });

    it('leaves future-dated scheduled payments untouched', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'future', data: { amount: 10, category: 'Food', date: future, type: 'expense', scheduled: true } },
        ]));

        expect(mockFireScheduledExpense).not.toHaveBeenCalled();
    });

    it('does not touch normal (non-scheduled) transactions', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'normal', data: { amount: 10, category: 'Food', date: today, type: 'expense' } },
        ]));

        expect(mockFireScheduledExpense).not.toHaveBeenCalled();
    });

    it('does not re-issue a transaction for the same id while one is already in flight on this client', () => {
        // Firestore's onSnapshot emits once from the local optimistic cache and again
        // once the server confirms, and the write isn't awaited before the next
        // snapshot can arrive — this reproduces that by invoking the callback several
        // times with the same still-due template before the in-flight call resolves.
        let resolveFire: () => void = () => {};
        mockFireScheduledExpense.mockReturnValue(new Promise<void>((resolve) => { resolveFire = resolve; }));

        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);
        const snap = makeSnapshot([
            { id: 'rent', data: { amount: 500, category: 'Home', date: today, type: 'expense', scheduled: true, repeat: 'monthly' } },
        ]);

        snapshotCallbacks[0](snap);
        snapshotCallbacks[0](snap);
        snapshotCallbacks[0](snap);

        expect(mockFireScheduledExpense).toHaveBeenCalledTimes(1);
        resolveFire();
    });
});
