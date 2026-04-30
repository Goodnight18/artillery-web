import { NextResponse } from "next/server";
import {
  createUserWithAudit,
  CreateUserValidationError,
} from "@/services/admin/createUser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("Authorization");
    const actorIdToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : undefined;

    const result = await createUserWithAudit({
      ...body,
      actorIdToken,
    });

    return NextResponse.json({
      success: true,
      message: "สร้างผู้ใช้สำเร็จ",
      uid: result.uid,
    });
  } catch (error: unknown) {
    if (error instanceof CreateUserValidationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสร้างผู้ใช้";
    console.error("Error creating user:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
