import type { Expense, CategoryStat, InsightsStats } from '../types';

const TOP_CATEGORIES_LIMIT = 5;
const SPIKE_MIN_PERCENT = 50;
const SPIKE_MIN_AMOUNT = 10; // ignore tiny/negligible categories even if they technically "spiked"
const MOVING_AVERAGE_MONTHS = 3;

function monthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function shiftMonth(date: Date, delta: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function isCountedExpense(e: Expense, monthStr: string): boolean {
    return e.type === 'expense' && !e.scheduled && e.date.startsWith(monthStr);
}

function sumByCategory(expenses: Expense[], monthStr: string): Map<string, number> {
    const totals = new Map<string, number>();
    for (const e of expenses) {
        if (!isCountedExpense(e, monthStr)) continue;
        const category = e.category || 'Other';
        totals.set(category, (totals.get(category) ?? 0) + Number(e.amount || 0));
    }
    return totals;
}

function sumMonth(expenses: Expense[], monthStr: string): number {
    let total = 0;
    for (const e of expenses) {
        if (!isCountedExpense(e, monthStr)) continue;
        total += Number(e.amount || 0);
    }
    return total;
}

function percentChange(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return round2(((current - previous) / previous) * 100);
}

export function buildInsightsStats(expenses: Expense[], now: Date = new Date()): InsightsStats {
    const currentMonthStr = monthKey(now);
    const previousMonthStr = monthKey(shiftMonth(now, -1));

    const currentByCategory = sumByCategory(expenses, currentMonthStr);
    const previousByCategory = sumByCategory(expenses, previousMonthStr);

    const categoryNames = new Set([...currentByCategory.keys(), ...previousByCategory.keys()]);

    const categories: CategoryStat[] = [...categoryNames].map((category) => {
        const currentTotal = round2(currentByCategory.get(category) ?? 0);
        const previousTotal = round2(previousByCategory.get(category) ?? 0);
        return {
            category,
            currentTotal,
            previousTotal,
            percentChange: percentChange(currentTotal, previousTotal),
        };
    });

    const topCategories = [...categories]
        .filter((c) => c.currentTotal > 0)
        .sort((a, b) => b.currentTotal - a.currentTotal)
        .slice(0, TOP_CATEGORIES_LIMIT);

    const spikes = categories.filter((c) =>
        c.previousTotal > 0 &&
        c.percentChange !== null &&
        c.percentChange >= SPIKE_MIN_PERCENT &&
        c.currentTotal >= SPIKE_MIN_AMOUNT
    );

    let monthlyTotalSum = 0;
    for (let i = 0; i < MOVING_AVERAGE_MONTHS; i++) {
        monthlyTotalSum += sumMonth(expenses, monthKey(shiftMonth(now, -i)));
    }

    return {
        month: currentMonthStr,
        currentMonthTotal: round2(sumMonth(expenses, currentMonthStr)),
        previousMonthTotal: round2(sumMonth(expenses, previousMonthStr)),
        categories,
        topCategories,
        spikes,
        threeMonthAverage: round2(monthlyTotalSum / MOVING_AVERAGE_MONTHS),
    };
}

export function computeStatsFingerprint(stats: InsightsStats): string {
    const json = JSON.stringify(stats);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
        hash = (hash * 31 + json.charCodeAt(i)) | 0;
    }
    return hash.toString(36);
}
