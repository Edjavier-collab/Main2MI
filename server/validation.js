/**
 * Input Validation Utilities for the Backend
 * Provides security-focused validation for API inputs
 */

/**
 * Validate UUID format (for Supabase user IDs)
 * @param {string} id - The ID to validate
 * @returns {boolean} - Whether the ID is a valid UUID
 */
export const isValidUUID = (id) => {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate plan type
 * @param {string} plan - The plan to validate
 * @returns {boolean} - Whether the plan is valid
 */
export const isValidPlan = (plan) => {
    return ['monthly', 'annual'].includes(plan);
};

/**
 * Validate action type for subscription cancellation
 * @param {string} action - The action to validate
 * @returns {boolean} - Whether the action is valid
 */
export const isValidCancelAction = (action) => {
    return ['accept_offer', 'cancel'].includes(action);
};

/**
 * Sanitize string input (basic XSS prevention)
 * @param {string} input - The string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input, maxLength = 1000) => {
    if (!input || typeof input !== 'string') return '';
    
    // Trim and truncate
    let sanitized = input.trim().slice(0, maxLength);
    
    // Remove potential script tags and other dangerous content
    sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    
    return sanitized;
};

/**
 * Validate and sanitize checkout session request
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export const validateCheckoutRequest = (body) => {
    const { userId, plan, email } = body;
    
    if (!userId) {
        return { valid: false, error: 'Missing userId' };
    }
    
    // Validate userId format (should be UUID from Supabase)
    // Also allow mock user IDs that start with 'mock-'
    if (!isValidUUID(userId) && !userId.startsWith('mock-')) {
        return { valid: false, error: 'Invalid userId format' };
    }
    
    if (!plan) {
        return { valid: false, error: 'Missing plan' };
    }
    
    if (!isValidPlan(plan)) {
        return { valid: false, error: 'Invalid plan. Must be "monthly" or "annual"' };
    }
    
    // Email is optional, but validate if provided
    if (email && !isValidEmail(email)) {
        return { valid: false, error: 'Invalid email format' };
    }
    
    return {
        valid: true,
        sanitized: {
            userId: sanitizeString(userId, 100),
            plan,
            email: email ? sanitizeString(email, 254) : undefined
        }
    };
};

/**
 * Validate subscription-related request
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export const validateSubscriptionRequest = (body) => {
    const { userId } = body;
    
    if (!userId) {
        return { valid: false, error: 'Missing userId' };
    }
    
    if (!isValidUUID(userId) && !userId.startsWith('mock-')) {
        return { valid: false, error: 'Invalid userId format' };
    }
    
    return {
        valid: true,
        sanitized: {
            userId: sanitizeString(userId, 100)
        }
    };
};

/**
 * Validate cancellation request
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export const validateCancelRequest = (body) => {
    const { userId, action } = body;
    
    if (!userId) {
        return { valid: false, error: 'Missing userId' };
    }
    
    if (!isValidUUID(userId) && !userId.startsWith('mock-')) {
        return { valid: false, error: 'Invalid userId format' };
    }
    
    if (!action) {
        return { valid: false, error: 'Missing action' };
    }
    
    if (!isValidCancelAction(action)) {
        return { valid: false, error: 'Invalid action. Must be "accept_offer" or "cancel"' };
    }
    
    return {
        valid: true,
        sanitized: {
            userId: sanitizeString(userId, 100),
            action
        }
    };
};

/**
 * Validate Stripe session ID format
 * @param {string} sessionId - The session ID to validate
 * @returns {boolean} - Whether the session ID is valid
 */
export const isValidStripeSessionId = (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') return false;
    // Stripe session IDs start with 'cs_' and contain alphanumeric characters
    return /^cs_[a-zA-Z0-9_]+$/.test(sessionId);
};

/**
 * Validate session update request
 * @param {object} body - Request body
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
export const validateSessionUpdateRequest = (body) => {
    const { sessionId } = body;
    
    if (!sessionId) {
        return { valid: false, error: 'Missing sessionId' };
    }
    
    if (!isValidStripeSessionId(sessionId)) {
        return { valid: false, error: 'Invalid sessionId format' };
    }
    
    return {
        valid: true,
        sanitized: {
            sessionId: sanitizeString(sessionId, 100)
        }
    };
};

export default {
    isValidUUID,
    isValidEmail,
    isValidPlan,
    isValidCancelAction,
    sanitizeString,
    validateCheckoutRequest,
    validateSubscriptionRequest,
    validateCancelRequest,
    isValidStripeSessionId,
    validateSessionUpdateRequest
};

