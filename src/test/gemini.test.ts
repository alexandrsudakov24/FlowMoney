import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateInsights, GeminiRequestError } from '../services/gemini';

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        ...response,
    });
}

function geminiTextResponse(text: string) {
    return {
        candidates: [{ content: { parts: [{ text }] } }],
    };
}

describe('generateInsights', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('throws no_api_key when the key is missing', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', '');

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'no_api_key',
        });
    });

    it('returns parsed insights on success', async () => {
        const insights = [{ title: 'Overspending', description: 'You spent more on food this month.', severity: 'warning' }];
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify({ insights }))) });

        const result = await generateInsights({ total: 100 }, 'en');

        expect(result).toEqual(insights);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('throws rate_limited on HTTP 429', async () => {
        mockFetchOnce({ ok: false, status: 429 });

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'rate_limited',
        });
    });

    it('throws network_error on other non-ok statuses', async () => {
        mockFetchOnce({ ok: false, status: 500 });

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'network_error',
        });
    });

    it('throws network_error when fetch rejects', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'network_error',
        });
    });

    it('throws blocked when promptFeedback has a blockReason', async () => {
        mockFetchOnce({ json: () => Promise.resolve({ promptFeedback: { blockReason: 'SAFETY' } }) });

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'blocked',
        });
    });

    it('throws blocked when the candidate finishReason is SAFETY', async () => {
        mockFetchOnce({
            json: () => Promise.resolve({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] }),
        });

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'blocked',
        });
    });

    it('throws parse_error when the model text is not valid JSON', async () => {
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse('not json')) });

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'parse_error',
        });
    });

    it('throws parse_error when insights is missing from the parsed JSON', async () => {
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify({ foo: 'bar' }))) });

        await expect(generateInsights({}, 'en')).rejects.toMatchObject({
            code: 'parse_error',
        });
    });

    it('is an instance of GeminiRequestError', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', '');

        try {
            await generateInsights({}, 'en');
            expect.fail('expected generateInsights to throw');
        } catch (err) {
            expect(err).toBeInstanceOf(GeminiRequestError);
        }
    });
});
