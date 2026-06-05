import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import styles from './ExpenseList.module.css';

export default function ExpenseList({ expenses }: { expenses: any[] }) {
    const { deleteExpense } = useApp();

    if (!expenses || expenses.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h3>No transactions yet</h3>
                <p>Start tracking by adding a new transaction</p>
            </div>
        );
    }

    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <ul className={styles.expenseList}>
                {sorted.map((e) => (
                    <li key={e.id} className={styles.expenseItem}>
                        <div className={styles.left}>
                            <div className={styles.category}>{e.category}</div>
                            <div className={styles.note}>{e.note || 'No note'}</div>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.amount} style={{ color: e.type === 'income' ? 'var(--success)' : 'var(--accent)' }}>${Number(e.amount).toFixed(2)}</div>
                            <div className={styles.date}>{new Date(e.date).toLocaleDateString()}</div>
                            <div className={styles.actions}>
                                <Link to={`/edit/${e.id}`} className="btn">Edit</Link>
                                <button className="btn danger" onClick={() => {
                                    if (confirm('Are you sure you want to delete this transaction?')) deleteExpense(e.id);
                                }}>Delete</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
