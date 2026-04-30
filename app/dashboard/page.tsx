"use client";

import React, { useState, useEffect } from 'react';
import ClientLayout from '../components/ClientLayout';
import TrafficChart from '../components/dashboard/TrafficChart';
import RequirePagePermission from '@/lib/requirePagePermission';

// --- Components for this specific dashboard layout ---

function TopCard({ icon, title, value, subtext }: { icon?: string; title: string; value: React.ReactNode; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-center h-full">
      <div className="mb-2 text-sm font-semibold text-slate-500 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </div>
      <div className="text-3xl font-extrabold text-slate-800">{value}</div>
      {subtext && <div className="mt-1 text-xs text-slate-400">{subtext}</div>}
    </div>
  );
}

function SectionSummary({ 
  label, 
  total, 
  checkpoint, 
  lastUpdate, 
  yesterdayTotal 
}: { 
  label: string; 
  total: number; 
  checkpoint: string; 
  lastUpdate: string; 
  yesterdayTotal: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-center h-full min-h-[240px]">
      <div className="mb-4 flex items-center gap-2 rounded bg-blue-50 px-3 py-1 text-blue-700">
        <span className="text-lg">⬇️</span>
        <span className="font-bold">{label}</span>
      </div>
      
      <div className="mb-2 text-lg text-slate-700">
        รวมทั้งหมดวันนี้: <span className="font-extrabold text-emerald-500 text-2xl">{total.toLocaleString()}</span> คัน
      </div>
      
      <div className="space-y-1 text-sm text-slate-600">
        <div>จุดตรวจ: <span className="font-semibold">{checkpoint}</span></div>
        <div className="flex items-center justify-center gap-1">
          <span>⏱️ ล่าสุด:</span>
          <span className="font-mono">{lastUpdate}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
         <span className="font-bold text-slate-500">BACK</span> ยอดเมื่อวาน: <span className="font-bold text-slate-700">{yesterdayTotal}</span> คัน
      </div>
    </div>
  );
}

function VehicleStatBox({ icon, label, count, colorClass = "text-emerald-600" }: { icon: string; label: string; count: number; colorClass?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
       <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
         <span>{icon}</span> {label}
       </div>
       <div className={`text-2xl font-extrabold ${colorClass}`}>
         {count.toLocaleString()}
       </div>
    </div>
  );
}

// --- Main Page ---

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Clock tick
    const tick = () => {
      const now = new Date();
      // Format: 28 ม.ค. 2526, 10:49:58
      const dateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('th-TH', { hour12: false });
      setCurrentTime(`${dateStr}, ${timeStr}`);
    };
    tick(); // initial
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // MOCK DATA
  const mockChart1 = [
    { time: '0:00', value: 30 }, { time: '4:00', value: 20 }, { time: '8:00', value: 150 },
    { time: '12:00', value: 210 }, { time: '16:00', value: 180 }, { time: '20:00', value: 130 },
  ];
  const mockChart2 = [
    { time: '0:00', value: 10 }, { time: '4:00', value: 15 }, { time: '8:00', value: 80 },
    { time: '12:00', value: 120 }, { time: '16:00', value: 90 }, { time: '20:00', value: 50 },
  ];
  const mockChart3 = [
    { time: '0:00', value: 5 }, { time: '4:00', value: 8 }, { time: '8:00', value: 40 },
    { time: '12:00', value: 60 }, { time: '16:00', value: 45 }, { time: '20:00', value: 20 },
  ];

  return (
    <RequirePagePermission module="dashboard">
      <ClientLayout>
        <div className="space-y-6">
        
        <div className="flex items-center justify-between">
           <h1 className="text-xl font-bold text-slate-800">หน้าหลัก</h1>
           <a href="/" className="text-sm font-semibold text-blue-600 hover:underline">หน้าหลัก</a>
        </div>

        {/* Top Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TopCard 
            icon="🚗" 
            title="รถทั้งหมดวันนี้" 
            value={<span className="text-emerald-500">4,270</span>} 
          />
          <TopCard 
            icon="🕒" 
            title="เวลา ณ ตอนนี้" 
            value={currentTime || "Loading..."} 
          />
          <TopCard 
            icon="🔥" 
            title="เปลี่ยนแปลง" 
            value={<span className="text-emerald-500">0%</span>} 
          />
        </div>

        {/* Channel 1: ช่องทางเสาธง */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_1fr] gap-6">
          <SectionSummary 
             label="ช่องทางเสาธง (ขาเข้า)"
             total={2989}
             checkpoint="เสาธง"
             lastUpdate={currentTime.split(',')[1] || "-"}
             yesterdayTotal={0}
          />
          <div className="grid grid-cols-2 gap-4 h-full">
             <VehicleStatBox icon="🚗" label="รถส่วนบุคคล" count={1574} />
             <VehicleStatBox icon="🚛" label="รถบรรทุก" count={1158} />
             <VehicleStatBox icon="🚌" label="รถเกิน 7 คน" count={104} />
             <VehicleStatBox icon="🏍️" label="รถจักรยานยนต์" count={16} colorClass="text-yellow-600" />
          </div>
          <TrafficChart 
             title="กราฟ ช่องทางเสาธง" 
             data={mockChart1} 
             color="#10b981" 
          />
        </div>

        {/* Channel 2: ช่องทางใต้ */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_1fr] gap-6">
          <SectionSummary 
             label="ช่องทางใต้ (ขาเข้า)"
             total={850}
             checkpoint="ใต้"
             lastUpdate={currentTime.split(',')[1] || "-"}
             yesterdayTotal={0}
          />
          <div className="grid grid-cols-2 gap-4 h-full">
             <VehicleStatBox icon="🚗" label="รถส่วนบุคคล" count={500} />
             <VehicleStatBox icon="🚛" label="รถบรรทุก" count={300} />
             <VehicleStatBox icon="🚌" label="รถเกิน 7 คน" count={40} />
             <VehicleStatBox icon="🏍️" label="รถจักรยานยนต์" count={10} colorClass="text-yellow-600" />
          </div>
          <TrafficChart 
             title="กราฟ ช่องทางใต้" 
             data={mockChart2} 
             color="#3b82f6" // Blue
          />
        </div>

        {/* Channel 3: ช่องทางเหนือ */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_1fr] gap-6">
          <SectionSummary 
             label="ช่องทางเหนือ (ขาเข้า)"
             total={431}
             checkpoint="เหนือ"
             lastUpdate={currentTime.split(',')[1] || "-"}
             yesterdayTotal={0}
          />
          <div className="grid grid-cols-2 gap-4 h-full">
             <VehicleStatBox icon="🚗" label="รถส่วนบุคคล" count={300} />
             <VehicleStatBox icon="🚛" label="รถบรรทุก" count={100} />
             <VehicleStatBox icon="🚌" label="รถเกิน 7 คน" count={31} />
             <VehicleStatBox icon="🏍️" label="รถจักรยานยนต์" count={0} colorClass="text-yellow-600" />
          </div>
          <TrafficChart 
             title="กราฟ ช่องทางเหนือ" 
             data={mockChart3} 
             color="#f59e0b" // Amber
          />
        </div>

      </div>
      </ClientLayout>
    </RequirePagePermission>
  );
}
