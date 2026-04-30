import React from 'react';
import { HeartHandshake } from "lucide-react";
import { FormState, RELATIONSHIP_OPTIONS } from "../../types";

interface RelationshipFieldsProps {
    form: FormState;
    errors: Record<string, string>;
    handleChange: (field: keyof FormState, value: any) => void;
    showRelationshipSection: boolean;
}

export default function RelationshipFields({ form, errors, handleChange, showRelationshipSection }: RelationshipFieldsProps) {
    if (!showRelationshipSection) return null;

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <HeartHandshake className="text-blue-500" size={20} />
                <h3 className="text-base font-semibold text-gray-800">B. ข้อมูลความสัมพันธ์</h3>
            </div>
            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">ชื่อบุคคลอ้างอิง/รับรอง <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        placeholder="จ.ส.อ.สมชาย ใจดี" 
                        value={form.sponsor_person_id} 
                        onChange={e => handleChange('sponsor_person_id', e.target.value)} 
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900 ${errors.sponsor_person_id ? 'border-red-400' : 'border-gray-300'}`} 
                    />
                    {errors.sponsor_person_id && <p className="text-xs text-red-500">{errors.sponsor_person_id}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">ความสัมพันธ์</label>
                        <select 
                            value={form.relationship_type} 
                            onChange={e => handleChange('relationship_type', e.target.value)} 
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white text-gray-900 ${errors.relationship_type ? 'border-red-400' : 'border-gray-300'}`}
                        >
                            {RELATIONSHIP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">รายละเอียดเพิ่มเติม</label>
                        <input 
                            type="text" 
                            value={form.relationship_note} 
                            onChange={e => handleChange('relationship_note', e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
