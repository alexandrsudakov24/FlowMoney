import type { Language } from '../i18n';

// Minimal typings for the Web Speech API — it isn't part of TypeScript's DOM lib.
export interface SpeechRecognitionResultLike {
    readonly isFinal: boolean;
    readonly 0: { readonly transcript: string };
}

export interface SpeechRecognitionEventLike {
    readonly resultIndex: number;
    readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

export interface SpeechRecognitionLike {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((e: SpeechRecognitionEventLike) => void) | null;
    onerror: ((e: { error: string }) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const SPEECH_LANGS: Record<Language, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    he: 'he-IL',
};

/** Returns a ready-to-start recognizer, or null when the browser has no Web Speech support (e.g. Firefox). */
export function createSpeechRecognition(language: Language): SpeechRecognitionLike | null {
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.lang = SPEECH_LANGS[language];
    recognition.interimResults = true;
    recognition.continuous = false;
    return recognition;
}

export function isSpeechRecognitionSupported(): boolean {
    const w = window as unknown as Record<string, unknown>;
    return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}
