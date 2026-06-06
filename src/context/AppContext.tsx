/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { loadExpenses, saveExpenses } from '../services/storageService';
import type { Expense } from '../services/storageService';

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

    useEffect(() => {
        setExpenses(loadExpenses());
    }, []);

    useEffect(() => {
        saveExpenses(expenses);
    }, [expenses]);

    const addExpense = (expense: Expense) => {
        setExpenses((prev) => [...prev, expense]);
    };

    const updateExpense = (id: string, updatedData: Partial<Expense>) => {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e)));
    };

    const deleteExpense = (id: string) => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
    };

    const clearAll = () => {
        setExpenses([]);
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
