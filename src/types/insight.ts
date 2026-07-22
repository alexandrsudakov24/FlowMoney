export interface Insight {
    title: string;
    description: string;
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
