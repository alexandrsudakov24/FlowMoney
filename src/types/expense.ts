export interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
    note?: string;
    type: 'expense' | 'income';
    addedBy?: { uid: string; name: string };
}

export type TransactionFormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
};
