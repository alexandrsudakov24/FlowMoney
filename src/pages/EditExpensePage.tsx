import { Link, useParams, useNavigate } from 'react-router-dom';
import { deleteField } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseForm } from '../components/expenses';
import type { TransactionFormData } from '../types';
import styles from './EditExpensePage.module.css';

type FormData = TransactionFormData;

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

    const handleSubmit = async (data: FormData) => {
        if (!id) return;
        const { repeat, ...rest } = data;
        try {
            await updateExpense(id, {
                ...rest,
                amount: Math.round(Number(data.amount) * 100) / 100,
                scheduled: repeat === 'none' ? deleteField() : true,
                repeat: repeat === 'monthly' ? 'monthly' : deleteField(),
            });
            navigate('/');
        } catch {
            // error already shown via toast
        }
    };

    const initialRepeat: FormData['repeat'] = expense.repeat === 'monthly'
        ? 'monthly'
        : expense.scheduled ? 'once' : 'none';

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>{t('edit_transaction')}</h2>
            <p className={styles.description}>{t('edit_transaction_desc')}</p>
            <ExpenseForm defaultValues={{ ...expense, repeat: initialRepeat } as unknown as Partial<FormData>} onSubmit={handleSubmit} />
        </div>
    );
}
