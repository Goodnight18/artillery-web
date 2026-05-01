import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { summarizeVehicleRecordDocs } from "./lib/vehicleRecordUnitSummaries.js";
import {
  aggregateVehicleRecordsForDashboard,
  buildHourlyTrafficFromAccessLogs,
} from "./lib/dashboardStats.js";
import { persistCallableAuditLog } from "./lib/writeAuditLog.js";
import { syncVehicleRecordToMaster } from "./lib/syncVehicleToMaster.js";

// 1. Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// --- HTTPS CALLABLE FUNCTIONS (V2) ---

export const getUnitSummaries = onCall({ region: "asia-southeast1" }, async (req) => {
    if (!req.auth?.uid) throw new HttpsError("unauthenticated", "กรุณาเข้าสู่ระบบก่อนดำเนินการ");
    try {
        const snapshot = await db.collection("vehicle_records").get();
        return { success: true, summaries: summarizeVehicleRecordDocs(snapshot.docs) };
    } catch (error: any) {
        console.error("Aggregation Error:", error);
        throw new HttpsError("internal", "เกิดข้อผิดพลาดในการคำนวณข้อมูลสถิติหลังบ้าน");
    }
});

export const getDashboardStats = onCall({ region: "asia-southeast1" }, async (req) => {
    if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Not logged in");
    
    try {
        const recordsSnap = await db.collection("vehicle_records").get();
        const stats = aggregateVehicleRecordsForDashboard(recordsSnap.docs);

        const today = new Date();
        today.setHours(0,0,0,0);
        const trafficSnap = await db.collection("access_logs")
            .where("ts", ">=", today)
            .orderBy("ts", "desc")
            .get();

        const { hourlyTraffic, trafficTotal } = buildHourlyTrafficFromAccessLogs(trafficSnap.docs);

        return {
            success: true,
            stats,
            hourlyTraffic,
            trafficTotal
        };
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        throw new HttpsError("internal", error.message || "Failed to fetch stats");
    }
});

export const writeAuditLog = onCall({ region: "asia-southeast1" }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Not logged in");
  return persistCallableAuditLog(db, req.auth, req.data);
});

/**
 * Triggers when a vehicle record is created, updated, or deleted.
 * Syncs approved complete records into `vehicles` for the Monitor.
 *
 * Uses **Cloud Functions Gen1** deliberately: Gen2/Eventarc deployments can fail when
 * Firestore is in `asia-southeast3` (see firebase.json): Gen2 sometimes cannot pair that
 * trigger location with Cloud Run destinations (400), and Bangkok may return 403 for Gen2 deploys.
 * Gen1 triggers still invoke against the same project Firestore via Admin SDK.
 *
 * Deploy region follows Firebase guidance for mismatched locations: nearest Gen1-supported region.
 */
export const syncVehicleToMaster = functionsV1.region("asia-east1").firestore
  .document("vehicle_records/{recordId}")
  .onWrite(async (change, context) => {
    await syncVehicleRecordToMaster({
      db,
      recordId: context.params.recordId as string,
      newData: change.after.exists ? change.after.data() : undefined,
      oldData: change.before.exists ? change.before.data() : undefined,
    });
  });