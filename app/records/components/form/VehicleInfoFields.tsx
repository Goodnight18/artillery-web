import React from 'react';
import { Car } from "lucide-react";
import { FormState, VEHICLE_TYPE_OPTIONS } from "../../types";
import { THAI_PROVINCES } from "../../constants/provinces";
import { VEHICLE_MASTER_DATA } from "../../constants/vehicles";
import SearchableCombobox from "../SearchableCombobox";

interface VehicleInfoFieldsProps {
    form: FormState;
    errors: Record<string, string>;
    handleChange: (field: keyof FormState, value: any) => void;
    isGovVehicle: boolean;
}

export default function VehicleInfoFields({ form, errors, handleChange, isGovVehicle }: VehicleInfoFieldsProps) {
    // Determine available brands and models based on vehicle type
    const categoryData = VEHICLE_MASTER_DATA[form.vehicle_type] || { brands: [], models: {} };
    const brandOptions = categoryData.brands;
    const modelOptions = categoryData.models[form.brand] || [];

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Car className="text-blue-500" size={20} />
                <h3 className="text-base font-semibold text-gray-800">C. ข้อมูลรถยานพาหนะ</h3>
            </div>

            {/* Plate Information Matrix */}
            {isGovVehicle ? (
                <div className="space-y-1.5 mb-4 animate-in fade-in duration-300">
                    <label className="text-sm font-medium text-gray-700">เลขทะเบียนราชการ <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={form.plateNumber} 
                        onChange={e => handleChange('plateNumber', e.target.value)} 
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900 ${errors.plateNumber ? 'border-red-400' : 'border-gray-300'}`} 
                        placeholder="เช่น ๑๒๓๔๕ หรือ 12345" 
                        autoComplete="off"
                    />
                    {errors.plateNumber && <p className="text-xs text-red-500">{errors.plateNumber}</p>}
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-2 sm:gap-4 mb-4 animate-in fade-in duration-300 bg-gray-50/50 p-4 border border-gray-100 rounded-xl">
                    <div className="col-span-3 sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 leading-tight">เลขนำหน้า<br/><span className="text-[10px] font-normal">(ถ้ามี)</span></label>
                        <input 
                            type="text" 
                            value={form.plateLeadingDigit} 
                            onChange={e => handleChange('plateLeadingDigit', e.target.value)} 
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-gray-900 transition-colors" 
                            placeholder="1" 
                            maxLength={2}
                            autoComplete="off"
                        />
                    </div>
                    <div className="col-span-4 sm:col-span-3 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 leading-tight">หมวดอักษร<br/><span className="text-red-500 text-[10px]">* จำเป็น</span></label>
                        <input 
                            type="text" 
                            value={form.platePrefix} 
                            onChange={e => handleChange('platePrefix', e.target.value)} 
                            className={`w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-gray-900 transition-colors ${errors.platePrefix ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} 
                            placeholder="กข" 
                            maxLength={4}
                            autoComplete="off"
                        />
                    </div>
                    <div className="col-span-5 sm:col-span-7 space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 leading-tight">เลขทะเบียน<br/><span className="text-red-500 text-[10px]">* จำเป็น</span></label>
                        <input 
                            type="text" 
                            value={form.plateNumber} 
                            onChange={e => handleChange('plateNumber', e.target.value)} 
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900 transition-colors ${errors.plateNumber ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} 
                            placeholder="1234" 
                            maxLength={6}
                            autoComplete="off"
                        />
                    </div>

                    <div className="col-span-12 space-y-1.5 pt-2">
                        <label className="text-xs font-semibold text-gray-500">หมวดจังหวัด <span className="text-red-500">*</span></label>
                        <SearchableCombobox
                            value={form.plateProvince} 
                            options={THAI_PROVINCES}
                            onChange={(val) => handleChange('plateProvince', val)} 
                            placeholder="พิมพ์หรือเลือกจังหวัด เช่น กรุงเทพมหานคร"
                            error={errors.plateProvince} 
                        />
                        {errors.plateProvince && <p className="text-xs text-red-500">{errors.plateProvince}</p>}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">ประเภท</label>
                    <select 
                        value={form.vehicle_type} 
                        onChange={e => handleChange('vehicle_type', e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white text-gray-900"
                    >
                        {VEHICLE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">ยี่ห้อ</label>
                    <SearchableCombobox
                        value={form.brand}
                        options={brandOptions}
                        onChange={(val) => { handleChange('brand', val); handleChange('model', ''); }}
                        placeholder="เช่น Toyota, Honda"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">รุ่น</label>
                    <SearchableCombobox
                        value={form.model}
                        options={modelOptions}
                        onChange={(val) => handleChange('model', val)}
                        placeholder={(form.brand && modelOptions.length > 0) ? "เลือกรุ่น/พิมพ์ค้นหา..." : "ไม่มีข้อมูลรุ่น/กรุณาเลือกยี่ห้อก่อน..."}
                    />
                </div>
                <div className="space-y-1.5 col-span-3 lg:col-span-1">
                    <label className="text-sm font-medium text-gray-700">สีรถ</label>
                    <input 
                        type="text" 
                        value={form.color} 
                        onChange={e => handleChange('color', e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900" 
                    />
                </div>
            </div>
        </div>
    );
}
