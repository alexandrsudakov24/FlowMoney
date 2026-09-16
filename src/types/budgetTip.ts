export interface BudgetTip {
    category: string;
    message: string;
}

export interface BudgetCategoryStat {
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    pctUsed: number;
}

export interface BudgetTipsStats {
    month: string; // YYYY-MM
    categories: BudgetCategoryStat[];
}

export interface BudgetTipsDoc {
    tips: BudgetTip[];
    generatedAt: number;
    statsFingerprint: string;
    language: 'en' | 'ru' | 'he';
    generatedBy?: string;
}
