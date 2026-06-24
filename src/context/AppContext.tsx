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
    deleteDoc, updateDoc, getDocs, getDoc, setDoc, type UpdateData
} from 'firebase/firestore';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Dividends', 'Gift', 'Other'];

type AppContextType = {
    expenses: Expense[];
    loading: boolean;
    addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    currency: string;
    changeCurrency: (cur: string) => Promise<void>;
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

    const userId = user?.id ?? null;
    const familyId = family?.id ?? null;
    const isAnonymous = user?.isAnonymous ?? true;

    const changeCurrency = async (cur: string): Promise<void> => {
        setCurrency(cur);
        localStorage.setItem('currency', cur);
        if (userId && !isAnonymous) {
            await setDoc(doc(db, 'users', userId), { currency: cur }, { merge: true })
                .catch(console.warn);
        }
    };

    useEffect(() => {
        if (!userId || isAnonymous) return;
        getDoc(doc(db, 'users', userId)).then((snap) => {
            const saved = snap.data()?.currency as string | undefined;
            if (saved) {
                setCurrency(saved);
                localStorage.setItem('currency', saved);
            }
        }).catch(console.warn);
    }, [userId, isAnonymous]);

    const expensesCol = useMemo(() => {
        if (!hasAccess || !userId) return null;
        if (familyId) return collection(db, 'families', familyId, 'expenses');
        return collection(db, 'users', userId, 'expenses');
    }, [hasAccess, userId, familyId]);

    const categoriesRef = useMemo(() => {
        if (!hasAccess || !userId) return null;
        if (familyId) return doc(db, 'families', familyId, 'settings', 'categories');
        return doc(db, 'users', userId, 'settings', 'categories');
    }, [hasAccess, userId, familyId]);

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

    const addExpense = async (expense: Omit<Expense, 'id'>): Promise<void> => {
        if (!expensesCol || !user) return;
        const data = family
            ? { ...expense, addedBy: { uid: user.id, name: user.name } }
            : expense;
        try {
            await addDoc(expensesCol, data);
        } catch (err) {
            console.error('Failed to add expense', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    const updateExpense = async (id: string, updatedData: Partial<Expense>): Promise<void> => {
        if (!expensesCol) return;
        const ref = doc(expensesCol, id);
        try {
            await updateDoc(ref, updatedData as UpdateData<Expense>);
        } catch (err) {
            console.error('Failed to update expense', err);
            showToast(t('save_error'));
            throw err;
        }
    };

    const deleteExpense = async (id: string): Promise<void> => {
        if (!expensesCol) return;
        const ref = doc(expensesCol, id);
        try {
            await deleteDoc(ref);
        } catch (err) {
            console.error('Failed to delete expense', err);
            showToast(t('save_error'));
            throw err;
        }
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
            showToast(t('save_error'));        });
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
