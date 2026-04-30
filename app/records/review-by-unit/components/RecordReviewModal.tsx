"use client";

import React, { useState } from "react";
import { RecordData, getStatusBadgeClass, buildDisplayName } from "../../types";
import { 
    X, CheckCircle2, AlertTriangle, User, Car, 
    Calendar, MapPin, Phone, Info, Loader2,
    Eye, ChevronRight, Hash, AlertCircle,
    Image as ImageIcon
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { writeAuditLog } from "@/lib/audit";

interface Props {
    record: RecordData;
    onClose: () => void;
    onUpdate: () => void;
}

export default function RecordReviewModal({ record, onClose, onUpdate }: Props) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [revisionMode, setRevisionMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [remark, setRemark] = useState("");
    const [formData, setFormData] = useState({
        first_name: record.first_name,
        last_name: record.last_name,
        rank: record.rank,
        prefix: record.prefix,
        phone: record.phone,
        plateNumber: record.plateNumber,
        plateProvince: record.plateProvince,
        brand: record.brand,
        model: record.model,
        color: record.color,
        vehicle_type: record.vehicle_type
    });

    const handleSaveChanges = async () => {
        if (!profile?.uid || loading) return;
        setLoading(true);
        try {
            const ref = doc(db, "vehicle_records", record.record_id);
            const updates = {
                ...formData,
                updated_at: Date.now(),
                updated_by_uid: profile.uid,
                updated_by_name: profile.display_name || profile.displayName || "Admin"
            };
            await updateDoc(ref, updates);
            
            // --- AUDIT LOG ---
            await writeAuditLog({
                action: "ADMIN_UPDATE_RECORD",
                resource: "vehicle_records",
                resourceId: record.record_id,
                targetName: `${record.plateFullDisplay || record.plateNumber} - ${buildDisplayName(record)}`,
                before: record,
                after: { ...record, ...updates }
            }).catch(e => console.error("Audit log error:", e));

            setEditMode(false);
            onUpdate();
        } catch (error) {
            console.error("Save error:", error);
            alert("ไม่สามารถบันทึกการแก้ไขได้");
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!profile?.uid || loading) return;
        if (!confirm("ยืนยันการปิดการอนุญาตยานพาหนะคันนี้? ข้อมูลจะไม่สามารถนำไปใช้ผ่านทางเข้า-ออกได้จนกว่าจะแก้ไขสถานะ")) return;
        
        setLoading(true);
        try {
            const ref = doc(db, "vehicle_records", record.record_id);
            const updates = {
                status: "disabled",
                updated_at: Date.now(),
                updated_by_uid: profile.uid,
                updated_by_name: profile.display_name || profile.displayName || "Admin"
            };
            await updateDoc(ref, updates);
            
            // --- AUDIT LOG ---
            await writeAuditLog({
                action: "DISABLE_RECORD",
                resource: "vehicle_records",
                resourceId: record.record_id,
                targetName: `${record.plateFullDisplay || record.plateNumber} - ${buildDisplayName(record)}`,
                before: record,
                after: { ...record, ...updates }
            }).catch(e => console.error("Audit log error:", e));

            onUpdate();
            onClose();
        } catch (error) {
            console.error("Disable error:", error);
            alert("ไม่สามารถปิดการอนุญาตได้");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!profile?.uid || loading) return;
        setLoading(true);
        try {
            const ref = doc(db, "vehicle_records", record.record_id);
            const updates = {
                status: "approved",
                approved_at: Date.now(),
                approved_by_uid: profile.uid,
                approved_by_name: profile.display_name || profile.displayName || "Admin",
                updated_at: Date.now(),
                updated_by_uid: profile.uid,
                updated_by_name: profile.display_name || profile.displayName || "Admin"
            };
            await updateDoc(ref, updates);
            
            // --- AUDIT LOG ---
            await writeAuditLog({
                action: "APPROVE_RECORD",
                resource: "vehicle_records",
                resourceId: record.record_id,
                targetName: `${record.plateFullDisplay || record.plateNumber} - ${buildDisplayName(record)}`,
                before: record,
                after: { ...record, ...updates }
            }).catch(e => console.error("Audit log error:", e));

            onUpdate();
            onClose();
        } catch (error) {
            console.error("Approve error:", error);
            alert("ไม่สามารถอนุมัติข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestRevision = async () => {
        if (!profile?.uid || loading || !remark.trim()) return;
        setLoading(true);
        try {
            const ref = doc(db, "vehicle_records", record.record_id);
            const updates = {
                status: "needs_revision",
                remark: remark.trim(),
                updated_at: Date.now(),
                updated_by_uid: profile.uid,
                updated_by_name: profile.display_name || profile.displayName || "Admin"
            };
            await updateDoc(ref, updates);
            
            // --- AUDIT LOG ---
            await writeAuditLog({
                action: "REQUEST_REVISION_RECORD",
                resource: "vehicle_records",
                resourceId: record.record_id,
                targetName: `${record.plateFullDisplay || record.plateNumber} - ${buildDisplayName(record)}`,
                before: record,
                after: { ...record, ...updates }
            }).catch(e => console.error("Audit log error:", e));

            onUpdate();
            onClose();
        } catch (error) {
            console.error("Revision error:", error);
            alert("ไม่สามารถส่งแก้ไขข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-5xl max-h-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Eye size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">ตรวจสอบรายละเอียดข้อมูล</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                <Hash size={12} className="text-blue-500" />
                                {record.record_id}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    
                    {/* Top Section: Photos & Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Photos Grid */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รูปบุคคล</label>
                                <div className="aspect-[3/4] bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden group relative">
                                    {record.person_photo_url ? (
                                        <img src={record.person_photo_url} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <User size={48} strokeWidth={1} />
                                            <span className="text-[10px] font-bold mt-2">ไม่มีรูปบุคคล</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หน้ารถ</label>
                                <div className="aspect-[3/4] bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden group relative">
                                    {record.vehicle_photo_front_url ? (
                                        <img src={record.vehicle_photo_front_url} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <Car size={48} strokeWidth={1} />
                                            <span className="text-[10px] font-bold mt-2">ไม่มีรูปหน้ารถ</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ท้ายรถ</label>
                                <div className="aspect-[3/4] bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden group relative">
                                    {record.vehicle_photo_back_url ? (
                                        <img src={record.vehicle_photo_back_url} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon size={48} strokeWidth={1} />
                                            <span className="text-[10px] font-bold mt-2">ไม่มีรูปท้ายรถ</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Summary & Quick Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                                    <span className="text-sm font-bold text-slate-500">สถานะปัจจุบัน</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusBadgeClass(record.status)}`}>
                                        {record.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                                    <span className="text-sm font-bold text-slate-500">ความครบถ้วน</span>
                                    {record.is_complete ? (
                                        <span className="text-emerald-600 font-black text-sm flex items-center gap-1">
                                            <CheckCircle2 size={16} /> สมบูรณ์
                                        </span>
                                    ) : (
                                        <span className="text-rose-600 font-black text-sm flex items-center gap-1">
                                            <AlertTriangle size={16} /> ไม่สมบูรณ์ ({record.missing_fields?.length})
                                        </span>
                                    )}
                                </div>
                                {!record.is_complete && record.missing_fields && (
                                    <div className="pt-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">ส่วนที่ขาดหายาก</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {record.missing_fields.map(f => (
                                                <span key={f} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-100">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-3">
                                <div className="flex items-center gap-2 text-blue-800 mb-1">
                                    <Info size={16} />
                                    <span className="text-xs font-black uppercase">ข้อมูลการบันทึก</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-blue-600/60 font-bold">บันทึกโดย:</span>
                                    <span className="font-bold text-blue-900">{record.created_by_name}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-blue-600/60 font-bold">วันที่บันทึก:</span>
                                    <span className="font-bold text-blue-900">{new Date(record.created_at).toLocaleString("th-TH")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        
                        {/* Person Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">ข้อมูลเจ้าของยานพาหนะ</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 ml-2">
                                <InfoItem 
                                    label="ชื่อ-นามสกุล" 
                                    value={editMode ? "" : buildDisplayName(record)} 
                                    isEditing={editMode}
                                    onChange={(v) => {}} // Name is complex, handled below if needed or just skip for now
                                    renderEdit={() => (
                                        <div className="flex gap-2">
                                            <input 
                                                value={formData.first_name} 
                                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                                                placeholder="ชื่อ"
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                                            />
                                            <input 
                                                value={formData.last_name} 
                                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                                                placeholder="นามสกุล"
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                                            />
                                        </div>
                                    )}
                                />
                                <InfoItem 
                                    label="เบอร์โทรศัพท์" 
                                    value={record.phone || "-"} 
                                    icon={<Phone size={14}/>} 
                                    isEditing={editMode}
                                    onChange={v => setFormData({...formData, phone: v})}
                                />
                                <InfoItem label="ประเภทบุคคล" value={record.person_type} />
                                <InfoItem label="สังกัด/พื้นที่" value={record.unit_name_th || record.unit_code || "-"} icon={<MapPin size={14}/>} />
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Car size={18} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">ข้อมูลยานพาหนะ</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 ml-2">
                                <div className={`col-span-2 ${editMode ? 'bg-slate-100' : 'bg-slate-900'} ${editMode ? 'text-slate-900' : 'text-white'} p-4 rounded-2xl shadow-lg flex items-center justify-between border-4 ${editMode ? 'border-slate-300' : 'border-slate-800'} transition-colors`}>
                                    <div>
                                        <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">เลขทะเบียนรถ</div>
                                        {editMode ? (
                                            <input 
                                                value={formData.plateNumber}
                                                onChange={e => setFormData({...formData, plateNumber: e.target.value})}
                                                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xl font-black w-full"
                                            />
                                        ) : (
                                            <div className="text-2xl font-black tracking-tight">{record.plateFullDisplay || record.plateNumber}</div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black opacity-50 uppercase tracking-widest text-blue-400">จังหวัด</div>
                                        {editMode ? (
                                            <input 
                                                value={formData.plateProvince}
                                                onChange={e => setFormData({...formData, plateProvince: e.target.value})}
                                                className="bg-white border border-slate-300 rounded px-2 py-0.5 font-black text-xs w-full text-right"
                                            />
                                        ) : (
                                            <div className="font-black text-sm">{record.plateProvince || "-"}</div>
                                        )}
                                    </div>
                                </div>
                                <InfoItem 
                                    label="ยี่ห้อ" 
                                    value={record.brand || "-"} 
                                    isEditing={editMode}
                                    onChange={v => setFormData({...formData, brand: v})}
                                />
                                <InfoItem 
                                    label="รุ่น" 
                                    value={record.model || "-"} 
                                    isEditing={editMode}
                                    onChange={v => setFormData({...formData, model: v})}
                                />
                                <InfoItem 
                                    label="สีรถ" 
                                    value={record.color || "-"} 
                                    isEditing={editMode}
                                    onChange={v => setFormData({...formData, color: v})}
                                />
                                <InfoItem 
                                    label="ประเภทรถ" 
                                    value={record.vehicle_type || "-"} 
                                    isEditing={editMode}
                                    onChange={v => setFormData({...formData, vehicle_type: v})}
                                />
                            </div>
                        </div>
                    </div>

                    {record.remark && !revisionMode && (
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-800 mb-2 font-bold text-sm">
                                <AlertTriangle size={16} />
                                หมายเหตุ
                            </div>
                            <p className="text-amber-900 text-sm">{record.remark}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                        {revisionMode ? (
                            <div className="flex w-full gap-3 animate-in slide-in-from-left-4">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="ระบุเหตุผลที่ให้ส่งแก้ไข..."
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white border border-rose-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm text-slate-900 transition-all placeholder:text-slate-400"
                                />
                                <button 
                                    onClick={() => setRevisionMode(false)}
                                    className="px-4 py-3 text-slate-400 font-bold hover:text-slate-600"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    disabled={loading || !remark.trim()}
                                    onClick={handleRequestRevision}
                                    className="px-6 py-3 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : "ส่งกลับไปแก้ไข"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Info size={16} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600">เลือกดำเนินการอนุมัติหรือส่งกลับไปแก้ไขข้อมูล</span>
                            </div>
                        )}
                    </div>
                    
                    {!revisionMode && (
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {editMode ? (
                                <>
                                    <button 
                                        onClick={() => setEditMode(false)}
                                        className="flex-1 md:flex-none px-6 py-3 text-slate-400 font-bold hover:text-slate-600"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button 
                                        disabled={loading}
                                        onClick={handleSaveChanges}
                                        className="flex-1 md:flex-none px-10 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : "บันทึกการแก้ไข"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setEditMode(true)}
                                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                                    >
                                        แก้ไขข้อมูล
                                    </button>
                                    
                                    <button 
                                        onClick={() => setRevisionMode(true)}
                                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-rose-100 text-rose-600 font-black rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <AlertTriangle size={18} />
                                        ให้ส่งแก้ไข
                                    </button>

                                    {record.status === 'approved' && (
                                        <button 
                                            onClick={handleDisable}
                                            className="flex-1 md:flex-none px-6 py-3 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                        >
                                            <AlertCircle size={18} />
                                            ปิดการอนุญาต
                                        </button>
                                    )}

                                    {(record.status === 'pending_review' || record.status === 'draft') && (
                                        <button 
                                            disabled={loading}
                                            onClick={handleApprove}
                                            className="flex-1 md:flex-none px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                            {loading ? "กำลังบันทึก..." : "อนุมัติข้อมูล"}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoItem({ 
    label, value, icon, isEditing, onChange, renderEdit 
}: { 
    label: string; 
    value: string; 
    icon?: React.ReactNode;
    isEditing?: boolean;
    onChange?: (val: string) => void;
    renderEdit?: () => React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">{label}</label>
            {isEditing ? (
                renderEdit ? renderEdit() : (
                    <input 
                        value={value === "-" ? "" : value}
                        onChange={e => onChange?.(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                    />
                )
            ) : (
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    {value}
                </div>
            )}
        </div>
    );
}
