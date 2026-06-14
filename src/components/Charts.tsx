import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useMemo } from 'react';
import styles from '../styles/components/Charts.module.css';
import type { Expense } from '../types';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Charts({ expenses }: { expenses: Expense[] }) {
    const { t } = useLanguage();

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
                <h3>{t('chart_by_category')}</h3>
                {byCategory.length === 0 ? <p>{t('no_expense_data')}</p> : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80}>
                                {byCategory.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className={styles.chartCard}>
                <h3>{t('chart_income_vs_expenses')}</h3>
                {byDate.length === 0 ? <p>{t('no_data')}</p> : (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={byDate}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="expense" fill="#ef4444" name={t('expense')} />
                            <Bar dataKey="income" fill="#10b981" name={t('income')} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
