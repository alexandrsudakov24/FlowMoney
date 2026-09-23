import type { Language } from '../i18n';
import type { Insight, BudgetTip } from '../types';

const MODEL_FALLBACKS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
const ENDPOINT_TEMPLATE = 'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent';

export type GeminiErrorCode = 'rate_limited' | 'blocked' | 'parse_error' | 'network_error' | 'no_api_key' | 'invalid_api_key';

export class GeminiRequestError extends Error {
    code: GeminiErrorCode;

    constructor(code: GeminiErrorCode, message?: string) {
        super(message ?? code);
        this.name = 'GeminiRequestError';
        this.code = code;
    }
}

const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    ru: 'Russian',
    he: 'Hebrew',
};

interface GeminiApiResponse {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
    }>;
}

export interface InlineImage {
    mimeType: string;
    data: string; // base64, without the data: prefix
}

// Shared request/retry/error-mapping logic for every structured-output call
// this app makes to Gemini. Callers only supply the prompt + JSON schema (and
// optionally an image sent before the prompt) and get back the model's raw
// parsed JSON (already model-fallback-retried).
async function callGeminiJson(prompt: string, schema: object, image?: InlineImage): Promise<unknown> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiRequestError('no_api_key');
    }

    let lastError: GeminiRequestError | null = null;

    for (const model of MODEL_FALLBACKS) {
        const endpoint = ENDPOINT_TEMPLATE.replace('{MODEL}', model);

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
                body: JSON.stringify({
                    contents: [{
                        parts: image
                            ? [{ inline_data: { mime_type: image.mimeType, data: image.data } }, { text: prompt }]
                            : [{ text: prompt }],
                    }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: schema,
                    },
                }),
            });
        } catch {
            lastError = new GeminiRequestError('network_error');
            continue;
        }

        if (!response.ok) {
            if (response.status === 429) {
                throw new GeminiRequestError('rate_limited');
            }

            if (response.status === 400 || response.status === 403 || response.status === 404) {
                lastError = new GeminiRequestError('invalid_api_key');
                if (model !== MODEL_FALLBACKS[MODEL_FALLBACKS.length - 1]) {
                    continue;
                }
                break;
            }

            if ((response.status === 503 || response.status === 500) && model !== MODEL_FALLBACKS[MODEL_FALLBACKS.length - 1]) {
                continue;
            }

            lastError = new GeminiRequestError('network_error');
            break;
        }

        let data: GeminiApiResponse;
        try {
            data = await response.json();
        } catch {
            throw new GeminiRequestError('parse_error');
        }

        const candidate = data.candidates?.[0];
        if (data.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') {
            throw new GeminiRequestError('blocked');
        }

        const text = candidate?.content?.parts?.[0]?.text;
        if (!text) {
            throw new GeminiRequestError('parse_error');
        }

        try {
            return JSON.parse(text);
        } catch {
            throw new GeminiRequestError('parse_error');
        }
    }

    throw lastError ?? new GeminiRequestError('network_error');
}

const INSIGHTS_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        insights: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                },
                required: ['title', 'description', 'severity'],
            },
        },
    },
    required: ['insights'],
};

function buildInsightsPrompt(stats: unknown, language: Language): string {
    return [
        'You are a personal finance assistant. Based on the following spending statistics (JSON),',
        'generate 3 to 6 short, specific insights a user would find useful',
        '(trends, anomalies, savings opportunities, warnings).',
        'Assign each insight a "severity": "info" for a neutral observation,',
        '"warning" for something worth the user\'s attention (e.g. a spending spike),',
        '"critical" for an urgent problem (e.g. spending far exceeding income).',
        `Write every "title" and "description" in ${LANGUAGE_NAMES[language]}.`,
        '',
        'Statistics:',
        JSON.stringify(stats),
    ].join('\n');
}

export async function generateInsights(stats: unknown, language: Language): Promise<Insight[]> {
    const parsed = await callGeminiJson(buildInsightsPrompt(stats, language), INSIGHTS_RESPONSE_SCHEMA) as { insights?: Insight[] };
    if (!Array.isArray(parsed.insights)) {
        throw new GeminiRequestError('parse_error');
    }
    return parsed.insights;
}

export interface SmartSearchFilter {
    categories: string[];
    type: 'all' | 'expense' | 'income';
    dateFrom: string;
    dateTo: string;
    keyword: string;
}

function buildSearchSchema(categories: string[]) {
    return {
        type: 'object',
        properties: {
            categories: {
                type: 'array',
                description: 'Category names from the allowed list that match the query. Empty if the query names no specific category.',
                items: { type: 'string', enum: categories },
            },
            type: {
                type: 'string',
                enum: ['all', 'expense', 'income'],
                description: '"expense" or "income" only if the query clearly asks for one; otherwise "all".',
            },
            dateFrom: { type: 'string', description: 'YYYY-MM-DD, or "" if no start date implied.' },
            dateTo: { type: 'string', description: 'YYYY-MM-DD, or "" if no end date implied.' },
            keyword: { type: 'string', description: 'Free-text term to search notes/categories, or "" if the query is fully covered by categories/dates/type.' },
        },
        required: ['categories', 'type', 'dateFrom', 'dateTo', 'keyword'],
    };
}

