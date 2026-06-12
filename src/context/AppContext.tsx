/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
    collection, onSnapshot, addDoc, doc,
    deleteDoc, updateDoc, getDocs, setDoc
} from 'firebase/firestore';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Home', 'Shopping', 'Health', 'Other'];

type AppContextType = {
    expenses: Expense[];
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
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const { user, isAuthenticated } = useAuth();

    // -----------------------------
    //  Currency state
    // -----------------------------
    const [currency, setCurrency] = useState(
        localStorage.getItem("currency") || "USD"
    );

    const changeCurrency = (cur: string) => {
        setCurrency(cur);
        localStorage.setItem("currency", cur);
    };

    // -----------------------------
    // Load expenses from Firestore
    // -----------------------------
    useEffect(() => {
        if (isAuthenticated && user) {
            const col = collection(db, 'users', user.id, 'expenses');
            const unsub = onSnapshot(col, (snap) => {
                const next: Expense[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any)
                }));
                setExpenses(next);
            });
            return () => unsub();
        }
        setExpenses([]);
    }, [isAuthenticated, user]);

    // -----------------------------
    // Load categories from Firestore
    // -----------------------------
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setCategories(DEFAULT_CATEGORIES);
            return;
        }
        const ref = doc(db, 'users', user.id, 'settings', 'categories');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setCategories(snap.data().list ?? DEFAULT_CATEGORIES);
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        });
        return () => unsub();
    }, [isAuthenticated, user]);

    // -----------------------------
    // CRUD operations
    // -----------------------------
    const addExpense = (expense: Expense) => {
        if (isAuthenticated && user) {
            const col = collection(db, 'users', user.id, 'expenses');
            const { id, ...payload } = expense as any;
            addDoc(col, payload).catch((err) =>
                console.error('Failed to add expense to Firestore', err)
            );
        }
    };

    const updateExpense = (id: string, updatedData: Partial<Expense>) => {
        if (isAuthenticated && user) {
            const ref = doc(db, 'users', user.id, 'expenses', id);
            updateDoc(ref, updatedData as any).catch((err) =>
                console.error('Failed to update expense in Firestore', err)
            );
        }
    };

    const deleteExpense = (id: string) => {
        if (isAuthenticated && user) {
            const ref = doc(db, 'users', user.id, 'expenses', id);
            deleteDoc(ref).catch((err) =>
                console.error('Failed to delete expense in Firestore', err)
            );
        }
    };

    const clearAll = async () => {
        if (isAuthenticated && user) {
            const col = collection(db, 'users', user.id, 'expenses');
            const snap = await getDocs(col);
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref))).catch(
                (err) => console.error('Failed to clear expenses', err)
            );
        }
    };

    // -----------------------------
    // Category operations
    // -----------------------------
    const addCategory = async (name: string): Promise<void> => {
        if (!isAuthenticated || !user) return;
        const trimmed = name.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        const next = [...categories, trimmed];
        await setDoc(
            doc(db, 'users', user.id, 'settings', 'categories'),
            { list: next }
        ).catch((err) => console.error('Failed to add category', err));
    };

    const removeCategory = async (name: string): Promise<boolean> => {
        if (!isAuthenticated || !user) return false;
        if (DEFAULT_CATEGORIES.includes(name)) return false;
        const inUse = expenses.some(e => e.category === name);
        if (inUse) return false;
        const next = categories.filter(c => c !== name);
        await setDoc(
            doc(db, 'users', user.id, 'settings', 'categories'),
            { list: next }
        ).catch((err) => console.error('Failed to remove category', err));
        return true;
    };

    return (
        <AppContext.Provider
            value={{
                expenses,
                addExpense,
                updateExpense,
                deleteExpense,
                clearAll,
                currency,
                changeCurrency,
                categories,
                addCategory,
                removeCategory,
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
