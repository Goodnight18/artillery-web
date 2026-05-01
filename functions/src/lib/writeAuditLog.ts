/**
 * Callable `writeAuditLog` implementation (extracted from `index.ts`).
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

function pick(obj: unknown, keys: string[]) {
  if (!obj) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj as any;
  if (keys.includes("*")) return obj;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {};
  for (const k of keys) if (k in o) out[k] = o[k];
  return out;
}

type CallableAuth = {
  uid: string;
  token?: { email?: string; name?: string };
};

/** Persists audit entry from HTTPS callable payload. Throws `HttpsError` on invalid arguments. */
export async function persistCallableAuditLog(
  db: Firestore,
  auth: CallableAuth,
  payload: unknown,
): Promise<{ ok: true }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (payload || {}) as any;
  const action = String(data.action || "").trim();
  const resource = String(data.resource || "").trim();
  if (!action || !resource) {
    throw new HttpsError("invalid-argument", "action/resource required");
  }
  const userSnap = await db.collection("users").doc(auth.uid).get();
  const role = userSnap.data()?.role || "viewer";
  const standardFields = [
    "displayName",
    "role",
    "isActive",
    "email",
    "status",
    "unit_code",
    "unit_name_th",
    "is_complete",
  ];
  const before = pick(data.before, standardFields);
  const after = pick(data.after, standardFields);
  await db.collection("audit_logs").add({
    actorUid: auth.uid,
    actorEmail: auth.token?.email || "",
    actorName: auth.token?.name || auth.token?.email || "",
    actorRole: role,
    action,
    resource,
    resourceId: data.resourceId || null,
    targetName: data.targetName || null,
    before: before ?? null,
    after: after ?? null,
    meta: data.meta ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
}
