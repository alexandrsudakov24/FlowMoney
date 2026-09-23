import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useApp, INCOME_CATEGORIES } from '../../context/AppContext';
import { parseTransactionText, GeminiRequestError } from '../../services/gemini';
import {
    createSpeechRecognition,
    isSpeechRecognitionSupported,
    type SpeechRecognitionLike,
} from '../../utils/speechRecognition';
import { ButtonSpinner } from '../ui';
import type { DraftTransaction } from './TransactionConfirmCard';
import buttonStyles from './QuickAddButton.module.css';
import styles from './VoiceInput.module.css';

interface Props {
    onResult: (draft: DraftTransaction) => void;
    disabled?: boolean;
}

// Turns a spoken (or, without Web Speech support, typed) phrase like
// "groceries 230 yesterday" into a draft transaction via Gemini.
export default function VoiceInput({ onResult, disabled = false }: Props) {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { categories } = useApp();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [listening, setListening] = useState(false);
    const [parsing, setParsing] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    // Read from recognition callbacks, which close over stale state
    const textRef = useRef('');
    const speechSupported = isSpeechRecognitionSupported();

    useEffect(() => () => recognitionRef.current?.abort(), []);

    const updateText = (value: string) => {
        textRef.current = value;
        setText(value);
    };

    const submit = async (phrase: string) => {
        const trimmed = phrase.trim();
        if (!trimmed || parsing) return;
        setParsing(true);
        try {
            const todayISO = new Date().toISOString().slice(0, 10);
            const result = await parseTransactionText(trimmed, categories, INCOME_CATEGORIES, todayISO, language);
            if (!result.isTransaction || result.amount <= 0) {
                showToast(t('voice_not_recognized'));
                return;
            }
            const fallbackCategory = result.type === 'income' ? INCOME_CATEGORIES[0] : categories[0] || 'Other';
            onResult({
                type: result.type,
                amount: Math.round(result.amount * 100) / 100,
                date: result.date || todayISO,
                category: result.category || fallbackCategory,
                note: result.note,
            });
            updateText('');
            setOpen(false);
        } catch (err) {
            const code = err instanceof GeminiRequestError ? err.code : 'network_error';
            showToast(t(`ai_input_error_${code}` as Parameters<typeof t>[0]));
        } finally {
            setParsing(false);
        }
    };

    const startListening = () => {
        const recognition = createSpeechRecognition(language);
        if (!recognition) return;
        recognitionRef.current?.abort();
        recognitionRef.current = recognition;
        updateText('');

        recognition.onresult = (e) => {
            let transcript = '';
            for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
            updateText(transcript);
        };
        recognition.onerror = (e) => {
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') showToast(t('voice_error_mic'));
            else if (e.error === 'no-speech') showToast(t('voice_no_speech'));
        };
        recognition.onend = () => {
            setListening(false);
            if (recognitionRef.current !== recognition) return;
            recognitionRef.current = null;
            // Speech ended naturally — go straight to parsing what was heard
            if (textRef.current.trim()) submit(textRef.current);
        };

        recognition.start();
        setListening(true);
    };

    const stopListening = () => recognitionRef.current?.stop();

    const handleMainClick = () => {
        if (listening) {
            stopListening();
            return;
        }
        setOpen(true);
        if (speechSupported) startListening();
    };

    const close = () => {
        const recognition = recognitionRef.current;
        recognitionRef.current = null;
        recognition?.abort();
        setListening(false);
        updateText('');
        setOpen(false);
    };

    const busyLabel = parsing ? t('voice_parsing') : listening ? t('voice_listening') : t('voice_input');

    return (
        <>
            <button
                type="button"
                className={`${buttonStyles.button} ${buttonStyles.indigo}`}
                onClick={handleMainClick}
                disabled={parsing || disabled}
                aria-pressed={listening}
            >
                <span className={`${buttonStyles.icon} ${listening ? styles.pulse : ''}`} aria-hidden="true">
                    {parsing ? <ButtonSpinner /> : speechSupported ? '🎤' : '⌨️'}
                </span>
                <span className={buttonStyles.text}>
                    <span className={buttonStyles.label}>{busyLabel}</span>
                    <span className={buttonStyles.desc}>{speechSupported ? t('voice_input_hint') : t('voice_type_hint')}</span>
                </span>
            </button>

            {open && (
                <form
                    className={styles.panel}
                    onSubmit={(e) => { e.preventDefault(); submit(text); }}
                >
                    <input
                        className={styles.input}
                        type="text"
                        value={text}
                        onChange={(e) => updateText(e.target.value)}
                        placeholder={listening ? t('voice_listening') : t('voice_placeholder')}
                        disabled={parsing}
                        autoFocus={!speechSupported}
                        maxLength={200}
                    />
                    {speechSupported && (
                        <button
                            type="button"
                            className={`${styles.iconButton} ${listening ? styles.recording : ''}`}
                            onClick={listening ? stopListening : startListening}
                            disabled={parsing}
                            aria-label={listening ? t('voice_stop') : t('voice_input')}
                        >
                            {listening ? '■' : '🎤'}
                        </button>
                    )}
                    <button
                        type="submit"
                        className={styles.submit}
                        disabled={parsing || listening || !text.trim()}
                    >
                        {parsing ? <ButtonSpinner /> : t('voice_submit')}
                    </button>
                    <button
                        type="button"
                        className={styles.close}
                        onClick={close}
                        disabled={parsing}
                        aria-label={t('cancel')}
                    >
                        ✕
                    </button>
                </form>
            )}
        </>
    );
}
