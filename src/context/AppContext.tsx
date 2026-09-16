import { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { UpdateData } from 'firebase/firestore';
import type { Expense, InsightsDoc, RolloverMode, BudgetTipsDoc } from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
import type { TranslationKeys, Language } from '../i18n';
import { useExpensesRef, useCategoriesRef, useInsightsRef, useRolloverRef, useBudgetTipsRef } from '../hooks/useFirestoreRef';
import { useExpenseStore } from '../stores/expenseStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useAccentColorStore, type AccentColor } from '../stores/accentColorStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useInsightsStore } from '../stores/insightsStore';
import { useRolloverStore } from '../stores/rolloverStore';
import { useBudgetTipsStore } from '../stores/budgetTipsStore';
import { computeMonthlyRollover, type MonthlyRollover } from '../utils/computeMonthlyRollover';

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Dividends', 'Gift', 'Other'];

type AppContextType = {
    expenses: Expense[];
    activeExpenses: Expense[];
    scheduledExpenses: Expense[];
    loading: boolean;
    addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, data: UpdateData<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    currency: string;
    changeCurrency: (cur: string) => Promise<void>;
    accentColor: AccentColor;
    changeAccentColor: (color: AccentColor) => Promise<void>;
    categories: string[];
    addCategory: (name: string) => Promise<void>;
    removeCategory: (name: string) => Promise<boolean>;
    categoryLimits: Record<string, number>;
    setCategoryLimit: (name: string, amount: number | null) => Promise<void>;
    insightsDoc: InsightsDoc | null;
    insightsLoading: boolean;
    insightsGenerating: boolean;
    regenerateInsights: (expenses: Expense[], language: Language) => Promise<void>;
    rolloverMode: RolloverMode;
    updateRolloverMode: (mode: RolloverMode) => Promise<void>;
    monthlyRollover: MonthlyRollover;
    budgetTipsDoc: BudgetTipsDoc | null;
    budgetTipsLoading: boolean;
    budgetTipsGenerating: boolean;
    regenerateBudgetTips: (expenses: Expense[], categoryLimits: Record<string, number>, language: Language) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { user, role } = useAuth();
    const { family } = useFamily();
    const { showToast: rawShowToast } = useToast();
    const { t } = useLanguage();
    const showToast = useCallback((key: string) => rawShowToast(t(key as TranslationKeys)), [rawShowToast, t]);

    const userId = user?.id ?? null;
    const familyId = family?.id ?? null;
    const hasAccess = role !== null;
    const isAnonymous = !user || user.isAnonymous === true;

    const expensesCol = useExpensesRef(userId, familyId, hasAccess);
    const categoriesRef = useCategoriesRef(userId, familyId, hasAccess);
    const insightsRef = useInsightsRef(userId, familyId, hasAccess);
    const rolloverRef = useRolloverRef(userId, familyId, hasAccess);
    const budgetTipsRef = useBudgetTipsRef(userId, familyId, hasAccess);

    const { _subscribe, expenses, loading, addExpense, updateExpense, deleteExpense, clearAll } =
        useExpenseStore();

    const { categories, addCategory, removeCategory, categoryLimits, setCategoryLimit, _subscribe: subscribeCategories } =
        useCategoryStore();

    const {
        doc: insightsDoc,
        loading: insightsLoading,
        generating: insightsGenerating,
        regenerate: regenerateInsights,
        _subscribe: subscribeInsights,
    } = useInsightsStore();

    const { currency, changeCurrency, _init: initCurrency } = useCurrencyStore();

    const { accentColor, changeAccentColor, _init: initAccentColor } = useAccentColorStore();

    const { rolloverMode, updateRolloverMode, _subscribe: subscribeRollover } = useRolloverStore();

    const {
        doc: budgetTipsDoc,
        loading: budgetTipsLoading,
        generating: budgetTipsGenerating,
        regenerate: regenerateBudgetTips,
        _subscribe: subscribeBudgetTips,
    } = useBudgetTipsStore();

    const activeExpenses = useMemo(() => expenses.filter((e) => !e.scheduled), [expenses]);
    const scheduledExpenses = useMemo(() => expenses.filter((e) => e.scheduled), [expenses]);

    const monthlyRollover = useMemo(
        () => computeMonthlyRollover(activeExpenses, rolloverMode),
        [activeExpenses, rolloverMode]
    );

    // Wire Firestore collection + user context into the expense store
    useEffect(() => {
        const unsub = _subscribe(expensesCol, user, family, showToast);
        return unsub;
    }, [expensesCol, user, family, showToast]);

    // Re-init currency store whenever the user changes (login, logout, etc.)
    useEffect(() => {
        initCurrency(userId, isAnonymous);
    }, [userId, isAnonymous, initCurrency]);

    // Re-init accent color store whenever the user changes (login, logout, etc.)
    useEffect(() => {
        initAccentColor(userId, isAnonymous);
    }, [userId, isAnonymous, initAccentColor]);

    // Reflect the chosen accent color on the document root so CSS variables pick it up
    useEffect(() => {
        document.documentElement.setAttribute('data-accent', accentColor);
    }, [accentColor]);

    // Wire Firestore categories document into the category store
    useEffect(() => {
        const unsub = subscribeCategories(categoriesRef, showToast);
        return unsub;
    }, [categoriesRef, showToast]);

    // Wire Firestore insights document into the insights store
    useEffect(() => {
        const unsub = subscribeInsights(insightsRef, user, showToast);
        return unsub;
    }, [insightsRef, user, showToast]);

    // Wire Firestore rollover document into the rollover store
    useEffect(() => {
        const unsub = subscribeRollover(rolloverRef, showToast);
        return unsub;
    }, [rolloverRef, showToast]);

    // Wire Firestore budget tips document into the budget tips store
    useEffect(() => {
        const unsub = subscribeBudgetTips(budgetTipsRef, user, showToast);
        return unsub;
    }, [budgetTipsRef, user, showToast]);

    return (
        <AppContext.Provider value={{
            expenses, activeExpenses, scheduledExpenses, loading, addExpense, updateExpense, deleteExpense, clearAll,
            currency, changeCurrency,
            accentColor, changeAccentColor,
            categories, addCategory, removeCategory, categoryLimits, setCategoryLimit,
            insightsDoc, insightsLoading, insightsGenerating, regenerateInsights,
            rolloverMode, updateRolloverMode, monthlyRollover,
            budgetTipsDoc, budgetTipsLoading, budgetTipsGenerating, regenerateBudgetTips,
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
