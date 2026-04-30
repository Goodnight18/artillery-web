interface PlateDisplayParams {
    leadingDigit?: string;
    prefix?: string;
    number: string;
    province?: string;
    isGovernment?: boolean;
}

/**
 * Builds the official UI display string for a license plate.
 * Government cars strictly display only their number.
 * Standard vehicles display: " LeadingDigitPrefix Number Province " (e.g., 2ขอ 3389 เชียงใหม่)
 */
export const buildPlateDisplay = (params: PlateDisplayParams): string => {
    if (params.isGovernment) {
        return params.number.trim();
    }
    
    const head = `${params.leadingDigit || ""}${params.prefix || ""}`.trim();
    const body = params.number.trim();
    const tail = (params.province || "").trim();
    
    // e.g. "2ขอ 3389 เชียงใหม่"
    return [head, body, tail].filter(Boolean).join(" ");
};
