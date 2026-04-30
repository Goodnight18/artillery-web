import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedProps {
  requestedModule?: string;
}

export default function AccessDenied({ requestedModule }: AccessDeniedProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm border border-slate-100 text-center flex flex-col items-center">
        <div className="mb-6 rounded-full bg-red-50 p-4">
          <ShieldAlert size={48} className="text-red-500" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-slate-800">ปฏิเสธการเข้าถึง</h1>
        <p className="mb-8 text-slate-500">
          บัญชีของคุณไม่มีสิทธิ์เพียงพอในการเข้าถึงหน้าที่ร้องขอ 
          {requestedModule ? <span className="block mt-1 text-xs px-2 py-1 bg-slate-100 rounded text-slate-400 font-mono">Module: {requestedModule}</span> : ''}
        </p>

        <Link 
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          <ArrowLeft size={16} />
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
