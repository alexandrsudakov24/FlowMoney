import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseList, Charts, ExpenseFilters } from '../components/expenses';
import type { FilterState } from '../components/expenses';
import { InsightsPanel } from '../components/insights';
import { Spinner } from '../components/ui';
import { currencySymbols } from '../constants/currency';
import { useCountUp } from '../hooks/useCountUp';
import { getCatLabel } from '../utils/getCatLabel';
import { getCategoryColorMap, darkenHex } from '../utils/getCategoryColors';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
    const { activeExpenses: expenses, loading, currency } = useApp();
    const { t } = useLanguage();

    const [filters, setFilters] = useState<FilterState>({
        month: '',
        search: '',
        type: 'all',
        categories: [],
    });

    // Shared predicate for both lists below. `skipCategory` lets the chart keep showing
    // every category (with the selected ones highlighted) instead of collapsing to them.
    const matchesFilters = (e: (typeof expenses)[number], skipCategory = false) => {
        if (filters.month && !e.date.startsWith(filters.month)) return false;
        if (filters.type !== 'all' && e.type !== filters.type) return false;
        if (!skipCategory && filters.categories.length > 0 && !filters.categories.includes(e.category)) return false;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const matchNote = e.note?.toLowerCase().includes(q) ?? false;
            const matchCat = e.category.toLowerCase().includes(q);
            if (!matchNote && !matchCat) return false;
        }
        return true;
    };

    const filteredExpenses = useMemo(
        () => expenses.filter((e) => matchesFilters(e)),
        [expenses, filters]
    );

    const chartExpenses = useMemo(
        () => expenses.filter((e) => matchesFilters(e, true)),
        [expenses, filters]
    );

    const toggleCategory = (category: string) => {
        setFilters((f) => ({
            ...f,
            categories: f.categories.includes(category)
                ? f.categories.filter((c) => c !== category)
                : [...f.categories, category],
        }));
    };

    const { todayTotal, weekTotal, monthTotal, balance } = useMemo(() => {
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
        let balance = 0;
        expenses.forEach((e) => {
            const amount = Number(e.amount || 0);
            balance += e.type === 'income' ? amount : -amount;
            if (e.type !== 'expense') return;
            if (e.date === todayStr) todayTotal += amount;
            if (e.date >= weekStartStr && e.date <= todayStr) weekTotal += amount;
            if (e.date.startsWith(monthStr)) monthTotal += amount;
        });

        return { todayTotal, weekTotal, monthTotal, balance };
    }, [expenses]);

    // startAt: 0 so the numbers count up every time the dashboard is shown
    // (e.g. right after adding a transaction), not just on the very first load.
    const animatedToday = useCountUp(todayTotal, 600, 0);
    const animatedWeek = useCountUp(weekTotal, 600, 0);
    const animatedMonth = useCountUp(monthTotal, 600, 0);
    const animatedBalance = useCountUp(balance, 600, 0);

    // Sum of expense amounts within the categories currently selected in the
    // chart — filteredExpenses already respects the category (and other) filters.
    const selectedCategoriesTotal = useMemo(
        () => filteredExpenses
            .filter((e) => e.type === 'expense')
            .reduce((sum, e) => sum + Number(e.amount || 0), 0),
        [filteredExpenses]
    );
    const animatedCategoriesTotal = useCountUp(selectedCategoriesTotal, 600, 0);

    // Same color a category's slice/legend dot uses in the chart below, so the
    // totals card visually matches whichever category was picked most recently.
    const categoryColorMap = useMemo(() => getCategoryColorMap(chartExpenses), [chartExpenses]);
    const lastCategoryColor = categoryColorMap[filters.categories[filters.categories.length - 1]];

    const hasActiveFilters =
        filters.month !== '' || filters.search !== '' || filters.type !== 'all' || filters.categories.length > 0;

    const symbol = currencySymbols[currency];

    if (loading) {
        return <Spinner size="lg" />;
    }

    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>{t('dashboard')}</h2>

            <div className={`${styles.balanceCard} ${balance < 0 ? styles.balanceNegative : ''}`}>
                <h3 className={styles.balanceTitle}>{t('net_balance')}</h3>
                <div className={styles.balanceValue}>
                    {animatedBalance.toFixed(2)} {symbol}
                </div>
            </div>

            <div className={styles.summary}>
                <div className={`${styles.card} ${styles.cardToday}`}>
                    <h3 className={styles.cardTitle}>{t('today')}</h3>
                    <div className={styles.cardValue}>
                        {animatedToday.toFixed(2)} {symbol}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.cardWeek}`}>
                    <h3 className={styles.cardTitle}>{t('this_week')}</h3>
                    <div className={styles.cardValue}>
                        {animatedWeek.toFixed(2)} {symbol}
                    </div>
                </div>

                <div className={`${styles.card} ${styles.cardMonth}`}>
                    <h3 className={styles.cardTitle}>{t('this_month')}</h3>
                    <div className={styles.cardValue}>
                        {animatedMonth.toFixed(2)} {symbol}
                    </div>
                </div>
            </div>

            <InsightsPanel />

            {expenses.length > 0 && (
                <ExpenseFilters
                    expenses={expenses}
                    filters={filters}
                    onChange={setFilters}
                />
            )}

            {filters.categories.length > 0 && (
                <div
                    className={styles.categoryTotalCard}
                    style={lastCategoryColor ? {
                        background: `linear-gradient(135deg, ${lastCategoryColor}, ${darkenHex(lastCategoryColor, 0.3)})`,
                    } : undefined}
                >
                    <h3 className={styles.categoryTotalTitle}>
                        {filters.categories.map((c) => getCatLabel(c, t)).join(', ')}
                    </h3>
                    <div className={styles.categoryTotalValue}>
                        {animatedCategoriesTotal.toFixed(2)} {symbol}
                    </div>
                </div>
            )}

            {chartExpenses.length > 0 && (
                <div className={styles.chartsSection}>
                    <h2 className={styles.chartsTitle}>{t('analytics')}</h2>
                    <Charts
                        expenses={chartExpenses}
                        selectedCategories={filters.categories}
                        onSelectCategory={toggleCategory}
                    />
                </div>
            )}

            {filteredExpenses.length > 0 && (
                <h2 className={styles.recentTitle}>
                    {t('recent_transactions')}
                    {hasActiveFilters && filteredExpenses.length !== expenses.length && (
                        <span className={styles.countBadge}>
                            {filteredExpenses.length} / {expenses.length}
                        </span>
                    )}
                </h2>
            )}

            {expenses.length > 0 && filteredExpenses.length === 0 ? (
                <div className={styles.noResults}>{t('filter_no_results')}</div>            ) : (
                <ExpenseList expenses={filteredExpenses} />
            )}
        </div>
    );
}
