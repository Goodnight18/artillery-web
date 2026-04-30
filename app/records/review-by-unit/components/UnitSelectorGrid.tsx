"use client";

import React, { useState } from "react";
import { Building2, Search, ChevronRight, Hash, AlertCircle, Clock } from "lucide-react";
import { UnitSummaryItem } from "@/lib/records/processUnitSummary";

interface Props {
    units: UnitSummaryItem[];
    onSelectUnit: (unitCode: string) => void;
}

export default function UnitSelectorGrid({ units, onSelectUnit }: Props) {
    const [search, setSearch] = useState("");

    const filteredUnits = units.filter(u => 
        u.unit_name_th.toLowerCase().includes(search.toLowerCase()) || 
        u.unit_code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search Input */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาหน่วยงานที่ส่งข้อมูลร่างเข้ามา..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                        <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-bold">ไม่พบหน่วยงานที่มีงานค้างส่งเข้ามา</p>
                    </div>
                ) : (
                    filteredUnits.map((unit) => (
                        <button 
                            key={unit.unit_code}
                            onClick={() => onSelectUnit(unit.unit_code)}
                            className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all text-left flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                                    <Building2 size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{unit.unit_name_th}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Hash size={10} />
                                            {unit.unit_code}
                                        </span>
                                        {unit.pendingRecords > 0 && (
                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black flex items-center gap-1 border border-amber-100">
                                                <Clock size={10} />
                                                รอตรวจ {unit.pendingRecords}
                                            </span>
                                        )}
                                        {unit.incompleteRecords > 0 && (
                                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black flex items-center gap-1 border border-rose-100">
                                                <AlertCircle size={10} />
                                                ไม่ครบ {unit.incompleteRecords}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
