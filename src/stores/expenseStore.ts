import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import type { CollectionReference } from 'firebase/firestore';
import type { Expense, User, Family } from '../types';
import * as expenseSvc from '../services/expenses';

// Shape of the store — what data it holds and what actions it can do
type ExpenseStore = {
    // --- state ---
    expenses: Expense[];
    loading: boolean;

    // --- actions (called from components) ---
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
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

            // Listen to Firestore in real time — updates expenses on every change
            const unsub = onSnapshot(col, (snap) => {
                set({
                    expenses: snap.docs.map((d) => ({
                        id: d.id,
                        ...(d.data() as Omit<Expense, 'id'>),
                    })),
                    loading: false,
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
                ? { ...expense, addedBy: { uid: _user.id, name: _user.name } }
                : expense;
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
