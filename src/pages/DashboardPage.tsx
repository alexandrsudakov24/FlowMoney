import { useApp } from '../context/AppContext.tsx';
import ExpenseList from '../components/ExpenseList';
import Charts from '../components/Charts';

export default function DashboardPage() {
    const { expenses } = useApp();

    const totalIncome = expenses.reduce((sum, e) => sum + (e.type === 'income' ? Number(e.amount || 0) : 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.type === 'expense' ? Number(e.amount || 0) : 0), 0);
    const net = totalIncome - totalExpenses;

    const thisMonthIncome = expenses.filter((e) => {
        const d = new Date(e.date);
        const today = new Date();
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && e.type === 'income';
    }).reduce((s, e) => s + Number(e.amount || 0), 0);

    const thisMonthExpense = expenses.filter((e) => {
        const d = new Date(e.date);
        const today = new Date();
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && e.type === 'expense';
    }).reduce((s, e) => s + Number(e.amount || 0), 0);

    return (
        <div className="page">
            <h2>Dashboard</h2>
            <div className="summary">
                <div className="card">
                    <h3>Total Income</h3>
                    <div className="value">${totalIncome.toFixed(2)}</div>
                </div>
                <div className="card">
                    <h3>Total Expenses</h3>
                    <div className="value">${totalExpenses.toFixed(2)}</div>
                </div>
                <div className="card">
                    <h3>Net</h3>
                    <div className="value">${net.toFixed(2)}</div>
                </div>
            </div>
            {expenses.length > 0 && (
                <>
                    <Charts expenses={expenses} />
                    <h2 style={{ marginTop: '24px' }}>Recent Transactions</h2>
                </>
            )}
            <ExpenseList expenses={expenses} />
        </div>
    );
}
