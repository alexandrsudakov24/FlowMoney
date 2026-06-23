/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
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
    addExpense: (e: Omit<Expense, 'id'>) => void;
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
    const { user, isAuthenticated, isGuest } = useAuth();
    const hasAccess = isAuthenticated || isGuest;
    const { family } = useFamily();
    const { showToast } = useToast();
    const { t } = useLanguage();

    const [currency, setCurrency] = useState(
        localStorage.getItem('currency') || 'USD'
    );

    const changeCurrency = (cur: string) => {
        setCurrency(cur);
        localStorage.setItem('currency', cur);
    };

    const expensesCol = useMemo(() => {
        if (!hasAccess || !user) return null;
        if (family) return collection(db, 'families', family.id, 'expenses');
        return collection(db, 'users', user.id, 'expenses');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAccess, user?.id, family?.id]);

    const categoriesRef = useMemo(() => {
        if (!hasAccess || !user) return null;
        if (family) return doc(db, 'families', family.id, 'settings', 'categories');
        return doc(db, 'users', user.id, 'settings', 'categories');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAccess, user?.id, family?.id]);

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
                ...(d.data() as Omit<Expense, 'id'>)
            }));
            setExpenses(next);
            setLoading(false);
        });
        return () => unsub();
    }, [expensesCol]);

    useEffect(() => {
        if (!categoriesRef) {
            setCategories(DEFAULT_CATEGORIES);
            return;
        }
        const unsub = onSnapshot(categoriesRef, (snap) => {
            if (snap.exists()) {
                setCategories(snap.data().list ?? DEFAULT_CATEGORIES);
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        });
        return () => unsub();
    }, [categoriesRef]);

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        if (!expensesCol || !user) return;
        const data = family
            ? { ...expense, addedBy: { uid: user.id, name: user.name } }
            : expense;
        addDoc(expensesCol, data).catch((err) => {
            console.error('Failed to add expense', err);
            showToast(t('save_error'));
        });
    };

    const updateExpense = (id: string, updatedData: Partial<Expense>) => {
        if (!expensesCol) return;
        const ref = doc(expensesCol, id);
        updateDoc(ref, updatedData as UpdateData<Expense>).catch((err) => {
            console.error('Failed to update expense', err);
            showToast(t('save_error'));
        });
    };

    const deleteExpense = (id: string) => {
        if (!expensesCol) return;
        const ref = doc(expensesCol, id);
        deleteDoc(ref).catch((err) => {
            console.error('Failed to delete expense', err);
            showToast(t('save_error'));
        });
    };

    const clearAll = async () => {
        if (!expensesCol) return;
        try {
            const snap = await getDocs(expensesCol);
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch (err) {
            console.error('Failed to clear expenses', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    const addCategory = async (name: string): Promise<void> => {
        if (!categoriesRef) return;
        const trimmed = name.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        const next = [...categories, trimmed];
        await setDoc(categoriesRef, { list: next }).catch((err) => {
            console.error('Failed to add category', err);
            showToast(t('save_error'));
        });
    };

    const removeCategory = async (name: string): Promise<boolean> => {
        if (!categoriesRef) return false;
        if (DEFAULT_CATEGORIES.includes(name)) return false;
        const next = categories.filter(c => c !== name);
        await setDoc(categoriesRef, { list: next }).catch((err) => {
            console.error('Failed to remove category', err);
            showToast(t('save_error'));
        });
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
