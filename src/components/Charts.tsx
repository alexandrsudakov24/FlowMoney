import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useMemo } from 'react';
import styles from '../styles/components/Charts.module.css';
import type { Expense } from '../services/storageService';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Charts({ expenses }: { expenses: Expense[] }) {
    const byCategory = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach((e) => {
            if (e.type === 'expense') {
                const cat = e.category || 'Other';
                map[cat] = (map[cat] || 0) + Number(e.amount || 0);
            }
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    const byDate = useMemo(() => {
        const map: Record<string, { expense: number; income: number }> = {};
        expenses.forEach((e) => {
            const d = e.date;
            if (!map[d]) map[d] = { expense: 0, income: 0 };
            if (e.type === 'expense') {
                map[d].expense += Number(e.amount || 0);
            } else {
                map[d].income += Number(e.amount || 0);
            }
        });
        return Object.entries(map)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [expenses]);

    return (
        <div className={styles.charts}>
            <div className={styles.chartCard}>
                <h3>By Category (Expenses)</h3>
                {byCategory.length === 0 ? <p>No expense data</p> : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                                {byCategory.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className={styles.chartCard}>
                <h3>Income vs Expenses by Date</h3>
                {byDate.length === 0 ? <p>No data</p> : (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={byDate}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                            <Bar dataKey="income" fill="#10b981" name="Income" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
