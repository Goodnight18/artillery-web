import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, display_name, unit, unit_name_th, role } = body;
        const unit_code = unit || body.unit_code;

        // 1. validate input
        if (!email || !email.includes("@")) {
            return NextResponse.json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
        }
        if (!password || password.length < 6) {
            return NextResponse.json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
        }
        if (!display_name?.trim()) {
            return NextResponse.json({ success: false, message: "กรุณากรอกชื่อหน่วย" }, { status: 400 });
        }
        if (!unit_code?.trim()) {
            return NextResponse.json({ success: false, message: "กรุณากรอกรหัสหน่วย" }, { status: 400 });
        }
        if (!role) {
            return NextResponse.json({ success: false, message: "กรุณาระบุสิทธิ์" }, { status: 400 });
        }

        // 2. Create User in Firebase Auth
        let userRecord;
        try {
            userRecord = await adminAuth.createUser({
                email,
                password,
                displayName: display_name,
            });
        } catch (createError: any) {
            if (createError.code === "auth/email-already-exists") {
                // Recover orphaned Auth user if deleted only from Firestore but still lingering
                userRecord = await adminAuth.getUserByEmail(email);
                await adminAuth.updateUser(userRecord.uid, {
                    password,
                    displayName: display_name,
                });
            } else {
                throw createError; // Re-throw other errors normally
            }
        }

        // 3. Save User Data in Firestore
        const userData = {
            uid: userRecord.uid,
            email: email,
            display_name: display_name,
            unit: unit_code,
            unit_code: unit_code,
            unit_name_th: unit_name_th || display_name,
            role: role,
            status: "active",
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        await adminDb.collection("users").doc(userRecord.uid).set(userData);
        
        // 4. Write Audit Log
        try {
            const authHeader = request.headers.get("Authorization");
            let actorEmail = "Unknown Admin";
            let actorUid = "system";
            let actorName = "Unknown Admin";
            
            if (authHeader?.startsWith("Bearer ")) {
                const idToken = authHeader.split("Bearer ")[1];
                const decodedToken = await adminAuth.verifyIdToken(idToken);
                actorEmail = decodedToken.email || "Unknown Admin";
                actorUid = decodedToken.uid;
                actorName = actorEmail;

                // Attempt to fetch display name from Firestore
                const actorDoc = await adminDb.collection("users").doc(actorUid).get();
                if (actorDoc.exists) {
                    actorName = actorDoc.data()?.display_name || actorEmail;
                }
            }

            await adminDb.collection("audit_logs").add({
                actorUid,
                actorEmail,
                actorName,
                actorRole: "admin", // Page level permission already implies this
                action: "create",
                resource: "users",
                resourceId: userRecord.uid,
                targetName: display_name,
                before: null,
                after: { 
                    email, 
                    display_name, 
                    role, 
                    unit_code, 
                    unit_name_th 
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (auditError) {
            console.warn("Audit Log failed for user creation:", auditError);
        }

        // 5. Return success response
        return NextResponse.json({
            success: true,
            message: "สร้างผู้ใช้สำเร็จ",
            uid: userRecord.uid
        });

    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้" },
            { status: 500 }
        );
    }
}
