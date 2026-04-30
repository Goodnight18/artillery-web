export interface UnitOption {
    code: string;
    name_th: string;
}

/**
 * Central list of authorized units.
 * In a production system, this could be fetched from a 'units' collection in Firestore.
 */
export const AUTHORIZED_UNITS: UnitOption[] = [
    { code: "HQ_CENTRAL", name_th: "บก.ศป." },
    { code: "SCHOOL_ART", name_th: "รร.ป.ศป." },
    { code: "REG_STUDENT", name_th: "กรม นร.รร.ป.ศป." },
    { code: "DEPT_EDU", name_th: "กศ.รร.ป.ศป." },
    { code: "DEPT_ACAD", name_th: "กวก.ศป." },
    { code: "DEPT_SERV", name_th: "กบร.ศป." },
    { code: "DEPT_TRAIN", name_th: "กชฝ.ศป." },
    { code: "BN_SERV", name_th: "พัน.บร.ศป." },
    { code: "BN_ART", name_th: "พัน.ป.ศป." },
    { code: "MED_UNIT", name_th: "หน่วยตรวจโรค ศป." },
    { code: "SCHOOL_JOINT", name_th: "รร.สองเหล่าสร้างฯ" },
    { code: "BN_MAINT", name_th: "พัน.ซบร.บ.ทบ." },
    { code: "AA_1_3", name_th: "ปตอ.1 พัน. 3" },
    { code: "ART_1_31_ROW", name_th: "ป. 1 พัน. 31 รอ." },
    { code: "AVIATION", name_th: "ศบบ." },
    { code: "ART_DIV", name_th: "พล.ป." },
    { code: "WING_2", name_th: "บน. 2" },
    { code: "DEPT_LOG", name_th: "กสยป.ศป." },
];

export const getUnitNameByCode = (code: string): string => {
    return AUTHORIZED_UNITS.find(u => u.code === code)?.name_th || code;
};
