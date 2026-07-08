import type { Language } from '../i18n';
import type { Insight } from '../types';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type GeminiErrorCode = 'rate_limited' | 'blocked' | 'parse_error' | 'network_error' | 'no_api_key';

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
                },
                required: ['title', 'description'],
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

export async function generateInsights(stats: unknown, language: Language): Promise<Insight[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiRequestError('no_api_key');
    }

    let response: Response;
    try {
        response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: buildPrompt(stats, language) }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: RESPONSE_SCHEMA,
                },
            }),
        });
    } catch {
        throw new GeminiRequestError('network_error');
    }

    if (!response.ok) {
        if (response.status === 429) {
            throw new GeminiRequestError('rate_limited');
        }
        throw new GeminiRequestError('network_error');
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
