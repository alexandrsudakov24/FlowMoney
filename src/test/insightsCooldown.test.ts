import { describe, it, expect } from 'vitest';
import {
    INSIGHTS_COOLDOWN_MS,
    msUntilInsightsAvailable,
    canRegenerateInsights,
} from '../utils/insightsCooldown';

describe('insightsCooldown', () => {
    it('is immediately available when insights were never generated', () => {
        expect(msUntilInsightsAvailable(null)).toBe(0);
        expect(canRegenerateInsights(null)).toBe(true);
    });

    it('is not available right after generating', () => {
        const now = 1_000_000;
        expect(canRegenerateInsights(now, now)).toBe(false);
        expect(msUntilInsightsAvailable(now, now)).toBe(INSIGHTS_COOLDOWN_MS);
    });

    it('counts down as time passes', () => {
        const generatedAt = 1_000_000;
        const now = generatedAt + INSIGHTS_COOLDOWN_MS / 2;
        expect(msUntilInsightsAvailable(generatedAt, now)).toBe(INSIGHTS_COOLDOWN_MS / 2);
        expect(canRegenerateInsights(generatedAt, now)).toBe(false);
    });

    it('becomes available exactly at the cooldown boundary', () => {
        const generatedAt = 1_000_000;
        const now = generatedAt + INSIGHTS_COOLDOWN_MS;
        expect(msUntilInsightsAvailable(generatedAt, now)).toBe(0);
        expect(canRegenerateInsights(generatedAt, now)).toBe(true);
    });

    it('stays available after the cooldown has long passed (no negative values)', () => {
        const generatedAt = 1_000_000;
        const now = generatedAt + INSIGHTS_COOLDOWN_MS * 3;
        expect(msUntilInsightsAvailable(generatedAt, now)).toBe(0);
        expect(canRegenerateInsights(generatedAt, now)).toBe(true);
    });
});
