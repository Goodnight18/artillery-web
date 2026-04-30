import { useState, useEffect } from "react";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
    FormState,
    RecordData,
    PREFIX_OPTIONS,
    RANK_OPTIONS,
    PERSON_TYPE_OPTIONS,
    VEHICLE_TYPE_OPTIONS
} from "../types";
import { compressImage } from "@/lib/browserImageCompression";
import { uploadImageToStorage, deleteOldImageIfNeeded } from "@/lib/storageHelper";
import { buildPlateSearchKeys } from "@/lib/plate/buildPlateSearchKeys";
import { checkRecordCompleteness } from "@/lib/validationHelper";
import { writeAuditLog } from "@/lib/audit";
import { buildDisplayName } from "../types";

export const initialFormState: FormState = {
    prefix: PREFIX_OPTIONS[0],
    rank: RANK_OPTIONS[0],
    first_name: "",
    last_name: "",
    phone: "",
    person_type: PERSON_TYPE_OPTIONS[0],
    sponsor_person_id: "",
    relationship_type: "",
    relationship_note: "",
    plateCategory: "private",
    plateLeadingDigit: "",
    platePrefix: "",
    plateNumber: "",
    plateProvince: "",
    vehicle_type: VEHICLE_TYPE_OPTIONS[0],
    brand: "",
    model: "",
    color: "",
    person_photo: null,
    vehicle_photo_front: null,
    vehicle_photo_back: null,
    status: "draft",
    remark: "",
    unit_code: "",
    unit_name_th: ""
};

interface UseRecordFormProps {
    initialData?: RecordData | null;
    onSuccess: () => void;
    onCancelEdit?: () => void;
}

