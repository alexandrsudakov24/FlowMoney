import type { Expense, RolloverMode } from '../types';

export interface MonthlyRollover {
    net: number;
    carryIn: number;
    total: number;
}

function monthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function shiftMonth(date: Date, delta: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function applyRollover(total: number, mode: RolloverMode): number {
    switch (mode) {
        case 'reset': return 0;
        case 'full': return total;
        case 'surplus_only': return Math.max(0, total);
        case 'deficit_only': return Math.min(0, total);
    }
}

function sumNet(expenses: Expense[], monthStr: string): number {
    let net = 0;
    for (const e of expenses) {
        if (e.scheduled || !e.date.startsWith(monthStr)) continue;
        const amount = Number(e.amount || 0);
        net += e.type === 'income' ? amount : -amount;
    }
    return net;
}

/**
 * Walks every month from the earliest transaction to `now` (inclusive),
 * carrying the previous month's net (income − expenses) forward per
 * `rolloverMode`. Gap months with no transactions are still walked so the
 * carry propagates correctly across them.
 */
export function computeMonthlyRollover(
    expenses: Expense[],
    rolloverMode: RolloverMode,
    now: Date = new Date(),
): MonthlyRollover {
    if (expenses.length === 0) return { net: 0, carryIn: 0, total: 0 };

    const earliestDate = expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date);
    const [startY, startM] = earliestDate.slice(0, 7).split('-').map(Number);
    let cursor = new Date(startY, startM - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);

    let carry = 0;
    let result: MonthlyRollover = { net: 0, carryIn: 0, total: 0 };

    while (cursor <= end) {
        const monthStr = monthKey(cursor);
        const net = sumNet(expenses, monthStr);
        const total = net + carry;

        result = { net, carryIn: carry, total };

        carry = applyRollover(total, rolloverMode);
        cursor = shiftMonth(cursor, 1);
    }

    return result;
}
