import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useFamily } from '../context/FamilyContext';
import { currencySymbols } from '../utils/currencySymbols';
import type { Expense } from '../types';
import styles from '../styles/components/ExpenseList.module.css';

export default function ExpenseList({ expenses }: { expenses: Expense[] }) {
    const { deleteExpense, currency } = useApp();
    const { t } = useLanguage();
    const { family } = useFamily();

    if (!expenses || expenses.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h3>{t('no_transactions')}</h3>
                <p>{t('no_transactions_desc')}</p>
            </div>
        );
    }

    const sorted = [...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getCategoryLabel = (category: string) => {
        const map: Record<string, string> = {
            'Food': t('cat_food'),
            'Transport': t('cat_transport'),
            'Home': t('cat_home'),
            'Shopping': t('cat_shopping'),
            'Health': t('cat_health'),
            'Other': t('cat_other'),
        };
        return map[category] || category;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    return (
        <div>
            <ul className={styles.expenseList}>
                {sorted.map((e) => {
                    const sign = e.type === 'income' ? '+' : '-';
                    const amount = Number(e.amount).toFixed(2);
                    const symbol = currencySymbols[currency];

                    return (
                        <li key={e.id} className={styles.expenseItem}>
                            <div className={styles.left}>
                                <div className={styles.category}>
                                    {e.type === 'income'
                                        ? t('income')
                                        : getCategoryLabel(e.category)}
                                </div>
                                <div className={styles.note}>
                                    {e.note || t('no_note')}
                                </div>
                                {family && e.addedBy && (
                                    <div className={styles.addedBy}>
                                        {t('added_by')} {e.addedBy.name}
                                    </div>
                                )}
                            </div>

                            <div className={styles.right}>
                                <div
                                    className={`${styles.amount} ${e.type === 'income' ? styles.amountIncome : styles.amountExpense}`}
                                >
                                    {sign}{amount} {symbol}
                                </div>

                                <div className={styles.date}>
                                    {formatDate(e.date)}
                                </div>

                                <div className={styles.actions}>
                                    <Link to={`/edit/${e.id}`} className="btn">
                                        {t('edit')}
                                    </Link>
                                    <button
                                        className="btn danger"
                                        onClick={() => {
                                            if (confirm(t('delete_confirm')))
                                                deleteExpense(e.id);
                                        }}
                                    >
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
