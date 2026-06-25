import { useEffect, useState } from 'react';
import type { CollectionReference } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import type { TranslationKeys } from '../i18n';
import type { Expense } from '../types';
import type { User } from '../context/AuthContext';
import type { Family } from '../types';
import * as expenseSvc from '../services/expenses';

export function useExpenses(
    expensesCol: CollectionReference | null,
    user: User | null,
    family: Family | null,
    showToast: (msg: string) => void,
    t: (key: TranslationKeys) => string,
) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!expensesCol) {
            setExpenses([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsub = onSnapshot(expensesCol, (snap) => {
            const next: Expense[] = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Expense, 'id'>),
            }));
            setExpenses(next);
            setLoading(false);
        });
        return () => unsub();
    }, [expensesCol]);

    const addExpense = async (expense: Omit<Expense, 'id'>): Promise<void> => {
        if (!expensesCol || !user) return;
        const data = family
            ? { ...expense, addedBy: { uid: user.id, name: user.name } }
            : expense;
        try {
            await expenseSvc.addExpense(expensesCol, data);
        } catch (err) {
            console.error('Failed to add expense', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    const updateExpense = async (id: string, updatedData: Partial<Expense>): Promise<void> => {
        if (!expensesCol) return;
        try {
            await expenseSvc.updateExpense(expensesCol, id, updatedData);
        } catch (err) {
            console.error('Failed to update expense', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    const deleteExpense = async (id: string): Promise<void> => {
        if (!expensesCol) return;
        try {
            await expenseSvc.deleteExpense(expensesCol, id);
        } catch (err) {
            console.error('Failed to delete expense', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    const clearAll = async (): Promise<void> => {
        if (!expensesCol) return;
        try {
            await expenseSvc.clearAllExpenses(expensesCol);
        } catch (err) {
            console.error('Failed to clear expenses', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    return { expenses, loading, addExpense, updateExpense, deleteExpense, clearAll };
}
