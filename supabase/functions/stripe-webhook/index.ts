import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe, getSubscriptionTierStatus } from '../_shared/stripe.ts';
import { updateUserTier, updateUserPlan } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Webhooks don't need CORS preflight, but handle it anyway
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = getStripe();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Require webhook secret - no bypass for development
    if (!webhookSecret) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
      return errorResponse('Webhook secret not configured', 500);
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[stripe-webhook] Missing stripe-signature header');
      return errorResponse('Missing stripe-signature header', 400);
    }

    // Always verify webhook signature - no bypass
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed');
      return errorResponse('Webhook signature verification failed', 400);
    }

    console.log(`[stripe-webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('[stripe-webhook] No userId in session metadata');
          return errorResponse('Missing userId in metadata', 400);
        }

        console.log('[stripe-webhook] Checkout completed for user:', userId.substring(0, 8) + '...');
        const plan = session.metadata?.plan || 'monthly';

        // Update subscription metadata with plan information
        if (session.subscription) {
          try {
            await stripe.subscriptions.update(session.subscription as string, {
              metadata: {
                userId,
                plan,
                tier: 'premium',
              },
            });
            console.log('[stripe-webhook] Updated subscription metadata with plan:', plan);
          } catch (metadataError) {
            console.warn('[stripe-webhook] Could not update subscription metadata:', metadataError);
          }
        }

        // Update user tier and plan in Supabase
        try {
          await updateUserTier(userId, 'premium');
          console.log('[stripe-webhook] Successfully updated user to premium tier');

          await updateUserPlan(userId, plan);
          console.log('[stripe-webhook] Successfully saved subscription plan:', plan);
        } catch (updateError) {
          console.error('[stripe-webhook] Failed to update user tier:', updateError);
          // Don't fail the webhook - Stripe will retry
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.warn('[stripe-webhook] No userId in subscription metadata');
          break;
        }

        console.log('[stripe-webhook] Subscription deleted for user:', userId.substring(0, 8) + '...');

        try {
          await updateUserTier(userId, 'free');
          console.log('[stripe-webhook] Successfully downgraded user to free tier');
        } catch (updateError) {
          console.error('[stripe-webhook] Failed to update user tier:', updateError);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.warn('[stripe-webhook] No userId in subscription metadata');
          break;
        }

        console.log('[stripe-webhook] Subscription updated for user:', userId.substring(0, 8) + '...');
        console.log('[stripe-webhook] Status:', subscription.status);
        console.log('[stripe-webhook] Cancel at period end:', subscription.cancel_at_period_end);

        // Update tier based on subscription status
        try {
          const targetTier = getSubscriptionTierStatus(subscription);
          await updateUserTier(userId, targetTier);
          console.log('[stripe-webhook] Updated user tier to:', targetTier);
        } catch (updateError) {
          console.error('[stripe-webhook] Failed to update user tier:', updateError);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[stripe-webhook] Payment failed for customer:', typeof invoice.customer === 'string' ? invoice.customer.substring(0, 8) + '...' : 'customer_id');
        console.log('[stripe-webhook] Invoice ID:', invoice.id.substring(0, 8) + '...');
        console.log('[stripe-webhook] Attempt count:', invoice.attempt_count);
        // User retains premium access until subscription status changes
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[stripe-webhook] Payment succeeded for customer:', typeof invoice.customer === 'string' ? invoice.customer.substring(0, 8) + '...' : 'customer_id');
        console.log('[stripe-webhook] Billing reason:', invoice.billing_reason);

        // Optionally confirm tier is premium
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const userId = subscription.metadata?.userId;

            if (userId) {
              const targetTier = getSubscriptionTierStatus(subscription);
              await updateUserTier(userId, targetTier);
              console.log('[stripe-webhook] Confirmed user tier:', targetTier);
            }
          } catch (error) {
            console.warn('[stripe-webhook] Could not confirm tier:', error);
          }
        }
        break;
      }

      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Webhook processing failed',
      500
    );
  }
});

