import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe, getPriceIds } from '../_shared/stripe.ts';
import { getUserEmail, updateUserPlan, verifyJWT } from '../_shared/supabase.ts';

// Coupon ID for 30% annual upgrade discount
const UPGRADE_COUPON_ID = 'UPGRADE_ANNUAL_30';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405, req);
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401, req);
    }

    const token = authHeader.replace('Bearer ', '');
    let authenticatedUser;
    try {
      authenticatedUser = await verifyJWT(token);
    } catch (authError) {
      console.error('[upgrade-subscription] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const { userId } = await req.json();

    if (!userId) {
      return errorResponse('Missing userId', 400, req);
    }

    // Verify userId matches authenticated user
    if (userId !== authenticatedUser.id) {
      console.error('[upgrade-subscription] UserId mismatch:', { requested: userId, authenticated: authenticatedUser.id });
      return errorResponse('Unauthorized: userId mismatch', 403, req);
    }

    console.log('[upgrade-subscription] Upgrading subscription for user:', userId.substring(0, 8) + '...');

    const stripe = getStripe();
    const priceIds = getPriceIds();

    // Get user email and find subscription
    const userEmail = await getUserEmail(userId);
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return errorResponse('No customer found', 404, req);
    }

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return errorResponse('No active subscription found', 404, req);
    }

    const subscription = subscriptions.data[0];
    const currentPriceId = subscription.items.data[0]?.price?.id;

    // Check if already annual
    if (currentPriceId === priceIds.annual) {
      return errorResponse('Subscription is already on the annual plan', 400, req);
    }

    // Check if monthly
    if (currentPriceId !== priceIds.monthly) {
      return errorResponse('Can only upgrade from monthly to annual plan', 400, req);
    }

    // Get or create the 30% upgrade discount coupon
    let coupon;
    try {
      coupon = await stripe.coupons.retrieve(UPGRADE_COUPON_ID);
      console.log('[upgrade-subscription] Retrieved existing coupon:', UPGRADE_COUPON_ID);
    } catch {
      // Coupon doesn't exist, create it
      coupon = await stripe.coupons.create({
        id: UPGRADE_COUPON_ID,
        percent_off: 30,
        duration: 'forever',
        name: 'Annual Upgrade Discount - 30% Off',
      });
      console.log('[upgrade-subscription] Created new coupon:', UPGRADE_COUPON_ID);
    }

    // Update subscription to annual with 30% discount
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceIds.annual,
        },
      ],
      coupon: UPGRADE_COUPON_ID,
      proration_behavior: 'create_prorations', // Credit remaining monthly time
      metadata: {
        ...subscription.metadata,
        plan: 'annual',
        upgradedFromMonthly: 'true',
        upgradeDiscount: '30',
      },
    });

    // Update plan in database
    try {
      await updateUserPlan(userId, 'annual');
      console.log('[upgrade-subscription] Saved annual plan to database');
    } catch (planError) {
      console.warn('[upgrade-subscription] Failed to save plan:', planError);
    }

    console.log('[upgrade-subscription] Upgraded subscription to annual with 30% discount');
    return jsonResponse({
      success: true,
      subscriptionId: updatedSubscription.id,
      originalPrice: 99.99,
      discountedPrice: 69.99,
      discountPercent: 30,
      message: `Your subscription has been upgraded to Annual Pro with a 30% discount! You'll be charged $69.99/year (normally $99.99).`,
    }, 200, req);
  } catch (error) {
    console.error('[upgrade-subscription] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to upgrade subscription',
      500,
      req
    );
  }
});

