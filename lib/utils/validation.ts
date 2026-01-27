/**
 * Validation utilities for common form fields
 */

export const calculateAge = (dob: Date | string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const isValidAge = (dob: Date | string, minAge: number = 4, maxAge: number = 120): boolean => {
    const age = calculateAge(dob);
    return age >= minAge && age <= maxAge;
};

export const getAgeValidationError = (dob: string, minAge: number = 4, maxAge: number = 120): string | null => {
    if (!dob) return null;
    
    try {
        const age = calculateAge(dob);
        if (age < minAge) {
            return `Age must be at least ${minAge} years`;
        }
        if (age > maxAge) {
            return `Age must not exceed ${maxAge} years`;
        }
        return null;
    } catch {
        return "Invalid date of birth";
    }
};

export const getMaxDate = (minAge: number = 4): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - minAge);
    return date.toISOString().split('T')[0];
};

export const getMinDate = (maxAge: number = 120): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - maxAge);
    return date.toISOString().split('T')[0];
};
