/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../services/storageService';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';

type AppContextType = {
    expenses: Expense[];
    addExpense: (e: Expense) => void;
    updateExpense: (id: string, data: Partial<Expense>) => void;
    deleteExpense: (id: string) => void;
    clearAll: () => Promise<void>;

    currency: string;
    changeCurrency: (cur: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
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

    return (
        <AppContext.Provider
            value={{
                expenses,
                addExpense,
                updateExpense,
                deleteExpense,
                clearAll,
                currency,
                changeCurrency
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
