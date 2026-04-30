/**
 * Utility to check the completeness of a record.
 * Returns an object with isComplete and a list of missing fields.
 */
export interface RecordCompleteness {
    isComplete: boolean;
    missingFields: string[];
}

export function checkRecordCompleteness(data: any): RecordCompleteness {
    const missingFields: string[] = [];
    const isGovPerson = data.person_type === "รถส่วนราชการ";
    const isGovVehicle = data.person_type === "รถส่วนราชการ" || data.vehicle_type === "รถส่วนราชการ";

    // A. Person Info
    if (!isGovPerson) {
        if (!data.first_name?.trim()) missingFields.push("ชื่อ");
        if (!data.last_name?.trim()) missingFields.push("นามสกุล");
        if (!data.rank?.trim()) missingFields.push("ยศ");
        if (!data.person_photo_url) missingFields.push("รูปถ่ายบุคคล");
        
        if (data.person_type !== "กำลังพล") {
            if (!data.sponsor_person_id?.trim()) missingFields.push("บุคคลอ้างอิง");
            if (!data.relationship_type?.trim()) missingFields.push("ความสัมพันธ์");
        }
    }

    // B. Vehicle Info
    if (isGovVehicle) {
        if (!data.plateNumber?.trim()) missingFields.push("เลขทะเบียนราชการ");
    } else {
        if (!data.platePrefix?.trim()) missingFields.push("หมวดอักษร");
        if (!data.plateNumber?.trim()) missingFields.push("เลขทะเบียน");
        if (!data.plateProvince?.trim()) missingFields.push("จังหวัด");
    }

    if (!data.brand?.trim()) missingFields.push("ยี่ห้อรถ");
    if (!data.color?.trim()) missingFields.push("สีรถ");
    if (!data.vehicle_photo_front_url) missingFields.push("รูปถ่ายรถ (ด้านหน้า)");
    if (!data.vehicle_photo_back_url) missingFields.push("รูปถ่ายรถ (ด้านหลัง)");

    return {
        isComplete: missingFields.length === 0,
        missingFields
    };
}
