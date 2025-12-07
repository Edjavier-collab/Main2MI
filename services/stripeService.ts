import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const getStripePublishableKey = (): string => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
    }
    return key;
};

// Initialize Stripe
let stripePromise: Promise<any> | null = null;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(getStripePublishableKey());
    }
    return stripePromise;
};

/**
 * Get the Supabase Functions URL from environment
 * Uses VITE_SUPABASE_URL to construct the functions URL
 */
const getFunctionsUrl = (): string => {
    // First check for explicit functions URL
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    if (functionsUrl) {
        return functionsUrl;
    }

    // Fall back to constructing from Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL is not set. Cannot determine Edge Functions URL.');
    }

    // Convert https://xxx.supabase.co to https://xxx.supabase.co/functions/v1
    return `${supabaseUrl}/functions/v1`;
};

/**
 * Get Supabase anon key for authorization
 */
const getAnonKey = (): string => {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!key) {
        throw new Error('VITE_SUPABASE_ANON_KEY is not set');
    }
    return key;
};

/**
 * Make a request to a Supabase Edge Function
 */
const callEdgeFunction = async (
    functionName: string,
    options: {
        method?: 'GET' | 'POST';
        body?: Record<string, unknown>;
        params?: Record<string, string>;
    } = {}
): Promise<Response> => {
    const { method = 'POST', body, params } = options;
    const functionsUrl = getFunctionsUrl();
    const anonKey = getAnonKey();

    let url = `${functionsUrl}/${functionName}`;
    
    // Add query params for GET requests
    if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    const fetchOptions: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
        },
    };

    if (body && method === 'POST') {
        fetchOptions.body = JSON.stringify(body);
    }

    return fetch(url, fetchOptions);
};

/**
 * Create a Stripe Checkout Session via Supabase Edge Function
 */
export const createCheckoutSession = async (
    userId: string,
    plan: 'monthly' | 'annual',
    email?: string
): Promise<{ sessionId: string; url: string }> => {
    const body: Record<string, unknown> = { userId, plan };
    if (email) {
        body.email = email;
    }

    const response = await callEdgeFunction('create-checkout-session', {
        method: 'POST',
        body,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
        const errorMessage = errorData.error || errorData.message || 'Failed to create checkout session';
        throw new Error(errorMessage);
    }

    return await response.json();
};

/**
 * Redirect user to Stripe Checkout
 */
export const redirectToCheckout = async (userId: string, plan: 'monthly' | 'annual', email?: string): Promise<void> => {
    try {
        console.log('[stripeService] Creating checkout session for user:', userId, 'plan:', plan, 'email:', email);

        const { sessionId, url } = await createCheckoutSession(userId, plan, email);
        
        if (url) {
            // Redirect to Stripe Checkout
            window.location.href = url;
        } else {
            // Fallback: use Stripe.js redirect
            const stripe = await getStripe();
            const { error } = await stripe!.redirectToCheckout({ sessionId });
            
            if (error) {
                throw new Error(error.message || 'Failed to redirect to checkout');
            }
        }
    } catch (error) {
        console.error('[stripeService] Checkout error:', error);
        throw error;
    }
};

/**
 * Get user's subscription details
 * Returns null if no subscription is found (404), throws error for other failures
 */
export const getUserSubscription = async (userId: string): Promise<any | null> => {
    const response = await callEdgeFunction('get-subscription', {
        method: 'GET',
        params: { userId },
    });

    if (!response.ok) {
        // Handle 404 (no subscription found)
        if (response.status === 404) {
            // Check if the response includes premium tier info
            const errorData = await response.json().catch(() => ({}));
            if (errorData.hasPremiumTier) {
                // Return a special object to indicate premium tier mismatch
                return { _premiumTierMismatch: true, error: errorData.error || 'No subscription found' };
            }
            return null;
        }
        
        // For other errors, parse and throw with proper error message
        const errorData = await response.json().catch(() => ({ error: 'Failed to get subscription' }));
        const errorMessage = errorData.error || errorData.message || 'Failed to get subscription';
        throw new Error(errorMessage);
    }

    return await response.json();
};

/**
 * Cancel subscription with retention offer option
 */
export const cancelSubscription = async (userId: string, acceptOffer: boolean): Promise<any> => {
    const response = await callEdgeFunction('cancel-subscription', {
        method: 'POST',
        body: {
            userId,
            action: acceptOffer ? 'accept_offer' : 'cancel',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to cancel subscription' }));
        const errorMessage = errorData.error || errorData.message || 'Failed to cancel subscription';
        throw new Error(errorMessage);
    }

    return await response.json();
};

/**
 * Apply retention discount to subscription
 */
export const applyRetentionDiscount = async (userId: string): Promise<any> => {
    const response = await callEdgeFunction('apply-retention-discount', {
        method: 'POST',
        body: { userId },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to apply retention discount' }));
        const errorMessage = errorData.error || errorData.message || 'Failed to apply retention discount';
        throw new Error(errorMessage);
    }

    return await response.json();
};

/**
 * Restore a cancelled subscription
 */
export const restoreSubscription = async (userId: string): Promise<any> => {
    const response = await callEdgeFunction('restore-subscription', {
        method: 'POST',
        body: { userId },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to restore subscription' }));
        const errorMessage = errorData.error || errorData.message || 'Failed to restore subscription';
        throw new Error(errorMessage);
    }

    return await response.json();
};

/**
 * Upgrade subscription from monthly to annual
 */
export const upgradeToAnnual = async (userId: string): Promise<any> => {
    console.log('[stripeService] upgradeToAnnual called for user:', userId);
    
    try {
        const response = await callEdgeFunction('upgrade-subscription', {
            method: 'POST',
            body: { userId },
        });

        console.log('[stripeService] upgradeToAnnual response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => {
                console.error('[stripeService] Failed to parse error response');
                return { error: `Failed to upgrade subscription (${response.status} ${response.statusText})` };
            });
            const errorMessage = errorData.error || errorData.message || `Failed to upgrade subscription (${response.status})`;
            console.error('[stripeService] upgradeToAnnual error:', errorMessage, errorData);
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[stripeService] upgradeToAnnual success:', result);
        return result;
    } catch (error) {
        console.error('[stripeService] upgradeToAnnual exception:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to upgrade subscription');
    }
};

/**
 * Create a mock subscription (development only)
 * Note: This functionality is no longer supported with Edge Functions.
 * Use real Stripe test mode instead.
 */
export const createMockSubscription = async (_userId: string, _plan: 'monthly' | 'annual'): Promise<any> => {
    throw new Error(
        'Mock subscriptions are not supported with Edge Functions. ' +
        'Please use Stripe test mode with test card numbers instead.'
    );
};
