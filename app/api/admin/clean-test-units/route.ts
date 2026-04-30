import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST() {
    try {
        const targets = ['unit01', 'unit2', 'unit3', 'ro4', 'UNIT001', 'UNIT002', 'UNIT003', 'UNIT004', 'UNIT005', 'UNIT006', 'UNIT007', 'UNIT008', 'UNIT009'];
        let usersDeleted = 0;
        let recordsDeleted = 0;

        console.log("Starting cleanup for units:", targets);

        // 1. Delete matching users
        const uSnap = await adminDb.collection("users").get();
        const userDocsToDelete = uSnap.docs.filter(doc => {
            const data = doc.data();
            const code = data.unit_code || data.unit;
            return targets.includes(code);
        });

        for (const doc of userDocsToDelete) {
            const uid = doc.id;
            try { 
                await adminAuth.deleteUser(uid); 
                console.log(`Deleted Auth Account: ${uid}`);
            } catch (e: any) {
                console.warn(`Auth Account ${uid} removal skipped: ${e.message}`);
            }
            await doc.ref.delete();
            usersDeleted++;
        }

        // 2. Delete matching records
        const rSnap = await adminDb.collection("vehicle_records").get();
        const recordDocsToDelete = rSnap.docs.filter(doc => {
            const data = doc.data();
            const code = data.unit_code || data.unit;
            return targets.includes(code);
        });

        for (const doc of recordDocsToDelete) {
            await doc.ref.delete();
            recordsDeleted++;
        }

        console.log(`Cleanup finished. Deleted ${usersDeleted} users and ${recordsDeleted} records.`);

        return NextResponse.json({
            success: true,
            message: "ล้างข้อมูลทดสอบเรียบร้อยแล้ว",
            summary: { usersDeleted, recordsDeleted }
        });
    } catch (error: any) {
        console.error("Cleanup Error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "เกิดข้อผิดพลาดในการล้างข้อมูล" 
        }, { status: 500 });
    }
}
