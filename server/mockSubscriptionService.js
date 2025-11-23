/**
 * Mock Subscription Service
 * Simulates Stripe subscriptions for development and testing
 * Stores subscriptions in memory (lost on server restart)
 */

// In-memory storage for mock subscriptions
const mockSubscriptions = new Map();

// Pricing constants
const PRICING = {
    monthly: { original: 9.99, discounted: 6.99 },
    annual: { original: 99.99, discounted: 69.99 },
};

/**
 * Generate a mock customer ID
 */
const generateCustomerId = (userId) => {
    return `cus_mock_${userId.substring(0, 8)}`;
};

/**
 * Generate a mock subscription ID
 */
const generateSubscriptionId = (userId) => {
    return `sub_mock_${userId.substring(0, 8)}_${Date.now()}`;
};

/**
 * Calculate next billing date (30 days for monthly, 365 for annual)
 */
const calculateNextBillingDate = (plan) => {
    const days = plan === 'monthly' ? 30 : 365;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

const isValidPlan = (plan) => Object.prototype.hasOwnProperty.call(PRICING, plan);

/**
 * Create a mock subscription
 */
export const createMockSubscription = (userId, plan) => {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
        throw new Error('Invalid userId provided for mock subscription');
    }

    if (!isValidPlan(plan)) {
        throw new Error(`Invalid plan "${plan}". Expected one of: ${Object.keys(PRICING).join(', ')}`);
    }

    const cleanedPlan = plan.trim();
    const customerId = generateCustomerId(userId);
    const subscriptionId = generateSubscriptionId(userId);
    const pricing = PRICING[cleanedPlan];

    const subscription = {
        customerId,
        subscriptionId,
        plan: cleanedPlan,
        status: 'active',
        currentPeriodEnd: calculateNextBillingDate(plan),
        cancelAtPeriodEnd: false,
        currentPrice: pricing.original,
        originalPrice: pricing.original,
        discountPercent: 0,
        hasRetentionDiscount: false,
    };

    mockSubscriptions.set(userId, subscription);
    console.log('[mockSubscriptionService] Created mock subscription for user:', userId, subscription);
    return subscription;
};

/**
 * Get mock subscription for a user
 */
export const getMockSubscription = (userId) => {
    const subscription = mockSubscriptions.get(userId);
    if (subscription) {
        console.log('[mockSubscriptionService] Retrieved mock subscription for user:', userId);
    } else {
        console.log('[mockSubscriptionService] No mock subscription found for user:', userId);
    }
    return subscription || null;
};

/**
 * Cancel mock subscription with retention offer option
 */
export const cancelMockSubscription = (userId, acceptOffer) => {
    const subscription = mockSubscriptions.get(userId);
    if (!subscription) {
        throw new Error('No subscription found');
    }

    if (acceptOffer) {
        // Apply retention discount
        const discountPercent = 30;
        const pricing = PRICING[subscription.plan];
        subscription.currentPrice = pricing.discounted;
        subscription.originalPrice = pricing.original;
        subscription.discountPercent = discountPercent;
        subscription.hasRetentionDiscount = true;
        subscription.cancelAtPeriodEnd = false; // Remove any scheduled cancellation
        subscription.status = 'active';
        console.log('[mockSubscriptionService] Applied retention discount to subscription for user:', userId);
    } else {
        // Cancel at period end
        subscription.cancelAtPeriodEnd = true;
        subscription.status = 'active'; // Still active until period ends
        console.log('[mockSubscriptionService] Scheduled cancellation for user:', userId);
    }

    mockSubscriptions.set(userId, subscription);
    return subscription;
};

/**
 * Restore a cancelled mock subscription
 */
export const restoreMockSubscription = (userId) => {
    const subscription = mockSubscriptions.get(userId);
    if (!subscription) {
        throw new Error('No subscription found');
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.status = 'active';
    
    // If subscription was past due, reactivate it
    if (subscription.status === 'past_due') {
        subscription.status = 'active';
    }

    mockSubscriptions.set(userId, subscription);
    console.log('[mockSubscriptionService] Restored subscription for user:', userId);
    return subscription;
};

/**
 * Apply retention discount to mock subscription
 */
export const applyRetentionDiscount = (userId) => {
    const subscription = mockSubscriptions.get(userId);
    if (!subscription) {
        throw new Error('No subscription found');
    }

    if (subscription.hasRetentionDiscount) {
        console.log('[mockSubscriptionService] Retention discount already applied for user:', userId);
        return subscription;
    }

    const discountPercent = 30;
    const pricing = PRICING[subscription.plan];
    subscription.currentPrice = pricing.discounted;
    subscription.originalPrice = pricing.original;
    subscription.discountPercent = discountPercent;
    subscription.hasRetentionDiscount = true;
    subscription.cancelAtPeriodEnd = false; // Remove any scheduled cancellation

    mockSubscriptions.set(userId, subscription);
    console.log('[mockSubscriptionService] Applied retention discount for user:', userId);
    return subscription;
};

/**
 * Delete a mock subscription (for testing)
 */
export const deleteMockSubscription = (userId) => {
    const deleted = mockSubscriptions.delete(userId);
    if (deleted) {
        console.log('[mockSubscriptionService] Deleted mock subscription for user:', userId);
    }
    return deleted;
};

/**
 * Get all mock subscriptions (for debugging)
 */
export const getAllMockSubscriptions = () => {
    return new Map(mockSubscriptions);
};

