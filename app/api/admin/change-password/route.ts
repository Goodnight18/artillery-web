import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, newPassword } = body;

        // 1. validate input
        if (!uid) {
            return NextResponse.json({ success: false, message: "กรุณาระบุ UID ของผู้ใช้" }, { status: 400 });
        }
        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
        }

        // 2. Overriding Password with Firebase Admin Auth
        await adminAuth.updateUser(uid, {
            password: newPassword,
        });

        // 3. Return success response
        return NextResponse.json({
            success: true,
            message: "เปลี่ยนรหัสผ่านสำเร็จ"
        });

    } catch (error: any) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { success: false, message: error.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" },
            { status: 500 }
        );
    }
}
