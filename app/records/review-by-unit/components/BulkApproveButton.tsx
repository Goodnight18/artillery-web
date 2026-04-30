"use client";

import React, { useState } from "react";
import { RecordData } from "../../types";
import { bulkApproveRecords } from "@/lib/records/bulkApproveRecords";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, Loader2, AlertTriangle, X } from "lucide-react";

interface Props {
    records: RecordData[];
    onSuccess: () => void;
}

export default function BulkApproveButton({ records, onSuccess }: Props) {
    const { profile } = useAuth();
    const [isConfirming, setIsConfirming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const eligible = records.filter(r => 
        (r.status === "pending_review" || r.status === "draft") && 
        r.is_complete === true
    );

    const handleApprove = async () => {
        if (!profile?.uid || isProcessing) return;

        setIsProcessing(true);
        try {
            const result = await bulkApproveRecords(eligible, {
                uid: profile.uid,
                name: profile.display_name || profile.displayName || "Admin"
            });
            
            alert(`ดำเนินการสำเร็จ: อนุมัติสำเร็จ ${result.totalUpdated} รายการ` + (result.failed > 0 ? ` (ล้มเหลว ${result.failed} รายการ)` : ""));
            onSuccess();
            setIsConfirming(false);
        } catch (error) {
            console.error("Bulk approve error:", error);
            alert("เกิดข้อผิดพลาดในการอนุมัติข้อมูล");
        } finally {
            setIsProcessing(false);
        }
    };

    if (eligible.length === 0) return null;

    return (
        <>
            <button
                onClick={() => setIsConfirming(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all text-sm"
            >
                <CheckCircle2 size={18} />
                อนุมัติข้อมูลที่ครบถ้วน ({eligible.length} รายการ)
            </button>

            {isConfirming && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3">ยืนยันการอนุมัติข้อมูล</h3>
                            <p className="text-slate-500 leading-relaxed">
                                คุณกำลังจะอนุมัติข้อมูลจำนวน <strong className="text-emerald-600">{eligible.length} รายการ</strong><br/>
                                ที่มีสถานะ <strong>"รอตรวจสอบ"</strong> และ <strong>"ข้อมูลครบถ้วน"</strong><br/>
                                <span className="text-xs text-rose-500 mt-2 block font-medium">* รายการที่ไม่ครบถ้วนจะไม่ถูกแก้ไข</span>
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 flex gap-3">
                            <button
                                onClick={() => setIsConfirming(false)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                {isProcessing ? "กำลังส่งคำขอ..." : "ยืนยันอนุมัติ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
