import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import ExpenseForm from '../components/ExpenseForm';

interface ExpenseFormData {
    amount: string;
    category: string;
    date: string;
    note?: string;
}

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
            <h2>Add New Expense</h2>
            <p style={{ color: '#718096', marginBottom: '24px' }}>
                Track your spending by adding a new expense
            </p>
            <ExpenseForm onSubmit={handleSubmit} defaultValues={undefined} />
        </div>
    );
}
