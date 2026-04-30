"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
    Search, 
    UserPlus, 
    Users, 
    UserCheck, 
    UserX, 
    Building2, 
    Eye, 
    Edit2, 
    Power,
    ChevronLeft,
    ChevronRight,
    Loader2,
    XCircle,
    Trash2,
    CheckCircle2
} from "lucide-react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { writeAuditLog } from "@/lib/audit";
import RequirePagePermission from "@/lib/requirePagePermission";
import ClientLayout from "../../components/ClientLayout";

// Types
type UserData = {
    uid: string;
    email: string;
    display_name: string;
    unit: string;
    unit_code?: string;
    unit_name_th?: string;
    role: string;
    status: string;
    created_at: number;
    updated_at: number;
};

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

export default function AdminUsersPage() {
    return (
        <RequirePagePermission module="users">
            <ClientLayout>
                <AdminUsersContent />
            </ClientLayout>
        </RequirePagePermission>
    );
}

function AdminUsersContent() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editUnitCode, setEditUnitCode] = useState("");
    const [editUnitNameTh, setEditUnitNameTh] = useState("");
    const [editRole, setEditRole] = useState("data_entry");
    const [editPassword, setEditPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Data
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("created_at", "desc"));
            const snapshot = await getDocs(q);
            
            const usersData: UserData[] = [];
            snapshot.forEach((doc) => {
                usersData.push({ uid: doc.id, ...doc.data() } as UserData);
            });
            
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Memoized Filtered Users
    const filteredUsers = useMemo(() => {
        let result = users;

        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(user => 
                (user.email || "").toLowerCase().includes(lowerSearch) ||
                (user.display_name || "").toLowerCase().includes(lowerSearch) ||
                (user.unit || "").toLowerCase().includes(lowerSearch)
            );
        }

        if (roleFilter !== "all") {
            result = result.filter(user => user.role === roleFilter);
        }

        if (statusFilter !== "all") {
            result = result.filter(user => user.status === statusFilter);
        }

        setCurrentPage(1);
        return result;
    }, [users, searchTerm, roleFilter, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    // Summary Analytics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === "active").length;
    const disabledUsers = users.filter(u => u.status !== "active").length;
    const uniqueUnits = new Set(users.map(u => u.unit)).size;

    // Handlers
    const handleClearFilters = () => {
        setSearchTerm("");
        setRoleFilter("all");
        setStatusFilter("all");
        setCurrentPage(1);
    };

    const handleView = (user: UserData) => {
        console.log("View user:", user.uid);
    };

    const handleEdit = (user: any) => {
        setEditDisplayName(user.display_name || "");
        setEditUnitCode(user.unit_code || user.unit || "");
        setEditUnitNameTh(user.unit_name_th || "");
        setEditRole(user.role || "data_entry");
        setEditPassword("");
        setEditingUser(user);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        
        setIsSaving(true);
        try {
            if (editPassword) {
                if (editPassword.length < 8) {
                    alert("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
                    setIsSaving(false);
                    return;
                }
                const res = await fetch("/api/admin/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid: editingUser.uid, newPassword: editPassword }),
                });
                const data = await res.json();
                if (!data.success) {
                   alert(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
                   setIsSaving(false);
                   return;
                }
            }

            const userRef = doc(db, "users", editingUser.uid);
            const updatePayload = {
                display_name: editDisplayName,
                unit: editUnitCode,
                unit_code: editUnitCode,
                unit_name_th: editUnitNameTh,
                role: editRole,
                updated_at: Date.now()
            };
            await updateDoc(userRef, updatePayload);
            
            // Audit Log: Update User
            await writeAuditLog({
                action: "update",
                resource: "users",
                resourceId: editingUser.uid,
                targetName: editDisplayName,
                before: {
                    display_name: editingUser.display_name,
                    unit_code: editingUser.unit_code || editingUser.unit,
                    unit_name_th: editingUser.unit_name_th,
                    role: editingUser.role
                },
                after: updatePayload,
                meta: { password_changed: !!editPassword }
            });
            
            setUsers(users.map(u => 
                u.uid === editingUser.uid 
                    ? { ...u, ...updatePayload } 
                    : u
            ));
            
            setEditingUser(null);
        } catch (error: any) {
            console.error("Error saving user:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error.message || "Unknown Error"));
        } finally {
            setIsSaving(false);
        }
    };


    const handleToggleStatus = async (user: UserData) => {
        const newStatus = user.status === "active" ? "disabled" : "active";
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                status: newStatus,
                updated_at: Date.now()
            });
            
            setUsers(users.map(u => 
                u.uid === user.uid 
                    ? { ...u, status: newStatus, updated_at: Date.now() } 
                    : u
            ));

            // Audit Log: Toggle Status
            await writeAuditLog({
                action: "update_status",
                resource: "users",
                resourceId: user.uid,
                targetName: user.display_name,
                before: { status: user.status },
                after: { status: newStatus }
            });
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        }
    };

    // UI Renderers
    const renderRoleBadge = (role: string) => {
        if (role === 'admin') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Data Entry</span>;
    };

    const renderStatusBadge = (status: string) => {
        if (status === 'active') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Disabled</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                        <p className="text-sm text-gray-500 mt-1">รายการบัญชีผู้ใช้งานของแต่ละหน่วย</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Link
                            href="/admin/create-user"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                            <UserPlus size={18} className="mr-2" />
                            สร้างผู้ใช้ใหม่
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">ผู้ใช้ทั้งหมด</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : totalUsers}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">พร้อมใช้งาน (Active)</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : activeUsers}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 mr-4">
                            <UserX size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">ระงับการใช้งาน</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : disabledUsers}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
                        <div className="p-3 rounded-lg bg-amber-50 text-amber-600 mr-4">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">จำนวนหน่วยทั้งหมด</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : uniqueUnits}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อหน่วย, อีเมล, รหัสหน่วย..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all text-gray-900"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all bg-white text-gray-900"
                            >
                                <option value="all">Role (ทั้งหมด)</option>
                                <option value="admin">Admin</option>
                                <option value="data_entry">Data Entry</option>
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all bg-white text-gray-900"
                            >
                                <option value="all">สถานะ (ทั้งหมด)</option>
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-6 py-4 font-medium">ข้อมูลหน่วย</th>
                                    <th className="px-6 py-4 font-medium">อีเมล</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">สถานะ</th>
                                    <th className="px-6 py-4 font-medium">วันที่สร้าง</th>
                                    <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
                                                <p>กำลังโหลดข้อมูลผู้ใช้งาน...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={48} className="text-gray-300 mb-3" />
                                                <p className="text-lg font-medium text-gray-900 mb-1">ไม่พบข้อมูลผู้ใช้งาน</p>
                                                <p className="text-sm text-gray-500">
                                                    ลองปรับเปลี่ยนตัวกรอง หรือสร้างผู้ใช้งานใหม่
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{user.display_name || "-"}</div>
                                                        <div className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                            {user.unit_name_th || "-"}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">รหัสหน่วย: {user.unit_code || user.unit || "-"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStatusBadge(user.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleView(user)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(user)}
                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            user.status === 'active' 
                                                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                            : 'text-red-500 hover:text-green-600 hover:bg-green-50'
                                                        }`}
                                                        title={user.status === 'active' ? 'ระงับการใช้งาน' : 'เปิดการใช้งาน'}
                                                    >
                                                        <Power size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filteredUsers.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                            <div className="text-sm text-gray-600">
                                แสดงผลลัพธ์ <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> จากทั้งหมด <span className="font-semibold text-gray-900">{filteredUsers.length}</span> รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-medium text-gray-700 px-2">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลผู้ใช้งาน</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(ไม่สามารถแก้ไขได้)</span></label>
                                <input type="email" value={editingUser.email} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน (Display Name) <span className="text-red-500">*</span></label>
                                <input type="text" required value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหน่วยงานภาษาไทย <span className="text-red-500">*</span></label>
                                <input type="text" required value={editUnitNameTh} onChange={e => setEditUnitNameTh(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสหน่วย (Unit Code) <span className="text-red-500">*</span></label>
                                <input type="text" required value={editUnitCode} onChange={e => setEditUnitCode(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ตั้งรหัสผ่านใหม่ (ไม่บังคับ)</label>
                                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="เว้นว่างไว้หากต้องการใช้รหัสผ่านเดิม" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท (Role) <span className="text-red-500">*</span></label>
                                <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 bg-white">
                                    <option value="data_entry">Data Entry</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditingUser(null)} disabled={isSaving} className="px-5 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors">
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-70">
                                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
