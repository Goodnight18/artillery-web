import { normalizePlateText } from "./normalizePlateText";
import { buildPlateDisplay } from "./buildPlateDisplay";

interface PlatePayloadInput {
    plateCategory: string; // "private" | "government" | "motorcycle" | "other"
    plateLeadingDigit: string;
    platePrefix: string;
    plateNumber: string;
    plateProvince: string;
}

export interface PlateNormalizedPayload {
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
}

/**
 * Validates, normalizes, and groups the granular plate data into a payload optimized for AI/OCR searching.
 */
export const buildPlateSearchKeys = (input: PlatePayloadInput): PlateNormalizedPayload => {
    const isGov = input.plateCategory === "government";
    
    // Clear unused fields for government vehicles
    const lDigit = isGov ? "" : input.plateLeadingDigit.trim();
    const pPrefix = isGov ? "" : input.platePrefix.trim();
    const pNumber = input.plateNumber.trim();
    const pProvince = isGov ? "" : input.plateProvince.trim();

    // Generate Base Normalized Strings
    const lDigitNorm = normalizePlateText(lDigit);
    const pPrefixNorm = normalizePlateText(pPrefix);
    const pNumberNorm = normalizePlateText(pNumber);
    const pProvinceNorm = normalizePlateText(pProvince);

    // Build Displays
    const fullDisplay = buildPlateDisplay({
        leadingDigit: lDigit,
        prefix: pPrefix,
        number: pNumber,
        province: pProvince,
        isGovernment: isGov
    });

    // Build Search Keys
    // e.g., 2ขอ3389 vs 12345
    const plateSearchKey = `${lDigitNorm}${pPrefixNorm}${pNumberNorm}`;
    
    // e.g., 2ขอ3389เชียงใหม่ vs 12345
    const plateSearchKeyWithProvince = `${plateSearchKey}${pProvinceNorm}`;

    return {
        plateCategory: input.plateCategory,
        plateLeadingDigit: lDigit,
        platePrefix: pPrefix,
        plateNumber: pNumber,
        plateProvince: pProvince,

        plateFullDisplay: fullDisplay,

        plateLeadingDigitNormalized: lDigitNorm,
        platePrefixNormalized: pPrefixNorm,
        plateNumberNormalized: pNumberNorm,
        plateProvinceNormalized: pProvinceNorm,

        plateSearchKey: plateSearchKey,
        plateSearchKeyWithProvince: plateSearchKeyWithProvince
    };
};
