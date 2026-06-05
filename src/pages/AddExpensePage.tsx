import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import ExpenseForm from '../components/ExpenseForm';

export default function AddExpensePage() {
    const { addExpense } = useApp();
    const navigate = useNavigate();

    const handleSubmit = (data) => {
        addExpense({
            id: crypto.randomUUID(),
            ...data,
            amount: Number(data.amount),
        });
        navigate('/');
    };

    return (
        <div className="page">
            <h2>Add Expense</h2>
            <ExpenseForm onSubmit={handleSubmit} />
        </div>
    );
}
