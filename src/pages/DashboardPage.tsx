import { useApp } from '../context/AppContext.tsx';
import ExpenseList from '../components/ExpenseList';
import Charts from '../components/Charts';

export default function DashboardPage() {
    const { expenses } = useApp();

    return (
        <div className="page">
            <h2>Dashboard</h2>
            <Charts expenses={expenses} />
            <ExpenseList expenses={expenses} />
        </div>
    );
}
