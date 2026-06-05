import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.tsx';
import ExpenseForm from '../components/ExpenseForm';
import type { Expense } from "../services/storageService.ts";

export default function EditExpensePage() {
    const {id} = useParams();
    const {expenses, updateExpense} = useApp();
    const navigate = useNavigate();

    const expense = expenses.find((e) => e.id === id);

    const handleSubmit = (data: Partial<Expense>) => {
        updateExpense(id, { ...data, amount: Number(data.amount) });
        navigate('/');
    };

    return (
        <div className="page">
            <h2>Edit Expense</h2>
            <p style={{ color: '#718096', marginBottom: '24px' }}>Update your expense details</p>
            <ExpenseForm defaultValues={expense} onSubmit={handleSubmit} />
        </div>
    );
}
