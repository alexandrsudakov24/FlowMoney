import { useMemo } from 'react';
import type { Expense } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import styles from '../../styles/components/ExpenseFilters.module.css';

export interface FilterState {
    month: string;
    search: string;
    type: 'all' | 'income' | 'expense';
}

interface Props {
    expenses: Expense[];
    filters: FilterState;
    onChange: (filters: FilterState) => void;
}

export default function ExpenseFilters({ expenses, filters, onChange }: Props) {
    const { t, language } = useLanguage();

    const months = useMemo(() => {
        const set = new Set<string>();
        expenses.forEach((e) => set.add(e.date.slice(0, 7)));
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [expenses]);

    const formatMonth = (ym: string) => {
        const [year, month] = ym.split('-');
        const date = new Date(Number(year), Number(month) - 1, 1);
        const locale = language === 'ru' ? 'ru-RU' : language === 'he' ? 'he-IL' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    };

    const hasActive = filters.month !== '' || filters.search !== '' || filters.type !== 'all';
    const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

    return (
        <div className={styles.filters}>
            <select
                value={filters.month}
                onChange={(e) => set({ month: e.target.value })}
                className={styles.select}
                aria-label={t('filter_all_time')}
            >
                <option value="">{t('filter_all_time')}</option>
                {months.map((m) => (
                    <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
            </select>

            <input
                type="search"
                placeholder={t('filter_search_placeholder')}
                value={filters.search}
                onChange={(e) => set({ search: e.target.value })}
                className={styles.search}
            />

            <div className={styles.typeToggle} role="group">
                {(['all', 'expense', 'income'] as const).map((type) => (
                    <button
                        key={type}
                        className={`${styles.typeBtn} ${filters.type === type ? styles.typeBtnActive : ''}`}
                        onClick={() => set({ type })}
                    >
                        {t(type === 'all' ? 'filter_type_all' : type)}
                    </button>
                ))}
            </div>

            {hasActive && (
                <button
                    className={styles.clearBtn}
                    onClick={() => onChange({ month: '', search: '', type: 'all' })}
                    title="Clear filters"
                    aria-label="Clear filters"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
