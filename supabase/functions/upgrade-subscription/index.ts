import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe, getPriceIds } from '../_shared/stripe.ts';
import { getUserEmail, updateUserPlan } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const { userId } = await req.json();

    if (!userId) {
      return errorResponse('Missing userId', 400);
    }

    console.log('[upgrade-subscription] Upgrading subscription for user:', userId);

    const stripe = getStripe();
    const priceIds = getPriceIds();

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
    const currentPriceId = subscription.items.data[0]?.price?.id;

    // Check if already annual
    if (currentPriceId === priceIds.annual) {
      return errorResponse('Subscription is already on the annual plan', 400);
    }

    // Check if monthly
    if (currentPriceId !== priceIds.monthly) {
      return errorResponse('Can only upgrade from monthly to annual plan', 400);
    }

    // Update subscription to annual
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceIds.annual,
        },
      ],
      proration_behavior: 'none', // Don't prorate - change at period end
      metadata: {
        ...subscription.metadata,
        plan: 'annual',
      },
    });

    // Update plan in database
    try {
      await updateUserPlan(userId, 'annual');
      console.log('[upgrade-subscription] Saved annual plan to database');
    } catch (planError) {
      console.warn('[upgrade-subscription] Failed to save plan:', planError);
    }

    console.log('[upgrade-subscription] Upgraded subscription to annual');
    return jsonResponse({
      success: true,
      subscriptionId: updatedSubscription.id,
      message: `Your subscription will be upgraded to Annual at the end of your current billing period (${new Date(updatedSubscription.current_period_end * 1000).toLocaleDateString()}).`,
    });
  } catch (error) {
    console.error('[upgrade-subscription] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to upgrade subscription',
      500
    );
  }
});

