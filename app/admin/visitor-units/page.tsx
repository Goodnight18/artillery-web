"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Check, 
    X, 
    Loader2, 
    Building2,
    ShieldCheck
} from "lucide-react";
import RequirePagePermission from "@/lib/requirePagePermission";
import ClientLayout from "../../components/ClientLayout";

interface VisitorUnit {
    id: string;
    code: string;
    name_th: string;
    created_at?: number;
}

function ManageVisitorUnitsContent() {
    const { isSuperAdmin } = useAuth();
    const [units, setUnits] = useState<VisitorUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [newCode, setNewCode] = useState("");
    const [newName, setNewName] = useState("");
    const [editCode, setEditCode] = useState("");
    const [editName, setEditName] = useState("");

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "visitor_units"), orderBy("name_th", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: VisitorUnit[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VisitorUnit));
            setUnits(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || !newName) return;

        setSaving(true);
        try {
            await addDoc(collection(db, "visitor_units"), {
                code: newCode.toUpperCase(),
                name_th: newName,
                created_at: Date.now()
            });
            setNewCode("");
            setNewName("");
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding unit:", error);
            alert("ไม่สามารถเพิ่มข้อมูลได้");
        } finally {
            setSaving(false);
        }
    };

    const handleEditSave = async (id: string) => {
        if (!editCode || !editName) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, "visitor_units", id), {
                code: editCode.toUpperCase(),
                name_th: editName,
                updated_at: Date.now()
            });
            setEditingId(null);
        } catch (error) {
            console.error("Error updating unit:", error);
            alert("ไม่สามารถแก้ไขข้อมูลได้");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพื้นที่นี้?")) return;

        try {
            await deleteDoc(doc(db, "visitor_units", id));
        } catch (error) {
            console.error("Error deleting unit:", error);
            alert("ไม่สามารถลบข้อมูลได้");
        }
    };

    const startEdit = (unit: VisitorUnit) => {
        setEditingId(unit.id);
        setEditCode(unit.code);
        setEditName(unit.name_th);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                    <ShieldCheck size={48} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">สิทธิ์เข้าถึงไม่เพียงพอ</h2>
                    <p className="text-slate-500">คุณต้องเป็น Super Admin เพื่อจัดการรายชื่อพื้นที่รับผิดชอบ</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Building2 className="text-blue-600" />
                            จัดการพื้นที่รับผิดชอบ (Visitors)
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">กำหนดรายชื่อสถานที่หรือส่วนงาน สำหรับให้บุคคลภายนอกเลือกติดต่อ</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200"
                    >
                        <Plus size={20} />
                        เพิ่มพื้นที่ใหม่
                    </button>
                </div>

                {/* Add Form */}
                {isAdding && (
                    <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Plus size={16} /> ข้อมูลพื้นที่ใหม่
                        </h2>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">รหัส (Code)</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newCode}
                                    onChange={e => setNewCode(e.target.value)}
                                    placeholder="เช่น HQ, HOUSING"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                />
                            </div>
                            <div className="md:col-span-6 space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">ชื่อพื้นที่ (Thai Name)</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="เช่น กองบังคับการ, บ้านพัก"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-3 flex gap-2">
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "บันทึกข้อมูล"}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">รหัส (Code)</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ชื่อพื้นที่รับผิดชอบ</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {units.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                                        ยังไม่มีข้อมูลพื้นที่รับผิดชอบ กรุณากดปุ่มเพิ่มพื้นที่ใหม่
                                    </td>
                                </tr>
                            ) : (
                                units.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {editingId === unit.id ? (
                                                <input 
                                                    type="text" 
                                                    value={editCode}
                                                    onChange={e => setEditCode(e.target.value)}
                                                    className="w-full px-3 py-1 border border-blue-300 rounded-lg text-sm text-slate-900 font-bold outline-none ring-2 ring-blue-50"
                                                />
                                            ) : (
                                                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-black uppercase tracking-wider">
                                                    {unit.code}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === unit.id ? (
                                                <input 
                                                    type="text" 
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full px-3 py-1 border border-blue-300 rounded-lg text-sm text-slate-900 outline-none ring-2 ring-blue-50"
                                                />
                                            ) : (
                                                <span className="font-semibold text-slate-800">{unit.name_th}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === unit.id ? (
                                                    <>
                                                        <button 
                                                            disabled={saving}
                                                            onClick={() => handleEditSave(unit.id)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Save"
                                                        >
                                                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => startEdit(unit)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(unit.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-900">คำเตือนสำหรับผู้ดูแลระบบ</h3>
                        <p className="text-sm text-amber-800/80 mt-1 leading-relaxed">
                            การลบพื้นที่รับผิดชอบอาจส่งผลให้รายงานเก่าๆ ที่เคยผูกกับพื้นที่นั้นแสดงผลเป็น "รหัส" แทนชื่อภาษาไทย 
                            อย่างไรก็ตาม ข้อมูลการลงทะเบียนจะไม่หายไปเพียงแต่การแสดงผลชื่อหน่วยในหน้าสรุปอาจจะไม่สมบูรณ์
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ManageVisitorUnitsPage() {
    return (
        <RequirePagePermission module="users">
            <ClientLayout>
                <ManageVisitorUnitsContent />
            </ClientLayout>
        </RequirePagePermission>
    );
}
