export const BUDGET_TIPS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Milliseconds remaining before the next manual regeneration is allowed.
// 0 means it's available right now (or tips have never been generated).
export function msUntilBudgetTipsAvailable(generatedAt: number | null, now: number = Date.now()): number {
    if (generatedAt === null) return 0;
    return Math.max(0, generatedAt + BUDGET_TIPS_COOLDOWN_MS - now);
}

export function canRegenerateBudgetTips(generatedAt: number | null, now: number = Date.now()): boolean {
    return msUntilBudgetTipsAvailable(generatedAt, now) === 0;
}
