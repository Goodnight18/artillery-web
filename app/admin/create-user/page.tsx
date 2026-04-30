"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import RequirePagePermission from "@/lib/requirePagePermission";
import ClientLayout from "../../components/ClientLayout";
import { auth } from "@/lib/firebase";
import { AUTHORIZED_UNITS } from "../../records/constants/units";

function CreateUserContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [unitCode, setUnitCode] = useState("");
    const [unitNameTh, setUnitNameTh] = useState("");
    const [role, setRole] = useState("data_entry");

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const clearForm = () => {
        setEmail("");
        setPassword("");
        setDisplayName("");
        setUnitCode("");
        setUnitNameTh("");
        setRole("data_entry");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        clearForm();
    };

    const createUserAccount = async () => {
        try {
            setIsLoading(true);

            // 1. Validate Form (basic validation)
            if (!email || !email.includes("@")) {
                throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
            }
            if (password.length < 6) {
                throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            }
            if (!displayName.trim()) {
                throw new Error("กรุณากรอกชื่อผู้ลงทะเบียน (Display Name)");
            }
            if (!unitCode.trim()) {
                throw new Error("กรุณากรอกรหัสหน่วย");
            }
            if (!unitNameTh.trim()) {
                throw new Error("กรุณากรอกชื่อหน่วยงาน (ภาษาไทย)");
            }

            // 2. Get ID Token for Audit Log
            const idToken = await auth.currentUser?.getIdToken();

            // 3. Call API Route
            const response = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    email,
                    password,
                    display_name: displayName,
                    unit_code: unitCode,
                    unit_name_th: unitNameTh,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้");
            }

            // 4. Success State
            showToast("สร้างผู้ใช้สำเร็จ", "success");
            clearForm();
        } catch (error: any) {
            console.error("Error creating user:", error);
            showToast(error.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUserAccount();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">สร้างบัญชีผู้ใช้งาน</h1>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {/* Dummy inputs to fool browser autofill */}
                    <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
                    <input type="password" name="password_fake" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
                    
                    {/* Section: ข้อมูลบัญชี */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">ข้อมูลบัญชี</h2>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                                Email
                            </label>
                             <input
                                id="user-req-email"
                                type="email"
                                name="user_email_new"
                                required
                                autoComplete="off"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="unit_r1@camp.local"
                                className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                 <input
                                    id="user-req-password"
                                    type={showPassword ? "text" : "password"}
                                    name="user_password_new"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                                    className="w-full px-4 py-2 text-gray-700 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section: ข้อมูลหน่วย */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">ข้อมูลหน่วย</h2>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
                                ชื่อผู้ใช้งาน / ชื่อสำหรับแสดงผล (Display Name)
                            </label>
                              <input
                                id="user-req-displayname"
                                type="text"
                                name="display_name_official"
                                required
                                autoComplete="off"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="เช่น จ.ส.อ. สมชาย ใจดี"
                                className="w-full px-4 py-2 text-gray-700 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="unitNameTh">
                                ชื่อหน่วยงานเต็ม (ภาษาไทย)
                            </label>
                            <select
                                id="unitNameTh"
                                required
                                value={unitNameTh}
                                onChange={(e) => {
                                    const selectedName = e.target.value;
                                    setUnitNameTh(selectedName);
                                    const unit = AUTHORIZED_UNITS.find(u => u.name_th === selectedName);
                                    if (unit) {
                                        setUnitCode(unit.code);
                                    } else {
                                        setUnitCode("");
                                    }
                                }}
                                className="w-full px-4 py-2 text-gray-700 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="">-- เลือกหน่วยงาน --</option>
                                {AUTHORIZED_UNITS.map((unit) => (
                                    <option key={unit.code} value={unit.name_th}>
                                        {unit.name_th}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="unitCode">
                                รหัสย่อหน่วย (Unit Code)
                            </label>
                            <input
                                id="unitCode"
                                type="text"
                                required
                                readOnly
                                value={unitCode}
                                placeholder="รหัสหน่วยจะถูกใส่ให้อัตโนมัติ"
                                className="w-full px-4 py-2 border text-gray-500 border-gray-300 rounded-lg bg-gray-50 outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Section: สิทธิ์ */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">สิทธิ์</h2>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="role">
                                Role
                            </label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="data_entry">data_entry</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    กำลังสร้างบัญชี...
                                </>
                            ) : (
                                "สร้างผู้ใช้"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isLoading}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            ล้างข้อมูล
                        </button>
                    </div>
                </form>
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

export default function CreateUserPage() {
    return (
        <RequirePagePermission module="users">
            <ClientLayout>
                <CreateUserContent />
            </ClientLayout>
        </RequirePagePermission>
    );
}
