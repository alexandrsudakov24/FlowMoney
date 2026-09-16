import type { Language } from '../i18n';
import type { Insight } from '../types';

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

const RESPONSE_SCHEMA = {
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

function buildPrompt(stats: unknown, language: Language): string {
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

interface GeminiApiResponse {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
    }>;
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
                    contents: [{ parts: [{ text: buildSearchPrompt(query, categories, todayISO) }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: buildSearchSchema(categories),
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
            return JSON.parse(text) as SmartSearchFilter;
        } catch {
            throw new GeminiRequestError('parse_error');
        }
    }

    throw lastError ?? new GeminiRequestError('network_error');
}

export async function generateInsights(stats: unknown, language: Language): Promise<Insight[]> {
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
                    contents: [{ parts: [{ text: buildPrompt(stats, language) }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: RESPONSE_SCHEMA,
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

        let parsed: { insights?: Insight[] };
        try {
            parsed = JSON.parse(text);
        } catch {
            throw new GeminiRequestError('parse_error');
        }

        if (!Array.isArray(parsed.insights)) {
            throw new GeminiRequestError('parse_error');
        }

        return parsed.insights;
    }

    throw lastError ?? new GeminiRequestError('network_error');
}
