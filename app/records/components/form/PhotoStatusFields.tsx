import React from 'react';
import { FileText } from "lucide-react";
import { FormState, STATUS_OPTIONS, RecordData } from "../../types";
import ImageUploadField from "../ImageUploadField";

interface PhotoStatusFieldsProps {
    form: FormState;
    handleChange: (field: keyof FormState, value: any) => void;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    initialData?: RecordData | null;
    flags: {
        removedPersonPhoto: boolean;
        removedVehiclePhotoFront: boolean;
        removedVehiclePhotoBack: boolean;
    };
    handlers: {
        setRemovedPersonPhoto: (val: boolean) => void;
        setRemovedVehiclePhotoFront: (val: boolean) => void;
        setRemovedVehiclePhotoBack: (val: boolean) => void;
    };
}

export default function PhotoStatusFields({ 
    form, 
    handleChange, 
    isAdmin, 
    isSuperAdmin, 
    initialData,
    flags,
    handlers
}: PhotoStatusFieldsProps) {
    const vehicleImageOrientation = form.vehicle_type === 'รถจักรยานยนต์' ? "portrait" : "landscape";

    return (
        <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="text-blue-500" size={20} />
                <h3 className="text-base font-semibold text-gray-800">D. รูปภาพและสถานะ</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {form.person_type !== "รถส่วนราชการ" && (
                    <ImageUploadField 
                        label="รูปถ่ายบุคคล"
                        orientation="portrait"
                        currentFile={form.person_photo}
                        onFileSelect={(f) => handleChange("person_photo", f)}
                        existingUrl={!flags.removedPersonPhoto && initialData?.person_photo_url ? initialData.person_photo_url : undefined}
                        onClearExisting={() => handlers.setRemovedPersonPhoto(true)}
                    />
                )}
                <ImageUploadField 
                    label="รูปถ่ายหน้ารถ"
                    orientation={vehicleImageOrientation}
                    currentFile={form.vehicle_photo_front}
                    onFileSelect={(f) => handleChange("vehicle_photo_front", f)}
                    existingUrl={!flags.removedVehiclePhotoFront && initialData?.vehicle_photo_front_url ? initialData.vehicle_photo_front_url : undefined}
                    onClearExisting={() => handlers.setRemovedVehiclePhotoFront(true)}
                />
                <ImageUploadField 
                    label="รูปถ่ายท้ายรถ"
                    orientation={vehicleImageOrientation}
                    currentFile={form.vehicle_photo_back}
                    onFileSelect={(f) => handleChange("vehicle_photo_back", f)}
                    existingUrl={!flags.removedVehiclePhotoBack && initialData?.vehicle_photo_back_url ? initialData.vehicle_photo_back_url : undefined}
                    onClearExisting={() => handlers.setRemovedVehiclePhotoBack(true)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-6">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">สถานะบันทึก</label>
                    <select 
                        value={form.status} 
                        onChange={e => handleChange('status', e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all bg-white text-gray-900 font-medium"
                    >
                        {STATUS_OPTIONS.filter(opt => {
                            if (isAdmin || isSuperAdmin) return true;
                            // Non-admins (data_entry, etc.) can only select draft or pending_review
                            if (['approved', 'rejected', 'needs_revision'].includes(opt.value)) {
                                return form.status === opt.value;
                            }
                            return true;
                        }).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">หมายเหตุเพิ่มเติม</label>
                    <textarea 
                        rows={2} 
                        value={form.remark} 
                        onChange={e => handleChange('remark', e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900 resize-none" 
                    />
                </div>
            </div>
        </div>
    );
}
