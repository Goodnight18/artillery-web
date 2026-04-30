"use client";

import React, { useState, useMemo } from "react";
import { Search, Eye, Edit2, Loader2, Car, XCircle, Trash2, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import { RecordData, getStatusBadgeClass, getStatusLabel, buildDisplayName } from "../types";
import { normalizePlateText } from "@/lib/plate/normalizePlateText";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteOldImageIfNeeded } from "@/lib/storageHelper";
import { writeAuditLog } from "@/lib/audit";

const formatDate = (timestamp: number) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

interface RecordTableProps {
    records: RecordData[];
    loading: boolean;
    onEdit: (record: RecordData) => void;
    onRefresh: () => void;
    onNextPage?: () => void;
    onPrevPage?: () => void;
    hasMore?: boolean;
    isFirstPage?: boolean;
    pageSize?: number;
}

export default function RecordTable({ 
    records, 
    loading, 
    onEdit, 
    onRefresh,
    onNextPage,
    onPrevPage,
    hasMore = false,
    isFirstPage = true,
    pageSize = 10
}: RecordTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleSearchFilter = useMemo(() => {
        if (!Array.isArray(records)) return [];
        if (!searchTerm.trim()) return records;
        
        const term = searchTerm.toLowerCase();
        const normalizedTerm = normalizePlateText(term);
        
        return records.filter(r => 
            (r.first_name || "").toLowerCase().includes(term) ||
            (r.last_name || "").toLowerCase().includes(term) ||
            (r.plateFullDisplay || (r as any).plate_no || "").toLowerCase().includes(term) ||
            (r.plateSearchKey || (r as any).plate_normalized || "").includes(normalizedTerm) ||
            (r.plateSearchKeyWithProvince || "").includes(normalizedTerm) ||
            (r.unit || "").toLowerCase().includes(term) ||
            (r.unit_code || "").toLowerCase().includes(term) ||
            ((r as any).unit_name_th || "").toLowerCase().includes(term) ||
            (r.created_by_name || "").toLowerCase().includes(term)
        );
    }, [records, searchTerm]);

    const toggleSelectAll = () => {
        if (selectedIds.size === handleSearchFilter.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(handleSearchFilter.map(r => r.record_id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleDelete = async (record: RecordData) => {
        if (!window.confirm(`ยืนยันการลบข้อมูลของ: ${buildDisplayName(record)}?\nการลบนี้จะลบไฟล์รูปภาพที่เกี่ยวข้องทั้งหมดและไม่สามารถกู้คืนได้`)) {
            return;
        }

        try {
            setDeletingId(record.record_id);
            
            // Cleanup images
            const imagePaths = [
                record.person_photo_path,
                (record as any).vehicle_photo_path,
                record.vehicle_photo_front_path,
                record.vehicle_photo_back_path
            ].filter(Boolean);

            for (const path of imagePaths) {
                await deleteOldImageIfNeeded(path);
            }

            // Delete Document
            await deleteDoc(doc(db, "vehicle_records", record.record_id));
            
            // --- AUDIT LOG ---
            await writeAuditLog({
                action: "DELETE_RECORD",
                resource: "vehicle_records",
                resourceId: record.record_id,
                targetName: `${record.plateFullDisplay || record.plateNumber} - ${buildDisplayName(record)}`,
                before: record
            }).catch(e => console.error("Audit log error:", e));
            
            onRefresh();
        } catch (error) {
            console.error("Error deleting record:", error);
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
            setDeletingId(null);
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedIds.size;
        if (count === 0) return;

        if (!window.confirm(`ยืนยันการลบข้อมูลที่เลือกทั้งหมด ${count} รายการ?\nการลบนี้จะไม่สามารถกู้คืนได้`)) {
            return;
        }

        try {
            setIsBulkDeleting(true);
            const idsToDelete = Array.from(selectedIds);
            
            // Sequential deletion to avoid hammering Firebase
            for (const id of idsToDelete) {
                const record = records.find(r => r.record_id === id);
                if (record) {
                    // Cleanup images
                    const imagePaths = [
                        record.person_photo_path,
                        (record as any).vehicle_photo_path,
                        record.vehicle_photo_front_path,
                        record.vehicle_photo_back_path
                    ].filter(Boolean);

                    for (const path of imagePaths) {
                        await deleteOldImageIfNeeded(path);
                    }
                    
                    await deleteDoc(doc(db, "vehicle_records", id));

                    // --- AUDIT LOG ---
                    await writeAuditLog({
                        action: "DELETE_RECORD",
                        resource: "vehicle_records",
                        resourceId: id,
                        targetName: `${record.plateFullDisplay || record.plateNumber} - ${buildDisplayName(record)}`,
                        before: record
                    }).catch(e => console.error("Audit log error:", e));
                }
            }
            
            setSelectedIds(new Set());
            onRefresh();
        } catch (error) {
            console.error("Bulk delete error:", error);
            alert("เกิดข้อผิดพลาดในการลบข้อมูลบางรายการ");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">รายการข้อมูลล่าสุด</h2>
                
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-left-2 transition-all">
                            <span className="text-xs font-bold text-blue-700">เลือก {selectedIds.size} รายการ</span>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting || deletingId !== null}
                                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-md text-[11px] font-bold hover:bg-red-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {isBulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash size={12} />}
                                ลบที่เลือก
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} className="text-blue-500 hover:text-blue-700 ml-1 transition-colors">
                                <XCircle size={16} />
                            </button>
                        </div>
                    )}
                    <div className="relative w-full sm:w-64 flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, ทะเบียน, หน่วย..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className="px-6 py-4 w-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.size > 0 && selectedIds.size === handleSearchFilter.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-4 font-medium">ทะเบียนรถ</th>
                            <th className="px-6 py-4 font-medium">ข้อมูลความสมบูรณ์</th>
                            <th className="px-6 py-4 font-medium">หน่วย</th>
                            <th className="px-6 py-4 font-medium">สถานะ</th>
                            <th className="px-6 py-4 font-medium">ผู้บันทึก</th>
                            <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin mb-3 text-blue-500" size={28} />
                                        <p>กำลังโหลดข้อมูล...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : handleSearchFilter.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Car className="text-gray-300 mb-2" size={32} />
                                        <p>ยังไม่มีข้อมูลที่คุณบันทึกไว้ หรือไม่พบข้อมูลที่ค้นหา</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            handleSearchFilter.map((record) => (
                                <tr key={record.record_id} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.has(record.record_id) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(record.record_id)}
                                            onChange={() => toggleSelect(record.record_id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {buildDisplayName(record)}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{record.person_type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{record.plateFullDisplay || (record as any).plate_no}</div>
                                        {!record.plateFullDisplay && (record as any).province && <div className="text-[11px] text-gray-500">{(record as any).province}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.is_complete ? (
                                            <span className="inline-flex items-center text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                สมบูรณ์
                                            </span>
                                        ) : (
                                            <div className="space-y-1">
                                                <span className="inline-flex items-center text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                    ข้อมูลไม่ครบ ({record.missing_fields?.length || 0})
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[11px] font-bold text-blue-700">{record.unit_code || record.unit || "-"}</div>
                                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]" title={(record as any).unit_name_th}>{ (record as any).unit_name_th || "-"}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(record.status)}`}>
                                            {getStatusLabel(record.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 text-xs font-semibold">{record.created_by_name}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(record.created_at)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEdit(record)} disabled={deletingId === record.record_id} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50" title="แก้ไข">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(record)} disabled={deletingId === record.record_id} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="ลบข้อมูล">
                                                {deletingId === record.record_id ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!searchTerm && (
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                        แสดง {records.length} รายการต่อหน้า
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPrevPage}
                            disabled={isFirstPage || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600 shadow-sm bg-white/50"
                            title="หน้าก่อนหน้า"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-blue-600 shadow-sm min-w-[60px] text-center">
                            {isFirstPage ? "หน้า 1" : "ถัดมา"}
                        </span>
                        <button
                            onClick={onNextPage}
                            disabled={!hasMore || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600 shadow-sm bg-white/50"
                            title="หน้าถัดไป"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
