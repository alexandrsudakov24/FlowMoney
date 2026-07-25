import { useMemo } from 'react';
import type { Expense } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCatLabel } from '../../utils/getCatLabel';
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator';
import styles from './ExpenseFilters.module.css';

export interface FilterState {
    month: string;
    search: string;
    type: 'all' | 'income' | 'expense';
    categories: string[];
}

const TYPE_FILTER_OPTIONS = ['all', 'expense', 'income'] as const;

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

    const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

    const typeIndicator = useSlidingIndicator(TYPE_FILTER_OPTIONS.indexOf(filters.type));

    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (filters.month) chips.push({ key: 'month', label: formatMonth(filters.month), clear: () => set({ month: '' }) });
    if (filters.type !== 'all') chips.push({ key: 'type', label: t(filters.type), clear: () => set({ type: 'all' }) });
    filters.categories.forEach((cat) => chips.push({
        key: `category-${cat}`,
        label: getCatLabel(cat, t),
        clear: () => set({ categories: filters.categories.filter((c) => c !== cat) }),
    }));
    if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"`, clear: () => set({ search: '' }) });

    return (
        <div>
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

                <div
                    className={styles.typeToggle}
                    role="tablist"
                    aria-label={t('transaction_type')}
                    ref={typeIndicator.containerRef}
                >
                    {typeIndicator.rect && (
                        <span
                            className={styles.typeToggleIndicator}
                            style={{
                                transform: `translate(${typeIndicator.rect.left}px, ${typeIndicator.rect.top}px)`,
                                width: typeIndicator.rect.width,
                                height: typeIndicator.rect.height,
                            }}
                        />
                    )}
                    {TYPE_FILTER_OPTIONS.map((type, i) => (
                        <button
                            key={type}
                            type="button"
                            className={`${styles.typeBtn} ${filters.type === type ? styles.typeBtnActive : ''}`}
                            onClick={() => set({ type })}
                            ref={(el) => { typeIndicator.itemRefs.current[i] = el; }}
                        >
                            {t(type === 'all' ? 'filter_type_all' : type)}
                        </button>
                    ))}
                </div>
            </div>

            {chips.length > 0 && (
                <div className={styles.activeChips}>
                    {chips.map((chip) => (
                        <button
                            key={chip.key}
                            className={styles.chip}
                            onClick={chip.clear}
                            aria-label={`${t('remove_filter')}: ${chip.label}`}
                        >
                            {chip.label}
                            <span aria-hidden="true">✕</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
