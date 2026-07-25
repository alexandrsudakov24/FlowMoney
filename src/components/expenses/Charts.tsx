import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';
import styles from './Charts.module.css';
import type { Expense } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCatLabel } from '../../utils/getCatLabel';

const COLORS = [
    '#2a78d6', '#1baf7a', '#eda100', '#008300',
    '#4a3aa7', '#e34948', '#e87ba4', '#eb6834',
    '#812964', '#5dbdfb', '#4c51f6', '#911a36',
];

interface ChartsProps {
    expenses: Expense[];
    selectedCategory?: string;
    onSelectCategory?: (category: string) => void;
}

export default function Charts({ expenses, selectedCategory = '', onSelectCategory }: ChartsProps) {
    const { t } = useLanguage();

    const byCategory = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach((e) => {
            if (e.type === 'expense') {
                const cat = e.category || 'Other';
                map[cat] = (map[cat] || 0) + Number(e.amount || 0);
            }
        });
        return Object.entries(map).map(([key, value]) => ({ key, name: getCatLabel(key, t), value }));
    }, [expenses, t]);

    const handleSelect = (key: string) => {
        onSelectCategory?.(selectedCategory === key ? '' : key);
    };

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
                                    {byCategory.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={selectedCategory && selectedCategory !== entry.key ? 0.35 : 1}
                                            stroke={selectedCategory === entry.key ? 'var(--card)' : undefined}
                                            strokeWidth={selectedCategory === entry.key ? 2 : 0}
                                            cursor={onSelectCategory ? 'pointer' : undefined}
                                            onClick={() => handleSelect(entry.key)}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <ul className={styles.legend}>
                            {byCategory.map((entry, index) => (
                                <li key={entry.key} className={styles.legendItem}>
                                    <button
                                        type="button"
                                        className={`${styles.legendBtn} ${selectedCategory === entry.key ? styles.legendBtnActive : ''}`}
                                        style={{ opacity: selectedCategory && selectedCategory !== entry.key ? 0.5 : 1 }}
                                        onClick={() => handleSelect(entry.key)}
                                    >
                                        <span
                                            className={styles.legendDot}
                                            style={{ background: COLORS[index % COLORS.length] }}
                                        />
                                        {entry.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
