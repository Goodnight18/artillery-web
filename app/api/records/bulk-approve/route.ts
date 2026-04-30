import { NextResponse } from "next/server";
import { bulkApproveRecords, BulkApproveError } from "@/services/records/bulkApprove";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : undefined;
    const body = await request.json();

    const result = await bulkApproveRecords({
      idToken,
      recordIds: body?.recordIds,
    });

    return NextResponse.json({
      success: true,
      totalUpdated: result.totalUpdated,
      failed: result.failed,
    });
  } catch (error: unknown) {
    if (error instanceof BulkApproveError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Bulk approve error:", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
