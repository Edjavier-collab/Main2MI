import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import { updateUserTier, updateUserPlan } from '../_shared/supabase.ts';

/**
 * Edge Function to update user tier directly from a Stripe Checkout Session
 * This provides immediate tier updates without waiting for webhooks
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return errorResponse('Missing sessionId', 400);
    }

    console.log('[update-tier-from-session] Processing session:', sessionId);

    const stripe = getStripe();

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (!session) {
      console.error('[update-tier-from-session] Session not found:', sessionId);
      return errorResponse('Checkout session not found', 404);
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      console.warn('[update-tier-from-session] Payment not completed:', session.payment_status);
      return errorResponse(`Payment not completed: ${session.payment_status}`, 400);
    }

    // Get userId from session metadata
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan || 'monthly';

    if (!userId) {
      console.error('[update-tier-from-session] No userId in session metadata');
      return errorResponse('No userId found in checkout session', 400);
    }

    console.log('[update-tier-from-session] Updating tier for user:', userId, 'plan:', plan);

    // Update subscription metadata if available
    if (session.subscription) {
      try {
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

        await stripe.subscriptions.update(subscriptionId, {
          metadata: {
            userId,
            plan,
            tier: 'premium',
          },
        });
        console.log('[update-tier-from-session] Updated subscription metadata');
      } catch (metadataError) {
        console.warn('[update-tier-from-session] Could not update subscription metadata:', metadataError);
        // Continue anyway - this is not critical
      }
    }

    // Update user tier in Supabase
    await updateUserTier(userId, 'premium');
    console.log('[update-tier-from-session] Successfully updated user to premium tier');

    // Update subscription plan
    await updateUserPlan(userId, plan);
    console.log('[update-tier-from-session] Successfully saved subscription plan:', plan);

    return jsonResponse({
      success: true,
      userId,
      tier: 'premium',
      plan,
      message: 'Tier updated successfully',
    });
  } catch (error) {
    console.error('[update-tier-from-session] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update tier from session',
      500
    );
  }
});
