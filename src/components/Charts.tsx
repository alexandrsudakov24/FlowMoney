import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B'];

export default function Charts({ expenses }) {
    const byCategory = useMemo(() => {
        const map = {};
        expenses.forEach((e) => {
            const cat = e.category || 'Other';
            map[cat] = (map[cat] || 0) + Number(e.amount || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    const byDate = useMemo(() => {
        const map = {};
        expenses.forEach((e) => {
            const d = e.date;
            map[d] = (map[d] || 0) + Number(e.amount || 0);
        });
        return Object.entries(map).map(([date, value]) => ({ date, value })).sort((a,b)=>a.date.localeCompare(b.date));
    }, [expenses]);

    return (
        <div className="charts">
            <div className="chart-card">
                <h3>By Category</h3>
                {byCategory.length === 0 ? <p>No data</p> : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                                {byCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="chart-card">
                <h3>By Date</h3>
                {byDate.length === 0 ? <p>No data</p> : (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={byDate}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