export function useRecordForm({ initialData, onSuccess, onCancelEdit }: UseRecordFormProps) {
    const { profile, isAdmin, isSuperAdmin } = useAuth();
    const canSelectUnit = isAdmin || isSuperAdmin;
    
    // State
    const [form, setForm] = useState<FormState>(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [submitMessage, setSubmitMessage] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Photo Flags
    const [removedPersonPhoto, setRemovedPersonPhoto] = useState(false);
    const [removedVehiclePhotoFront, setRemovedVehiclePhotoFront] = useState(false);
    const [removedVehiclePhotoBack, setRemovedVehiclePhotoBack] = useState(false);

    // Initialization
    useEffect(() => {
        if (initialData) {
            setForm({
                prefix: initialData.prefix || "",
                rank: initialData.rank || "",
                first_name: initialData.first_name || "",
                last_name: initialData.last_name || "",
                phone: initialData.phone || "",
                person_type: initialData.person_type || PERSON_TYPE_OPTIONS[0],
                sponsor_person_id: initialData.sponsor_person_id || "",
                relationship_type: initialData.relationship_type || "",
                relationship_note: initialData.relationship_note || "",
                plateCategory: initialData.plateCategory || "private",
                plateLeadingDigit: initialData.plateLeadingDigit || "",
                platePrefix: initialData.platePrefix || "",
                plateNumber: initialData.plateNumber || "",
                plateProvince: initialData.plateProvince || "",
                vehicle_type: initialData.vehicle_type || VEHICLE_TYPE_OPTIONS[0],
                brand: initialData.brand || "",
                model: initialData.model || "",
                color: initialData.color || "",
                person_photo: null,
                vehicle_photo_front: null,
                vehicle_photo_back: null,
                status: initialData.status || "draft",
                remark: initialData.remark || "",
                unit_code: initialData.unit_code || initialData.unit || "",
                unit_name_th: initialData.unit_name_th || ""
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setForm(initialFormState);
        }
        setErrors({});
        setUploadProgress("");
        setRemovedPersonPhoto(false);
        setRemovedVehiclePhotoFront(false);
        setRemovedVehiclePhotoBack(false);
    }, [initialData]);

    const showSubmitMessage = (message: string, type: "success" | "error") => {
        setSubmitMessage({ message, type });
        setTimeout(() => setSubmitMessage(null), 3000);
    };

    const resetForm = () => {
        if (initialData && onCancelEdit) {
            onCancelEdit();
            return;
        }
        setForm(initialFormState);
        setErrors({});
        setUploadProgress("");
        setRemovedPersonPhoto(false);
        setRemovedVehiclePhotoFront(false);
        setRemovedVehiclePhotoBack(false);
    };

    const handleChange = (field: keyof FormState, value: any) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            
            if (field === 'rank') {
                if (value !== 'ไม่มียศ') {
                    updated.prefix = '';
                } else if (!prev.prefix) {
                    updated.prefix = PREFIX_OPTIONS[0];
                }
            }

            if (field === 'person_type' && value === 'รถส่วนราชการ') {
                updated.prefix = '';
                updated.rank = 'ไม่มียศ';
                updated.first_name = '';
                updated.last_name = '';
                updated.phone = '';
                updated.sponsor_person_id = '';
                updated.relationship_type = '';
                updated.relationship_note = '';
                updated.person_photo = null;
                setRemovedPersonPhoto(true);

                updated.vehicle_type = 'รถส่วนราชการ';
                updated.plateCategory = 'government';
                updated.plateLeadingDigit = '';
                updated.platePrefix = '';
                updated.plateProvince = '';
            }
            
            if (field === 'vehicle_type') {
                if (value === 'รถส่วนราชการ') {
                    updated.plateCategory = 'government';
                    updated.plateLeadingDigit = '';
                    updated.platePrefix = '';
                    updated.plateProvince = '';
                } else {
                    updated.plateCategory = value === 'รถจักรยานยนต์' ? 'motorcycle' : 'private';
                }
                
                // Reset brand and model when vehicle type changes to prevent cross-category data pollution
                updated.brand = '';
                updated.model = '';
            }

            return updated;
        });
        
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const isOfficialPerson = form.person_type === "รถส่วนราชการ";
        const isOfficialVehicle = form.vehicle_type === "รถส่วนราชการ" || isOfficialPerson;

        // Validation
        const newErrors: Record<string, string> = {};
        if (!form.person_type.trim()) newErrors.person_type = "กรุณาเลือกประเภทบุคคล";
        
        if (isOfficialVehicle) {
            if (!form.plateNumber.trim()) newErrors.plateNumber = "กรุณากรอกเลขทะเบียนราชการ";
        } else {
            if (!form.platePrefix.trim()) newErrors.platePrefix = "กรุณากรอกหมวดอักษร";
            if (!form.plateNumber.trim()) newErrors.plateNumber = "กรุณากรอกเลขทะเบียน";
            if (!form.plateProvince.trim()) newErrors.plateProvince = "กรุณาเลือกหมวดจังหวัด";
        }

        if (!isOfficialPerson) {
            if (!form.first_name.trim()) newErrors.first_name = "กรุณากรอกชื่อ";
            if (!form.last_name.trim()) newErrors.last_name = "กรุณากรอกนามสกุล";

            if (form.person_type !== "กำลังพล") {
                if (!form.relationship_type.trim()) {
                    newErrors.relationship_type = "กรุณาเลือกความสัมพันธ์";
                }
                if (!form.sponsor_person_id.trim()) {
                    newErrors.sponsor_person_id = "กรุณากรอกชื่อบุคคลอ้างอิง";
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showSubmitMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
            return;
        }

        if (!profile?.uid) {
            showSubmitMessage("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่", "error");
            return;
        }

        // --- PRE-FLIGHT UNIT CHECK ---
        const effectiveUnitCode = canSelectUnit ? form.unit_code : (profile.unit_code || profile.unit || "");
        if (!effectiveUnitCode) {
            showSubmitMessage("บัญชีของคุณยังไม่ได้ระบุหน่วยงานต้นสังกัด กรุณาติดต่อผู้ดูแลระบบ", "error");
            setSaving(false);
            return;
        }

        setSaving(true);
        setUploadProgress(initialData ? "ประมวลผลการแก้ไขข้อมูล..." : "กำลังเตรียมบันทึกข้อมูล...");
        try {
            const now = Date.now();
            
            // Resolve working doc target
            const recordsRef = collection(db, "vehicle_records");
            const workingDocRef = initialData ? doc(db, "vehicle_records", initialData.record_id) : doc(recordsRef);
            const docId = workingDocRef.id;

            // Manage Photos
            let personPhotoUrl = initialData?.person_photo_url || "";
            let personPhotoPath = initialData?.person_photo_path || "";
            let vehiclePhotoFrontUrl = initialData?.vehicle_photo_front_url || "";
            let vehiclePhotoFrontPath = initialData?.vehicle_photo_front_path || "";
            let vehiclePhotoBackUrl = initialData?.vehicle_photo_back_url || "";
            let vehiclePhotoBackPath = initialData?.vehicle_photo_back_path || "";

            // If photo was removed or overwritten, delete old assets
            if ((removedPersonPhoto || form.person_photo) && initialData?.person_photo_path) {
                await deleteOldImageIfNeeded(initialData.person_photo_path);
                personPhotoUrl = "";
                personPhotoPath = "";
            }

            if ((removedVehiclePhotoFront || form.vehicle_photo_front) && initialData?.vehicle_photo_front_path) {
                await deleteOldImageIfNeeded(initialData.vehicle_photo_front_path);
                vehiclePhotoFrontUrl = "";
                vehiclePhotoFrontPath = "";
            }

            if ((removedVehiclePhotoBack || form.vehicle_photo_back) && initialData?.vehicle_photo_back_path) {
                await deleteOldImageIfNeeded(initialData.vehicle_photo_back_path);
                vehiclePhotoBackUrl = "";
                vehiclePhotoBackPath = "";
            }

            // Upload New Photos
            const uploadTasks: Promise<void>[] = [];

            if (form.person_photo && !isOfficialPerson) {
                uploadTasks.push(
                    (async () => {
                        setUploadProgress("กำลังบีบอัดและอัปโหลดรูปบุคคล...");
                        const compressedPerson = await compressImage(form.person_photo!, { maxWidthOrHeight: 1200, quality: 0.8, fileType: "image/jpeg" });
                        const pUpload = await uploadImageToStorage(compressedPerson, `records/persons/${docId}/person_${now}.jpg`);
                        personPhotoUrl = pUpload.downloadUrl;
                        personPhotoPath = pUpload.fullPath;
                    })()
                );
            }

            if (form.vehicle_photo_front) {
                uploadTasks.push(
                    (async () => {
                        setUploadProgress("กำลังบีบอัดและอัปโหลดรูปหน้ารถ...");
                        const compressedVehicle = await compressImage(form.vehicle_photo_front!, { maxWidthOrHeight: 1600, quality: 0.8, fileType: "image/jpeg" });
                        const vUpload = await uploadImageToStorage(compressedVehicle, `records/vehicles/${docId}/vehicle_front_${now}.jpg`);
                        vehiclePhotoFrontUrl = vUpload.downloadUrl;
                        vehiclePhotoFrontPath = vUpload.fullPath;
                    })()
                );
            }

            if (form.vehicle_photo_back) {
                uploadTasks.push(
                    (async () => {
                        setUploadProgress("กำลังบีบอัดและอัปโหลดรูปท้ายรถ...");
                        const compressedVehicle = await compressImage(form.vehicle_photo_back!, { maxWidthOrHeight: 1600, quality: 0.8, fileType: "image/jpeg" });
                        const vUpload = await uploadImageToStorage(compressedVehicle, `records/vehicles/${docId}/vehicle_back_${now}.jpg`);
                        vehiclePhotoBackUrl = vUpload.downloadUrl;
                        vehiclePhotoBackPath = vUpload.fullPath;
                    })()
                );
            }
            
            if (uploadTasks.length > 0) {
                await Promise.all(uploadTasks);
            }

            if (canSelectUnit && !form.unit_code) {
                setErrors({ unit_code: "กรุณาเลือกหน่วยที่รับผิดชอบ" });
                setSaving(false);
                return;
            }

            setUploadProgress(initialData ? "อัปเดตข้อมูลแก้ไขลงฐานข้อมูล..." : "กำลังบันทึกข้อมูลลงฐานข้อมูล...");
            
            // Build AI Ready Plate Payload
            const platePayload = buildPlateSearchKeys({
                plateCategory: isOfficialVehicle ? "government" : form.plateCategory,
                plateLeadingDigit: form.plateLeadingDigit,
                platePrefix: form.platePrefix,
                plateNumber: form.plateNumber,
                plateProvince: form.plateProvince
            });

            // Prepare Record Mutation Form
            const payload: any = {
                prefix: isOfficialPerson ? "" : (form.rank !== "ไม่มียศ" ? "" : form.prefix),
                rank: isOfficialPerson ? "" : form.rank,
                first_name: isOfficialPerson ? "" : form.first_name.trim(),
                last_name: isOfficialPerson ? "" : form.last_name.trim(),
                phone: isOfficialPerson ? "" : form.phone.trim(),
                person_type: form.person_type,
                
                ...platePayload,
                
                vehicle_type: form.vehicle_type,
                brand: form.brand.trim(),
                model: form.model.trim(),
                color: form.color.trim(),
                person_photo_url: personPhotoUrl,
                person_photo_path: personPhotoPath,
                vehicle_photo_front_url: vehiclePhotoFrontUrl,
                vehicle_photo_front_path: vehiclePhotoFrontPath,
                vehicle_photo_back_url: vehiclePhotoBackUrl,
                vehicle_photo_back_path: vehiclePhotoBackPath,
                status: form.status,
                remark: form.remark.trim(),
                updated_at: now,
                updated_by_uid: profile.uid,
                updated_by_name: profile.display_name || profile.displayName || "Unknown"
            };

            // Calculate completeness
            const { isComplete, missingFields } = checkRecordCompleteness(payload);
            payload.is_complete = isComplete;
            payload.missing_fields = missingFields;

            // Inject sponsor specifics 
            if (form.person_type !== "กำลังพล" && form.person_type !== "รถส่วนราชการ") {
                payload.sponsor_person_id = form.sponsor_person_id.trim();
                payload.relationship_type = form.relationship_type;
                payload.relationship_note = form.relationship_note.trim();
            } else {
                payload.sponsor_person_id = "";
                payload.relationship_type = "";
                payload.relationship_note = "";
            }

            if (initialData) {
                // UPDATE Route
                if (canSelectUnit) {
                    payload.unit = form.unit_code;
                    payload.unit_code = form.unit_code;
                    payload.unit_name_th = form.unit_name_th;
                }
                await updateDoc(workingDocRef, payload);
                
                // --- AUDIT LOG ---
                await writeAuditLog({
                    action: "UPDATE_RECORD",
                    resource: "vehicle_records",
                    resourceId: initialData.record_id,
                    targetName: `${initialData.plateFullDisplay || initialData.plateNumber} - ${buildDisplayName(initialData)}`,
                    before: initialData,
                    after: payload
                }).catch(e => console.error("Audit log error:", e));

                showSubmitMessage("อัปเดตข้อมูลเรียบร้อย", "success");
                if (onCancelEdit) onCancelEdit();
            } else {
                // CREATE Route
                payload.record_id = docId;
                payload.created_by_uid = profile.uid;
                payload.created_by_name = profile.display_name || profile.displayName || "Unknown";
                
                // Logic for Admin vs User unit assignment
                if (canSelectUnit) {
                    payload.unit = form.unit_code;
                    payload.unit_code = form.unit_code;
                    payload.unit_name_th = form.unit_name_th;
                } else {
                    payload.unit = profile.unit_code || profile.unit || "";
                    payload.unit_code = profile.unit_code || profile.unit || "";
                    payload.unit_name_th = profile.unit_name_th || profile.display_name || profile.displayName || "";
                }

                payload.created_at = now;
                
                await setDoc(workingDocRef, payload);

                // --- AUDIT LOG ---
                await writeAuditLog({
                    action: "CREATE_RECORD",
                    resource: "vehicle_records",
                    resourceId: docId,
                    targetName: `${payload.plateFullDisplay || payload.plateNumber} - ${buildDisplayName(payload as any)}`,
                    after: payload
                }).catch(e => console.error("Audit log error:", e));

                showSubmitMessage("บันทึกข้อมูลเรียบร้อย", "success");
                setForm(initialFormState);
                setRemovedPersonPhoto(false);
                setRemovedVehiclePhotoFront(false);
                setRemovedVehiclePhotoBack(false);
            }
            
            onSuccess();

        } catch (error: any) {
            console.error("Error saving record:", error);
            const errorMessage = error?.message?.includes("permission-denied") 
                ? "คุณไม่มีสิทธิ์ในการบันทึกข้อมูล กรุณาตรวจสอบการเข้าสู่ระบบ" 
                : "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง";
            showSubmitMessage(errorMessage, "error");
        } finally {
            setTimeout(() => {
                setSaving(false);
                setUploadProgress("");
            }, 1000);
        }
    };

    return {
        form,
        errors,
        saving,
        uploadProgress,
        submitMessage,
        canSelectUnit,
        handlers: {
            handleChange,
            handleSubmit,
            resetForm,
            setRemovedPersonPhoto,
            setRemovedVehiclePhotoFront,
            setRemovedVehiclePhotoBack
        },
        flags: {
            removedPersonPhoto,
            removedVehiclePhotoFront,
            removedVehiclePhotoBack
        }
    };
}
