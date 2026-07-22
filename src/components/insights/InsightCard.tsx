import type { JSX } from 'react';
import type { Insight, InsightSeverity } from '../../types';
import styles from './InsightCard.module.css';

const IconInfo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <circle cx="12" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
);

const IconWarning = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 L22 20 L2 20 Z" />
        <line x1="12" y1="9" x2="12" y2="14" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
);

const IconCritical = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="7" x2="12" y2="13" />
        <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
    </svg>
);

const ICONS: Record<InsightSeverity, () => JSX.Element> = {
    info: IconInfo,
    warning: IconWarning,
    critical: IconCritical,
};

export default function InsightCard({ insight }: { insight: Insight }) {
    const severity: InsightSeverity = insight.severity ?? 'info';
    const Icon = ICONS[severity] ?? IconInfo;

    return (
        <div className={`${styles.card} ${styles[severity]}`}>
            <span className={styles.icon}><Icon /></span>
            <div className={styles.body}>
                <h3 className={styles.title}>{insight.title}</h3>
                <p className={styles.description}>{insight.description}</p>
            </div>
        </div>
    );
}
