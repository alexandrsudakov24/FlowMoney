import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';
import styles from './Charts.module.css';
import type { Expense } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCatLabel } from '../../utils/getCatLabel';

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
        return Object.entries(map).map(([name, value]) => ({ name: getCatLabel(name, t), value }));
    }, [expenses, t]);

    return (
        <div className={styles.charts}>
            <div className={styles.chartCard}>
                <h3>{t('chart_by_category')}</h3>
                {byCategory.length === 0 ? <p>{t('no_expense_data')}</p> : (
                    <div className={styles.donutRow}>
                        <ResponsiveContainer width="100%" height={220} className={styles.donutChart}>
                            <PieChart>
                                <Pie
                                    data={byCategory}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={2}
                                >
                                    {byCategory.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <ul className={styles.legend}>
                            {byCategory.map((entry, index) => (
                                <li key={entry.name} className={styles.legendItem}>
                                    <span
                                        className={styles.legendDot}
                                        style={{ background: COLORS[index % COLORS.length] }}
                                    />
                                    {entry.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
