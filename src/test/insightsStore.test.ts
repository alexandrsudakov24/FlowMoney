import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInsightsStore } from '../stores/insightsStore';
import { GeminiRequestError } from '../services/gemini';
import type { DocumentReference } from 'firebase/firestore';
import type { Expense } from '../types';

const { mockSetDoc, mockGenerateInsights, snapshotCallbacks } = vi.hoisted(() => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined);
    const mockGenerateInsights = vi.fn();
    const snapshotCallbacks: Array<(snap: unknown) => void> = [];
    return { mockSetDoc, mockGenerateInsights, snapshotCallbacks };
});

vi.mock('firebase/firestore', () => ({
    onSnapshot: vi.fn((_ref: unknown, cb: (snap: unknown) => void) => {
        snapshotCallbacks.push(cb);
        return () => {};
    }),
    setDoc: mockSetDoc,
}));

vi.mock('../services/gemini', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/gemini')>();
    return { ...actual, generateInsights: mockGenerateInsights };
});

function makeSnapshot(data: Record<string, unknown> | null) {
    return { exists: () => data !== null, data: () => data };
}

const ref = {} as DocumentReference;
const user = { id: 'u1', name: 'Alex', email: 'alex@test.com' };
const expenses: Expense[] = [
    { id: 'e-1', amount: 20, category: 'Food', date: '2026-03-01', type: 'expense' },
];

describe('insightsStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        snapshotCallbacks.length = 0;
        useInsightsStore.setState({ doc: null, loading: false, generating: false });
    });

    it('clears the doc when subscribed with no ref (logged out)', () => {
        useInsightsStore.getState()._subscribe(null, user, vi.fn());
        expect(useInsightsStore.getState().doc).toBeNull();
        expect(useInsightsStore.getState().loading).toBe(false);
    });

    it('updates doc from Firestore snapshots', () => {
        useInsightsStore.getState()._subscribe(ref, user, vi.fn());
        const cached = {
            insights: [{ title: 'A', description: 'B' }],
            generatedAt: 123,
            statsFingerprint: 'abc',
            language: 'en',
        };

        snapshotCallbacks[0](makeSnapshot(cached));

        expect(useInsightsStore.getState().doc).toEqual(cached);
        expect(useInsightsStore.getState().loading).toBe(false);
    });

    it('sets doc to null when the snapshot has no document', () => {
        useInsightsStore.getState()._subscribe(ref, user, vi.fn());
        snapshotCallbacks[0](makeSnapshot(null));
        expect(useInsightsStore.getState().doc).toBeNull();
    });

    it('regenerate() generates and saves insights when never generated before', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
        mockGenerateInsights.mockResolvedValue([{ title: 'Spike', description: 'Food is up' }]);
        useInsightsStore.getState()._subscribe(ref, user, vi.fn());

        await useInsightsStore.getState().regenerate(expenses, 'en');

        expect(mockGenerateInsights).toHaveBeenCalledWith(expect.any(Object), 'en');
        expect(mockSetDoc).toHaveBeenCalledWith(ref, {
            insights: [{ title: 'Spike', description: 'Food is up' }],
            generatedAt: 1_000_000,
            statsFingerprint: expect.any(String),
            language: 'en',
            generatedBy: 'u1',
        });
        expect(useInsightsStore.getState().generating).toBe(false);
    });

    it('regenerate() is a no-op while the cooldown is active', async () => {
        useInsightsStore.getState()._subscribe(ref, user, vi.fn());
        snapshotCallbacks[0](makeSnapshot({
            insights: [], generatedAt: Date.now(), statsFingerprint: 'x', language: 'en',
        }));

        await useInsightsStore.getState().regenerate(expenses, 'en');

        expect(mockGenerateInsights).not.toHaveBeenCalled();
        expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('shows a mapped toast on GeminiRequestError and keeps the cached doc', async () => {
        const showToast = vi.fn();
        mockGenerateInsights.mockRejectedValue(new GeminiRequestError('rate_limited'));
        useInsightsStore.getState()._subscribe(ref, user, showToast);

        const cached = { insights: [{ title: 'Old', description: 'Cached' }], generatedAt: 1, statsFingerprint: 'x', language: 'en' as const };
        snapshotCallbacks[0](makeSnapshot(cached));
        vi.spyOn(Date, 'now').mockReturnValue(cached.generatedAt + 999_999_999);

        await useInsightsStore.getState().regenerate(expenses, 'en');

        expect(showToast).toHaveBeenCalledWith('insights_error_rate_limited');
        expect(mockSetDoc).not.toHaveBeenCalled();
        expect(useInsightsStore.getState().doc).toEqual(cached);
        expect(useInsightsStore.getState().generating).toBe(false);
    });

    it('maps unexpected errors to the generic network_error toast', async () => {
        const showToast = vi.fn();
        mockGenerateInsights.mockRejectedValue(new Error('boom'));
        useInsightsStore.getState()._subscribe(ref, user, showToast);

        await useInsightsStore.getState().regenerate(expenses, 'en');

        expect(showToast).toHaveBeenCalledWith('insights_error_network_error');
    });

    it('does nothing when there is no ref (logged out)', async () => {
        useInsightsStore.getState()._subscribe(null, user, vi.fn());
        await useInsightsStore.getState().regenerate(expenses, 'en');
        expect(mockGenerateInsights).not.toHaveBeenCalled();
    });
});
