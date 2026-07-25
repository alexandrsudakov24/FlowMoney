import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import InsightCard from './InsightCard';
import { Spinner, ButtonSpinner } from '../ui';
import { msUntilInsightsAvailable } from '../../utils/insightsCooldown';
import styles from './InsightsPanel.module.css';

function formatDuration(ms: number): string {
    const totalMinutes = Math.ceil(ms / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function InsightsPanel() {
    const { activeExpenses, insightsDoc, insightsLoading, insightsGenerating, regenerateInsights } = useApp();
    const { t, language } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    // Ticks once a minute so the cooldown hint counts down without a refresh
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!expanded) return;
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, [expanded]);

    const msRemaining = msUntilInsightsAvailable(insightsDoc?.generatedAt ?? null, now);
    const onCooldown = msRemaining > 0;

    const handleRegenerate = () => {
        regenerateInsights(activeExpenses, language);
    };

    return (
        <div className={styles.panel}>
            <button
                type="button"
                className={styles.teaser}
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
            >
                <div className={styles.teaserText}>
                    <span className={styles.teaserLabel}>{t('insights')}</span>
                    {insightsDoc?.insights[0] ? (
                        <h3 className={styles.teaserTitle}>{insightsDoc.insights[0].title}</h3>
                    ) : (
                        <p className={styles.teaserDesc}>{t('insights_teaser_desc')}</p>
                    )}
                </div>
                <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▾</span>
            </button>

            {expanded && (
                <div className={styles.content}>
                    {insightsLoading ? (
                        <Spinner size="md" />
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
