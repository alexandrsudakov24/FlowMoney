import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseList, Charts, ExpenseFilters } from '../components/expenses';
import type { FilterState } from '../components/expenses';
import { Spinner } from '../components/ui';
import { currencySymbols } from '../constants/currency';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
    const { expenses, loading, currency } = useApp();
    const { t } = useLanguage();

    const [filters, setFilters] = useState<FilterState>({
        month: '',
        search: '',
        type: 'all',
    });

    const filteredExpenses = useMemo(() => {
        return expenses.filter((e) => {
            if (filters.month && !e.date.startsWith(filters.month)) return false;
            if (filters.type !== 'all' && e.type !== filters.type) return false;
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const matchNote = e.note?.toLowerCase().includes(q) ?? false;
                const matchCat = e.category.toLowerCase().includes(q);
                if (!matchNote && !matchCat) return false;
            }
            return true;
        });
    }, [expenses, filters]);

    const { todayTotal, weekTotal, monthTotal } = useMemo(() => {
        const toDateStr = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const now = new Date();
        const todayStr = toDateStr(now);
        const monthStr = todayStr.slice(0, 7);
        const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek);
        const weekStartStr = toDateStr(monday);

        let todayTotal = 0;
        let weekTotal = 0;
        let monthTotal = 0;
        expenses.forEach((e) => {
            if (e.type !== 'expense') return;
            const amount = Number(e.amount || 0);
            if (e.date === todayStr) todayTotal += amount;
            if (e.date >= weekStartStr && e.date <= todayStr) weekTotal += amount;
            if (e.date.startsWith(monthStr)) monthTotal += amount;
        });

        return { todayTotal, weekTotal, monthTotal };
    }, [expenses]);

    const hasActiveFilters =
        filters.month !== '' || filters.search !== '' || filters.type !== 'all';

    const symbol = currencySymbols[currency];

    if (loading) {
        return <Spinner size="lg" />;
    }

    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>{t('dashboard')}</h2>

            <div className={styles.summary}>
                <div className={`${styles.card} ${styles.cardToday}`}>
                    <h3 className={styles.cardTitle}>{t('today')}</h3>
                    <div className={styles.cardValue}>
                        {todayTotal.toFixed(2)} {symbol}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.cardWeek}`}>
                    <h3 className={styles.cardTitle}>{t('this_week')}</h3>
                    <div className={styles.cardValue}>
                        {weekTotal.toFixed(2)} {symbol}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.cardMonth}`}>
                    <h3 className={styles.cardTitle}>{t('this_month')}</h3>
                    <div className={styles.cardValue}>
                        {monthTotal.toFixed(2)} {symbol}
                    </div>
                </div>
            </div>

            {expenses.length > 0 && (
                <ExpenseFilters
                    expenses={expenses}
                    filters={filters}
                    onChange={setFilters}
                />
            )}

            {filteredExpenses.length > 0 && (
                <>
                    <div className={styles.chartsSection}>
                        <h2 className={styles.chartsTitle}>{t('analytics')}</h2>
                        <Charts expenses={filteredExpenses} />
                    </div>

                    <h2 className={styles.recentTitle}>
                        {t('recent_transactions')}
                        {hasActiveFilters && filteredExpenses.length !== expenses.length && (
                            <span className={styles.countBadge}>
                                {filteredExpenses.length} / {expenses.length}
                            </span>
                        )}
                    </h2>
                </>
            )}

            {expenses.length > 0 && filteredExpenses.length === 0 ? (
                <div className={styles.noResults}>{t('filter_no_results')}</div>            ) : (
                <ExpenseList expenses={filteredExpenses} />
            )}
        </div>
    );
}
