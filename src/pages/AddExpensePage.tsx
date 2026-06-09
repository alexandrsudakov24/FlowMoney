import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import { useLanguage } from '../context/LanguageContext';
import ExpenseForm from '../components/ExpenseForm';
import styles from '../styles/pages/AddExpensePage.module.css';

type FormData = {
    amount: string;
    category?: string;
    date: string;
    note?: string;
    type: 'expense' | 'income';
};

export default function AddExpensePage() {
    const { addExpense } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSubmit = (data: FormData) => {
        const safeAmount = Math.round(Number(data.amount) * 100) / 100;

        addExpense({
            id: crypto.randomUUID(),
            ...data,
            amount: safeAmount,
            category: data.category || 'Other',
        });

        navigate('/');
    };


    return (
        <div className={styles.page}>
            <h2 className={styles.title}>{t('add_transaction')}</h2>
            <p className={styles.description}>{t('add_transaction_desc')}</p>
            <ExpenseForm onSubmit={handleSubmit} defaultValues={undefined} />
        </div>
    );
}
