import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import ExpenseForm from '../components/ExpenseForm';

export default function EditExpensePage() {
    const { id } = useParams();
    const { expenses, updateExpense } = useApp();
    const navigate = useNavigate();

    const expense = expenses.find((e) => e.id === id);

    const handleSubmit = (data) => {
        updateExpense(id, { ...data, amount: Number(data.amount) });
        navigate('/');
    };

    return (
        <div className="page">
            <h2>Edit Expense</h2>
            <ExpenseForm defaultValues={expense} onSubmit={handleSubmit} />
        </div>
    );
}
