"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Camera, FileText, Phone, Building, Navigation, Clock, Loader2, CheckCircle2, XCircle, X, ShieldAlert } from "lucide-react";
import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
    VisitorFormState, 
    VISITOR_PURPOSE_OPTIONS, 
    GATE_OPTIONS, 
    VISITOR_VEHICLE_OPTIONS 
} from "../types";
import { AUTHORIZED_UNITS } from "../../records/constants/units";
import { useUnits } from "@/hooks/useUnits";
import { uploadImageToStorage } from "@/lib/storageHelper";
import { compressImage } from "@/lib/browserImageCompression";

const initialFormState: VisitorFormState = {
    name: "",
    id_card: "",
    phone: "",
    purpose: VISITOR_PURPOSE_OPTIONS[0],
    department: "",
    person_to_meet: "",
    gate: GATE_OPTIONS[0],
    vehicle_type: VISITOR_VEHICLE_OPTIONS[0],
    plate: "",
    image: null,
    unit_code: "",
    unit_name_th: ""
};

interface VisitorFormProps {
    onSuccess: () => void;
}

export default function VisitorForm({ onSuccess }: VisitorFormProps) {
    const { profile, isAdmin, isSuperAdmin } = useAuth();
    const canSelectUnit = isAdmin || isSuperAdmin;

    // Use "visitor" type to fetch specific visitor contact areas
    const { units: dynamicUnits, loadingUnits } = useUnits("visitor");

    const [form, setForm] = useState<VisitorFormState>(initialFormState);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [submitMessage, setSubmitMessage] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const showSubmitMessage = (message: string, type: "success" | "error") => {
        setSubmitMessage({ message, type });
        setTimeout(() => setSubmitMessage(null), 3000);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file, { maxWidthOrHeight: 1200, quality: 0.8, fileType: "image/jpeg" });
                setForm(prev => ({ ...prev, image: compressed }));
                const reader = new FileReader();
                reader.onloadend = () => setPreviewImage(reader.result as string);
                reader.readAsDataURL(compressed);
            } catch (err) {
                console.error("Compression error:", err);
                alert("ไม่สามารถบีบอัดรูปภาพได้");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        setErrors({});
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = "กรุณากรอกชื่อ-นามสกุล";
        if (canSelectUnit && !form.unit_code) newErrors.unit_code = "กรุณาเลือกหน่วยที่รับผิดชอบ";
        if (!form.id_card.trim()) newErrors.id_card = "กรุณากรอกเลขบัตรประชาชน";
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);
            setUploadProgress("กำลังเตรียมข้อมูล...");
            const now = Date.now();
            const docId = `VIS-${now}`;

            let imageUrl = "";
            let imagePath = "";

            if (form.image) {
                setUploadProgress("กำลังอัปโหลดรูปภาพ...");
                const uploadRes = await uploadImageToStorage(form.image, `visitors/${docId}/photo`);
                imageUrl = uploadRes.downloadUrl;
                imagePath = uploadRes.fullPath;
            }

            setUploadProgress("กำลังบันทึกข้อมูล...");

            const payload: any = {
                visitor_id: docId,
                name: form.name.trim(),
                id_card: form.id_card.trim(),
                phone: form.phone.trim(),
                purpose: form.purpose,
                department: form.department.trim(),
                person_to_meet: form.person_to_meet.trim(),
                gate: form.gate,
                vehicle_type: form.vehicle_type,
                plate: form.plate.trim(),
                time_in: now,
                time_out: null,
                status: "ปกติ",
                image_url: imageUrl,
                image_path: imagePath,
                
                // Audit & Unit scoping
                created_by_uid: profile?.uid,
                created_by_name: profile?.display_name || profile?.displayName || "Unknown",
                created_at: now,
                updated_at: now
            };

            // Enhanced Unit Assignment Logic
            if (canSelectUnit) {
                payload.unit = form.unit_code;
                payload.unit_code = form.unit_code;
                payload.unit_name_th = form.unit_name_th;
            } else {
                payload.unit = profile?.unit_code || profile?.unit || "";
                payload.unit_code = profile?.unit_code || profile?.unit || "";
                payload.unit_name_th = profile?.unit_name_th || profile?.display_name || profile?.displayName || "";
            }

            await setDoc(doc(db, "visitors", docId), payload);

            showSubmitMessage("ลงทะเบียนสำเร็จ", "success");
            setForm(initialFormState);
            setPreviewImage(null);
            onSuccess();
        } catch (error) {
            console.error("Error saving visitor:", error);
            showSubmitMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
        } finally {
            setSaving(false);
            setUploadProgress("");
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden relative">
            {saving && (
                <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                    <p className="text-blue-900 font-bold">{uploadProgress}</p>
                </div>
            )}

            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus size={20} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">ลงทะเบียนผู้มาติดต่อใหม่</h2>
                </div>
                {canSelectUnit && (
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-200">
                        ADMIN MODE
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Left Column: Essential Info & Photography */}
                    <div className="space-y-6">
                        
                        {/* Admin Unit Selection */}
                        {canSelectUnit && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide">
                                        หน่วยที่รับผิดชอบ <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <select
                                    value={form.unit_code}
                                    onChange={(e) => {
                                        const unit = dynamicUnits.find(u => u.code === e.target.value);
                                        setForm(prev => ({ 
                                            ...prev, 
                                            unit_code: e.target.value,
                                            unit_name_th: unit?.name_th || ""
                                        }));
                                    }}
                                    className={`w-full px-4 py-2 bg-white border ${errors.unit_code ? 'border-red-500' : 'border-blue-200'} rounded-lg text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                                >
                                    <option value="">-- เลือกพื้นที่รับผิดชอบ --</option>
                                    {loadingUnits ? (
                                        <option disabled>กำลังโหลดพื้นที่...</option>
                                    ) : (
                                        dynamicUnits.map(u => (
                                            <option key={u.code} value={u.code}>{u.name_th}</option>
                                        ))
                                    )}
                                </select>
                                {errors.unit_code && <p className="text-red-500 text-[10px] mt-1">{errors.unit_code}</p>}
                                <p className="text-[10px] text-blue-500 mt-2 font-medium italic">
                                    * Super Admin สามารถจัดการรายชื่อพื้นที่เหล่านี้ได้ในหน้าตั้งค่า
                                </p>
                            </div>
                        )}

                        {/* Image Capture */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">รูปถ่ายผู้มาติดต่อ</label>
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden group flex items-center justify-center">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Camera size={48} strokeWidth={1} />
                                            <span className="text-xs font-medium">ไม่มีรูปภาพ</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 cursor-pointer opacity-0" htmlFor="visitor-image"></label>
                                    <input 
                                        type="file" 
                                        id="visitor-image" 
                                        accept="image/*" 
                                        capture="environment" 
                                        onChange={handleImageChange}
                                        className="hidden" 
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-black/60 backdrop-blur-sm flex justify-center">
                                        <label htmlFor="visitor-image" className="cursor-pointer bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-slate-100 transition-colors">
                                            ถ่ายรูป/เลือกไฟล์
                                        </label>
                                    </div>
                                </div>
                                {previewImage && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setPreviewImage(null); setForm(prev => ({ ...prev, image: null })); }}
                                        className="text-[11px] text-rose-500 font-bold hover:text-rose-700"
                                    >
                                        ลบรูปภาพ
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <FileText size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={form.name}
                                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        className={`w-full pl-10 pr-3 py-2 bg-slate-50 border ${errors.name ? 'border-red-400' : 'border-slate-200'} rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500`}
                                        placeholder="นายสมชาย มั่งมี"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">เลขบัตรประชาชน <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={form.id_card}
                                    onChange={e => setForm(prev => ({ ...prev, id_card: e.target.value }))}
                                    className={`w-full px-3 py-2 bg-slate-50 border ${errors.id_card ? 'border-red-400' : 'border-slate-200'} rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="1-2345-67890-XX-X"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">เบอร์โทรศัพท์</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input 
                                        type="tel" 
                                        value={form.phone}
                                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="081-XXX-XXXX"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Purpose & Vehicle */}
                    <div className="space-y-6">
                        
                        {/* Visit Details */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2 border-b border-blue-100 pb-2">
                                <Building size={14} /> รายละเอียดการเข้าพบ
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">วัตถุประสงค์ <span className="text-red-500">*</span></label>
                                    <select 
                                        value={form.purpose}
                                        onChange={e => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    >
                                        {VISITOR_PURPOSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">หน่วย/แผนกที่เข้าพบ</label>
                                        <input 
                                            type="text" 
                                            value={form.department}
                                            onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="ร้อย.มทบ.11"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">ชื่อบุคคลที่จะพบ</label>
                                        <input 
                                            type="text" 
                                            value={form.person_to_meet}
                                            onChange={e => setForm(prev => ({ ...prev, person_to_meet: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="จ.ส.อ. สมหมาย"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle & Gate */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Navigation size={14} /> ข้อมูลการเข้า-ออก
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">ช่องทางเข้า <span className="text-red-500">*</span></label>
                                    <select 
                                        value={form.gate}
                                        onChange={e => setForm(prev => ({ ...prev, gate: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {GATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">พาหนะ</label>
                                        <select 
                                            value={form.vehicle_type}
                                            onChange={e => setForm(prev => ({ ...prev, vehicle_type: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {VISITOR_VEHICLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">ทะเบียนรถ</label>
                                        <input 
                                            type="text" 
                                            value={form.plate}
                                            onChange={e => setForm(prev => ({ ...prev, plate: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="1กข 1234 กทม"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="pt-4 flex flex-col gap-3">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
                            >
                                <UserPlus size={20} />
                                ลงทะเบียนและพิมพ์บัตร
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setForm(initialFormState); setPreviewImage(null); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
                            >
                                ล้างข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Notification Toast */}
            {submitMessage && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 z-[100] ${submitMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
                    {submitMessage.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    <span className="font-bold">{submitMessage.message}</span>
                </div>
            )}
        </div>
    );
}
