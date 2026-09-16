import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { answerMoneyQuestion, GeminiRequestError } from '../../services/gemini';
import { buildMoneyChatStats } from '../../utils/moneyChatStats';
import { ButtonSpinner } from '../ui';
import styles from './MoneyChat.module.css';

// One question, one answer — no conversation history. Answers are generated
// fresh from a 12-month spending/income breakdown, not cached, since each
// question is a one-off (unlike the daily-cached insights panel above it).
export default function MoneyChat() {
    const { activeExpenses } = useApp();
    const { t, language } = useLanguage();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAsk = async () => {
        const trimmed = question.trim();
        if (!trimmed || loading) return;
        setLoading(true);
        setError(null);
        setAnswer(null);
        try {
            const stats = buildMoneyChatStats(activeExpenses);
            const result = await answerMoneyQuestion(trimmed, stats, language);
            setAnswer(result);
        } catch (err) {
            const code = err instanceof GeminiRequestError ? err.code : 'network_error';
            setError(t(`money_chat_error_${code}` as Parameters<typeof t>[0]));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.section}>
            <h3 className={styles.title}>{t('money_chat_title')}</h3>
            <div className={styles.row}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder={t('money_chat_placeholder')}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    disabled={loading}
                />
                <button
                    type="button"
                    className={styles.button}
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                >
                    {loading ? <ButtonSpinner /> : t('money_chat_ask')}
                </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {answer && <p className={styles.answer}>{answer}</p>}
        </div>
    );
}
