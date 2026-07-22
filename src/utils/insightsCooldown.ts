export const INSIGHTS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Milliseconds remaining before the next manual regeneration is allowed.
// 0 means it's available right now (or insights have never been generated).
export function msUntilInsightsAvailable(generatedAt: number | null, now: number = Date.now()): number {
    if (generatedAt === null) return 0;
    return Math.max(0, generatedAt + INSIGHTS_COOLDOWN_MS - now);
}

export function canRegenerateInsights(generatedAt: number | null, now: number = Date.now()): boolean {
    return msUntilInsightsAvailable(generatedAt, now) === 0;
}
