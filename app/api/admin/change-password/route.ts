import { NextResponse } from "next/server";
import {
  changeUserPassword,
  ChangePasswordValidationError,
} from "@/services/admin/changePassword";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await changeUserPassword(body);

    return NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error: unknown) {
    if (error instanceof ChangePasswordValidationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";
    console.error("Error changing password:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
