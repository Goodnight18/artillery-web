"use client";

import React, { useMemo, useState } from "react";
import { RecordData, getStatusBadgeClass, buildDisplayName } from "../../types";
import { Filter, User, Calendar, CheckCircle2, AlertTriangle, Image as ImageIcon, Eye, Check, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RecordReviewModal from "./RecordReviewModal";

interface Props {
    records: RecordData[];
    onUpdate: () => void;
}

type FilterType = "all" | "pending" | "approved" | "complete" | "incomplete" | "missing_photo";

export default function UnitRecordDetailTable({ records, onUpdate }: Props) {
    const { profile } = useAuth();
    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
        switch (filter) {
            case "pending": return records.filter(r => r.status === "pending_review" || r.status === "draft");
            case "approved": return records.filter(r => r.status === "approved");
            case "complete": return records.filter(r => r.is_complete === true);
            case "incomplete": return records.filter(r => r.is_complete === false);
            case "missing_photo": return records.filter(r => 
                !r.person_photo_url || !r.vehicle_photo_front_url || !r.vehicle_photo_back_url
            );
            default: return records;
        }
    }, [records, filter]);

    const handleQuickApprove = async (e: React.MouseEvent, record: RecordData) => {
        e.stopPropagation();
        if (!profile?.uid || processingId) return;
        
        setProcessingId(record.record_id);
        try {
            const ref = doc(db, "vehicle_records", record.record_id);
            await updateDoc(ref, {
                status: "approved",
                approved_at: Date.now(),
                approved_by_uid: profile.uid,
                approved_by_name: profile.display_name || profile.displayName || "Admin",
                updated_at: Date.now(),
                updated_by_uid: profile.uid,
                updated_by_name: profile.display_name || profile.displayName || "Admin"
            });
            onUpdate();
        } catch (error) {
            console.error("Quick approve error:", error);
            alert("ไม่สามารถอนุมัติข้อมูลได้");
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500 border-r border-slate-200 mr-2">
                    <Filter size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">ตัวกรอง</span>
                </div>
                {[
                    { id: "all", label: "ทั้งหมด", count: records.length },
                    { id: "pending", label: "รอตรวจ", count: records.filter(r => r.status === "pending_review" || r.status === "draft").length },
                    { id: "approved", label: "อนุมัติแล้ว", count: records.filter(r => r.status === "approved").length },
                    { id: "complete", label: "ข้อมูลครบ", count: records.filter(r => r.is_complete === true).length },
                    { id: "incomplete", label: "ไม่ครบ", count: records.filter(r => r.is_complete === false).length },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as FilterType)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            filter === f.id 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {f.label} ({f.count})
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ทะเบียนรถ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ชื่อบุคคล / ประเภท</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ความสมบูรณ์</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">สถานะ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">บันทึกเมื่อ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">ไม่พบรายการข้อมูลในหมวดนี้</td>
                                </tr>
                            ) : (
                                filteredRecords.map((r) => (
                                    <tr 
                                        key={r.record_id} 
                                        onClick={() => setSelectedRecord(r)}
                                        className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{r.plateFullDisplay || r.plateNumber}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{r.plateProvince || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                                                    {r.person_photo_url ? (
                                                        <img src={r.person_photo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : <User size={14} />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{buildDisplayName(r)}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium">{r.person_type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {r.is_complete ? (
                                                <div className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    <CheckCircle2 size={12} />
                                                    <span className="text-[10px]">สมบูรณ์</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex flex-col items-center">
                                                    <div className="flex items-center gap-1 text-rose-500 mb-1">
                                                        <AlertTriangle size={12} />
                                                        <span className="text-[10px] font-bold">ไม่ครบ ({r.missing_fields?.length || 0})</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-widest ${getStatusBadgeClass(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] text-slate-500">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{formatDate(r.created_at)}</span>
                                                <span className="text-[9px] opacity-70">โดย {r.created_by_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {(r.status === 'pending_review' || r.status === 'draft') && (
                                                    <button 
                                                        disabled={!!processingId}
                                                        onClick={(e) => handleQuickApprove(e, r)}
                                                        className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center border border-emerald-100 disabled:opacity-50"
                                                        title="อนุมัติทันที"
                                                    >
                                                        {processingId === r.record_id ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); }}
                                                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-blue-100"
                                                    title="ตรวจสอบละเอียด"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRecord && (
                <RecordReviewModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
}
