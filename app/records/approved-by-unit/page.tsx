"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, limit, where, getDocs, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RecordData } from "../types";
import { processUnitSummary, UnitSummaryItem } from "@/lib/records/processUnitSummary";
import RequirePagePermission from "@/lib/requirePagePermission";
import ClientLayout from "../../components/ClientLayout";
import UnitSelectorGrid from "../review-by-unit/components/UnitSelectorGrid";
import PaginatedRecordTable from "./components/PaginatedRecordTable";
import { 
    History, 
    ChevronLeft, 
    Building2, 
    Search, 
    Loader2, 
    AlertCircle, 
    CheckCircle,
    LayoutDashboard
} from "lucide-react";

function ApprovedByUnitContent() {
    const { profile, isSuperAdmin } = useAuth();
    const [unitsSummary, setUnitsSummary] = useState<UnitSummaryItem[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(true);
    const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(null);

    // Records Pagination States
    const [records, setRecords] = useState<RecordData[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [pageStack, setPageStack] = useState<QueryDocumentSnapshot[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    // Phase 1: Fetch units that have approved records
    useEffect(() => {
        setLoadingUnits(true);
        // Only fetch a sample to identify units with approved records
        const q = query(
            collection(db, "vehicle_records"), 
            where("status", "==", "approved"),
            orderBy("created_at", "desc"),
            limit(1000) 
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: RecordData[] = snapshot.docs.map(doc => ({
                record_id: doc.id,
                ...doc.data()
            } as RecordData));
            
            const summaryMap = processUnitSummary(list);
            setUnitsSummary(Object.values(summaryMap).filter(u => u.approvedRecords > 0));
            setLoadingUnits(false);
        }, (err) => {
            console.error("Fetch units error:", err);
            setLoadingUnits(false);
        });

        return () => unsubscribe();
    }, []);

    // Phase 2: Fetch Detail with Pagination
    useEffect(() => {
        if (selectedUnitCode) {
            loadRecords();
        } else {
            setRecords([]);
            setPageStack([]);
            setLastVisible(null);
        }
    }, [selectedUnitCode]);

    const loadRecords = async (isNext = false) => {
        if (!selectedUnitCode) return;

        try {
            setLoadingRecords(true);
            const recordsRef = collection(db, "vehicle_records");
            
            let q = query(
                recordsRef, 
                where("unit_code", "==", selectedUnitCode),
                where("status", "==", "approved"),
                orderBy("created_at", "desc"), 
                limit(PAGE_SIZE + 1)
            );

            if (isNext && lastVisible) {
                q = query(q, startAfter(lastVisible));
            } else {
                setPageStack([]);
            }

            const snapshot = await getDocs(q);
            const docs = snapshot.docs;
            
            const fetchedRecords: RecordData[] = docs.slice(0, PAGE_SIZE).map(doc => ({
                record_id: doc.id,
                ...doc.data()
            } as RecordData));
            
            setRecords(fetchedRecords);
            setHasMore(docs.length > PAGE_SIZE);
            
            if (docs.length > 0) {
                const nextLastVisible = docs[Math.min(docs.length - 1, PAGE_SIZE - 1)];
                setLastVisible(nextLastVisible);
                
                if (isNext) {
                    setPageStack(prev => [...prev, lastVisible!]);
                }
            }
        } catch (error) {
            console.error("Error fetching approved records:", error);
        } finally {
            setLoadingRecords(false);
        }
    };

    const handleNextPage = () => {
        if (hasMore && !loadingRecords) {
            loadRecords(true);
        }
    };

    const handlePrevPage = async () => {
        if (pageStack.length === 0 || loadingRecords) {
            loadRecords(false);
            return;
        }

        const newStack = [...pageStack];
        newStack.pop(); 
        const prevMarker = newStack.length > 0 ? newStack[newStack.length - 1] : null;
        
        try {
            setLoadingRecords(true);
            const recordsRef = collection(db, "vehicle_records");
            let q = query(
                recordsRef, 
                where("unit_code", "==", selectedUnitCode),
                where("status", "==", "approved"),
                orderBy("created_at", "desc"), 
                limit(PAGE_SIZE + 1)
            );

            if (prevMarker) {
                q = query(q, startAfter(prevMarker));
            }

            const snapshot = await getDocs(q);
            const docs = snapshot.docs;
            const fetchedRecords: RecordData[] = docs.slice(0, PAGE_SIZE).map(doc => ({ 
                record_id: doc.id, 
                ...doc.data() 
            } as RecordData));
            
            setRecords(fetchedRecords);
            setHasMore(docs.length > PAGE_SIZE);
            setLastVisible(docs[Math.min(docs.length - 1, PAGE_SIZE - 1)]);
            setPageStack(newStack);
        } catch (error) {
            console.error("Prev page error:", error);
        } finally {
            setLoadingRecords(false);
        }
    };

    const selectedUnitName = useMemo(() => {
        return unitsSummary.find(u => u.unit_code === selectedUnitCode)?.unit_name_th || selectedUnitCode;
    }, [unitsSummary, selectedUnitCode]);

    if (loadingUnits) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
                <p className="text-slate-500 font-medium">กำลังโหลดรายชื่อหน่วยงาน...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <History className="text-emerald-600" />
                        ตรวจสอบข้อมูลอนุมัติแล้ว
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {selectedUnitCode 
                            ? `แสดงประวัติข้อมูลที่อนุมัติแล้วของหน่วย: ${selectedUnitName}`
                            : "เลือกหน่วยงานเพื่อเรียกดูประวัติข้อมูลรถและบุคคลที่ได้รับอนุมัติแล้ว"
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
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900">ค้นหาตามหน่วยงาน</h2>
                    </div>
                    
                    {unitsSummary.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                            <Search className="text-slate-300 mx-auto mb-4" size={48} />
                            <p className="text-slate-500 font-bold">ไม่พบหน่วยงานที่มีข้อมูลได้รับการอนุมัติ</p>
                        </div>
                    ) : (
                        <UnitSelectorGrid 
                            units={unitsSummary} 
                            onSelectUnit={setSelectedUnitCode} 
                        />
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-400">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2rem] shadow-xl text-white flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30">
                                <Building2 size={40} />
                            </div>
                            <div>
                                <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">{selectedUnitCode}</div>
                                <h1 className="text-3xl font-black">{selectedUnitName}</h1>
                                <div className="flex gap-4 mt-3">
                                    <div className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold text-emerald-100 flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        อนุมัติแล้ว
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-center min-w-[120px]">
                            <div className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">สถานะปัจจุบัน</div>
                            <div className="text-xl font-black">History Mode</div>
                        </div>
                    </div>

                    <PaginatedRecordTable 
                        records={records} 
                        onRefresh={() => loadRecords(false)} 
                        onNextPage={handleNextPage}
                        onPrevPage={handlePrevPage}
                        hasMore={hasMore}
                        isFirstPage={pageStack.length === 0}
                        loading={loadingRecords}
                        pageSize={PAGE_SIZE}
                    />
                </div>
            )}
        </div>
    );
}

export default function ApprovedByUnitPage() {
    return (
        <RequirePagePermission module="users">
            <ClientLayout>
                <ApprovedByUnitContent />
            </ClientLayout>
        </RequirePagePermission>
    );
}
