import type { Expense } from '../types';

export const CATEGORY_COLORS = [
    '#2a78d6', '#1baf7a', '#eda100', '#008300',
    '#4a3aa7', '#e34948', '#e87ba4', '#eb6834',
    '#812964', '#5dbdfb', '#4c51f6', '#911a36',
];

/**
 * Assigns each expense category a stable color based on the order it first
 * appears in `expenses` — the same order the category pie chart builds its
 * slices in, so anything else showing a category can reuse its exact color.
 */
export function getCategoryColorMap(expenses: Expense[]): Record<string, string> {
    const order: string[] = [];
    const seen = new Set<string>();
    expenses.forEach((e) => {
        if (e.type !== 'expense') return;
        const cat = e.category || 'Other';
        if (!seen.has(cat)) {
            seen.add(cat);
            order.push(cat);
        }
    });

    const map: Record<string, string> = {};
    order.forEach((cat, i) => {
        map[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    return map;
}

/** Darkens a "#rrggbb" color by `amount` (0–1) — used to build a two-stop
 *  gradient from a single category color without relying on CSS color-mix. */
export function darkenHex(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const channel = (shift: number) => {
        const value = (num >> shift) & 0xff;
        return Math.round(Math.max(0, value * (1 - amount)))
            .toString(16)
            .padStart(2, '0');
    };
    return `#${channel(16)}${channel(8)}${channel(0)}`;
}
