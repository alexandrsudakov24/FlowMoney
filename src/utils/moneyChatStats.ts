import type { Expense } from '../types';

const MONTHS_BACK = 12;

interface MonthBreakdown {
    month: string; // YYYY-MM
    totalExpense: number;
    totalIncome: number;
    byCategory: Record<string, number>; // expense-only, category -> amount
}

export interface MoneyChatStats {
    currentMonth: string; // YYYY-MM, so the model knows what "this month" means
    months: MonthBreakdown[];
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Aggregates the last 12 months of activity into per-month, per-category
// totals — small enough to send to Gemini in full, so it can answer
// "how much on X in month Y" without needing the raw transaction list.
export function buildMoneyChatStats(expenses: Expense[], now: Date = new Date()): MoneyChatStats {
    const months: MonthBreakdown[] = [];
    for (let i = 0; i < MONTHS_BACK; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ month: monthKey(d), totalExpense: 0, totalIncome: 0, byCategory: {} });
    }
    const byMonth = new Map(months.map((m) => [m.month, m]));

    expenses.forEach((e) => {
        if (e.scheduled) return;
        const m = byMonth.get(e.date.slice(0, 7));
        if (!m) return;
        const amount = Number(e.amount || 0);
        if (e.type === 'expense') {
            m.totalExpense = round2(m.totalExpense + amount);
            const category = e.category || 'Other';
            m.byCategory[category] = round2((m.byCategory[category] || 0) + amount);
        } else {
            m.totalIncome = round2(m.totalIncome + amount);
        }
    });

    return {
        currentMonth: monthKey(now),
        months: months.filter((m) => m.totalExpense > 0 || m.totalIncome > 0),
    };
}
