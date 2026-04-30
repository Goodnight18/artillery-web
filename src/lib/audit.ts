import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export type AuditPayload = {
  action: string;
  resource: string;
  resourceId?: string;
  targetName?: string;
  before?: any;
  after?: any;
  meta?: any;
};

export async function writeAuditLog(payload: AuditPayload) {
  try {
    const fn = httpsCallable(functions, "writeAuditLog");
    await fn(payload);
  } catch (err) {
    console.error("AuditLog error:", err);
    // Fail silently to the user, but log to console
  }
}