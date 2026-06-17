import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import ExpenseForm from '../components/ExpenseForm';
import type { Expense } from '../types';
import styles from '../styles/pages/EditExpensePage.module.css';

type FormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: Expense['type'];
};

export default function EditExpensePage() {
    const { id } = useParams();
    const { expenses, updateExpense } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const expense = expenses.find((e) => e.id === id);

    if (!expense) {
        return (
            <div className={styles.page}>
                <p className={styles.description}>{t('expense_not_found')}</p>
                <Link to="/">{t('go_back')}</Link>
            </div>
        );
    }

    const handleSubmit = (data: FormData) => {
        if (id) {
            updateExpense(id, { ...data, amount: Number(data.amount) });
            navigate('/');
        }
    };

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>{t('edit_transaction')}</h2>
            <p className={styles.description}>{t('edit_transaction_desc')}</p>
            <ExpenseForm defaultValues={expense} onSubmit={handleSubmit} />
        </div>
    );
}
