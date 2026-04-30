"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, limit, where } from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "@/context/AuthContext";
import { RecordData } from "../types";
import { AUTHORIZED_UNITS } from "../constants/units";
import { processUnitSummary, UnitSummaryItem } from "@/lib/records/processUnitSummary";
import { useCachedUnitSummaries } from "@/hooks/useCachedUnitSummaries";
import RequirePagePermission from "@/lib/requirePagePermission";
import ClientLayout from "../../components/ClientLayout";
import UnitSelectorGrid from "./components/UnitSelectorGrid";
import UnitRecordDetailTable from "./components/UnitRecordDetailTable";
import BulkApproveButton from "./components/BulkApproveButton";
import { 
    LayoutDashboard, 
    ChevronLeft, 
    Building2, 
    Search, 
    RefreshCcw, 
    Loader2, 
    AlertCircle, 
    CheckCircle, 
    FileText,
    History
} from "lucide-react";

interface VisitorUnit {
    id: string;
    code: string;
    name_th: string;
}

function UnitReviewContent() {
    const { profile } = useAuth();
    // Detailed data for selected unit
    const [records, setRecords] = useState<RecordData[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    
    // Cached 1-minute TTL Summary Aggregator
    const { summaries: unitsSummary, loading: loadingUnits, error, refetch: fetchSummaries } = useCachedUnitSummaries();

    // Selected Unit state
    const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(null);

    // Filter items to show only those with actionable records
    const actionableSummaries = useMemo(() => {
        return unitsSummary.filter(item => item.pendingRecords > 0 || item.incompleteRecords > 0);
    }, [unitsSummary]);

    // Phase 2: Fetch FULL history for the selected unit
    useEffect(() => {
        if (!selectedUnitCode) {
            setRecords([]);
            return;
        }

        setLoadingRecords(true);
        const q = query(
            collection(db, "vehicle_records"), 
            where("unit_code", "==", selectedUnitCode),
            orderBy("created_at", "desc"),
            limit(1000) 
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: RecordData[] = snapshot.docs.map(doc => ({
                record_id: doc.id,
                ...doc.data()
            } as RecordData));
            setRecords(list);
            setLoadingRecords(false);
        }, (err) => {
            console.error("Fetch unit detail error:", err);
            setLoadingRecords(false);
        });

        return () => unsubscribe();
    }, [selectedUnitCode]);

    const selectedUnitInfo = useMemo(() => {
        const info = unitsSummary.find(u => u.unit_code === selectedUnitCode);

        // Fallback to locally calculating if somehow it's missing from unitsSummary 
        const stats = info || processUnitSummary(records)[selectedUnitCode || ""];

        return {
            unit_code: selectedUnitCode,
            unit_name_th: stats?.unit_name_th || selectedUnitCode,
            totalRecords: stats?.totalRecords || 0,
            pendingRecords: stats?.pendingRecords || 0,
            completeRecords: stats?.completeRecords || 0,
            incompleteRecords: stats?.incompleteRecords || 0,
        };
    }, [unitsSummary, selectedUnitCode, records]);

    if (loadingUnits) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="text-slate-500 font-medium">กำลังโหลดรายชื่อหน่วยงาน...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 p-12 text-center rounded-3xl border border-rose-100 max-w-2xl mx-auto my-12">
                <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold text-rose-900 mb-2">เกิดข้อผิดพลาด</h2>
                <p className="text-rose-700">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold"
                >
                    ลองอีกครั้ง
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <LayoutDashboard className="text-blue-600" />
                        ตรวจสอบข้อมูลรายหน่วย
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {selectedUnitCode 
                            ? `กำลังแสดงข้อมูลของหน่วย: ${selectedUnitInfo.unit_name_th}`
                            : "เลือกหน่วยงานเพื่อตรวจสอบความครบถ้วนและอนุมัติข้อมูล"
                        }
                    </p>
                </div>
                {selectedUnitCode && (
                    <button 
                        onClick={() => setSelectedUnitCode(null)}
                        className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
                    >
                        <ChevronLeft size={20} />
                        กลับไปเลือกหน่วย
                    </button>
                )}
            </div>

            {/* Main Views */}
            {!selectedUnitCode ? (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-snug">
                                หน่วยที่ต้องตรวจสอบข้อมูล
                            </h2>
                            <p className="text-sm md:text-base text-gray-500 font-medium mt-1">
                                เลือกหน่วยที่ระบุว่ามีข้อมูลแบบร่างหรือรอการตรวจสอบอยู่
                            </p>
                        </div>
                        <button 
                            onClick={fetchSummaries}
                            disabled={loadingUnits}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors bg-white font-medium text-sm disabled:opacity-50"
                        >
                            <RefreshCcw size={18} className={loadingUnits ? "animate-spin text-blue-500" : ""} />
                            <span className="hidden sm:inline">รีเฟรชข้อมูล (1 นาที Cache)</span>
                        </button>
                    </div>

                    {actionableSummaries.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <Search className="text-slate-300 mx-auto mb-4" size={48} />
                            <p className="text-slate-500 font-bold">ไม่พบหน่วยงานที่มีข้อมูลคงค้างที่ต้องดำเนินการ (Review/Revision)</p>
                        </div>
                    ) : (
                        <UnitSelectorGrid 
                            units={actionableSummaries} 
                            onSelectUnit={setSelectedUnitCode} 
                        />
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-400">
                    {loadingRecords ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <p className="text-slate-500 font-medium">กำลังดึงข้อมูลบันทึกของหน่วย...</p>
                        </div>
                    ) : (
                        <>
                            {/* Unit Detail Header */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] shadow-xl text-white flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30">
                                        <Building2 size={40} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">{selectedUnitCode}</div>
                                        <h1 className="text-3xl font-black">{selectedUnitInfo?.unit_name_th}</h1>
                                        <div className="flex gap-4 mt-3">
                                            <div className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold">ทั้งหมด: {selectedUnitInfo?.totalRecords}</div>
                                            <div className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-emerald-300">รอตรวจ: {selectedUnitInfo?.pendingRecords}</div>
                                            <div className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-rose-300">ไม่ครบ: {selectedUnitInfo?.incompleteRecords}</div>
                                        </div>
                                    </div>
                                </div>
                                <BulkApproveButton 
                                    records={records} 
                                    onSuccess={() => {}} 
                                />
                            </div>

                            <UnitRecordDetailTable 
                                records={records} 
                                onUpdate={() => {}} 
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ReviewByUnitPage() {
    return (
        <RequirePagePermission module="users">
            <ClientLayout>
                <UnitReviewContent />
            </ClientLayout>
        </RequirePagePermission>
    );
}
