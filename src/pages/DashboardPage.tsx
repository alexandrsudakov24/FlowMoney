import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext';
import ExpenseList from '../components/ExpenseList';
import Charts from '../components/Charts';
import { currencySymbols } from '../utils/currencySymbols';
import styles from '../styles/pages/DashboardPage.module.css';

export default function DashboardPage() {
    const { expenses, currency } = useApp();
    const { t } = useLanguage();

    const totalIncome = expenses.reduce(
        (sum, e) => sum + (e.type === 'income' ? Number(e.amount || 0) : 0),
        0
    );

    const totalExpenses = expenses.reduce(
        (sum, e) => sum + (e.type === 'expense' ? Number(e.amount || 0) : 0),
        0
    );

    const net = totalIncome - totalExpenses;

    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>{t('dashboard')}</h2>

            <div className={styles.summary}>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>{t('total_income')}</h3>
                    <div className={styles.cardValue}>
                        {totalIncome.toFixed(2)} {currencySymbols[currency]}
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>{t('total_expenses')}</h3>
                    <div className={styles.cardValue}>
                        {totalExpenses.toFixed(2)} {currencySymbols[currency]}
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>{t('net_balance')}</h3>
                    <div className={styles.cardValue}>
                        {net.toFixed(2)} {currencySymbols[currency]}
                    </div>
                </div>
            </div>

            {expenses.length > 0 && (
                <>
                    <div className={styles.chartsSection}>
                        <h2 className={styles.chartsTitle}>{t('analytics')}</h2>
                        <Charts expenses={expenses} />
                    </div>

                    <h2 className={styles.recentTitle}>{t('recent_transactions')}</h2>
                </>
            )}

            <ExpenseList expenses={expenses} />
        </div>
    );
}
