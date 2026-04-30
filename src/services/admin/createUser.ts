import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export type CreateUserInput = {
  email?: string;
  password?: string;
  display_name?: string;
  unit?: string;
  unit_code?: string;
  unit_name_th?: string;
  role?: string;
  actorIdToken?: string;
};

type CreateUserResult = {
  uid: string;
};

export class CreateUserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateUserValidationError";
  }
}

function validateInput(input: CreateUserInput, unitCode: string) {
  if (!input.email || !input.email.includes("@")) {
    throw new CreateUserValidationError("รูปแบบอีเมลไม่ถูกต้อง");
  }
  if (!input.password || input.password.length < 6) {
    throw new CreateUserValidationError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  }
  if (!input.display_name?.trim()) {
    throw new CreateUserValidationError("กรุณากรอกชื่อหน่วย");
  }
  if (!unitCode.trim()) {
    throw new CreateUserValidationError("กรุณากรอกรหัสหน่วย");
  }
  if (!input.role) {
    throw new CreateUserValidationError("กรุณาระบุสิทธิ์");
  }
}

export async function createUserWithAudit(input: CreateUserInput): Promise<CreateUserResult> {
  const unitCode = input.unit || input.unit_code || "";
  validateInput(input, unitCode);

  let userRecord;
  try {
    userRecord = await adminAuth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.display_name,
    });
  } catch (error: unknown) {
    const createError = error as { code?: string };
    if (createError.code === "auth/email-already-exists" && input.email) {
      userRecord = await adminAuth.getUserByEmail(input.email);
      await adminAuth.updateUser(userRecord.uid, {
        password: input.password,
        displayName: input.display_name,
      });
    } else {
      throw error;
    }
  }

  const now = Date.now();
  await adminDb.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: input.email,
    display_name: input.display_name,
    unit: unitCode,
    unit_code: unitCode,
    unit_name_th: input.unit_name_th || input.display_name,
    role: input.role,
    status: "active",
    created_at: now,
    updated_at: now,
  });

  try {
    let actorEmail = "Unknown Admin";
    let actorUid = "system";
    let actorName = "Unknown Admin";

    if (input.actorIdToken) {
      const decodedToken = await adminAuth.verifyIdToken(input.actorIdToken);
      actorEmail = decodedToken.email || "Unknown Admin";
      actorUid = decodedToken.uid;
      actorName = actorEmail;

      const actorDoc = await adminDb.collection("users").doc(actorUid).get();
      if (actorDoc.exists) {
        actorName = actorDoc.data()?.display_name || actorEmail;
      }
    }

    await adminDb.collection("audit_logs").add({
      actorUid,
      actorEmail,
      actorName,
      actorRole: "admin",
      action: "create",
      resource: "users",
      resourceId: userRecord.uid,
      targetName: input.display_name,
      before: null,
      after: {
        email: input.email,
        display_name: input.display_name,
        role: input.role,
        unit_code: unitCode,
        unit_name_th: input.unit_name_th,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (auditError: unknown) {
    console.warn("Audit Log failed for user creation:", auditError);
  }

  return { uid: userRecord.uid };
}
