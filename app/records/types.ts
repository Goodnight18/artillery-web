export interface RecordData {
    record_id: string;
    prefix: string;
    rank: string;
    first_name: string;
    last_name: string;
    unit: string;
    unit_code?: string;
    unit_name_th?: string;
    phone: string;
    person_type: string;
    sponsor_person_id: string;
    relationship_type: string;
    relationship_note: string;
    
    plateCategory: string;
    plateLeadingDigit: string;
    platePrefix: string;
    plateNumber: string;
    plateProvince: string;
    plateFullDisplay: string;
    plateLeadingDigitNormalized: string;
    platePrefixNormalized: string;
    plateNumberNormalized: string;
    plateProvinceNormalized: string;
    plateSearchKey: string;
    plateSearchKeyWithProvince: string;
    

    vehicle_type: string;
    brand: string;
    model: string;
    color: string;
    person_photo_url: string;
    person_photo_path?: string;
    vehicle_photo_front_url: string;
    vehicle_photo_front_path?: string;
    vehicle_photo_back_url: string;
    vehicle_photo_back_path?: string;
    status: string;
    remark: string;
    
    // Audit Fields
    created_by_uid: string;
    created_by_name: string;
    created_at: number;
    updated_by_uid?: string;
    updated_by_name?: string;
    updated_at: number;

    // Reliability & Completeness
    is_complete?: boolean;
    missing_fields?: string[];
}

export interface FormState {
    prefix: string;
    rank: string;
    first_name: string;
    last_name: string;
    phone: string;
    person_type: string;
    sponsor_person_id: string;
    relationship_type: string;
    relationship_note: string;
    
    plateCategory: string;
    plateLeadingDigit: string;
    platePrefix: string;
    plateNumber: string;
    plateProvince: string;

    vehicle_type: string;
    brand: string;
    model: string;
    color: string;
    person_photo: File | null;
    vehicle_photo_front: File | null;
    vehicle_photo_back: File | null;
    status: string;
    remark: string;
    unit_code: string;
    unit_name_th: string;
}

export const PREFIX_OPTIONS = ["นาย", "นาง", "นางสาว", "เด็กชาย", "เด็กหญิง", "ไม่ระบุ"];
export const RANK_OPTIONS = ["ไม่มียศ","ว่าที่ ร.ต.","ว่าที่ ร.ต.หญิง", "พลฯ", "ส.ต.","ส.ต.หญิง", "ส.ท.","ส.ท.หญิง", "ส.อ.","ส.อ.หญิง", "จ.ส.ต.","จ.ส.ต.หญิง", "จ.ส.ท.","จ.ส.ท.หญิง", "จ.ส.อ.","จ.ส.อ.หญิง", "ร.ต.","ร.ต.หญิง", "ร.ท.","ร.ท.หญิง", "ร.อ.","ร.อ.หญิง", "พ.ต.","พ.ต.หญิง", "พ.ท.","พ.ท.หญิง", "พ.อ.","พ.อ.หญิง","พล.ต.","พล.ท.", "พล.อ.", "อื่น ๆ"];
export const PERSON_TYPE_OPTIONS = ["กำลังพล", "ครอบครัวกำลังพล", "บุคคลภายนอก", "ติดต่อราชการ", "รถส่วนราชการ"];
export const RELATIONSHIP_OPTIONS = ["คู่สมรส", "บุตร", "บิดา", "มารดา", "พี่น้อง", "ญาติ", "ผู้อุปการะ", "ผู้ติดตาม", "อื่น ๆ"];
export const VEHICLE_TYPE_OPTIONS = ["รถยนต์", "รถจักรยานยนต์", "รถบรรทุก", "รถส่วนราชการ", "อื่น ๆ"];
export const STATUS_OPTIONS = [
    { value: "draft", label: "แบบร่าง (Draft)" },
    { value: "pending_review", label: "รอตรวจสอบ (Pending Review)" },
    { value: "approved", label: "อนุมัติ (Approved)" },
    { value: "needs_revision", label: "รอสับเปลี่ยน (Needs Revision)" },
    { value: "rejected", label: "ปฏิเสธ (Rejected)" },
    { value: "disabled", label: "ยกเลิกการอนุญาต (Disabled)" }
];

export const getStatusBadgeClass = (status: string) => {
    switch(status) {
        case 'approved':
            return "bg-green-100 text-green-800 border-green-200";
        case 'pending_review':
            return "bg-amber-100 text-amber-800 border-amber-200";
        case 'needs_revision':
            return "bg-orange-100 text-orange-800 border-orange-200";
        case 'rejected':
            return "bg-red-100 text-red-800 border-red-200";
        case 'disabled':
            return "bg-slate-900 text-white border-slate-900 uppercase font-black";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

export const getStatusLabel = (status: string) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.label.split(" ")[0] : status;
};

export const buildDisplayName = (record: RecordData) => {
    if (record.person_type === "รถส่วนราชการ") return "รถส่วนราชการ";
    const title = (record.rank && record.rank !== "ไม่มียศ") ? record.rank : (record.prefix || "");
    return `${title} ${record.first_name} ${record.last_name}`.trim();
};
