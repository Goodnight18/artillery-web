import { NextResponse } from "next/server";
import { cleanTestUnits } from "@/services/admin/cleanTestUnits";

export async function POST() {
  try {
    const summary = await cleanTestUnits();
    return NextResponse.json({
      success: true,
      message: "ล้างข้อมูลทดสอบเรียบร้อยแล้ว",
      summary,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการล้างข้อมูล";
    console.error("Cleanup Error:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
