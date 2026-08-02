import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenseStore } from '../stores/expenseStore';
import type { CollectionReference } from 'firebase/firestore';

const { mockUpdateDoc, mockAddDoc, mockDoc, mockDeleteField, snapshotCallbacks } = vi.hoisted(() => {
    const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
    const mockAddDoc = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn((_col: unknown, id: string) => ({ id }));
    const mockDeleteField = vi.fn(() => ({ __op: 'deleteField' }));
    const snapshotCallbacks: Array<(snap: unknown) => void> = [];
    return { mockUpdateDoc, mockAddDoc, mockDoc, mockDeleteField, snapshotCallbacks };
});

vi.mock('firebase/firestore', () => ({
    onSnapshot: vi.fn((_col: unknown, cb: (snap: unknown) => void) => {
        snapshotCallbacks.push(cb);
        return () => {};
    }),
    updateDoc: mockUpdateDoc,
    addDoc: mockAddDoc,
    doc: mockDoc,
    deleteField: mockDeleteField,
    // Unused by this test but imported by services/expenses.ts — harmless stubs
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

    it('clones a due monthly payment into a real transaction and advances the template', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);

        snapshotCallbacks[0](makeSnapshot([
            { id: 'rent', data: { amount: 500, category: 'Home', date: today, type: 'expense', scheduled: true, repeat: 'monthly' } },
        ]));

        expect(mockAddDoc).toHaveBeenCalledWith(col, expect.objectContaining({
            amount: 500,
            category: 'Home',
            date: today,
            type: 'expense',
        }));
        const [, clonedData] = mockAddDoc.mock.calls[0];
        expect(clonedData).not.toHaveProperty('scheduled');
        expect(clonedData).not.toHaveProperty('repeat');

        expect(mockUpdateDoc).toHaveBeenCalledWith(
            { id: 'rent' },
            { date: expect.any(String) },
        );
        const [, advancedData] = mockUpdateDoc.mock.calls[0];
        expect(advancedData.date > today).toBe(true);
    });

    it('does not double-fire a monthly payment when the snapshot re-fires before the writes settle', () => {
        // Firestore's onSnapshot emits once from the local optimistic cache and again
        // once the server confirms, and neither write below is awaited before the next
        // snapshot can arrive — this reproduces that by invoking the callback several
        // times with the same still-due template before its date has actually advanced.
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());
        const today = new Date().toISOString().slice(0, 10);
        const snap = makeSnapshot([
            { id: 'rent', data: { amount: 500, category: 'Home', date: today, type: 'expense', scheduled: true, repeat: 'monthly' } },
        ]);

        snapshotCallbacks[0](snap);
        snapshotCallbacks[0](snap);
        snapshotCallbacks[0](snap);

        expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });

    it('clamps end-of-month recurrence (Jan 31 -> Feb 28)', () => {
        // Fixed past dates so the test doesn't depend on the real "today".
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());

        snapshotCallbacks[0](makeSnapshot([
            { id: 'sub', data: { amount: 20, category: 'Other', date: '2021-01-31', type: 'expense', scheduled: true, repeat: 'monthly' } },
        ]));

        expect(mockUpdateDoc).toHaveBeenCalledWith({ id: 'sub' }, { date: '2021-02-28' });
    });

    it('rolls over into January of the next year after December', () => {
        useExpenseStore.getState()._subscribe(col, user, null, vi.fn());

        snapshotCallbacks[0](makeSnapshot([
            { id: 'sub', data: { amount: 20, category: 'Other', date: '2021-12-31', type: 'expense', scheduled: true, repeat: 'monthly' } },
        ]));

        expect(mockUpdateDoc).toHaveBeenCalledWith({ id: 'sub' }, { date: '2022-01-31' });
    });
});
