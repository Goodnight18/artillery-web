/**
 * Cleans up and normalizes Thai license plate text formats.
 * - Converts Thai numerals ๐-๙ to Arabic numerals 0-9
 * - Removes spaces, dashes, dots, underscores
 * - Uppercases all alphabet characters
 */
export const normalizePlateText = (text?: string): string => {
    if (!text) return "";
    
    // Convert Thai numerals to Arabic numerals
    const thaiNumerals = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
    let normalized = text.split("").map(char => {
        const thaiIndex = thaiNumerals.indexOf(char);
        return thaiIndex !== -1 ? thaiIndex.toString() : char;
    }).join("");

    // Remove unwanted characters (spaces, dashes, dots, underscores, slashes)
    normalized = normalized.replace(/[\s\-_.\/\\]/g, "");
    
    // Capitalize
    return normalized.toUpperCase();
};
