import { describe, it, expect } from 'vitest';
import { computeMonthlyRollover } from '../utils/computeMonthlyRollover';
import type { Expense } from '../types';

const NOW = new Date(2026, 2, 15); // 2026-03-15

let idCounter = 0;
function expense(overrides: Partial<Expense>): Expense {
    idCounter += 1;
    return {
        id: `e-${idCounter}`,
        amount: 10,
        category: 'Food',
        date: '2026-01-01',
        type: 'expense',
        ...overrides,
    };
}

describe('computeMonthlyRollover', () => {
    it('returns all zeros with no transactions', () => {
        expect(computeMonthlyRollover([], 'full', NOW)).toEqual({ net: 0, carryIn: 0, total: 0 });
    });

    it('reset mode ignores prior months entirely', () => {
        const expenses = [
            expense({ date: '2026-01-15', amount: 200, type: 'expense' }), // Jan net: -200
            expense({ date: '2026-02-15', amount: 300, type: 'income' }),  // Feb net: +300
            expense({ date: '2026-03-01', amount: 40, type: 'expense' }),  // Mar net: -40
        ];
        const result = computeMonthlyRollover(expenses, 'reset', NOW);
        expect(result).toEqual({ net: -40, carryIn: 0, total: -40 });
    });

    it('full mode carries both surplus and deficit forward', () => {
        const expenses = [
            expense({ date: '2026-01-15', amount: 200, type: 'expense' }), // Jan: net -200, total -200
            expense({ date: '2026-02-15', amount: 300, type: 'income' }),  // Feb: net +300, total 100
            expense({ date: '2026-03-01', amount: 40, type: 'expense' }),  // Mar: net -40, total 60
        ];
        const result = computeMonthlyRollover(expenses, 'full', NOW);
        expect(result).toEqual({ net: -40, carryIn: 100, total: 60 });
    });

    it('surplus_only carries a positive total but drops a deficit', () => {
        const expenses = [
            expense({ date: '2026-01-15', amount: 200, type: 'expense' }), // Jan: total -200 -> carried as 0
            expense({ date: '2026-02-15', amount: 80, type: 'income' }),   // Feb: total 80 -> carried
        ];
        const result = computeMonthlyRollover(expenses, 'surplus_only', NOW);
        // Mar: net 0, carryIn 80, total 80
        expect(result).toEqual({ net: 0, carryIn: 80, total: 80 });
    });

    it('deficit_only carries a negative total but drops a surplus', () => {
        const expenses = [
            expense({ date: '2026-01-15', amount: 80, type: 'income' }),   // Jan: total 80 -> dropped, carry 0
            expense({ date: '2026-02-15', amount: 50, type: 'expense' }),  // Feb: total -50 -> carried
        ];
        const result = computeMonthlyRollover(expenses, 'deficit_only', NOW);
        // Mar: net 0, carryIn -50, total -50
        expect(result).toEqual({ net: 0, carryIn: -50, total: -50 });
    });

    it('propagates carry through gap months with no transactions', () => {
        // Only January has data; Feb has no transactions but the carry must still flow through it into March.
        const expenses = [expense({ date: '2026-01-15', amount: 60, type: 'income' })]; // Jan: total 60
        const result = computeMonthlyRollover(expenses, 'full', NOW);
        // Feb: net 0, carryIn 60, total 60; Mar: net 0, carryIn 60, total 60
        expect(result).toEqual({ net: 0, carryIn: 60, total: 60 });
    });
});
