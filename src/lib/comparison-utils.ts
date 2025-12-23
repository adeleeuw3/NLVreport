export interface ComparisonResult {
    trend: "up" | "down" | "neutral";
    percentChange: number;
    formattedChange: string;
}

export const calculateTrend = (current: number, previous: number): ComparisonResult => {
    if (!previous || previous === 0) return { trend: "neutral", percentChange: 0, formattedChange: "0%" };
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const trend = percent > 0 ? "up" : percent < 0 ? "down" : "neutral";
    return {
        trend,
        percentChange: Math.abs(percent),
        formattedChange: `${Math.abs(percent).toFixed(1)}%`
    };
};

export const compareData = (
    kpiId: string,
    currentData: any,
    previousData: any,
    extractValueFn: (data: any) => number
): ComparisonResult | null => {
    if (!previousData || !previousData[kpiId] || !currentData || !currentData[kpiId]) return null;

    // We expect the extractValueFn to handle the finding of the 'total' or 'current' value from the KPI data structure
    // But since we can't easily pass the function across files without circular deps if it's in Dashboard,
    // let's assume raw number extraction or basic object access.

    // Actually, StoryDashboard passes a helper. Let's rely on it.
    const currVal = extractValueFn(currentData[kpiId]);
    const prevVal = extractValueFn(previousData[kpiId]);

    return calculateTrend(currVal, prevVal);
};
