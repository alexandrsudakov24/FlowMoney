import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import { useToast } from './ToastContext';
import { useExpensesRef, useCategoriesRef } from '../hooks/useFirestoreRef';
import { useExpenseStore } from '../stores/expenseStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useCategoryStore } from '../stores/categoryStore';

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
    const { user, isAuthenticated, isGuest } = useAuth();
    const { family } = useFamily();
    const { showToast } = useToast();

    const userId = user?.id ?? null;
    const familyId = family?.id ?? null;
    const hasAccess = isAuthenticated || isGuest;
    const isAnonymous = user?.isAnonymous ?? true;

    const expensesCol = useExpensesRef(userId, familyId, hasAccess);
    const categoriesRef = useCategoriesRef(userId, familyId, hasAccess);

    const { _subscribe, expenses, loading, addExpense, updateExpense, deleteExpense, clearAll } =
        useExpenseStore();

    const { categories, addCategory, removeCategory, _subscribe: subscribeCategories } =
        useCategoryStore();

    const { currency, changeCurrency, _init: initCurrency } = useCurrencyStore();

    // Wire Firestore collection + user context into the expense store
    useEffect(() => {
        const unsub = _subscribe(expensesCol, user, family, showToast);
        return unsub;
    }, [expensesCol, user, family, showToast]);

    // Re-init currency store whenever the user changes (login, logout, etc.)
    useEffect(() => {
        initCurrency(userId, isAnonymous);
    }, [userId, isAnonymous]);

    // Wire Firestore categories document into the category store
    useEffect(() => {
        const unsub = subscribeCategories(categoriesRef, showToast);
        return unsub;
    }, [categoriesRef, showToast]);

    return (
        <AppContext.Provider value={{
            expenses, loading, addExpense, updateExpense, deleteExpense, clearAll,
            currency, changeCurrency,
            categories, addCategory, removeCategory,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
