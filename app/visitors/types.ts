export interface VisitorData {
    visitor_id: string; // Document ID
    name: string;
    id_card?: string;
    phone?: string;
    purpose: string;
    department: string;
    person_to_meet: string;
    gate: string;
    vehicle_type: string;
    plate: string;
    time_in: number;
    time_out?: number | null;
    status: "ปกติ" | "ออกแล้ว" | "อยู่เกินเวลา" | "ต้องสงสัย";
    image_url?: string;
    image_path?: string;
    
    // Scoping & Audit
    unit: string;
    unit_code: string;
    unit_name_th: string;
    created_by_uid: string;
    created_by_name: string;
    created_at: number;
    updated_by_uid?: string;
    updated_by_name?: string;
    updated_at: number;
}

export interface VisitorFormState {
    name: string;
    id_card: string;
    phone: string;
    purpose: string;
    department: string;
    person_to_meet: string;
    gate: string;
    vehicle_type: string;
    plate: string;
    image: File | null;
    unit_code: string;
    unit_name_th: string;
}

export const VISITOR_PURPOSE_OPTIONS = [
    "ติดต่อหน่วยงาน",
    "ติดต่อส่งพัสดุ/เอกสาร/อาหาร",
    "เยี่ยมญาติ/ทหารใหม่",
    "รับเหมาซ่อมแซม/ปรับปรุง",
    "อื่น ๆ"
];

export const GATE_OPTIONS = [
    "ช่องทางเสาธง (Main)",
    "ช่องทางใต้ (South)",
    "ช่องทางเหนือ (North)",
    "ช่องยุทธยศ"
];

export const VISITOR_VEHICLE_OPTIONS = [
    "เดินเท้า",
    "จักรยานยนต์",
    "รถเก๋ง",
    "รถกระบะ/SUV",
    "รถบรรทุก",
    "อื่น ๆ"
];
