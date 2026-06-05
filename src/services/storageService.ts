export interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
    note?: string;
    type: 'expense' | 'income';
}

const KEY = 'expenses_data_v1';

export const loadExpenses = (): Expense[] => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Expense[];
        // ensure date fields are strings in YYYY-MM-DD
        return parsed.map((p) => ({ ...p }));
    } catch (e) {
        console.error('Failed to load expenses', e);
        return [];
    }
};

export const saveExpenses = (expenses: Expense[]) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(expenses));
    } catch (e) {
        console.error('Failed to save expenses', e);
    }
};

