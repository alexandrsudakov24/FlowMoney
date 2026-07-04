import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenseStore } from '../stores/expenseStore';
import type { CollectionReference } from 'firebase/firestore';

const { mockUpdateDoc, mockDoc, mockDeleteField, snapshotCallbacks } = vi.hoisted(() => {
    const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn((_col: unknown, id: string) => ({ id }));
    const mockDeleteField = vi.fn(() => ({ __op: 'deleteField' }));
    const snapshotCallbacks: Array<(snap: unknown) => void> = [];
    return { mockUpdateDoc, mockDoc, mockDeleteField, snapshotCallbacks };
});

vi.mock('firebase/firestore', () => ({
    onSnapshot: vi.fn((_col: unknown, cb: (snap: unknown) => void) => {
        snapshotCallbacks.push(cb);
        return () => {};
    }),
    updateDoc: mockUpdateDoc,
    doc: mockDoc,
    deleteField: mockDeleteField,
    // Unused by this test but imported by services/expenses.ts — harmless stubs
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDocs: vi.fn(),
}));

function makeSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) };
}

describe('expenseStore — scheduled payment firing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        snapshotCallbacks.length = 0;
    });

    const col = {} as CollectionReference;
    const user = { id: 'u1', name: 'Alex', email: 'alex@test.com' };

    it('clears the scheduled flag once the date has arrived', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'due', data: { amount: 10, category: 'Food', date: today, type: 'expense', scheduled: true } },
        ]));

        expect(mockUpdateDoc).toHaveBeenCalledWith(
            { id: 'due' },
            { scheduled: expect.objectContaining({ __op: 'deleteField' }) },
        );
    });

    it('leaves future-dated scheduled payments untouched', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'future', data: { amount: 10, category: 'Food', date: future, type: 'expense', scheduled: true } },
        ]));

        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('does not touch normal (non-scheduled) transactions', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'normal', data: { amount: 10, category: 'Food', date: today, type: 'expense' } },
        ]));

        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
});
