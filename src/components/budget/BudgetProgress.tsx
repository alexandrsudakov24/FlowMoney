import { useEffect, useMemo, useRef } from 'react';
import type { Expense } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getCatLabel } from '../../utils/getCatLabel';
import BudgetTipsPanel from './BudgetTipsPanel';
import styles from './BudgetProgress.module.css';

interface Props {
    monthExpenses: Expense[];
    monthStr: string;
    categoryLimits: Record<string, number>;
    symbol: string;
}

// Categories with a monthly limit set, spent-so-far and percentage — sorted by
// how close to (or over) the limit they are, so the most urgent one shows first.
export default function BudgetProgress({ monthExpenses, monthStr, categoryLimits, symbol }: Props) {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const warnedRef = useRef<Set<string>>(new Set());

    const rows = useMemo(() => {
        const spent: Record<string, number> = {};
        monthExpenses.forEach((e) => {
            if (e.type !== 'expense') return;
            spent[e.category] = (spent[e.category] || 0) + Number(e.amount || 0);
        });
        return Object.entries(categoryLimits)
            .map(([cat, limit]) => ({
                cat,
                limit,
                spent: spent[cat] || 0,
                pct: limit > 0 ? Math.min(100, ((spent[cat] || 0) / limit) * 100) : 0,
                exceeded: (spent[cat] || 0) > limit,
            }))
            .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
    }, [monthExpenses, categoryLimits]);

    useEffect(() => {
        rows.forEach(({ cat, exceeded }) => {
            const key = `${monthStr}:${cat}`;
            if (exceeded && !warnedRef.current.has(key)) {
                warnedRef.current.add(key);
                showToast(`${t('budget_exceeded')}: ${getCatLabel(cat, t)}`, 'error');
            }
        });
    }, [rows, monthStr, showToast, t]);

    if (rows.length === 0) return null;

    return (
        <div className={styles.section}>
            <h2 className={styles.title}>{t('budgets')}</h2>
            <div className={styles.list}>
                {rows.map(({ cat, limit, spent, pct, exceeded }) => (
                    <div key={cat} className={styles.row}>
                        <div className={styles.rowHeader}>
                            <span className={styles.name}>{getCatLabel(cat, t)}</span>
                            <span className={exceeded ? styles.amountExceeded : styles.amount}>
                                {spent.toFixed(2)} / {limit.toFixed(2)} {symbol}
                            </span>
                        </div>
                        <div className={styles.track}>
                            <div
                                className={exceeded ? styles.fillExceeded : styles.fill}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <BudgetTipsPanel />
        </div>
    );
}
