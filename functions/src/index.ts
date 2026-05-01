import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { summarizeVehicleRecordDocs } from "./lib/vehicleRecordUnitSummaries.js";

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
        // 1. Get Vehicle Records Overall
        const recordsSnap = await db.collection("vehicle_records").get();
        const stats = {
            totalRecords: 0,
            pendingRecords: 0,
            approvedRecords: 0,
            incompleteRecords: 0,
            vehicleTypes: {} as Record<string, number>,
        };

        recordsSnap.docs.forEach(doc => {
            const data = doc.data();
            stats.totalRecords++;
            if (data.status === "pending_review") stats.pendingRecords++;
            if (data.status === "approved") stats.approvedRecords++;
            if (!data.is_complete) stats.incompleteRecords++;
            
            const vt = data.vehicle_type || "ไม่ระบุ";
            stats.vehicleTypes[vt] = (stats.vehicleTypes[vt] || 0) + 1;
        });

        // 2. Get Today's Traffic (access_logs)
        const today = new Date();
        today.setHours(0,0,0,0);
        const trafficSnap = await db.collection("access_logs")
            .where("ts", ">=", today)
            .orderBy("ts", "desc")
            .get();
        
        const hourlyTraffic: Record<string, { in: number, out: number }> = {};
        // Initialize 24 hours
        for(let i=0; i<24; i++) {
            const h = i.toString().padStart(2, '0') + ":00";
            hourlyTraffic[h] = { in: 0, out: 0 };
        }

        trafficSnap.docs.forEach(doc => {
            const data = doc.data();
            const ts = data.ts?.toDate?.() || new Date(data.ts?._seconds * 1000);
            const hourKey = ts.getHours().toString().padStart(2, '0') + ":00";
            
            // Logic: if reason is PASS, count as traffic
            // Note: In this system, 'CAR' usually enters/exits. 
            // We'll treat all PASS logs for simplification or add gate direction if available.
            // For now, let's assume 'in' is everything pass.
            if (data.decision === "PASS") {
                hourlyTraffic[hourKey].in++; 
            }
        });

        return {
            success: true,
            stats,
            hourlyTraffic: Object.entries(hourlyTraffic).map(([time, val]) => ({ time, ...val })),
            trafficTotal: trafficSnap.size
        };
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        throw new HttpsError("internal", error.message || "Failed to fetch stats");
    }
});

function pick(obj: any, keys: string[]) {
  if (!obj) return undefined;
  if (keys.includes('*')) return obj;
  const out: any = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

export const writeAuditLog = onCall({ region: "asia-southeast1" }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Not logged in");
  const data = req.data || {};
  const action = String(data.action || "").trim();
  const resource = String(data.resource || "").trim();
  if (!action || !resource) throw new HttpsError("invalid-argument", "action/resource required");
  const userSnap = await db.collection("users").doc(req.auth.uid).get();
  const role = userSnap.data()?.role || "viewer";
  const standardFields = ["displayName", "role", "isActive", "email", "status", "unit_code", "unit_name_th", "is_complete"];
  const before = pick(data.before, standardFields);
  const after  = pick(data.after,  standardFields);
  await db.collection("audit_logs").add({
    actorUid: req.auth.uid,
    actorEmail: req.auth.token?.email || "",
    actorName: req.auth.token?.name || req.auth.token?.email || "",
    actorRole: role, action, resource, resourceId: data.resourceId || null, targetName: data.targetName || null, before: before ?? null, after: after ?? null, meta: data.meta ?? null, createdAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

/**
 * Triggers when a vehicle record is created or updated.
 * Syncs approved and complete records to the 'vehicles' collection for the Monitor.
 */
export const syncVehicleToMaster = onDocumentWritten({ 
    document: "vehicle_records/{recordId}",
    region: "asia-southeast1" 
}, async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();

    if (!newData) {
        if (oldData?.plateSearchKey) {
            console.log(`Record ${event.params.recordId} deleted.`);
        }
        return;
    }

    const { 
        plateSearchKey, status, is_complete, first_name, last_name, rank, prefix, 
        brand, model, color, vehicle_photo_front_url, person_photo_url, vehicle_type 
    } = newData;

    if (!plateSearchKey) return;

    const masterRef = db.collection("vehicles").doc(plateSearchKey);

    if (status === "approved" && is_complete) {
        const fullName = `${rank && rank !== 'ไม่มียศ' ? rank : (prefix || "")} ${first_name} ${last_name}`.trim();
        await masterRef.set({
            plateCode: plateSearchKey,
            fullName: fullName || "ไม่ระบุชื่อ",
            brand: brand || "",
            model: model || "",
            color: color || "",
            vehicleType: vehicle_type || "",
            photoUrl: vehicle_photo_front_url || "",
            personPhotoUrl: person_photo_url || "",
            lastUpdated: FieldValue.serverTimestamp(),
            sourceRecordId: event.params.recordId,
            isActive: true
        }, { merge: true });
    } else if (oldData?.status === "approved" && status !== "approved") {
        await masterRef.update({ isActive: false, lastUpdated: FieldValue.serverTimestamp() }).catch(() => {});
    }
});