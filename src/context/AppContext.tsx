/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../services/storageService';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

type AppContextType = {
    expenses: Expense[];
    addExpense: (e: Expense) => void;
    updateExpense: (id: string, data: Partial<Expense>) => void;
    deleteExpense: (id: string) => void;
    clearAll: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { user, isAuthenticated } = useAuth();

    // Load expenses: subscribe to Firestore for the current user. We no longer use localStorage.
    useEffect(() => {
        console.log('AppContext: useEffect triggered, isAuthenticated:', isAuthenticated, 'user:', user?.id);
        if (isAuthenticated && user) {
            const col = collection(db, 'users', user.id, 'expenses');
            console.log('AppContext: subscribing to Firestore collection users/', user.id, '/expenses');
            const unsub = onSnapshot(col, (snap) => {
                console.log('AppContext: onSnapshot received, docs count:', snap.docs.length);
                const next: Expense[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
                setExpenses(next);
            });
            return () => unsub();
        }
        // if no user yet, clear expenses until auth state arrives
        setExpenses([]);
    }, [isAuthenticated, user]);

    const addExpense = (expense: Expense) => {
        if (isAuthenticated && user) {
            // write to Firestore under users/{uid}/expenses
            const col = collection(db, 'users', user.id, 'expenses');
            // don't await here — optimistic local update will be handled by snapshot
            // ensure we don't send the id field as Firestore will generate one
            const { id, ...payload } = expense as any;
            addDoc(col, payload).catch((err) => console.error('Failed to add expense to Firestore', err));
        } else {
            console.error('addExpense: no authenticated user yet — cannot add expense to Firestore');
        }
    };

    const updateExpense = (id: string, updatedData: Partial<Expense>) => {
        if (isAuthenticated && user) {
            const ref = doc(db, 'users', user.id, 'expenses', id);
            updateDoc(ref, updatedData as any).catch((err) => console.error('Failed to update expense in Firestore', err));
        } else {
            console.error('updateExpense: no authenticated user yet — cannot update expense in Firestore');
        }
    };

    const deleteExpense = (id: string) => {
        if (isAuthenticated && user) {
            const ref = doc(db, 'users', user.id, 'expenses', id);
            deleteDoc(ref).catch((err) => console.error('Failed to delete expense in Firestore', err));
        } else {
            console.error('deleteExpense: no authenticated user yet — cannot delete expense in Firestore');
        }
    };

    const clearAll = () => {
        if (isAuthenticated && user) {
            // remove all docs in the user's expenses collection — Firestore doesn't support batch delete here without listing
            // We'll read all docs and delete them
            const col = collection(db, 'users', user.id, 'expenses');
            onSnapshot(col, (snap) => {
                snap.docs.forEach((d) => {
                    deleteDoc(doc(db, 'users', user.id, 'expenses', d.id)).catch((err) => console.error('Failed to delete expense', err));
                });
            });
        } else {
            console.error('clearAll: no authenticated user yet — cannot clear expenses in Firestore');
        }
    };

    return (
        <AppContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense, clearAll }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
