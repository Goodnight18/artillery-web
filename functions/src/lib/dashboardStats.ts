/**
 * Aggregation for callable `getDashboardStats`.
 * Logic extracted from former `functions/src/index.ts`.
 */

import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

export type DashboardVehicleStats = {
  totalRecords: number;
  pendingRecords: number;
  approvedRecords: number;
  incompleteRecords: number;
  vehicleTypes: Record<string, number>;
};

export type HourlyTrafficBucket = {
  time: string;
  in: number;
  out: number;
};

/** Step 1: scan all vehicle_records documents (same semantics as legacy handler). */
export function aggregateVehicleRecordsForDashboard(
  docs: QueryDocumentSnapshot[],
): DashboardVehicleStats {
  const stats: DashboardVehicleStats = {
    totalRecords: 0,
    pendingRecords: 0,
    approvedRecords: 0,
    incompleteRecords: 0,
    vehicleTypes: {},
  };

  docs.forEach((doc) => {
    const data = doc.data();
    stats.totalRecords++;
    if (data.status === "pending_review") stats.pendingRecords++;
    if (data.status === "approved") stats.approvedRecords++;
    if (!data.is_complete) stats.incompleteRecords++;

    const vt = data.vehicle_type || "ไม่ระบุ";
    stats.vehicleTypes[vt] = (stats.vehicleTypes[vt] || 0) + 1;
  });

  return stats;
}

/**
 * Step 2: access_logs docs for \"today\" (caller runs the query).
 * Matches legacy hourly bucket + PASS counting behavior.
 */
export function buildHourlyTrafficFromAccessLogs(
  docs: QueryDocumentSnapshot[],
): { hourlyTraffic: HourlyTrafficBucket[]; trafficTotal: number } {
  const hourlyTraffic: Record<string, { in: number; out: number }> = {};

  for (let i = 0; i < 24; i++) {
    const h = `${i.toString().padStart(2, "0")}:00`;
    hourlyTraffic[h] = { in: 0, out: 0 };
  }

  docs.forEach((doc) => {
    const data = doc.data();
    // Legacy: Firestore Timestamp or plain `{ _seconds }` on access_logs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ts = (data.ts as any)?.toDate?.() || new Date((data.ts as any)?._seconds * 1000);
    const hourKey = `${ts.getHours().toString().padStart(2, "0")}:00`;

    if (data.decision === "PASS") {
      hourlyTraffic[hourKey].in++;
    }
  });

  return {
    hourlyTraffic: Object.entries(hourlyTraffic).map(([time, val]) => ({
      time,
      ...val,
    })),
    trafficTotal: docs.length,
  };
}
