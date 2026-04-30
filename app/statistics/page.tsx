"use client";

import { useEffect, useState } from "react";
import ClientLayout from "../components/ClientLayout";
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Download, TrendingUp, CarFront, AlertTriangle, ShieldCheck, ArrowRightLeft, Loader2 } from "lucide-react";
import RequirePagePermission from "@/lib/requirePagePermission";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"];

export default function StatisticsPage() {
    const [dateRange, setDateRange] = useState("today");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const getStats = httpsCallable(functions, "getDashboardStats");
                const result = await getStats();
                setData(result.data);
            } catch (error) {
                console.error("Fetch Stats Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [dateRange]);

    if (loading) {
        return (
            <RequirePagePermission module="stats">
                <ClientLayout>
                    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                        <span className="ml-3 text-slate-600 font-medium">กำลังโหลดข้อมูลสถิติ...</span>
                    </div>
                </ClientLayout>
            </RequirePagePermission>
        );
    }

    const stats = data?.stats || {};
    const hourlyData = data?.hourlyTraffic || [];
    
    // Format pie chart data
    const vehicleTypeData = Object.entries(stats.vehicleTypes || {}).map(([name, value]) => ({ 
        name, 
        value: Number(value) 
    }));

    return (
        <RequirePagePermission module="stats">
            <ClientLayout>
                <div className="min-h-screen bg-slate-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">สถิติข้อมูลรถเข้า-ออก</h1>
                            <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลเชิงสถิติของปริมาณยานพาหนะและการใช้งานช่องทาง</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="today">วันนี้</option>
                                <option value="week" disabled>สัปดาห์นี้ (เร็วๆ นี้)</option>
                                <option value="month" disabled>เดือนนี้ (เร็วๆ นี้)</option>
                            </select>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors">
                                <Download size={16} />
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1 */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <ArrowRightLeft size={20} />
                                </div>
                                <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold">
                                    Live
                                </span>
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium">รถผ่านเข้า-ออก (วันนี้)</h3>
                                <div className="text-3xl font-bold text-slate-900 mt-1">
                                    {data?.trafficTotal?.toLocaleString() || 0} 
                                    <span className="text-sm font-normal text-slate-500 ml-1">คัน</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Combined Records */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <CarFront size={20} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium">ทะเบียนที่ลงทะเบียนแล้ว</h3>
                                <div className="text-3xl font-bold text-slate-900 mt-1">
                                    {stats.totalRecords || 0}
                                    <span className="text-sm font-normal text-slate-500 ml-1">รายการ</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Approved */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col hover:border-emerald-300 transition-colors cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium">ผ่านการอนุมัติแล้ว</h3>
                                <div className="text-3xl font-bold text-emerald-600 mt-1">
                                    {stats.approvedRecords || 0}
                                    <span className="text-sm font-normal text-slate-500 ml-1">รายการ</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Issues */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col hover:border-orange-300 transition-colors cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                    <AlertTriangle size={20} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium">ข้อมูลไม่ครบถ้วน</h3>
                                <div className="text-3xl font-bold text-orange-600 mt-1">
                                    {stats.incompleteRecords || 0}
                                    <span className="text-sm font-normal text-slate-500 ml-1">รายการ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Main Chart: Time Distribution */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-base font-bold text-slate-800">ปริมาณจราจรตามช่วงเวลา (วันนี้)</h2>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>รถเข้า</div>
                                </div>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="in" name="รถเข้า" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Vehicle Types */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h2 className="text-base font-bold text-slate-800 mb-2">สัดส่วนประเภทรถ (ที่ลงทะเบียน)</h2>
                            <div className="h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={vehicleTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {vehicleTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [value, 'จำนวน']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-slate-800">{vehicleTypeData.length}</span>
                                    <span className="text-xs text-slate-500">ประเภทรถ</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {vehicleTypeData.map((item, index) => (
                                    <div key={item.name} className="flex items-center text-xs">
                                        <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        <span className="text-slate-600 truncate">{item.name} <span className="font-semibold text-slate-800 ml-1">{item.value}</span></span>
                                    </div>
                                ))}
                                {vehicleTypeData.length === 0 && <p className="text-center col-span-2 text-slate-400 text-xs py-4">ไม่มีข้อมูล</p>}
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Summary Note */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                           <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                               <ShieldCheck size={20} />
                               ความพร้อมของข้อมูลในระบบ
                           </h3>
                           <p className="text-blue-700 text-sm leading-relaxed">
                               สถิติชุดนี้ประมวลผลจากฐานข้อมูลจริงแบบ Real-time ข้อมูล "รอการอนุมัติ" และ "ข้อมูลไม่ครบถ้วน" ควรได้รับการจัดการจากผู้ดูแลหน่วยงานเพื่อให้ระบบมีความสมบูรณ์ 100% สำหรับการตรวจสอบด้วย AI ในอนาคต
                           </p>
                        </div>
                    </div>

                </div>
            </div>
            </ClientLayout>
        </RequirePagePermission>
    );
}
