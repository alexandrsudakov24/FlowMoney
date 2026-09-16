import type { Expense, BudgetTipsStats, BudgetCategoryStat } from '../types';

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

// Only categories that actually have a limit set are relevant to budget
// tips — categories without one behave as if the feature doesn't exist.
export function buildBudgetTipsStats(
    expenses: Expense[],
    categoryLimits: Record<string, number>,
    now: Date = new Date(),
): BudgetTipsStats {
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const spent: Record<string, number> = {};
    expenses.forEach((e) => {
        if (e.type !== 'expense' || e.scheduled || !e.date.startsWith(monthStr)) return;
        spent[e.category] = (spent[e.category] || 0) + Number(e.amount || 0);
    });

    const categories: BudgetCategoryStat[] = Object.entries(categoryLimits).map(([category, limit]) => {
        const categorySpent = round2(spent[category] || 0);
        return {
            category,
            limit: round2(limit),
            spent: categorySpent,
            remaining: round2(limit - categorySpent),
            pctUsed: limit > 0 ? round2((categorySpent / limit) * 100) : 0,
        };
    });

    return { month: monthStr, categories };
}

export function computeBudgetStatsFingerprint(stats: BudgetTipsStats): string {
    const json = JSON.stringify(stats);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
        hash = (hash * 31 + json.charCodeAt(i)) | 0;
    }
    return hash.toString(36);
}
