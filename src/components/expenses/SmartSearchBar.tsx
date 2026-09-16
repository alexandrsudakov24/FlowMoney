import { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { parseSmartSearchQuery, GeminiRequestError } from '../../services/gemini';
import type { FilterState } from './ExpenseFilters';
import { useClickOutside } from '../../hooks/useClickOutside';
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
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    useClickOutside(wrapRef, () => setOpen(false), open);

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
            setOpen(false);
        } catch (err) {
            const code = err instanceof GeminiRequestError ? err.code : 'network_error';
            showToast(code === 'no_api_key' ? t('smart_search_error') : t('smart_search_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrap} ref={wrapRef}>
            <button
                type="button"
                className={styles.teaser}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className={styles.teaserIcon} aria-hidden="true">✨</span>
                <div className={styles.teaserText}>
                    <span className={styles.teaserLabel}>{t('smart_search_button')}</span>
                    <p className={styles.teaserDesc}>{t('smart_search_placeholder')}</p>
                </div>
                <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▾</span>
            </button>

            {open && (
                <div className={styles.bar}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder={t('smart_search_placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={loading}
                        autoFocus
                        onBlur={() => !query.trim() && !loading && setOpen(false)}
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
            )}
        </div>
    );
}
