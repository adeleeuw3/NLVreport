import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";

export interface ReportDocument {
    id: string; // Format: YYYY-Month (e.g., 2025-Jan)
    month: string;
    year: string;
    title?: string;
    createdAt: number;
    data: any; // The massive form data object
    userId?: string;
}

export const StorageService = {
    /**
     * Save a report to Firestore under a specific user.
     * Path: users/{uid}/reports/{reportId}
     */
    async saveReport(uid: string, month: string, year: string, data: any, title: string = "") {
        if (!uid) return { success: false, error: "User not authenticated" };

        try {
            const id = `${year}-${month}`;
            // NEW PATH: users/{uid}/reports/{id}
            const docRef = doc(db, "users", uid, "reports", id);

            const payload: ReportDocument = {
                id,
                month,
                year,
                title,
                createdAt: Date.now(),
                data,
                userId: uid
            };

            await setDoc(docRef, payload);
            console.log("Report saved successfully for user:", uid, id);
            return { success: true, id };
        } catch (error) {
            console.error("Error saving report:", error);
            return { success: false, error };
        }
    },

    /**
     * Load a specific report for a user.
     */
    async getReport(uid: string, month: string, year: string) {
        if (!uid) return null;
        try {
            const id = `${year}-${month}`;
            const docRef = doc(db, "users", uid, "reports", id);
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                return snapshot.data() as ReportDocument;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error loading report:", error);
            throw error;
        }
    },

    /**
     * Find the "Previous" report automatically for a user.
     */
    async getPreviousReport(uid: string, currentMonth: string, currentYear: string) {
        if (!uid) return null;

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let mIndex = months.indexOf(currentMonth);
        let y = parseInt(currentYear);

        if (mIndex === -1) return null; // Invalid month

        // Decrement
        mIndex--;
        if (mIndex < 0) {
            mIndex = 11;
            y--;
        }

        const prevMonth = months[mIndex];
        const prevYear = y.toString();

        return await this.getReport(uid, prevMonth, prevYear);
    },

    /**
     * Get a list of months that have saved reports for a given year.
     */
    async getSavedMonths(uid: string, year: string): Promise<string[]> {
        if (!uid) return [];
        try {
            const reportsRef = collection(db, "users", uid, "reports");
            const q = query(reportsRef, where("year", "==", year));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => doc.data().month);
        } catch (error) {
            console.error("Error fetching saved months:", error);
            return [];
        }
    },

    /**
     * Delete a report for a specific month/year.
     */
    async deleteReport(uid: string, month: string, year: string) {
        if (!uid) return { success: false, error: "User not authenticated" };
        try {
            const id = `${year}-${month}`;
            const docRef = doc(db, "users", uid, "reports", id);
            await deleteDoc(docRef);
            console.log("Report deleted successfully:", id);
            return { success: true };
        } catch (error) {
            console.error("Error deleting report:", error);
            return { success: false, error };
        }
    }
};
