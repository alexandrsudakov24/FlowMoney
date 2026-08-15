import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import type { CollectionReference, UpdateData } from 'firebase/firestore';
import type { Expense, User, Family } from '../types';
import * as expenseSvc from '../services/expenses';

// Shape of the store — what data it holds and what actions it can do
type ExpenseStore = {
    // --- state ---
    expenses: Expense[];
    loading: boolean;

    // --- actions (called from components) ---
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, data: UpdateData<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;

    // --- internal setup (called once from AppProvider, not from components) ---
    _subscribe: (
        col: CollectionReference | null,
        user: User | null,
        family: Family | null,
        showToast: (msg: string) => void,
    ) => () => void; // returns unsubscribe function
};

export const useExpenseStore = create<ExpenseStore>((set) => {
    // These are plain variables, not reactive state.
    // Storing them here avoids extra re-renders when they change.
    // They get updated every time _subscribe is called.
    let _col: CollectionReference | null = null;
    let _user: User | null = null;
    let _family: Family | null = null;
    let _showToast: (msg: string) => void = () => {};

    return {
        expenses: [],
        loading: false,

        // Called from AppProvider whenever the Firestore collection changes
        // (e.g. user logs in, joins a family, or logs out).
        // Sets up a real-time listener and returns a cleanup function.
        _subscribe: (col, user, family, showToast) => {
            // Save the latest values so actions can use them
            _col = col;
            _user = user;
            _family = family;
            _showToast = showToast;

            // No collection means the user is logged out or has no access
            if (!col) {
                set({ expenses: [], loading: false });
                return () => {};
            }

            set({ loading: true });

            // onSnapshot fires multiple times per write (once optimistically from the
            // local cache, again once the server confirms), and the write below isn't
            // awaited before the next snapshot arrives. This just avoids re-issuing a
            // redundant transaction on every one of those interim snapshots from *this*
            // client; the transaction itself (see expenseSvc.fireScheduledExpense) is
            // what actually guards against double-firing, including from another family
            // member's device racing on the same template.
            const firingIds = new Set<string>();

            // Listen to Firestore in real time — updates expenses on every change
            const unsub = onSnapshot(col, (snap) => {
                const expenses = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<Expense, 'id'>),
                }));
                // Most recently added first; older docs without createdAt sink to the bottom.
                expenses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                set({ expenses, loading: false });

                // Fire any scheduled payments whose date has arrived. One-time payments
                // simply lose their `scheduled` flag. Monthly ones stay alive as a
                // template: this occurrence is cloned into a real historical
                // transaction and the template's date advances to next month.
                const todayStr = new Date().toISOString().slice(0, 10);
                expenses
                    .filter((e) => e.scheduled && e.date <= todayStr && !firingIds.has(e.id))
                    .forEach((e) => {
                        firingIds.add(e.id);
                        const clear = () => firingIds.delete(e.id);
                        expenseSvc.fireScheduledExpense(col, e.id, todayStr).catch(() => {}).finally(clear);
                    });
            });

            // Return unsub so AppProvider can stop listening on cleanup
            return unsub;
        },

        // Save a new expense to Firestore.
        // If the user is in a family, attach their name so others can see who added it.
        addExpense: async (expense) => {
            if (!_col || !_user) return;
            const data = _family
                ? { ...expense, createdAt: Date.now(), addedBy: { uid: _user.id, name: _user.name } }
                : { ...expense, createdAt: Date.now() };
            try {
                await expenseSvc.addExpense(_col, data);
            } catch (err) {
                console.error('Failed to add expense', err);
                _showToast('save_error');
                throw err; // re-throw so the form can react (e.g. stop spinner)
            }
        },

        // Update an existing expense by id
        updateExpense: async (id, data) => {
            if (!_col) return;
            try {
                await expenseSvc.updateExpense(_col, id, data);
            } catch (err) {
                console.error('Failed to update expense', err);
                _showToast('save_error');
                throw err;
            }
        },

        // Delete a single expense by id
        deleteExpense: async (id) => {
            if (!_col) return;
            try {
                await expenseSvc.deleteExpense(_col, id);
            } catch (err) {
                console.error('Failed to delete expense', err);
                _showToast('save_error');
                throw err;
            }
        },

        // Delete every expense in the collection (used in settings / danger zone)
        clearAll: async () => {
            if (!_col) return;
            try {
                await expenseSvc.clearAllExpenses(_col);
            } catch (err) {
                console.error('Failed to clear expenses', err);
                _showToast('save_error');
                throw err;
            }
        },
    };
});
