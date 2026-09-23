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
    repeat?: 'monthly'; // only meaningful when `scheduled` is also true
}

// Partial update of an expense. A `null` value removes that field from
// the stored document (e.g. turning a scheduled payment into a normal one).
export type ExpenseUpdate = {
    [K in keyof Omit<Expense, 'id'>]?: Expense[K] | null;
};

export type TransactionFormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
    repeat?: 'none' | 'once' | 'monthly';
};
