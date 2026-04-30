import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        // 1. Verify Authentication
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, message: "Unauthorized: Missing Token" }, { status: 401 });
        }
        
        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (error) {
            return NextResponse.json({ success: false, message: "Unauthorized: Invalid Token" }, { status: 401 });
        }

        const uid = decodedToken.uid;

        // 2. Verify Admin Role
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ success: false, message: "Forbidden: User not found" }, { status: 403 });
        }

        const userData = userDoc.data();
        if (userData?.role !== "admin" && userData?.role !== "super_admin") {
            return NextResponse.json({ success: false, message: "Forbidden: Admins only" }, { status: 403 });
        }

        // 3. Parse Request
        const body = await request.json();
        const { recordIds } = body;

        if (!Array.isArray(recordIds) || recordIds.length === 0) {
            return NextResponse.json({ success: false, message: "Bad Request: No record IDs provided" }, { status: 400 });
        }

        const approvedByName = userData.display_name || userData.displayName || "Admin";

        // 4. Chunk & Batch Update
        let totalUpdated = 0;
        let failed = 0;
        const batches: string[][] = [];
        const BATCH_SIZE = 400; // Firestore batch limit is 500

        for (let i = 0; i < recordIds.length; i += BATCH_SIZE) {
            batches.push(recordIds.slice(i, i + BATCH_SIZE));
        }

        for (const chunk of batches) {
            const batch = adminDb.batch();
            const now = Date.now();

            chunk.forEach(id => {
                const ref = adminDb.collection("vehicle_records").doc(id);
                batch.update(ref, {
                    status: "approved",
                    approved_at: now,
                    approved_by_uid: uid,
                    approved_by_name: approvedByName,
                    updated_at: now,
                    updated_by_uid: uid,
                    updated_by_name: approvedByName
                });
            });

            try {
                await batch.commit();
                totalUpdated += chunk.length;
            } catch (err) {
                console.error("Batch update chunk failed:", err);
                failed += chunk.length;
            }
        }

        return NextResponse.json({
            success: true,
            totalUpdated,
            failed
        });

    } catch (error: any) {
        console.error("Bulk approve error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
