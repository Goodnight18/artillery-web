import React from 'react';
import { FormState } from "../../types";

interface UnitSelectionProps {
    form: FormState;
    errors: Record<string, string>;
    handleChange: (field: keyof FormState, value: any) => void;
    canSelectUnit: boolean;
    dynamicUnits: Array<{ code: string; name_th: string }>;
    loadingUnits: boolean;
}

export default function UnitSelection({
    form,
    errors,
    handleChange,
    canSelectUnit,
    dynamicUnits,
    loadingUnits
}: UnitSelectionProps) {
    if (!canSelectUnit) return null;

    return (
        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mb-6 shadow-sm">
            <label className="block text-sm font-bold text-blue-800 mb-2.5">
                หน่วยที่รับผิดชอบ (สำหรับ Admin) <span className="text-red-500">*</span>
            </label>
            <select
                value={form.unit_code}
                onChange={(e) => {
                    const unit = dynamicUnits.find(u => u.code === e.target.value);
                    handleChange('unit_code', e.target.value);
                    handleChange('unit_name_th', unit?.name_th || "");
                }}
                className={`w-full px-4 py-2.5 bg-white border ${errors.unit_code ? 'border-red-500' : 'border-blue-200'} rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 font-semibold outline-none transition-all shadow-sm`}
            >
                <option value="">-- เลือกหน่วยงานที่ข้อมูลนี้สังกัด --</option>
                {loadingUnits ? (
                    <option disabled>กำลังโหลดหน่วยงาน...</option>
                ) : (
                    dynamicUnits.map(unit => (
                        <option key={unit.code} value={unit.code}>{unit.name_th} ({unit.code})</option>
                    ))
                )}
            </select>
            {errors.unit_code && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.unit_code}</p>}
            <div className="mt-3 flex items-start gap-2 bg-white/60 p-2 rounded-lg">
                <div className="text-blue-500 mt-0.5 whitespace-nowrap">💡</div>
                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                    ในฐานะ Admin คุณต้องระบุหน่วยงานให้ถูกต้อง เพื่อให้เจ้าหน้าที่ประจำหน่วยนั้นๆ สามารถมองเห็นและจัดการข้อมูลชุดนี้ได้
                </p>
            </div>
        </div>
    );
}
