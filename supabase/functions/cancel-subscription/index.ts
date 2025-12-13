import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe, getSubscriptionTierStatus } from '../_shared/stripe.ts';
import { getUserEmail, updateUserTier, verifyJWT } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    let authenticatedUser;
    try {
      authenticatedUser = await verifyJWT(token);
    } catch (authError) {
      console.error('[cancel-subscription] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401);
    }

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return errorResponse('Missing userId or action', 400);
    }

    // Verify userId matches authenticated user
    if (userId !== authenticatedUser.id) {
      console.error('[cancel-subscription] UserId mismatch:', { requested: userId, authenticated: authenticatedUser.id });
      return errorResponse('Unauthorized: userId mismatch', 403);
    }

    if (!['accept_offer', 'cancel'].includes(action)) {
      return errorResponse('Invalid action. Must be "accept_offer" or "cancel"', 400);
    }

    console.log('[cancel-subscription] Processing request:', { userId, action });

    const stripe = getStripe();

    // Get user email and find subscription
    const userEmail = await getUserEmail(userId);
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return errorResponse('No customer found', 404);
    }

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return errorResponse('No active subscription found', 404);
    }

    const subscription = subscriptions.data[0];

    if (action === 'accept_offer') {
      // Apply retention discount
      let coupon;
      try {
        coupon = await stripe.coupons.retrieve('RETENTION_30');
      } catch (error: unknown) {
        // Coupon doesn't exist, create it
        if ((error as { code?: string }).code === 'resource_missing') {
          coupon = await stripe.coupons.create({
            id: 'RETENTION_30',
            percent_off: 30,
            duration: 'forever',
            name: 'Retention Offer - 30% Off',
          });
          console.log('[cancel-subscription] Created retention coupon');
        } else {
          throw error;
        }
      }

      // Remove any cancellation and apply discount
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        coupon: 'RETENTION_30',
        cancel_at_period_end: false,
      });

      console.log('[cancel-subscription] User accepted retention offer');
      return jsonResponse({
        success: true,
        action: 'accept_offer',
        subscriptionId: updatedSubscription.id,
        message: 'Retention discount applied successfully',
      });
    } else {
      // Cancel subscription at period end
      const cancelledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      // Update user tier based on subscription status
      // When cancel_at_period_end is true, status is still 'active' until period ends
      // So user should remain premium until the billing period ends
      try {
        const targetTier = getSubscriptionTierStatus(cancelledSubscription);
        await updateUserTier(userId, targetTier);
        console.log('[cancel-subscription] Updated user tier to:', targetTier, '(subscription status:', cancelledSubscription.status, ')');
      } catch (tierError) {
        console.error('[cancel-subscription] Failed to update tier:', tierError);
        // Don't fail the request - webhook will handle it
      }

      console.log('[cancel-subscription] Subscription scheduled for cancellation');
      return jsonResponse({
        success: true,
        action: 'cancel',
        subscriptionId: cancelledSubscription.id,
        cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
        status: cancelledSubscription.status,
        message: 'Subscription will be cancelled at the end of the billing period',
      });
    }
  } catch (error) {
    console.error('[cancel-subscription] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to cancel subscription',
      500
    );
  }
});

