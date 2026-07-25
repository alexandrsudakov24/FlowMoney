import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';
import styles from './Charts.module.css';
import type { Expense } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCatLabel } from '../../utils/getCatLabel';
import { getCategoryColorMap } from '../../utils/getCategoryColors';

interface ChartsProps {
    expenses: Expense[];
    selectedCategories?: string[];
    onSelectCategory?: (category: string) => void;
}

export default function Charts({ expenses, selectedCategories = [], onSelectCategory }: ChartsProps) {
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

    const colorMap = useMemo(() => getCategoryColorMap(expenses), [expenses]);

    const hasSelection = selectedCategories.length > 0;
    const isSelected = (key: string) => selectedCategories.includes(key);

    return (
        <div className={styles.charts}>
            <div className={styles.chartCard}>
                <h3>{t('chart_by_category')}</h3>
                {byCategory.length === 0 ? <p className={styles.empty}>{t('no_expense_data')}</p> : (
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
                                            fill={colorMap[entry.key]}
                                            opacity={hasSelection && !isSelected(entry.key) ? 0.35 : 1}
                                            stroke={isSelected(entry.key) ? 'var(--card)' : undefined}
                                            strokeWidth={isSelected(entry.key) ? 2 : 0}
                                            cursor={onSelectCategory ? 'pointer' : undefined}
                                            onClick={() => onSelectCategory?.(entry.key)}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <ul className={styles.legend}>
                            {byCategory.map((entry) => (
                                <li key={entry.key} className={styles.legendItem}>
                                    <button
                                        type="button"
                                        className={`${styles.legendBtn} ${isSelected(entry.key) ? styles.legendBtnActive : ''}`}
                                        style={{ opacity: hasSelection && !isSelected(entry.key) ? 0.5 : 1 }}
                                        onClick={() => onSelectCategory?.(entry.key)}
                                    >
                                        <span
                                            className={styles.legendDot}
                                            style={{ background: colorMap[entry.key] }}
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
