
import { KPI_LIST } from "./kpi-definitions";
import { ReportDocument } from "./storage-service";

/**
 * Stitch multiple monthly reports into a single data object for the Dashboard.
 * 
 * @param reports Array of loaded ReportDocuments (can contain nulls or missing months)
 * @param monthsToLoad The list of months (e.g., ["Jan", "Feb"]) that we WANT to visualize.
 *                       The reports array should usually align with this, or we filter from it.
 * 
 * @returns A formData object structured like: { kpiId: { inputId: "val1, val2" } }
 */
export function stitchReports(reports: (ReportDocument | null)[], monthsToLoad: string[]): any {
    const result: any = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    KPI_LIST.forEach(kpi => {
        const kpiData: any = {};

        kpi.inputs.forEach(input => {
            if (input.type === "array") {
                // For array inputs, we collect the value from each report in the range
                const values = monthsToLoad.map(m => {
                    // Find report for this month
                    const report = reports.find(r => r && r.month === m);
                    if (!report || !report.data || !report.data[kpi.id]) return "";

                    const val = report.data[kpi.id][input.id];
                    // If the stored value is already an array (legacy), take the relevant index?
                    // NO: The new system saves SCALAR values per month.
                    // BUT: We need to handle migration if old data exists? 
                    // Let's assume for now we are reading the NEW simple format.
                    // If the user entered "100" for Jan, we get "100".

                    return val !== undefined ? val : "";
                });

                // Join into what the dashboard expects: "100, 200, 150"
                kpiData[input.id] = values.join(",");
            } else {
                // For scalar inputs (like "Total Customers" or "Winner Name"), 
                // we usually want the LATEST known value in the selected range.
                let latestVal = "";

                // Iterate backwards through the months we selected
                for (let i = monthsToLoad.length - 1; i >= 0; i--) {
                    const m = monthsToLoad[i];
                    const report = reports.find(r => r && r.month === m);
                    if (report && report.data && report.data[kpi.id] && report.data[kpi.id][input.id]) {
                        latestVal = report.data[kpi.id][input.id];
                        break;
                    }
                }

                kpiData[input.id] = latestVal;
            }
        });

        result[kpi.id] = kpiData;
    });

    return result;
}
