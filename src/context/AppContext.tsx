/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import { db } from '../firebase';
import {
    collection, onSnapshot, addDoc, doc,
    deleteDoc, updateDoc, getDocs, setDoc, type UpdateData
} from 'firebase/firestore';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Dividends', 'Gift', 'Other'];

type AppContextType = {
    expenses: Expense[];
    loading: boolean;
    addExpense: (e: Expense) => void;
    updateExpense: (id: string, data: Partial<Expense>) => void;
    deleteExpense: (id: string) => void;
    clearAll: () => Promise<void>;
    currency: string;
    changeCurrency: (cur: string) => void;
    categories: string[];
    addCategory: (name: string) => Promise<void>;
    removeCategory: (name: string) => Promise<boolean>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const { user, isAuthenticated } = useAuth();
    const { family } = useFamily();

    const [currency, setCurrency] = useState(
        localStorage.getItem('currency') || 'USD'
    );

    const changeCurrency = (cur: string) => {
        setCurrency(cur);
        localStorage.setItem('currency', cur);
    };

    const getExpensesCol = () => {
        if (family) return collection(db, 'families', family.id, 'expenses');
        return collection(db, 'users', user!.id, 'expenses');
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            setLoading(true);
            const col = family
                ? collection(db, 'families', family.id, 'expenses')
                : collection(db, 'users', user.id, 'expenses');
            const unsub = onSnapshot(col, (snap) => {
                const next: Expense[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<Expense, 'id'>)
                }));
                setExpenses(next);
                setLoading(false);
            });
            return () => unsub();
        }
        setExpenses([]);
        setLoading(false);
    }, [isAuthenticated, user, family]);

    const getCategoriesRef = () =>
        family
            ? doc(db, 'families', family.id, 'settings', 'categories')
            : doc(db, 'users', user!.id, 'settings', 'categories');

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setCategories(DEFAULT_CATEGORIES);
            return;
        }
        const ref = family
            ? doc(db, 'families', family.id, 'settings', 'categories')
            : doc(db, 'users', user.id, 'settings', 'categories');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setCategories(snap.data().list ?? DEFAULT_CATEGORIES);
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        });
        return () => unsub();
    }, [isAuthenticated, user, family]);

    const addExpense = (expense: Expense) => {
        if (isAuthenticated && user) {
            const col = getExpensesCol();
            const { id: _id, ...payload } = expense;
            const data = family
                ? { ...payload, addedBy: { uid: user.id, name: user.name } }
                : payload;
            addDoc(col, data).catch((err) =>
                console.error('Failed to add expense', err)
            );
        }
    };

    const updateExpense = (id: string, updatedData: Partial<Expense>) => {
        if (isAuthenticated && user) {
            const ref = doc(getExpensesCol(), id);
            updateDoc(ref, updatedData as UpdateData<Expense>).catch((err) =>
                console.error('Failed to update expense', err)
            );
        }
    };

    const deleteExpense = (id: string) => {
        if (isAuthenticated && user) {
            const ref = doc(getExpensesCol(), id);
            deleteDoc(ref).catch((err) =>
                console.error('Failed to delete expense', err)
            );
        }
    };

    const clearAll = async () => {
        if (isAuthenticated && user) {
            const snap = await getDocs(getExpensesCol());
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref))).catch(
                (err) => console.error('Failed to clear expenses', err)
            );
        }
    };

    const addCategory = async (name: string): Promise<void> => {
        if (!isAuthenticated || !user) return;
        const trimmed = name.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        const next = [...categories, trimmed];
        await setDoc(getCategoriesRef(), { list: next })
            .catch((err) => console.error('Failed to add category', err));
    };

    const removeCategory = async (name: string): Promise<boolean> => {
        if (!isAuthenticated || !user) return false;
        if (DEFAULT_CATEGORIES.includes(name)) return false;
        const inUse = expenses.some(e => e.category === name);
        if (inUse) return false;
        const next = categories.filter(c => c !== name);
        await setDoc(getCategoriesRef(), { list: next })
            .catch((err) => console.error('Failed to remove category', err));
        return true;
    };

    return (
        <AppContext.Provider
            value={{
                expenses, loading, addExpense, updateExpense, deleteExpense, clearAll,
                currency, changeCurrency,
                categories, addCategory, removeCategory,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
        if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
