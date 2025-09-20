// HSN Code validation utilities for Indian GST compliance

export interface HSNValidationResult {
    isValid: boolean;
    error?: string;
    formatted?: string;
}

/**
 * Validates HSN code format and structure
 * HSN codes can be 2, 4, 6, or 8 digits
 * @param hsnCode - The HSN code to validate
 * @returns HSNValidationResult object
 */
export function validateHSNCode(hsnCode: string): HSNValidationResult {
    if (!hsnCode) {
        return {
            isValid: false,
            error: "HSN code is required"
        };
    }

    // Remove any spaces or special characters
    const cleanCode = hsnCode.replace(/[^0-9]/g, '');

    // Check if it's a valid number
    if (!/^\\d+$/.test(cleanCode)) {
        return {
            isValid: false,
            error: "HSN code must contain only numbers"
        };
    }

    // Check valid lengths (2, 4, 6, or 8 digits)
    const validLengths = [2, 4, 6, 8];
    if (!validLengths.includes(cleanCode.length)) {
        return {
            isValid: false,
            error: "HSN code must be 2, 4, 6, or 8 digits long"
        };
    }

    // Additional validation rules
    if (cleanCode.length >= 2) {
        const chapter = parseInt(cleanCode.substring(0, 2));
        if (chapter < 1 || chapter > 99) {
            return {
                isValid: false,
                error: "Invalid HSN chapter (first two digits must be 01-99)"
            };
        }
    }

    return {
        isValid: true,
        formatted: cleanCode
    };
}

/**
 * Suggests tax rate based on HSN code
 * @param hsnCode - The HSN code
 * @returns Suggested tax rate percentage
 */
export function suggestTaxRate(hsnCode: string): number | null {
    const cleanCode = hsnCode.replace(/[^0-9]/g, '');
    
    if (cleanCode.length < 2) return null;
    
    const chapter = parseInt(cleanCode.substring(0, 2));
    
    // Basic tax rate suggestions (simplified)
    const taxRateMap: { [key: number]: number } = {
        // Food items - typically 5% or exempt
        1: 5,   // Live animals
        2: 5,   // Meat and edible meat offal
        3: 5,   // Fish and crustaceans
        4: 5,   // Dairy produce
        5: 5,   // Products of animal origin
        6: 5,   // Live trees and plants
        7: 5,   // Edible vegetables
        8: 5,   // Edible fruit and nuts
        9: 5,   // Coffee, tea, spices
        10: 5,  // Cereals
        15: 5,  // Animal or vegetable fats
        
        // Machinery and equipment - typically 18%
        84: 18, // Nuclear reactors, boilers, machinery
        85: 18, // Electrical machinery
        87: 18, // Vehicles other than railway
        90: 18, // Optical, photographic instruments
        94: 18, // Furniture; Bedding, Mattresses
    };
    
    return taxRateMap[chapter] || 18; // Default to 18% if not found
}

/**
 * Formats HSN code for display
 * @param hsnCode - The HSN code to format
 * @returns Formatted HSN code string
 */
export function formatHSNCode(hsnCode: string): string {
    const cleanCode = hsnCode.replace(/[^0-9]/g, '');
    
    // Add spacing for better readability
    switch (cleanCode.length) {
        case 2:
            return cleanCode;
        case 4:
            return `${cleanCode.substring(0, 2)} ${cleanCode.substring(2, 4)}`;
        case 6:
            return `${cleanCode.substring(0, 2)} ${cleanCode.substring(2, 4)} ${cleanCode.substring(4, 6)}`;
        case 8:
            return `${cleanCode.substring(0, 2)} ${cleanCode.substring(2, 4)} ${cleanCode.substring(4, 6)} ${cleanCode.substring(6, 8)}`;
        default:
            return cleanCode;
    }
}