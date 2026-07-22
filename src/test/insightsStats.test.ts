import { describe, it, expect } from 'vitest';
import { buildInsightsStats, computeStatsFingerprint } from '../utils/insightsStats';
import type { Expense } from '../types';

// Fixed "now": March is current month, February is previous, January is 2 months back.
const NOW = new Date(2026, 2, 15); // 2026-03-15

let idCounter = 0;
function expense(overrides: Partial<Expense>): Expense {
    idCounter += 1;
    return {
        id: `e-${idCounter}`,
        amount: 10,
        category: 'Food',
        date: '2026-03-01',
        type: 'expense',
        ...overrides,
    };
}

describe('buildInsightsStats', () => {
    it('sums current and previous month totals per category', () => {
        const expenses: Expense[] = [
            expense({ category: 'Food', amount: 100, date: '2026-03-05' }),
            expense({ category: 'Food', amount: 50, date: '2026-03-20' }),
            expense({ category: 'Food', amount: 80, date: '2026-02-10' }),
            expense({ category: 'Transport', amount: 30, date: '2026-03-01' }),
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.month).toBe('2026-03');
        expect(stats.currentMonthTotal).toBe(180);
        expect(stats.previousMonthTotal).toBe(80);

        const food = stats.categories.find((c) => c.category === 'Food');
        expect(food).toEqual({ category: 'Food', currentTotal: 150, previousTotal: 80, percentChange: 87.5 });
    });

    it('returns null percentChange for a brand-new category with no previous-month base', () => {
        const expenses: Expense[] = [
            expense({ category: 'Gadgets', amount: 200, date: '2026-03-10' }),
        ];

        const stats = buildInsightsStats(expenses, NOW);
        const gadgets = stats.categories.find((c) => c.category === 'Gadgets');

        expect(gadgets?.percentChange).toBeNull();
    });

    it('computes -100% change for a category that disappeared this month', () => {
        const expenses: Expense[] = [
            expense({ category: 'Books', amount: 40, date: '2026-02-05' }),
        ];

        const stats = buildInsightsStats(expenses, NOW);
        const books = stats.categories.find((c) => c.category === 'Books');

        expect(books).toEqual({ category: 'Books', currentTotal: 0, previousTotal: 40, percentChange: -100 });
    });

    it('excludes income and scheduled (not-yet-fired) transactions', () => {
        const expenses: Expense[] = [
            expense({ category: 'Salary', amount: 5000, date: '2026-03-01', type: 'income' }),
            expense({ category: 'Food', amount: 999, date: '2026-03-01', scheduled: true }),
            expense({ category: 'Food', amount: 20, date: '2026-03-01' }),
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.currentMonthTotal).toBe(20);
        expect(stats.categories.find((c) => c.category === 'Salary')).toBeUndefined();
    });

    it('flags a spike: >=50% growth and not a negligible amount', () => {
        const expenses: Expense[] = [
            expense({ category: 'Entertainment', amount: 100, date: '2026-02-01' }),
            expense({ category: 'Entertainment', amount: 160, date: '2026-03-01' }), // +60%
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.spikes).toHaveLength(1);
        expect(stats.spikes[0].category).toBe('Entertainment');
    });

    it('does not flag growth below the 50% threshold as a spike', () => {
        const expenses: Expense[] = [
            expense({ category: 'Entertainment', amount: 100, date: '2026-02-01' }),
            expense({ category: 'Entertainment', amount: 130, date: '2026-03-01' }), // +30%
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.spikes).toHaveLength(0);
    });

    it('does not flag a negligible (tiny) category as a spike even at high % growth', () => {
        const expenses: Expense[] = [
            expense({ category: 'Parking', amount: 1, date: '2026-02-01' }),
            expense({ category: 'Parking', amount: 5, date: '2026-03-01' }), // +400% but tiny amount
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.spikes).toHaveLength(0);
    });

    it('does not flag a brand-new category (no base) as a spike', () => {
        const expenses: Expense[] = [
            expense({ category: 'Gadgets', amount: 200, date: '2026-03-10' }),
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.spikes).toHaveLength(0);
    });

    it('sorts topCategories by current-month total, descending, limited to 5', () => {
        const expenses: Expense[] = [
            expense({ category: 'A', amount: 10, date: '2026-03-01' }),
            expense({ category: 'B', amount: 90, date: '2026-03-01' }),
            expense({ category: 'C', amount: 50, date: '2026-03-01' }),
            expense({ category: 'D', amount: 20, date: '2026-03-01' }),
            expense({ category: 'E', amount: 5, date: '2026-03-01' }),
            expense({ category: 'F', amount: 1, date: '2026-03-01' }),
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.topCategories).toHaveLength(5);
        expect(stats.topCategories.map((c) => c.category)).toEqual(['B', 'C', 'D', 'A', 'E']);
    });

    it('computes a 3-month moving average of total spend', () => {
        const expenses: Expense[] = [
            expense({ category: 'Food', amount: 100, date: '2026-03-01' }),
            expense({ category: 'Food', amount: 200, date: '2026-02-01' }),
            expense({ category: 'Food', amount: 300, date: '2026-01-01' }),
            expense({ category: 'Food', amount: 999, date: '2025-12-01' }), // outside the 3-month window
        ];

        const stats = buildInsightsStats(expenses, NOW);

        expect(stats.threeMonthAverage).toBe(200); // (100 + 200 + 300) / 3
    });

    it('returns zeroed stats for an empty expense list', () => {
        const stats = buildInsightsStats([], NOW);

        expect(stats.currentMonthTotal).toBe(0);
        expect(stats.previousMonthTotal).toBe(0);
        expect(stats.categories).toEqual([]);
        expect(stats.topCategories).toEqual([]);
        expect(stats.spikes).toEqual([]);
        expect(stats.threeMonthAverage).toBe(0);
    });
});

describe('computeStatsFingerprint', () => {
    it('is deterministic for identical stats', () => {
        const expenses: Expense[] = [expense({ category: 'Food', amount: 50, date: '2026-03-01' })];

        const a = computeStatsFingerprint(buildInsightsStats(expenses, NOW));
        const b = computeStatsFingerprint(buildInsightsStats(expenses, NOW));

        expect(a).toBe(b);
    });

    it('changes when the underlying numbers change', () => {
        const before = buildInsightsStats(
            [expense({ category: 'Food', amount: 50, date: '2026-03-01' })],
            NOW
        );
        const after = buildInsightsStats(
            [expense({ category: 'Food', amount: 51, date: '2026-03-01' })],
            NOW
        );

        expect(computeStatsFingerprint(before)).not.toBe(computeStatsFingerprint(after));
    });
});
