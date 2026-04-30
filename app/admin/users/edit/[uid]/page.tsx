"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AUTHORIZED_UNITS } from "../../../../../app/records/constants/units";
import { 
    ChevronLeft, 
    Save, 
    Power, 
    PowerOff, 
    Loader2, 
    CheckCircle2, 
    XCircle
} from "lucide-react";
import RequirePagePermission from "@/lib/requirePagePermission";

// Helper Format Date
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

export default function EditUserPage() {
    return (
        <RequirePagePermission module="users">
            <EditUserContent />
        </RequirePagePermission>
    );
}

function EditUserContent() {
    const params = useParams();
    const router = useRouter();
    const uid = params.uid as string;

    // Loading States
    const [pageLoading, setPageLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Form Data States
    const [email, setEmail] = useState("");
    const [createdAt, setCreatedAt] = useState(0);
    const [updatedAt, setUpdatedAt] = useState(0);
    
    // Editable Fields
    const [displayName, setDisplayName] = useState("");
    const [unitCode, setUnitCode] = useState("");
    const [unitNameTh, setUnitNameTh] = useState("");
    const [role, setRole] = useState("data_entry");
    const [status, setStatus] = useState("active");
    const [password, setPassword] = useState("");

    // Validation & Messages
    const [errors, setErrors] = useState<{ displayName?: string; unitCode?: string; unitNameTh?: string }>({});
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load Data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!uid) return;
            try {
                setPageLoading(true);
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setEmail(data.email || "");
                    setDisplayName(data.display_name || "");
                    setUnitCode(data.unit_code || data.unit || "");
                    setUnitNameTh(data.unit_name_th || "");
                    setRole(data.role || "data_entry");
                    setStatus(data.status || "active");
                    setCreatedAt(data.created_at || 0);
                    setUpdatedAt(data.updated_at || 0);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                setNotFound(true);
                showToast("โหลดข้อมูลล้มเหลว", "error");
            } finally {
                setPageLoading(false);
            }
        };

        fetchUserData();
    }, [uid]);

    // Save Data
    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Validation
        const newErrors: { displayName?: string; unitCode?: string; unitNameTh?: string } = {};
        if (!displayName.trim()) newErrors.displayName = "กรุณากรอกชื่อผู้ลงทะเบียน";
        if (!unitNameTh.trim()) newErrors.unitNameTh = "กรุณากรอกชื่อหน่วยงานเต็ม";
        if (!unitCode.trim()) newErrors.unitCode = "กรุณากรอกรหัสย่อหน่วย";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSaving(true);
        const now = Date.now();

        try {
            if (password) {
                if (password.length < 8) {
                    showToast("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", "error");
                    setIsSaving(false);
                    return;
                }
                const res = await fetch("/api/admin/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid, newPassword: password }),
                });
                const data = await res.json();
                if (!data.success) {
                   showToast(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ", "error");
                   setIsSaving(false);
                   return;
                }
            }

            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                display_name: displayName,
                unit: unitCode,
                unit_code: unitCode,
                unit_name_th: unitNameTh,
                role: role,
                status: status,
                updated_at: now
            });

            setUpdatedAt(now);
            showToast("บันทึกข้อมูลเรียบร้อย", "success");
        } catch (error) {
            console.error("Error updating user:", error);
            showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle Status
    const handleToggleStatus = async () => {
        setIsToggling(true);
        const newStatus = status === "active" ? "disabled" : "active";
        const now = Date.now();

        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
                status: newStatus,
                updated_at: now
            });

            setStatus(newStatus);
            setUpdatedAt(now);
            showToast(`ผู้ใช้งานถูก${newStatus === 'active' ? 'เปิด' : 'ปิด'}การใช้งานแล้ว`, "success");
        } catch (error) {
            console.error("Error toggling status:", error);
            showToast("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ", "error");
        } finally {
            setIsToggling(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center max-w-md w-full">
                    <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบผู้ใช้งานนี้</h2>
                    <p className="text-gray-500 mb-6">ผู้ใช้งานที่คุณต้องการแก้ไขอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                        <ChevronLeft size={18} className="mr-2" />
                        กลับไปหน้าผู้ใช้งาน
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Breadcrumb & Header */}
                <div>
                    <nav className="flex items-center text-sm font-medium text-gray-500 mb-4">
                        <Link href="/admin/users" className="hover:text-blue-600 transition-colors">ผู้ใช้งาน</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">แก้ไขผู้ใช้</span>
                    </nav>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลผู้ใช้งาน</h1>
                            <p className="text-sm text-gray-500 mt-1">อัปเดตข้อมูลหน่วย บทบาท และสถานะของบัญชีผู้ใช้งาน</p>
                        </div>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6" autoComplete="off">
                        {/* Dummy inputs to fool browser autofill */}
                        <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
                        <input type="password" name="password_fake" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
                        
                        
                        {/* System Information Section (Readonly) */}
                        <div className="space-y-4 pb-6 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">ข้อมูลบัญชีระบบ (อ่านอย่างเดียว)</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg outline-none"
                                    />
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <span className="text-xs text-gray-400">UID:</span>
                                        <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{uid}</code>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">วันที่สร้าง</label>
                                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-lg">
                                            {formatDate(createdAt)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">แก้ไขล่าสุด</label>
                                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-lg">
                                            {formatDate(updatedAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Profile Section */}
                        <div className="space-y-4 pb-6 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">ข้อมูลส่วนกำหนดค่า</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อผู้ลงทะเบียน (Display Name) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="edit-user-displayname"
                                        type="text"
                                        name="display_name_edit"
                                        value={displayName}
                                        autoComplete="off"
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="เช่น จ.ส.อ. สมชาย ใจดี"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 ${
                                            errors.displayName ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.displayName && <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อหน่วยงานเต็ม (ภาษาไทย) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={unitNameTh}
                                        onChange={(e) => {
                                            const selectedName = e.target.value;
                                            setUnitNameTh(selectedName);
                                            const unit = AUTHORIZED_UNITS.find(u => u.name_th === selectedName);
                                            if (unit) {
                                                setUnitCode(unit.code);
                                            }
                                        }}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white ${
                                            errors.unitNameTh ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">-- เลือกหน่วยงาน --</option>
                                        {AUTHORIZED_UNITS.map((unit) => (
                                            <option key={unit.code} value={unit.name_th}>
                                                {unit.name_th}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.unitNameTh && <p className="mt-1 text-sm text-red-500">{errors.unitNameTh}</p>}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        รหัสย่อหน่วย (Unit Code) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={unitCode}
                                        readOnly
                                        placeholder="รหัสหน่วยจะถูกใส่ให้อัตโนมัติ"
                                        className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-gray-500 bg-gray-50 cursor-not-allowed ${
                                            errors.unitCode ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.unitCode && <p className="mt-1 text-sm text-red-500">{errors.unitCode}</p>}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ต้ังรหัสผ่านใหม่ (ไม่บังคับ)
                                    </label>
                                    <input
                                        id="edit-user-newpassword"
                                        type="password"
                                        name="new_password_edit"
                                        value={password}
                                        autoComplete="new-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="เว้นว่างไว้หากต้องการใช้รหัสผ่านเดิม"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        บทบาท (Role) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                                    >
                                        <option value="data_entry">Data Entry</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        สถานะบัญชี <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white font-medium ${
                                            status === 'active' 
                                            ? 'border-green-300 text-green-700 focus:ring-green-500 focus:border-green-500 bg-green-50' 
                                            : 'border-red-300 text-red-700 focus:ring-red-500 focus:border-red-500 bg-red-50'
                                        }`}
                                    >
                                        <option value="active" className="text-green-700">Active (พร้อมใช้งาน)</option>
                                        <option value="disabled" className="text-red-700">Disabled (ระงับการใช้งาน)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1">
                                <Link
                                    href="/admin/users"
                                    className="flex-1 sm:flex-none justify-center inline-flex items-center px-6 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                                >
                                    ย้อนกลับ
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none justify-center inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={18} />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} className="mr-2" />
                                            บันทึกการเปลี่ยนแปลง
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="w-full sm:w-auto order-1 sm:order-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleToggleStatus}
                                    disabled={isToggling}
                                    className={`w-full sm:w-auto justify-center inline-flex items-center px-4 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                                        status === 'active'
                                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                                        : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
                                    }`}
                                >
                                    {isToggling ? (
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                    ) : status === 'active' ? (
                                        <PowerOff size={18} className="mr-2" />
                                    ) : (
                                        <Power size={18} className="mr-2" />
                                    )}
                                    {status === 'active' ? 'ปิดใช้งานผู้ใช้' : 'เปิดใช้งานผู้ใช้'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed bottom-4 right-4 sm:top-4 sm:bottom-auto flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300 z-50 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
                        }`}
                >
                    {toast.type === "success" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}
