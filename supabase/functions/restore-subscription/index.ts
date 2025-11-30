import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import { getUserEmail, updateUserTier } from '../_shared/supabase.ts';

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

    console.log('[restore-subscription] Restoring subscription for user:', userId);

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

    // Look for subscriptions that are scheduled for cancellation
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 5,
    });

    // Find a subscription that can be restored (active but cancel_at_period_end = true)
    const subscriptionToRestore = subscriptions.data.find(
      (sub) => sub.status === 'active' && sub.cancel_at_period_end
    );

    if (!subscriptionToRestore) {
      return errorResponse('No subscription found to restore', 404);
    }

    // Restore the subscription by removing the cancellation
    const restoredSubscription = await stripe.subscriptions.update(subscriptionToRestore.id, {
      cancel_at_period_end: false,
    });

    // Update user tier back to premium
    try {
      await updateUserTier(userId, 'premium');
      console.log('[restore-subscription] Updated user tier to premium');
    } catch (tierError) {
      console.error('[restore-subscription] Failed to update tier:', tierError);
    }

    console.log('[restore-subscription] Subscription restored:', restoredSubscription.id);
    return jsonResponse({
      success: true,
      subscription: {
        subscriptionId: restoredSubscription.id,
        status: restoredSubscription.status,
        cancelAtPeriodEnd: restoredSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(restoredSubscription.current_period_end * 1000).toISOString(),
      },
      message: 'Subscription restored successfully',
    });
  } catch (error) {
    console.error('[restore-subscription] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to restore subscription',
      500
    );
  }
});

