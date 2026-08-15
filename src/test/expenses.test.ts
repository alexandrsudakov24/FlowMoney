import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as expenseSvc from '../services/expenses';
import type { CollectionReference } from 'firebase/firestore';

// A tiny in-memory stand-in for Firestore's server-side documents, so the
// transaction mock below can model "read the current server state, then
// conditionally write it" the same way a real Firestore transaction would.
const { mockRunTransaction, mockDoc, mockDeleteField, serverDocs } = vi.hoisted(() => {
    const serverDocs = new Map<string, Record<string, unknown>>();
    let nextAutoId = 0;

    const mockDoc = vi.fn((_col: unknown, id?: string) => ({ id: id ?? `auto-${nextAutoId++}` }));
    const mockDeleteField = vi.fn(() => ({ __op: 'deleteField' }));

    const mockRunTransaction = vi.fn(async (_db: unknown, updateFn: (tx: unknown) => Promise<void>) => {
        const tx = {
            get: async (ref: { id: string }) => {
                const data = serverDocs.get(ref.id);
                return { exists: () => data !== undefined, data: () => data };
            },
            set: (ref: { id: string }, data: Record<string, unknown>) => {
                serverDocs.set(ref.id, data);
            },
            update: (ref: { id: string }, data: Record<string, unknown>) => {
                const current = serverDocs.get(ref.id) ?? {};
                const next = { ...current };
                for (const [key, value] of Object.entries(data)) {
                    if (value && typeof value === 'object' && (value as { __op?: string }).__op === 'deleteField') {
                        delete next[key];
                    } else {
                        next[key] = value;
                    }
                }
                serverDocs.set(ref.id, next);
            },
        };
        await updateFn(tx);
    });

    return { mockRunTransaction, mockDoc, mockDeleteField, serverDocs };
});

vi.mock('firebase/firestore', () => ({
    doc: mockDoc,
    deleteField: mockDeleteField,
    runTransaction: mockRunTransaction,
    // Unused by these tests but imported by services/expenses.ts — harmless stubs
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    getDocs: vi.fn(),
}));

const col = { firestore: {} } as CollectionReference;

describe('expenseSvc.fireScheduledExpense', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        serverDocs.clear();
    });

    it('clones a due monthly payment and advances the template date', async () => {
        const today = new Date().toISOString().slice(0, 10);
        serverDocs.set('rent', { amount: 500, category: 'Home', date: today, type: 'expense', scheduled: true, repeat: 'monthly' });

        await expenseSvc.fireScheduledExpense(col, 'rent', today);

        const template = serverDocs.get('rent') as { date: string };
        expect(template.date > today).toBe(true);

        const clones = [...serverDocs.entries()].filter(([id]) => id !== 'rent');
        expect(clones).toHaveLength(1);
        const [, clonedData] = clones[0];
        expect(clonedData).toEqual(expect.objectContaining({ amount: 500, category: 'Home', date: today, type: 'expense' }));
        expect(clonedData).not.toHaveProperty('scheduled');
        expect(clonedData).not.toHaveProperty('repeat');
    });

    it('clears the scheduled flag on a due one-off payment', async () => {
        const today = new Date().toISOString().slice(0, 10);
        serverDocs.set('due', { amount: 10, category: 'Food', date: today, type: 'expense', scheduled: true });

        await expenseSvc.fireScheduledExpense(col, 'due', today);

        expect(serverDocs.get('due')).not.toHaveProperty('scheduled');
    });

    it('leaves a future-dated payment untouched', async () => {
        const today = new Date().toISOString().slice(0, 10);
        const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        serverDocs.set('future', { amount: 10, category: 'Food', date: future, type: 'expense', scheduled: true });

        await expenseSvc.fireScheduledExpense(col, 'future', today);

        expect(serverDocs.get('future')).toEqual(expect.objectContaining({ scheduled: true, date: future }));
        expect([...serverDocs.keys()]).toEqual(['future']);
    });

    it('clamps end-of-month recurrence (Jan 31 -> Feb 28)', async () => {
        serverDocs.set('sub', { amount: 20, category: 'Other', date: '2021-01-31', type: 'expense', scheduled: true, repeat: 'monthly' });

        await expenseSvc.fireScheduledExpense(col, 'sub', '2021-01-31');

        expect((serverDocs.get('sub') as { date: string }).date).toBe('2021-02-28');
    });

    it('rolls over into January of the next year after December', async () => {
        serverDocs.set('sub', { amount: 20, category: 'Other', date: '2021-12-31', type: 'expense', scheduled: true, repeat: 'monthly' });

        await expenseSvc.fireScheduledExpense(col, 'sub', '2021-12-31');

        expect((serverDocs.get('sub') as { date: string }).date).toBe('2022-01-31');
    });

    it('does not clone twice when another family member device already fired the same template', async () => {
        // Simulates two family members' devices both seeing the same due template at
        // once. Each fire attempt re-reads the template from the server inside its own
        // transaction, so whichever commits first advances the date; the other attempt
        // (e.g. its own device firing again off a stale local snapshot) re-reads the
        // already-advanced doc and becomes a no-op instead of cloning a second time.
        const today = new Date().toISOString().slice(0, 10);
        serverDocs.set('rent', { amount: 500, category: 'Home', date: today, type: 'expense', scheduled: true, repeat: 'monthly' });

        await expenseSvc.fireScheduledExpense(col, 'rent', today); // device A fires first
        await expenseSvc.fireScheduledExpense(col, 'rent', today); // device B's attempt, after A's already committed

        const clones = [...serverDocs.entries()].filter(([id]) => id !== 'rent');
        expect(clones).toHaveLength(1);
    });
});
