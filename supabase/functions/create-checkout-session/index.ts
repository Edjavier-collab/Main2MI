import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe, getPriceIds } from '../_shared/stripe.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const { userId, plan, email } = await req.json();

    // Validate required fields
    if (!userId || !plan) {
      console.error('[create-checkout-session] Missing userId or plan:', { userId, plan });
      return errorResponse('Missing userId or plan', 400);
    }

    if (!['monthly', 'annual'].includes(plan)) {
      console.error('[create-checkout-session] Invalid plan:', plan);
      return errorResponse('Invalid plan. Must be "monthly" or "annual"', 400);
    }

    // Get Stripe instance and price IDs
    const stripe = getStripe();
    const priceIds = getPriceIds();
    const priceId = priceIds[plan as keyof typeof priceIds];

    if (!priceId) {
      const errorMsg = `Price ID not configured for plan: ${plan}`;
      console.error('[create-checkout-session]', errorMsg);
      return errorResponse(errorMsg, 500);
    }

    console.log('[create-checkout-session] Creating session for user:', userId, 'plan:', plan);

    // Get the origin for success/cancel URLs
    const origin = req.headers.get('origin') || Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    const successUrl = `${origin}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`;
    const cancelUrl = origin;

    // Create Checkout Session
    const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
        tier: 'premium',
      },
      billing_address_collection: 'auto',
    };

    // Add customer email if provided
    if (email) {
      sessionConfig.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('[create-checkout-session] Session created:', session.id);

    return jsonResponse({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[create-checkout-session] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create checkout session',
      500
    );
  }
});

