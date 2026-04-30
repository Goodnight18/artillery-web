import { adminAuth } from "@/lib/firebase-admin";

export type ChangePasswordInput = {
  uid?: string;
  newPassword?: string;
};

export class ChangePasswordValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChangePasswordValidationError";
  }
}

function validateInput(input: ChangePasswordInput) {
  if (!input.uid) {
    throw new ChangePasswordValidationError("กรุณาระบุ UID ของผู้ใช้");
  }
  if (!input.newPassword || input.newPassword.length < 8) {
    throw new ChangePasswordValidationError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  }
}

export async function changeUserPassword(input: ChangePasswordInput): Promise<void> {
  validateInput(input);

  await adminAuth.updateUser(input.uid!, {
    password: input.newPassword,
  });
}
