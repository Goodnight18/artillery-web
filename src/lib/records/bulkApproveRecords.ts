import { RecordData } from "../../../app/records/types";
import { getAuth } from "firebase/auth";

export interface BulkApproveResult {
    totalRequested: number;
    totalUpdated: number;
    failed: number;
}

/**
 * Invokes the secure backend API to bulk approve records.
 * Only records with status === "pending_review" and is_complete === true are sent.
 */
export async function bulkApproveRecords(
    records: RecordData[],
    approvedBy: { uid: string; name: string }
): Promise<BulkApproveResult> {
    const eligibleRecords = records.filter(r => r.status === "pending_review" && r.is_complete === true);
    if (eligibleRecords.length === 0) return { totalRequested: 0, totalUpdated: 0, failed: 0 };
    
    // Retrieve the authorization ID token from Firebase Auth
    const auth = getAuth();
    if (!auth.currentUser) {
       throw new Error("User not authenticated");
    }
    const token = await auth.currentUser.getIdToken();

    const recordIds = eligibleRecords.map(r => r.record_id);

    const response = await fetch("/api/records/bulk-approve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Pass Firebase ID Token
        },
        body: JSON.stringify({ recordIds })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to bulk approve records");
    }

    return {
        totalRequested: eligibleRecords.length,
        totalUpdated: data.totalUpdated,
        failed: data.failed
    };
}
