import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe, getPriceIds } from '../_shared/stripe.ts';
import { getUserEmail, getUserProfile } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Get userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return errorResponse('Missing userId', 400);
    }

    console.log('[get-subscription] Getting subscription for user:', userId);

    const stripe = getStripe();
    const priceIds = getPriceIds();

    // Get user email from Supabase
    let userEmail: string;
    try {
      userEmail = await getUserEmail(userId);
    } catch (error) {
      console.error('[get-subscription] Failed to get user email:', error);
      return errorResponse('User not found', 404);
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.log('[get-subscription] No Stripe customer found for email:', userEmail);

      // Check if user is premium in Supabase
      const profile = await getUserProfile(userId);
      if (profile?.tier === 'premium') {
        return errorResponse(
          'No Stripe subscription found. Your account shows as premium, but no active subscription was found in Stripe. Please contact support.',
          404
        );
      }
      return errorResponse('No subscription found', 404);
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log('[get-subscription] No active subscription found for customer:', customer.id);

      // Check if user is premium in Supabase
      const profile = await getUserProfile(userId);
      if (profile?.tier === 'premium') {
        return errorResponse(
          'No active subscription found. Your account shows as premium, but no subscription was found in Stripe. Please contact support.',
          404
        );
      }
      return errorResponse('No active subscription found', 404);
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;
    const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;

    // Detect plan
    let plan = 'unknown';

    // Method 1: Check subscription metadata
    if (subscription.metadata?.plan && ['monthly', 'annual'].includes(subscription.metadata.plan)) {
      plan = subscription.metadata.plan;
    }
    // Method 2: Check price ID match
    else if (priceId === priceIds.monthly) {
      plan = 'monthly';
    } else if (priceId === priceIds.annual) {
      plan = 'annual';
    }
    // Method 3: Infer from price amount
    else {
      const priceInDollars = priceAmount / 100;
      plan = priceInDollars > 50 ? 'annual' : 'monthly';
    }

    // Calculate discounted price if coupon is applied
    let currentPrice = priceAmount;
    let originalPrice = currentPrice;
    let discountPercent = 0;

    if (subscription.discount?.coupon) {
      const coupon = subscription.discount.coupon;
      if (coupon.percent_off) {
        discountPercent = coupon.percent_off;
        originalPrice = Math.round(currentPrice / (1 - discountPercent / 100));
      } else if (coupon.amount_off) {
        originalPrice = currentPrice + coupon.amount_off;
        discountPercent = Math.round((coupon.amount_off / originalPrice) * 100);
      }
    }

    const subscriptionDetails = {
      customerId: customer.id,
      subscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPrice: currentPrice / 100,
      originalPrice: originalPrice / 100,
      discountPercent,
      hasRetentionDiscount: subscription.discount?.coupon?.id === 'RETENTION_30',
    };

    console.log('[get-subscription] Found subscription:', subscriptionDetails);
    return jsonResponse(subscriptionDetails);
  } catch (error) {
    console.error('[get-subscription] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get subscription',
      500
    );
  }
});

