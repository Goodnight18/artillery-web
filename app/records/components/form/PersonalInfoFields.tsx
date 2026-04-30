import React from 'react';
import { UserCircle } from "lucide-react";
import { FormState, PERSON_TYPE_OPTIONS, RANK_OPTIONS, PREFIX_OPTIONS } from "../../types";

interface PersonalInfoFieldsProps {
    form: FormState;
    errors: Record<string, string>;
    handleChange: (field: keyof FormState, value: any) => void;
}

export default function PersonalInfoFields({ form, errors, handleChange }: PersonalInfoFieldsProps) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserCircle className="text-blue-500" size={20} />
                <h3 className="text-base font-semibold text-gray-800">A. ข้อมูลบุคคล</h3>
            </div>

            <div className="space-y-1.5 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="text-sm font-medium text-gray-700">ประเภทบุคคล <span className="text-red-500">*</span></label>
                <select 
                    value={form.person_type} 
                    onChange={e => handleChange('person_type', e.target.value)} 
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white text-gray-900 shadow-sm ${errors.person_type ? 'border-red-400' : 'border-gray-200'}`}
                >
                    {PERSON_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {errors.person_type && <p className="text-xs text-red-500">{errors.person_type}</p>}
            </div>
            
            {form.person_type !== "รถส่วนราชการ" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                            <label className="text-sm font-medium text-gray-700">ยศ <span className="text-red-500">*</span></label>
                            <select 
                                value={form.rank} 
                                onChange={e => handleChange('rank', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white text-gray-900"
                            >
                                {RANK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        {form.rank === 'ไม่มียศ' && (
                            <div className="space-y-1.5 col-span-2 sm:col-span-1 animate-in fade-in duration-200">
                                <label className="text-sm font-medium text-gray-700">คำนำหน้า <span className="text-red-500">*</span></label>
                                <select 
                                    value={form.prefix} 
                                    onChange={e => handleChange('prefix', e.target.value)} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white text-gray-900"
                                >
                                    {PREFIX_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">ชื่อ <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={form.first_name} 
                                onChange={e => handleChange('first_name', e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900 ${errors.first_name ? 'border-red-400' : 'border-gray-300'}`} 
                            />
                            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={form.last_name} 
                                onChange={e => handleChange('last_name', e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900 ${errors.last_name ? 'border-red-400' : 'border-gray-300'}`} 
                            />
                            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                            <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                            <input 
                                type="tel" 
                                value={form.phone} 
                                onChange={e => handleChange('phone', e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
