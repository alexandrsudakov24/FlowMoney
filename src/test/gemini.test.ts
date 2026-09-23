import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateInsights, scanReceipt, parseTransactionText, GeminiRequestError } from '../services/gemini';

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    globalThis.fetch = vi.fn().mockResolvedValue({
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
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('generativelanguage.googleapis.com'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'X-goog-api-key': 'test-key' }),
            })
        );
    });

    it('retries when the first model is unavailable and succeeds on the next one', async () => {
        const insights = [{ title: 'Overspending', description: 'You spent more on food this month.', severity: 'warning' }];
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: false, status: 404 })
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(geminiTextResponse(JSON.stringify({ insights }))),
            });
        globalThis.fetch = fetchMock;

        const result = await generateInsights({ total: 100 }, 'en');

        expect(result).toEqual(insights);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[0][0]).toContain('gemini-3.6-flash');
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
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));

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

describe('scanReceipt', () => {
    const image = { mimeType: 'image/jpeg', data: 'BASE64DATA' };
    const categories = ['Food', 'Transport', 'Other'];

    beforeEach(() => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('sends the image inline and returns the parsed receipt', async () => {
        const receipt = { isReceipt: true, amount: 42.5, date: '2026-09-20', category: 'Food', note: 'Shufersal' };
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify(receipt))) });

        const result = await scanReceipt(image, categories, '2026-09-23', 'en');

        expect(result).toEqual(receipt);
        const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
        expect(body.contents[0].parts[0]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'BASE64DATA' } });
    });

    it('blanks out an unknown category, a malformed date and a future date', async () => {
        const receipt = { isReceipt: true, amount: 10, date: '2026-12-01', category: 'Groceries', note: 'Shop' };
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify(receipt))) });

        const result = await scanReceipt(image, categories, '2026-09-23', 'en');

        expect(result.category).toBe('');
        expect(result.date).toBe('');
    });

    it('throws parse_error when the amount is missing', async () => {
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify({ isReceipt: true }))) });

        await expect(scanReceipt(image, categories, '2026-09-23', 'en')).rejects.toBeInstanceOf(GeminiRequestError);
    });
});

describe('parseTransactionText', () => {
    const expenseCategories = ['Food', 'Transport', 'Other'];
    const incomeCategories = ['Salary', 'Gift', 'Other'];

    beforeEach(() => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('returns the parsed transaction and includes the phrase in the prompt', async () => {
        const tx = { isTransaction: true, type: 'expense', amount: 230, date: '2026-09-22', category: 'Food', note: 'Groceries' };
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify(tx))) });

        const result = await parseTransactionText('groceries 230 yesterday', expenseCategories, incomeCategories, '2026-09-23', 'en');

        expect(result).toEqual(tx);
        const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
        expect(body.contents[0].parts[0].text).toContain('groceries 230 yesterday');
    });

    it('rejects a category that belongs to the other transaction type', async () => {
        const tx = { isTransaction: true, type: 'income', amount: 8000, date: '', category: 'Food', note: '' };
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify(tx))) });

        const result = await parseTransactionText('got my salary 8000', expenseCategories, incomeCategories, '2026-09-23', 'en');

        expect(result.type).toBe('income');
        expect(result.category).toBe('');
    });

    it('drops a future date', async () => {
        const tx = { isTransaction: true, type: 'expense', amount: 15, date: '2026-10-01', category: 'Food', note: 'Coffee' };
        mockFetchOnce({ json: () => Promise.resolve(geminiTextResponse(JSON.stringify(tx))) });

        const result = await parseTransactionText('coffee 15', expenseCategories, incomeCategories, '2026-09-23', 'en');

        expect(result.date).toBe('');
    });
});
