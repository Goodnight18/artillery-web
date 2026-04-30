"use client";

import React, { useState, useEffect, useMemo } from "react";
import ClientLayout from "../components/ClientLayout";
import { 
    Search, 
    Filter, 
    Download, 
    UserPlus, 
    Clock, 
    MapPin, 
    Building, 
    ShieldAlert, 
    CheckCircle2, 
    Plus,
    Users,
    LogOut,
    ArrowRightLeft,
    RefreshCcw,
    X
} from "lucide-react";
import RequirePagePermission from "@/lib/requirePagePermission";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { VisitorData } from "./types";
import VisitorForm from "./components/VisitorForm";
import VisitorTable from "./components/VisitorTable";

export default function VisitorsPage() {
    return (
        <RequirePagePermission module="external_persons">
            <VisitorsContent />
        </RequirePagePermission>
    );
}

function VisitorsContent() {
    const { profile, isAdmin, isSuperAdmin } = useAuth();
    
    const [visitors, setVisitors] = useState<VisitorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // 1. Fetch Data with Scoping
    useEffect(() => {
        if (!profile) return;

        setLoading(true);
        const visitorsRef = collection(db, "visitors");
        
        let q;
        if (isAdmin || isSuperAdmin) {
            // Global view for admins
            q = query(visitorsRef, orderBy("created_at", "desc"), limit(100));
        } else {
            // Unit-scoped view for regular users
            const unitCode = profile.unit_code || profile.unit || "";
            q = query(
                visitorsRef, 
                where("unit_code", "==", unitCode),
                orderBy("created_at", "desc"), 
                limit(100)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: VisitorData[] = [];
            snapshot.forEach((doc) => {
                data.push({ visitor_id: doc.id, ...doc.data() } as VisitorData);
            });
            setVisitors(data);
            setLoading(false);
            setLastUpdated(new Date());
        }, (error) => {
            console.error("Firestore Listen Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, isAdmin, isSuperAdmin]);

    // 2. Computed Stats
    const stats = useMemo(() => {
        const total = visitors.length;
        const active = visitors.filter(v => v.status === "ปกติ").length;
        const completed = visitors.filter(v => v.status === "ออกแล้ว").length;
        const highRisk = visitors.filter(v => v.status === "ต้องสงสัย").length;
        const overtime = visitors.filter(v => v.status === "อยู่เกินเวลา").length;

        return { total, active, completed, highRisk, overtime };
    }, [visitors]);

    return (
        <ClientLayout>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Users className="text-blue-600" />
                            ระบบลงทะเบียนผู้มาติดต่อ (External Persons)
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            จัดการการเข้า-ออกของบุคคลภายนอก {isAdmin ? "ทุกหน่วยงาน" : `ประจำหน่วย: ${profile?.unit_name_th || "กำลังโหลด..."}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
                                showForm 
                                ? "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200" 
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                            }`}
                        >
                            {showForm ? <X size={20} /> : <Plus size={20} />}
                            {showForm ? "ปิดหน้าต่างลงทะเบียน" : "ลงทะเบียนใหม่"}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard 
                        label="ทั้งหมด" 
                        value={stats.total} 
                        icon={<Users size={20} />} 
                        color="bg-blue-600" 
                        sub="คนวันนี้"
                    />
                    <StatCard 
                        label="ยังอยู่ข้างใน" 
                        value={stats.active} 
                        icon={<Clock size={20} />} 
                        color="bg-emerald-500" 
                        sub="ปกติ"
                    />
                    <StatCard 
                        label="ออกแล้ว" 
                        value={stats.completed} 
                        icon={<LogOut size={20} />} 
                        color="bg-slate-400" 
                        sub="เรียบร้อย"
                    />
                    <StatCard 
                        label="อยู่เกินเวลา" 
                        value={stats.overtime} 
                        icon={<ArrowRightLeft size={20} />} 
                        color="bg-amber-500" 
                        sub="ดูแลพิเศษ"
                    />
                     <StatCard 
                        label="ต้องสงสัย" 
                        value={stats.highRisk} 
                        icon={<ShieldAlert size={20} />} 
                        color="bg-rose-500" 
                        sub="เฝ้าระวัง"
                    />
                </div>

                {/* Conditional Form Rendering */}
                {showForm && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <VisitorForm onSuccess={() => setShowForm(false)} />
                    </div>
                )}

                {/* Main Table Section */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <VisitorTable 
                        visitors={visitors} 
                        loading={loading} 
                        onRefresh={() => {}} // Snapshot handles this
                    />
                </div>

                {/* Footer Meta */}
                <div className="flex items-center justify-between px-4 text-[11px] text-slate-400 font-medium pt-8">
                    <div className="flex items-center gap-2">
                        <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
                        อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString()}
                    </div>
                    <div>
                        Power of 11th Artillery Regiment Digital Command
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}

function StatCard({ label, value, icon, color, sub }: { label: string, value: number, icon: any, color: string, sub: string }) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-blue-200 transition-all">
            <div className={`${color} p-2.5 rounded-xl text-white mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="text-2xl font-black text-slate-800">{value}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
        </div>
    );
}
