import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCatLabel } from '../../utils/getCatLabel';
import { ButtonSpinner } from '../ui';
import { msUntilBudgetTipsAvailable } from '../../utils/budgetTipsCooldown';
import styles from './BudgetTipsPanel.module.css';

function formatDuration(ms: number): string {
    const totalHours = Math.ceil(ms / 3_600_000);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

// Weekly, AI-generated advice for staying within the monthly limits the user
// set per category (see CategoryModal). Only rendered when at least one
// category has a limit — nothing shows up for users who don't use budgets.
export default function BudgetTipsPanel() {
    const { activeExpenses, categoryLimits, budgetTipsDoc, budgetTipsLoading, budgetTipsGenerating, regenerateBudgetTips } = useApp();
    const { t, language } = useLanguage();

    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    const msRemaining = msUntilBudgetTipsAvailable(budgetTipsDoc?.generatedAt ?? null, now);
    const onCooldown = msRemaining > 0;

    const handleRegenerate = () => {
        regenerateBudgetTips(activeExpenses, categoryLimits, language);
    };

    if (budgetTipsLoading) return null;

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h3 className={styles.title}>{t('budget_tips')}</h3>
                <button
                    className={styles.regenerateBtn}
                    onClick={handleRegenerate}
                    disabled={budgetTipsGenerating || onCooldown}
                >
                    {budgetTipsGenerating
                        ? <ButtonSpinner />
                        : t(budgetTipsDoc ? 'budget_tips_refresh_cta' : 'budget_tips_generate_cta')}
                </button>
            </div>

            {onCooldown && (
                <span className={styles.cooldownHint}>
                    {t('budget_tips_cooldown_hint').replace('{time}', formatDuration(msRemaining))}
                </span>
            )}

            {budgetTipsDoc ? (
                <div className={styles.list}>
                    {budgetTipsDoc.tips.map((tip, i) => (
                        <div key={i} className={styles.tip}>
                            <span className={styles.tipCategory}>{getCatLabel(tip.category, t)}</span>
                            <p className={styles.tipMessage}>{tip.message}</p>
                        </div>
                    ))}
                </div>
            ) : (
                !budgetTipsGenerating && <p className={styles.empty}>{t('budget_tips_empty')}</p>
            )}
        </div>
    );
}
