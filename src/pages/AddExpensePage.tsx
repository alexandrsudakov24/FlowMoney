import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
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
    const navigate = useNavigate();

    const handleSubmit = (data: FormData) => {
        addExpense({
            id: crypto.randomUUID(),
            ...data,
            amount: Number(data.amount),
            category: data.category || 'Other',
        });
        navigate('/');
    };

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>Add Transaction</h2>
            <p className={styles.description}>
                Add an expense or income to track your finances
            </p>
            <ExpenseForm onSubmit={handleSubmit} defaultValues={undefined} />
        </div>
    );
}
