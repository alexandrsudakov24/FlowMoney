import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { parseSmartSearchQuery, GeminiRequestError } from '../../services/gemini';
import type { FilterState } from './ExpenseFilters';
import styles from './SmartSearchBar.module.css';

interface Props {
    categories: string[];
    onApply: (patch: Partial<FilterState>) => void;
}

// Turns a free-text query ("gifts this year") into a structured filter via
// Gemini, then hands the result to the caller to merge into FilterState.
export default function SmartSearchBar({ categories, onApply }: Props) {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed || loading) return;
        setLoading(true);
        try {
            const todayISO = new Date().toISOString().slice(0, 10);
            const result = await parseSmartSearchQuery(trimmed, categories, todayISO);
            onApply({
                categories: result.categories.filter((c) => categories.includes(c)),
                type: result.type,
                dateFrom: result.dateFrom || '',
                dateTo: result.dateTo || '',
                month: '',
                search: result.keyword || '',
            });
            setQuery('');
        } catch (err) {
            const code = err instanceof GeminiRequestError ? err.code : 'network_error';
            showToast(code === 'no_api_key' ? t('smart_search_error') : t('smart_search_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.bar}>
            <span className={styles.icon} aria-hidden="true">✨</span>
            <input
                type="text"
                className={styles.input}
                placeholder={t('smart_search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
            />
            <button
                type="button"
                className={styles.button}
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                aria-label={t('smart_search_button')}
            >
                {loading ? '…' : t('smart_search_button')}
            </button>
        </div>
    );
}
