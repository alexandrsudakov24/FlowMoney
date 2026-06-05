import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function ExpenseList({ expenses }) {
    const { deleteExpense } = useApp();

    if (!expenses || expenses.length === 0) {
        return <p>No expenses yet</p>;
    }

    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <ul className="expense-list">
            {sorted.map((e) => (
                <li key={e.id} className="expense-item">
                    <div className="left">
                        <div className="category">{e.category}</div>
                        <div className="note">{e.note}</div>
                    </div>
                    <div className="right">
                        <div className="amount">${Number(e.amount).toFixed(2)}</div>
                        <div className="date">{e.date}</div>
                        <div className="actions">
                            <Link to={`/edit/${e.id}`} className="btn">Edit</Link>
                            <button className="btn danger" onClick={() => {
                                if (confirm('Delete this expense?')) deleteExpense(e.id);
                            }}>Delete</button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
