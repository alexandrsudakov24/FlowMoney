import { useApp } from '../context/AppContext.tsx';
import ExpenseList from '../components/ExpenseList';
import Charts from '../components/Charts';

export default function DashboardPage() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { expenses } = useApp();

    const totalExpenses = expenses.reduce((sum: number, e: { amount: never; }) => sum + Number(e.amount || 0), 0);
    const thisMonth = expenses.filter((e: { date: string | number | Date; }) => {
        const expenseDate = new Date(e.date);
        const today = new Date();
        return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
    }).reduce((sum: number, e: { amount: never; }) => sum + Number(e.amount || 0), 0);
    const thisWeek = expenses.filter((e: { date: string | number | Date; }) => {
        const expenseDate = new Date(e.date);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenseDate >= weekAgo;
    }).reduce((sum: number, e: { amount: never; }) => sum + Number(e.amount || 0), 0);

    return (
        <div className="page">
            <h2>Dashboard</h2>
            <div className="summary">
                <div className="card">
                    <h3>Total</h3>
                    <div className="value">${totalExpenses.toFixed(2)}</div>
                </div>
                <div className="card">
                    <h3>This Month</h3>
                    <div className="value">${thisMonth.toFixed(2)}</div>
                </div>
                <div className="card">
                    <h3>This Week</h3>
                    <div className="value">${thisWeek.toFixed(2)}</div>
                </div>
            </div>
            {expenses.length > 0 && (
                <>
                    <Charts expenses={expenses} />
                    <h2 style={{ marginTop: '24px' }}>Recent Expenses</h2>
                </>
            )}
            <ExpenseList expenses={expenses} />
        </div>
    );
}
