import { adminAuth, adminDb } from "@/lib/firebase-admin";

export type CleanTestUnitsSummary = {
  usersDeleted: number;
  recordsDeleted: number;
};

const DEFAULT_TARGETS = [
  "unit01",
  "unit2",
  "unit3",
  "ro4",
  "UNIT001",
  "UNIT002",
  "UNIT003",
  "UNIT004",
  "UNIT005",
  "UNIT006",
  "UNIT007",
  "UNIT008",
  "UNIT009",
];

export async function cleanTestUnits(
  targets: string[] = DEFAULT_TARGETS
): Promise<CleanTestUnitsSummary> {
  let usersDeleted = 0;
  let recordsDeleted = 0;

  console.log("Starting cleanup for units:", targets);

  const uSnap = await adminDb.collection("users").get();
  const userDocsToDelete = uSnap.docs.filter((doc) => {
    const data = doc.data();
    const code = data.unit_code || data.unit;
    return targets.includes(code);
  });

  for (const doc of userDocsToDelete) {
    const uid = doc.id;
    try {
      await adminAuth.deleteUser(uid);
      console.log(`Deleted Auth Account: ${uid}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Auth Account ${uid} removal skipped: ${message}`);
    }
    await doc.ref.delete();
    usersDeleted++;
  }

  const rSnap = await adminDb.collection("vehicle_records").get();
  const recordDocsToDelete = rSnap.docs.filter((doc) => {
    const data = doc.data();
    const code = data.unit_code || data.unit;
    return targets.includes(code);
  });

  for (const doc of recordDocsToDelete) {
    await doc.ref.delete();
    recordsDeleted++;
  }

  console.log(
    `Cleanup finished. Deleted ${usersDeleted} users and ${recordsDeleted} records.`
  );

  return { usersDeleted, recordsDeleted };
}
