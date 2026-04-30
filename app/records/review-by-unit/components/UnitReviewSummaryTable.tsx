"use client";

import React from "react";
import { UnitSummaryItem } from "@/lib/records/processUnitSummary";
import { ChevronRight, FileCheck, FileWarning, Eye, CameraOff } from "lucide-react";

interface Props {
    summaries: UnitSummaryItem[];
    onSelectUnit: (unitCode: string) => void;
}

export default function UnitReviewSummaryTable({ summaries, onSelectUnit }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">หน่วยงาน / พื้นที่</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ทั้งหมด</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center text-amber-600">รอตรวจ</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center text-emerald-600">ครบถ้วน</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center text-rose-600">ขาดข้อมูล</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ขาดรูปภาพ</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {summaries.map((unit) => (
                            <tr key={unit.unit_code} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{unit.unit_name_th}</div>
                                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">{unit.unit_code}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                                        {unit.totalRecords}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2 py-0.5 ${unit.pendingRecords > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'} text-xs font-bold rounded-full`}>
                                        {unit.pendingRecords}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <div className="text-xs font-bold text-emerald-600">{unit.completeRecords}</div>
                                        <FileCheck size={12} className="text-emerald-400" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <div className={`text-xs font-bold ${unit.incompleteRecords > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{unit.incompleteRecords}</div>
                                        <FileWarning size={12} className={unit.incompleteRecords > 0 ? 'text-rose-400' : 'text-slate-200'} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="flex flex-col items-center" title="ขาดรูปรถ">
                                            <span className={`text-[10px] font-bold ${unit.missingVehiclePhotoCount > 0 ? 'text-orange-600' : 'text-slate-300'}`}>{unit.missingVehiclePhotoCount}</span>
                                            <CameraOff size={10} className={unit.missingVehiclePhotoCount > 0 ? 'text-orange-400' : 'text-slate-200'} />
                                        </div>
                                        <div className="flex flex-col items-center" title="ขาดรูปบุคคล">
                                            <span className={`text-[10px] font-bold ${unit.missingPersonPhotoCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{unit.missingPersonPhotoCount}</span>
                                            <CameraOff size={10} className={unit.missingPersonPhotoCount > 0 ? 'text-blue-400' : 'text-slate-200'} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onSelectUnit(unit.unit_code)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold rounded-lg transition-all"
                                    >
                                        <Eye size={14} />
                                        รายละเอียด
                                        <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