function buildSearchPrompt(query: string, categories: string[], todayISO: string): string {
    return [
        'You translate a natural-language search into a structured filter for a personal finance app.',
        `Today's date is ${todayISO}.`,
        `The user's transaction categories are: ${categories.join(', ')}.`,
        'Interpret relative dates ("this year", "last month", "in June") relative to today.',
        'Only use category names from the exact list given — never invent new ones.',
        'If the query mentions a topic that isn\'t one of the categories (e.g. a specific store or person\'s name), put it in "keyword" instead.',
        '',
        `Query: "${query}"`,
    ].join('\n');
}

export async function parseSmartSearchQuery(
    query: string,
    categories: string[],
    todayISO: string,
): Promise<SmartSearchFilter> {
    return await callGeminiJson(
        buildSearchPrompt(query, categories, todayISO),
        buildSearchSchema(categories),
    ) as SmartSearchFilter;
}

const BUDGET_TIPS_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        tips: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    category: { type: 'string' },
                    message: { type: 'string' },
                },
                required: ['category', 'message'],
            },
        },
    },
    required: ['tips'],
};

function buildBudgetTipsPrompt(stats: unknown, language: Language): string {
    return [
        'You are a personal finance assistant. Based on the following JSON — this month\'s spending',
        'so far against a user-set monthly limit, per category — write one short, specific,',
        'actionable tip per category so the user stays within (or gets back within) their limit.',
        'Reference concrete numbers where useful (e.g. a percentage to cut, or how much is left).',
        'Keep each tip to one sentence. Only include categories that are present in the data.',
        `Write every "message" in ${LANGUAGE_NAMES[language]}.`,
        '',
        'Data:',
        JSON.stringify(stats),
    ].join('\n');
}

export async function generateBudgetTips(stats: unknown, language: Language): Promise<BudgetTip[]> {
    const parsed = await callGeminiJson(buildBudgetTipsPrompt(stats, language), BUDGET_TIPS_RESPONSE_SCHEMA) as { tips?: BudgetTip[] };
    if (!Array.isArray(parsed.tips)) {
        throw new GeminiRequestError('parse_error');
    }
    return parsed.tips;
}

const MONEY_CHAT_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        answer: { type: 'string', description: 'A short, direct answer to the user\'s question, in plain language.' },
    },
    required: ['answer'],
};

function buildMoneyChatPrompt(question: string, stats: unknown, language: Language): string {
    return [
        'You are a personal finance assistant answering a question about the user\'s own transaction history.',
        'You are given a JSON breakdown of their spending and income by month and category.',
        'Answer using only this data. If it doesn\'t contain what\'s needed to answer, say so plainly',
        'rather than guessing. Mention concrete numbers from the data when relevant. Keep the answer',
        'to 1-3 short sentences.',
        `Write the "answer" in ${LANGUAGE_NAMES[language]}.`,
        '',
        'Data (amounts are already in the user\'s chosen currency):',
        JSON.stringify(stats),
        '',
        `Question: "${question}"`,
    ].join('\n');
}

export async function answerMoneyQuestion(question: string, stats: unknown, language: Language): Promise<string> {
    const parsed = await callGeminiJson(buildMoneyChatPrompt(question, stats, language), MONEY_CHAT_RESPONSE_SCHEMA) as { answer?: string };
    if (typeof parsed.answer !== 'string') {
        throw new GeminiRequestError('parse_error');
    }
    return parsed.answer;
}

export interface ReceiptScanResult {
    isReceipt: boolean;
    amount: number;
    date: string; // YYYY-MM-DD, or '' when not visible
    category: string; // one of the given categories, or '' when the model returned something else
    note: string;
}

function buildReceiptSchema(categories: string[]) {
    return {
        type: 'object',
        properties: {
            isReceipt: { type: 'boolean', description: 'false if the image is not a receipt/invoice or the total is unreadable.' },
            amount: { type: 'number', description: 'The final total paid (after discounts and tax). 0 if unreadable.' },
            date: { type: 'string', description: 'Purchase date as YYYY-MM-DD, or "" if not visible.' },
            category: { type: 'string', enum: categories, description: 'The best-matching category from the allowed list.' },
            note: { type: 'string', description: 'Short note: the store/merchant name, optionally with 1-3 key items. Max 60 characters.' },
        },
        required: ['isReceipt', 'amount', 'date', 'category', 'note'],
    };
}

function buildReceiptPrompt(categories: string[], todayISO: string, language: Language): string {
    return [
        'You read a photo of a shop receipt or invoice for a personal finance app.',
        'Extract the final total the customer paid, the purchase date, and the merchant.',
        `Today's date is ${todayISO}. Receipts often print dates as DD/MM/YY — interpret them so the date is not in the future.`,
        `Pick the single best category from this exact list: ${categories.join(', ')}.`,
        `Write the "note" in ${LANGUAGE_NAMES[language]}, keeping the merchant's name as printed.`,
        'Return the amount as a plain number without any currency symbol.',
    ].join('\n');
}

export async function scanReceipt(
    image: InlineImage,
    categories: string[],
    todayISO: string,
    language: Language,
): Promise<ReceiptScanResult> {
    const parsed = await callGeminiJson(
        buildReceiptPrompt(categories, todayISO, language),
        buildReceiptSchema(categories),
        image,
    ) as Partial<ReceiptScanResult>;
    if (typeof parsed.isReceipt !== 'boolean' || typeof parsed.amount !== 'number') {
        throw new GeminiRequestError('parse_error');
    }
    const date = parsed.date ?? '';
    const category = parsed.category ?? '';
    return {
        isReceipt: parsed.isReceipt,
        amount: parsed.amount,
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= todayISO ? date : '',
        category: categories.includes(category) ? category : '',
        note: (parsed.note ?? '').slice(0, 200),
    };
}
