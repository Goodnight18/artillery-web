"use client";

import React, { useState, useEffect } from "react";
import { Loader2, History as HistoryIcon } from "lucide-react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit, where, startAfter, QueryDocumentSnapshot, doc, getDoc, or } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { RecordData } from "./types";
import RecordForm from "./components/RecordForm";
import RecordTable from "./components/RecordTable";
import RequirePagePermission from "@/lib/requirePagePermission";
import ClientLayout from "../components/ClientLayout";

export default function RecordsProductionPage() {
    return (
        <RequirePagePermission module="vehicles">
            <RecordsProductionContent />
        </RequirePagePermission>
    );
}

function RecordsProductionContent() {
    const { profile, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
    
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [records, setRecords] = useState<RecordData[]>([]);
    const [editingRecord, setEditingRecord] = useState<RecordData | null>(null);
    const [filter, setFilter] = useState<'all' | 'incomplete' | 'needs_revision'>('all');
    
    // Pagination states
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [pageStack, setPageStack] = useState<QueryDocumentSnapshot[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const PAGE_SIZE = 10;

    useEffect(() => {
        if (profile?.uid) {
            loadRecords();
        }
    }, [profile?.uid, filter]);

    const loadRecords = async (isNext = false) => {
        if (!profile?.uid) return;

        try {
            setLoadingRecords(true);
            const recordsRef = collection(db, "vehicle_records");
            
            // Handle Scoped Queries based on Role
            const conditions: any[] = [];
            
            if (!isSuperAdmin) {
                if (isAdmin) {
                    const unitCode = profile?.unit_code || profile?.unit || "";
                    // Admin sees records of their unit OR records they created manually
                    conditions.push(or(
                        where("unit_code", "==", unitCode),
                        where("created_by_uid", "==", profile?.uid)
                    ));
                } else {
                    conditions.push(where("created_by_uid", "==", profile?.uid));
                }
            }

            if (filter === 'incomplete') {
                conditions.push(where("is_complete", "==", false));
            } else if (filter === 'needs_revision') {
                conditions.push(where("status", "==", "needs_revision"));
            }

            let q = query(
                recordsRef, 
                ...conditions,
                orderBy("created_at", "desc"), 
                limit(PAGE_SIZE + 1) // Fetch one extra to check if there's a next page
            );

            if (isNext && lastVisible) {
                q = query(q, startAfter(lastVisible));
            } else {
                // Reset pagination for new filter or initial load
                setPageStack([]);
            }

            const snapshot = await getDocs(q);
            const docs = snapshot.docs;
            
            const fetchedRecords: RecordData[] = [];
            const displayDocs = docs.slice(0, PAGE_SIZE);
            
            displayDocs.forEach((doc) => {
                fetchedRecords.push({ record_id: doc.id, ...doc.data() } as RecordData);
            });
            
            setRecords(fetchedRecords);
            setHasMore(docs.length > PAGE_SIZE);
            
            if (displayDocs.length > 0) {
                const nextLastVisible = displayDocs[displayDocs.length - 1];
                setLastVisible(nextLastVisible);
                
                if (isNext) {
                    setPageStack(prev => [...prev, lastVisible!]);
                }
            }
        } catch (error) {
            console.error("Error fetching records:", error);
        } finally {
            setLoadingRecords(false);
            setIsInitialLoad(false);
        }
    };

    const handleNextPage = () => {
        if (hasMore && !loadingRecords) {
            loadRecords(true);
        }
    };

    const handlePrevPage = async () => {
        if (pageStack.length === 0 || loadingRecords) {
            // If already on first page, just reload first page
            loadRecords(false);
            return;
        }

        const newStack = [...pageStack];
        newStack.pop(); // Remove current page's marker
        const prevMarker = newStack.length > 0 ? newStack[newStack.length - 1] : null;
        
        try {
            setLoadingRecords(true);
            const recordsRef = collection(db, "vehicle_records");
            const conditions: any[] = [];
            
            if (!isSuperAdmin) {
                if (isAdmin) {
                    const unitCode = profile?.unit_code || profile?.unit || "";
                    conditions.push(or(
                        where("unit_code", "==", unitCode),
                        where("created_by_uid", "==", profile?.uid)
                    ));
                } else {
                    conditions.push(where("created_by_uid", "==", profile?.uid));
                }
            }

            if (filter === 'incomplete') {
                conditions.push(where("is_complete", "==", false));
            } else if (filter === 'needs_revision') {
                conditions.push(where("status", "==", "needs_revision"));
            }

            let q = query(
                recordsRef, 
                ...conditions,
                orderBy("created_at", "desc"), 
                limit(PAGE_SIZE + 1)
            );

            if (prevMarker) {
                q = query(q, startAfter(prevMarker));
            }

            const snapshot = await getDocs(q);
            const docs = snapshot.docs;
            const displayDocs = docs.slice(0, PAGE_SIZE);
            
            const fetchedRecords: RecordData[] = displayDocs.map(doc => ({ record_id: doc.id, ...doc.data() } as RecordData));
            
            setRecords(fetchedRecords);
            setHasMore(docs.length > PAGE_SIZE);
            setLastVisible(displayDocs[displayDocs.length - 1]);
            setPageStack(newStack);
        } catch (error) {
            console.error("Prev page error:", error);
        } finally {
            setLoadingRecords(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <RequirePagePermission module="vehicles">
            <ClientLayout>
                <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        
                        {/* Header Sub-section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูล</h1>
                                <p className="text-sm text-gray-500 mt-1">เพิ่มข้อมูลรถและบุคคลใหม่ และดูรายการเข้า-ออกล่าสุด {isSuperAdmin ? "ทุกหน่วยงาน" : (isAdmin ? `หน่วยงาน: ${profile?.unit_name_th || profile?.unit_code}` : "ที่คุณบันทึก")}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <Link 
                                    href="/records/approved-by-unit"
                                    className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-sm"
                                >
                                    <HistoryIcon size={18} className="mr-2" />
                                    ดูบันทึกที่อนุมัติแล้ว
                                </Link>

                                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                    <button 
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        ทั้งหมด
                                    </button>
                                    <button 
                                        onClick={() => setFilter('incomplete')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'incomplete' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        ข้อมูลไม่ครบ
                                    </button>
                                    <button 
                                        onClick={() => setFilter('needs_revision')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'needs_revision' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        รอสับเปลี่ยน
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Form Card Component */}
                        <RecordForm 
                            initialData={editingRecord}
                            onCancelEdit={() => setEditingRecord(null)}
                            onSuccess={() => { setEditingRecord(null); loadRecords(); }} 
                        />

                        {/* Section 2: Table Card Component */}
                        <RecordTable 
                            records={records} 
                            loading={loadingRecords} 
                            onEdit={(record) => setEditingRecord(record)}
                            onRefresh={() => loadRecords(false)}
                            onNextPage={handleNextPage}
                            onPrevPage={handlePrevPage}
                            hasMore={hasMore}
                            isFirstPage={pageStack.length === 0}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                </div>
            </ClientLayout>
        </RequirePagePermission>
    );
}
