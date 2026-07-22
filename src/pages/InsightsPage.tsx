import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { InsightCard } from '../components/insights';
import { Spinner, ButtonSpinner } from '../components/ui';
import { msUntilInsightsAvailable } from '../utils/insightsCooldown';
import styles from './InsightsPage.module.css';

function formatDuration(ms: number): string {
    const totalMinutes = Math.ceil(ms / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function InsightsPage() {
    const { activeExpenses, insightsDoc, insightsLoading, insightsGenerating, regenerateInsights } = useApp();
    const { t, language } = useLanguage();

    // Ticks once a minute so the cooldown hint counts down without a page refresh
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    const msRemaining = msUntilInsightsAvailable(insightsDoc?.generatedAt ?? null, now);
    const onCooldown = msRemaining > 0;

    const handleRegenerate = () => {
        regenerateInsights(activeExpenses, language);
    };

    if (insightsLoading) {
        return <Spinner size="lg" />;
    }

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>{t('insights')}</h2>

            <div className={styles.actions}>
                <button
                    className={styles.regenerateBtn}
                    onClick={handleRegenerate}
                    disabled={insightsGenerating || onCooldown}
                >
                    {insightsGenerating
                        ? <ButtonSpinner />
                        : t(insightsDoc ? 'insights_regenerate_cta' : 'insights_generate_cta')}
                </button>
                {onCooldown && (
                    <span className={styles.cooldownHint}>
                        {t('insights_cooldown_hint').replace('{time}', formatDuration(msRemaining))}
                    </span>
                )}
            </div>

            {insightsDoc ? (
                <>
                    <p className={styles.updatedAt}>
                        {t('insights_last_updated').replace(
                            '{time}',
                            new Date(insightsDoc.generatedAt).toLocaleString()
                        )}
                    </p>
                    <div className={styles.list}>
                        {insightsDoc.insights.map((insight, i) => (
                            <InsightCard key={i} insight={insight} />
                        ))}
                    </div>
                </>
            ) : (
                <div className={styles.empty}>{t('insights_empty')}</div>
            )}
        </div>
    );
}
