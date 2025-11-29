/**
 * Frontend Validation Utilities
 * 
 * Provides client-side validation for forms and user input.
 * Note: Always validate on the server as well - client validation is for UX only.
 */

/**
 * Password strength requirements
 */
export interface PasswordStrength {
    score: number; // 0-4 (0 = weak, 4 = very strong)
    label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
    color: string;
    feedback: string[];
    isValid: boolean;
}

/**
 * Check password strength
 * @param password - The password to check
 * @returns PasswordStrength object with score, label, and feedback
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length checks
    if (password.length >= 8) {
        score += 1;
    } else {
        feedback.push('At least 8 characters');
    }

    if (password.length >= 12) {
        score += 1;
    }

    // Character type checks
    if (/[a-z]/.test(password)) {
        score += 0.5;
    } else {
        feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
        score += 0.5;
    } else {
        feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
        score += 0.5;
    } else {
        feedback.push('Add numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 0.5;
    } else {
        feedback.push('Add special characters (!@#$%^&*...)');
    }

    // Common patterns to avoid (reduces score)
    const commonPatterns = [
        /^123/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /letmein/i,
        /welcome/i,
        /admin/i,
        /login/i,
        /(.)\1{2,}/ // Repeating characters
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
        score = Math.max(0, score - 1);
        feedback.push('Avoid common patterns');
    }

    // Normalize score to 0-4 range
    score = Math.min(4, Math.max(0, Math.round(score)));

    const strengthMap: Record<number, { label: PasswordStrength['label']; color: string }> = {
        0: { label: 'Very Weak', color: 'bg-red-500' },
        1: { label: 'Weak', color: 'bg-orange-500' },
        2: { label: 'Fair', color: 'bg-yellow-500' },
        3: { label: 'Strong', color: 'bg-green-400' },
        4: { label: 'Very Strong', color: 'bg-green-500' }
    };

    const { label, color } = strengthMap[score];

    return {
        score,
        label,
        color,
        feedback: feedback.slice(0, 3), // Limit to 3 suggestions
        isValid: score >= 2 && password.length >= 8
    };
};

/**
 * Validate email format
 * @param email - The email to validate
 * @returns boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
};

/**
 * Validate password meets minimum requirements
 * @param password - The password to validate
 * @returns Object with isValid and error message
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password must be less than 128 characters' };
    }

    // Check for at least one lowercase, uppercase, and number
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/\d/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }

    return { isValid: true };
};

/**
 * Sanitize text input for display (basic XSS prevention)
 * Note: This is for display purposes - always escape on render
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export default {
    checkPasswordStrength,
    isValidEmail,
    validatePassword,
    sanitizeInput
};

