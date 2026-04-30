"use client";

import React from "react";
import { Save, RefreshCcw, Loader2, CheckCircle2, XCircle, X, Edit2 } from "lucide-react";
import { RecordData } from "../types";
import { useAuth } from "@/context/AuthContext";
import { useUnits } from "@/hooks/useUnits";

import { useRecordForm } from "../hooks/useRecordForm";
import UnitSelection from "./form/UnitSelection";
import PersonalInfoFields from "./form/PersonalInfoFields";
import RelationshipFields from "./form/RelationshipFields";
import VehicleInfoFields from "./form/VehicleInfoFields";
import PhotoStatusFields from "./form/PhotoStatusFields";

interface RecordFormProps {
    onSuccess: () => void;
    initialData?: RecordData | null;
    onCancelEdit?: () => void;
}

export default function RecordForm({ onSuccess, initialData, onCancelEdit }: RecordFormProps) {
    const { isAdmin, isSuperAdmin } = useAuth();
    const { units: dynamicUnits, loadingUnits } = useUnits();
    
    // Abstracted Logic
    const {
        form,
        errors,
        saving,
        uploadProgress,
        submitMessage,
        canSelectUnit,
        handlers,
        flags
    } = useRecordForm({ initialData, onSuccess, onCancelEdit });

    const showRelationshipSection = form.person_type !== "กำลังพล" && form.person_type !== "รถส่วนราชการ";
    const isGovVehicle = form.person_type === 'รถส่วนราชการ' || form.vehicle_type === 'รถส่วนราชการ';

    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden relative transition-colors ${initialData ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-100'}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${initialData ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-gray-100'}`}>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${initialData ? 'text-amber-800' : 'text-gray-900'}`}>
                    {initialData ? (
                        <>
                            <Edit2 size={20} className="text-amber-600" />
                            แก้ไขข้อมูลเดิม
                        </>
                    ) : (
                        "เพิ่มข้อมูลใหม่"
                    )}
                </h2>
                {initialData && onCancelEdit && (
                    <button onClick={onCancelEdit} type="button" className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>
            
            {saving && uploadProgress && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                    <p className="text-blue-900 font-medium">{uploadProgress}</p>
                </div>
            )}

            <form onSubmit={handlers.handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-8">
                        <UnitSelection 
                            form={form}
                            errors={errors}
                            handleChange={handlers.handleChange}
                            canSelectUnit={canSelectUnit}
                            dynamicUnits={dynamicUnits}
                            loadingUnits={loadingUnits}
                        />

                        <PersonalInfoFields 
                            form={form}
                            errors={errors}
                            handleChange={handlers.handleChange}
                        />

                        <RelationshipFields 
                            form={form}
                            errors={errors}
                            handleChange={handlers.handleChange}
                            showRelationshipSection={showRelationshipSection}
                        />
                    </div>

                    <div className="space-y-8">
                        <VehicleInfoFields 
                            form={form}
                            errors={errors}
                            handleChange={handlers.handleChange}
                            isGovVehicle={isGovVehicle}
                        />

                        <PhotoStatusFields 
                            form={form}
                            handleChange={handlers.handleChange}
                            isAdmin={isAdmin}
                            isSuperAdmin={isSuperAdmin}
                            initialData={initialData}
                            flags={flags}
                            handlers={handlers}
                        />
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row justify-end gap-3 mt-6 border-t border-gray-100">
                    <button type="button" onClick={handlers.resetForm} disabled={saving} className={`px-6 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 text-gray-700 hover:bg-gray-100 border border-gray-300`}>
                        <span className="flex items-center justify-center">
                            {initialData ? <X size={18} className="mr-2" /> : <RefreshCcw size={18} className="mr-2" />}
                            {initialData ? "ยกเลิกแก้ไข" : "ล้างข้อมูล"}
                        </span>
                    </button>
                    <button type="submit" disabled={saving} className={`px-6 py-2.5 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        <span className="flex items-center justify-center">
                            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                            {initialData ? "อัปเดตข้อมูล" : "บันทึกข้อมูล"}
                        </span>
                    </button>
                </div>
            </form>
            
            {submitMessage && (
                <div className={`absolute bottom-4 right-4 sm:top-4 sm:bottom-auto flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white font-medium animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4 duration-300 z-50 ${submitMessage.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
                    {submitMessage.type === "success" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    <span>{submitMessage.message}</span>
                </div>
            )}
        </div>
    );
}
