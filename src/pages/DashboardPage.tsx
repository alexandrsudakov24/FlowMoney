import { useApp } from '../context/AppContext.tsx';
import ExpenseList from '../components/ExpenseList';
import Charts from '../components/Charts';
import styles from '../styles/pages/DashboardPage.module.css';


export default function DashboardPage() {
    const { expenses } = useApp();
    console.log('DashboardPage: rendered, expenses count:', expenses.length);

    const totalIncome = expenses.reduce((sum, e) => sum + (e.type === 'income' ? Number(e.amount || 0) : 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.type === 'expense' ? Number(e.amount || 0) : 0), 0);
    const net = totalIncome - totalExpenses;


    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>Dashboard</h2>
            <div className={styles.summary}>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Total Income</h3>
                    <div className={styles.cardValue}>${totalIncome.toFixed(2)}</div>
                </div>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Total Expenses</h3>
                    <div className={styles.cardValue}>${totalExpenses.toFixed(2)}</div>
                </div>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Net</h3>
                    <div className={styles.cardValue}>${net.toFixed(2)}</div>
                </div>
            </div>
            {expenses.length > 0 && (
                <>
                    <div className={styles.chartsSection}>
                        <h2 className={styles.chartsTitle}>Analytics</h2>
                        <Charts expenses={expenses} />
                    </div>
                    <h2 className={styles.recentTitle}>Recent Transactions</h2>
                </>
            )}
            <ExpenseList expenses={expenses} />
        </div>
    );
}
