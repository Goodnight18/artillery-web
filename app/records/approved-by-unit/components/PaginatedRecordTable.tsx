"use client";

import React, { useState } from "react";
import { RecordData, getStatusBadgeClass, buildDisplayName } from "../../types";
import { 
    User, 
    Calendar, 
    CheckCircle2, 
    AlertTriangle, 
    Eye, 
    ChevronLeft, 
    ChevronRight,
    Search,
    FileText
} from "lucide-react";
import RecordReviewModal from "../../review-by-unit/components/RecordReviewModal";

interface Props {
    records: RecordData[];
    onRefresh: () => void;
    onNextPage: () => void;
    onPrevPage: () => void;
    hasMore: boolean;
    isFirstPage: boolean;
    loading: boolean;
    pageSize: number;
}

export default function PaginatedRecordTable({ 
    records, 
    onRefresh, 
    onNextPage, 
    onPrevPage, 
    hasMore, 
    isFirstPage,
    loading,
    pageSize
}: Props) {
    const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ทะเบียนรถ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ชื่อบุคคล / ประเภท</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ความสมบูรณ์</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">สถานะ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">วันที่ได้รับการอนุมัติ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ดูข้อมูล</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">กำลังโหลดข้อมูล...</td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">ไม่พบรายการข้อมูลที่อนุมัติแล้ว</td>
                                </tr>
                            ) : (
                                records.map((r) => (
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
                                                <div className="inline-flex items-center gap-1 text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                                    <AlertTriangle size={12} />
                                                    <span className="text-[10px]">ไม่ครบ</span>
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
                                                <span className="font-bold text-slate-700">{formatDate(r.updated_at || r.created_at)}</span>
                                                <span className="text-[9px] opacity-70">อนุมัติโดย {(r as any).approved_by_name || "ระบบ"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-blue-100 mx-auto"
                                                title="ดูข้อมูล"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="text-sm font-medium text-slate-500">
                        แสดง {records.length} รายการ (20 รายการต่อหน้า)
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            disabled={isFirstPage || loading}
                            onClick={(e) => { e.stopPropagation(); onPrevPage(); }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
                        >
                            <ChevronLeft size={16} />
                            ก่อนหน้า
                        </button>
                        <button 
                            disabled={!hasMore || loading}
                            onClick={(e) => { e.stopPropagation(); onNextPage(); }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
                        >
                            ถัดไป
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedRecord && (
                <RecordReviewModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)}
                    onUpdate={onRefresh}
                />
            )}
        </div>
    );
}
