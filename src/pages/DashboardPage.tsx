import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import ExpenseList from '../components/ExpenseList';
import Charts from '../components/Charts';
import ExpenseFilters from '../components/ExpenseFilters';
import Spinner from '../components/Spinner';
import type { FilterState } from '../components/ExpenseFilters';
import { currencySymbols } from '../utils/currencySymbols';
import styles from '../styles/pages/DashboardPage.module.css';

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

    const { totalIncome, totalExpenses, net } = useMemo(() => {
        const totalIncome = filteredExpenses.reduce(
            (sum, e) => sum + (e.type === 'income' ? Number(e.amount || 0) : 0),
            0
        );
        const totalExpenses = filteredExpenses.reduce(
            (sum, e) => sum + (e.type === 'expense' ? Number(e.amount || 0) : 0),
            0
        );
        return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
    }, [filteredExpenses]);

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
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>{t('total_income')}</h3>
                    <div className={styles.cardValue}>
                        {totalIncome.toFixed(2)} {symbol}
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>{t('total_expenses')}</h3>
                    <div className={styles.cardValue}>
                        {totalExpenses.toFixed(2)} {symbol}
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>{t('net_balance')}</h3>
                    <div className={styles.cardValue}>
                        {net.toFixed(2)} {symbol}
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
