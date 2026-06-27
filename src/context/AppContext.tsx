import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Expense } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
import { useExpensesRef, useCategoriesRef } from '../hooks/useFirestoreRef';
import { useCategories } from '../hooks/useCategories';
import { useCurrency } from '../hooks/useCurrency';
import { useExpenseStore } from '../stores/expenseStore';

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
    const { t } = useLanguage();

    const userId = user?.id ?? null;
    const familyId = family?.id ?? null;
    const hasAccess = isAuthenticated || isGuest;
    const isAnonymous = user?.isAnonymous ?? true;

    const expensesCol = useExpensesRef(userId, familyId, hasAccess);
    const categoriesRef = useCategoriesRef(userId, familyId, hasAccess);

    const { _subscribe, expenses, loading, addExpense, updateExpense, deleteExpense, clearAll } =
        useExpenseStore();

    const { categories, addCategory, removeCategory } =
        useCategories(categoriesRef, showToast, t);

    const { currency, changeCurrency } =
        useCurrency(userId, isAnonymous);

    // подключаем Firestore к стору
    useEffect(() => {
        const unsub = _subscribe(expensesCol, user, family, showToast);
        return unsub;
    }, [expensesCol, user, family, showToast]);

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
