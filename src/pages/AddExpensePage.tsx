import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import ExpenseForm from '../components/ExpenseForm';

type ExpenseFormData = {
    amount: string;
    category: string;
    date: string;
    note?: string;
    type: 'expense' | 'income';
};

export default function AddExpensePage() {
    const { addExpense } = useApp();
    const navigate = useNavigate();

    const handleSubmit = (data: ExpenseFormData) => {
        addExpense({
            id: crypto.randomUUID(),
            ...data,
            amount: Number(data.amount),
        });
        navigate('/');
    };

    return (
        <div className="page">
            <h2>Add Transaction</h2>
            <p style={{ color: '#718096', marginBottom: '24px' }}>
                Add an expense or income to track your finances
            </p>
            <ExpenseForm onSubmit={handleSubmit} defaultValues={undefined} />
        </div>
    );
}
