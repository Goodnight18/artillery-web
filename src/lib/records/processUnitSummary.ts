import { RecordData } from "../../../app/records/types";

export interface UnitSummaryItem {
    unit_code: string;
    unit_name_th: string;
    totalRecords: number;
    pendingRecords: number;
    approvedRecords: number;
    completeRecords: number;
    incompleteRecords: number;
    missingVehiclePhotoCount: number;
    missingPersonPhotoCount: number;
    updatedAt: number;
}

/**
 * Groups record data by unit and calculates summary statistics.
 */
export function processUnitSummary(records: RecordData[]): Record<string, UnitSummaryItem> {
    const summary: Record<string, UnitSummaryItem> = {};

    records.forEach(record => {
        const code = record.unit_code || record.unit || "UNKNOWN";
        const name = record.unit_name_th || record.unit_name_th || code;

        if (!summary[code]) {
            summary[code] = {
                unit_code: code,
                unit_name_th: name,
                totalRecords: 0,
                pendingRecords: 0,
                approvedRecords: 0,
                completeRecords: 0,
                incompleteRecords: 0,
                missingVehiclePhotoCount: 0,
                missingPersonPhotoCount: 0,
                updatedAt: 0
            };
        }

        const item = summary[code];
        item.totalRecords++;

        if (record.status === "pending_review") item.pendingRecords++;
        if (record.status === "approved") item.approvedRecords++;

        if (record.is_complete) {
            item.completeRecords++;
        } else {
            item.incompleteRecords++;
        }

        // Count missing photos based on common patterns in missing_fields
        if (record.missing_fields) {
            if (record.missing_fields.some(f => f.includes("รูปถ่ายรถ"))) item.missingVehiclePhotoCount++;
            if (record.missing_fields.some(f => f.includes("รูปถ่ายบุคคล"))) item.missingPersonPhotoCount++;
        }

        if (record.updated_at > item.updatedAt) {
            item.updatedAt = record.updated_at;
        }
    });

    return summary;
}
