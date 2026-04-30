"use client";

import React, { useState, useMemo } from "react";
import { Search, Clock, LogOut, ShieldAlert, CheckCircle2, User, Phone, MapPin, Loader2, Navigation, Building } from "lucide-react";
import { VisitorData } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface VisitorTableProps {
    visitors: VisitorData[];
    loading: boolean;
    onRefresh: () => void;
}

const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
};

export default function VisitorTable({ visitors, loading, onRefresh }: VisitorTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [checkingOut, setCheckingOut] = useState<string | null>(null);

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return visitors;
        const term = searchTerm.toLowerCase();
        return visitors.filter(v => 
            (v.name || "").toLowerCase().includes(term) ||
            (v.id_card || "").toLowerCase().includes(term) ||
            (v.plate || "").toLowerCase().includes(term) ||
            (v.person_to_meet || "").toLowerCase().includes(term) ||
            (v.unit_name_th || "").toLowerCase().includes(term)
        );
    }, [visitors, searchTerm]);

    const handleCheckOut = async (visitor: VisitorData) => {
        if (!window.confirm(`ยืนยันการออกจากพื้นที่สำหรับ: ${visitor.name}?`)) return;

        try {
            setCheckingOut(visitor.visitor_id);
            const ref = doc(db, "visitors", visitor.visitor_id);
            await updateDoc(ref, {
                time_out: Date.now(),
                status: "ออกแล้ว",
                updated_at: Date.now()
            });
            onRefresh();
        } catch (err) {
            console.error("Check-out error:", err);
            alert("เกิดข้อผิดพลาดในการบันทึกเวลาออก");
        } finally {
            setCheckingOut(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">ทะเบียนประวัติผู้มาติดต่อ</h2>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ, เลขบัตร, ทะเบียน..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                            <th className="px-6 py-4 font-bold">ข้อมูลผู้มาติดต่อ</th>
                            <th className="px-6 py-4 font-bold">รายละเอียดการเข้าพบ</th>
                            <th className="px-6 py-4 font-bold">พาหนะ/ทะเบียน</th>
                            <th className="px-6 py-4 font-bold">เวลาเข้า-ออก</th>
                            <th className="px-6 py-4 font-bold">หน่วยรับผิดชอบ</th>
                            <th className="px-6 py-4 font-bold">สถานะ</th>
                            <th className="px-6 py-4 font-bold text-right">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                    <p className="text-sm">ไม่พบข้อมูลผู้มาติดต่อ</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((v) => (
                                <tr key={v.visitor_id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {v.image_url ? (
                                                <img src={v.image_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-slate-900">{v.name}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">{v.id_card}</div>
                                                {v.phone && <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={10} /> {v.phone}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-800">{v.purpose}</div>
                                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><Building size={10} /> {v.department || "-"}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">พบ: {v.person_to_meet || "-"}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-xs">{v.plate || "-"}</div>
                                        <div className="text-[10px] text-slate-500">{v.vehicle_type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100">
                                                <Clock size={10} /> เข้า: {formatTime(v.time_in)}
                                            </div>
                                            {v.time_out ? (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-md border border-orange-100">
                                                    <Clock size={10} /> ออก: {formatTime(v.time_out)}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-400 italic px-2">ยังไม่ออก</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[11px] font-bold text-blue-800">{v.unit_code}</div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]" title={v.unit_name_th}>{v.unit_name_th}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                            v.status === 'ปกติ' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            v.status === 'ออกแล้ว' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                            v.status === 'อยู่เกินเวลา' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}>
                                            {v.status === 'ปกติ' && <CheckCircle2 size={10} className="mr-1" />}
                                            {v.status === 'ต้องสงสัย' && <ShieldAlert size={10} className="mr-1" />}
                                            {v.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!v.time_out && (
                                            <button 
                                                onClick={() => handleCheckOut(v)}
                                                disabled={checkingOut === v.visitor_id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {checkingOut === v.visitor_id ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                                บันทึกออก
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
