/**
 * Firestore trigger logic: sync `vehicle_records` → `vehicles` for Monitor (extracted from `index.ts`).
 */

import {
  FieldValue,
  type DocumentData,
  type Firestore,
} from "firebase-admin/firestore";

export async function syncVehicleRecordToMaster(opts: {
  db: Firestore;
  recordId: string;
  newData?: DocumentData;
  oldData?: DocumentData;
}): Promise<void> {
  const { db, recordId, newData, oldData } = opts;

  if (!newData) {
    if (oldData?.plateSearchKey) {
      console.log(`Record ${recordId} deleted.`);
    }
    return;
  }

  const {
    plateSearchKey,
    status,
    is_complete,
    first_name,
    last_name,
    rank,
    prefix,
    brand,
    model,
    color,
    vehicle_photo_front_url,
    person_photo_url,
    vehicle_type,
  } = newData;

  if (!plateSearchKey) return;

  const masterRef = db.collection("vehicles").doc(String(plateSearchKey));

  if (status === "approved" && is_complete) {
    const fullName = `${rank && rank !== "ไม่มียศ" ? rank : prefix || ""} ${first_name} ${last_name}`.trim();
    await masterRef.set(
      {
        plateCode: plateSearchKey,
        fullName: fullName || "ไม่ระบุชื่อ",
        brand: brand || "",
        model: model || "",
        color: color || "",
        vehicleType: vehicle_type || "",
        photoUrl: vehicle_photo_front_url || "",
        personPhotoUrl: person_photo_url || "",
        lastUpdated: FieldValue.serverTimestamp(),
        sourceRecordId: recordId,
        isActive: true,
      },
      { merge: true },
    );
  } else if (oldData?.status === "approved" && status !== "approved") {
    await masterRef
      .update({ isActive: false, lastUpdated: FieldValue.serverTimestamp() })
      .catch(() => {});
  }
}
