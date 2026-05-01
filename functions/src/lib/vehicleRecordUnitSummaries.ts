/**
 * Aggregation for callable `getUnitSummaries`.
 * Logic copied verbatim from former `functions/src/index.ts` implementation.
 */

import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

/** Shape returned by `getUnitSummaries` callable (matches prior inline object). */
export type CallableUnitSummary = {
  unit_code: unknown;
  unit_name_th: unknown;
  totalRecords: number;
  pendingRecords: number;
  approvedRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  updatedAt: number;
};

export function summarizeVehicleRecordDocs(
  docs: QueryDocumentSnapshot[],
): CallableUnitSummary[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary: Record<any, CallableUnitSummary> = {};

  docs.forEach((doc) => {
    const data = doc.data();
    const code = data.unit_code || data.unit || "UNKNOWN";
    const name = data.unit_name_th || code;
    if (!summary[code]) {
      summary[code] = {
        unit_code: code,
        unit_name_th: name,
        totalRecords: 0,
        pendingRecords: 0,
        approvedRecords: 0,
        completeRecords: 0,
        incompleteRecords: 0,
        updatedAt: 0,
      };
    }
    const item = summary[code];
    item.totalRecords++;
    if (data.status === "pending_review") item.pendingRecords++;
    if (data.status === "approved") item.approvedRecords++;
    if (data.is_complete) item.completeRecords++;
    else item.incompleteRecords++;

    const upTs = data.updated_at || 0;
    if (upTs > item.updatedAt) item.updatedAt = upTs;
  });

  return Object.values(summary);
}
