import { adminAuth, adminDb } from "@/lib/firebase-admin";

export type BulkApproveInput = {
  idToken?: string;
  recordIds?: string[];
};

export class BulkApproveError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BulkApproveError";
    this.status = status;
  }
}

type BulkApproveResult = {
  totalUpdated: number;
  failed: number;
};

export async function bulkApproveRecords(
  input: BulkApproveInput
): Promise<BulkApproveResult> {
  if (!input.idToken) {
    throw new BulkApproveError("Unauthorized: Missing Token", 401);
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(input.idToken);
  } catch {
    throw new BulkApproveError("Unauthorized: Invalid Token", 401);
  }

  const uid = decodedToken.uid;
  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    throw new BulkApproveError("Forbidden: User not found", 403);
  }

  const userData = userDoc.data();
  if (userData?.role !== "admin" && userData?.role !== "super_admin") {
    throw new BulkApproveError("Forbidden: Admins only", 403);
  }

  if (!Array.isArray(input.recordIds) || input.recordIds.length === 0) {
    throw new BulkApproveError("Bad Request: No record IDs provided", 400);
  }

  const approvedByName = userData.display_name || userData.displayName || "Admin";
  let totalUpdated = 0;
  let failed = 0;
  const batches: string[][] = [];
  const batchSize = 400;

  for (let i = 0; i < input.recordIds.length; i += batchSize) {
    batches.push(input.recordIds.slice(i, i + batchSize));
  }

  for (const chunk of batches) {
    const batch = adminDb.batch();
    const now = Date.now();

    chunk.forEach((id) => {
      const ref = adminDb.collection("vehicle_records").doc(id);
      batch.update(ref, {
        status: "approved",
        approved_at: now,
        approved_by_uid: uid,
        approved_by_name: approvedByName,
        updated_at: now,
        updated_by_uid: uid,
        updated_by_name: approvedByName,
      });
    });

    try {
      await batch.commit();
      totalUpdated += chunk.length;
    } catch (error: unknown) {
      console.error("Batch update chunk failed:", error);
      failed += chunk.length;
    }
  }

  return { totalUpdated, failed };
}
