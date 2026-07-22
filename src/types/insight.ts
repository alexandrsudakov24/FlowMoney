export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
    title: string;
    description: string;
    severity: InsightSeverity;
}

export interface CategoryStat {
    category: string;
    currentTotal: number;
    previousTotal: number;
    /** Percent change vs. previous month; null when previousTotal is 0 (new category, no base to compare). */
    percentChange: number | null;
}

export interface InsightsStats {
    month: string; // YYYY-MM
    currentMonthTotal: number;
    previousMonthTotal: number;
    categories: CategoryStat[];
    topCategories: CategoryStat[];
    spikes: CategoryStat[];
    threeMonthAverage: number;
}

export interface InsightsDoc {
    insights: Insight[];
    generatedAt: number;
    statsFingerprint: string;
    language: 'en' | 'ru' | 'he';
    generatedBy?: string;
}
