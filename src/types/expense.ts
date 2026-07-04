export interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
    note?: string;
    type: 'expense' | 'income';
    addedBy?: { uid: string; name: string };
    createdAt?: number;
    scheduled?: true; // present only while the payment hasn't fired yet
}

export type TransactionFormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
    scheduled?: boolean;
};
