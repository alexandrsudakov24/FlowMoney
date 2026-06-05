import { useApp } from '../context/AppContext';
import ExpenseList from '../components/ExpenseList.jsx';
import Charts from '../components/Charts.jsx';

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
