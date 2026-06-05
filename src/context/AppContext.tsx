import { createContext, useContext, useEffect, useState } from 'react';
import { loadExpenses, saveExpenses } from '../services/storageService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        setExpenses(loadExpenses());
    }, []);

    useEffect(() => {
        saveExpenses(expenses);
    }, [expenses]);

    const addExpense = (expense) => {
        setExpenses((prev) => [...prev, expense]);
    };

    const updateExpense = (id, updatedData) => {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e)));
    };

    const deleteExpense = (id) => {
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

export const useApp = () => useContext(AppContext);
