import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
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
 * Triggers when a vehicle record is created or updated.
 * Syncs approved and complete records to the 'vehicles' collection for the Monitor.
 */
// Firestore Eventarc triggers must deploy in the same region as `firestore.location` (see firebase.json).
export const syncVehicleToMaster = onDocumentWritten({ 
    document: "vehicle_records/{recordId}",
    region: "asia-southeast3" 
}, async (event) => {
    await syncVehicleRecordToMaster({
        db,
        recordId: event.params.recordId,
        newData: event.data?.after.data(),
        oldData: event.data?.before.data(),
    });
});