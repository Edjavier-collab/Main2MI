import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getStripe } from '../_shared/stripe.ts';
import { getUserEmail, verifyJWT } from '../_shared/supabase.ts';

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
      console.error('[apply-retention-discount] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401);
    }

    const { userId } = await req.json();

    if (!userId) {
      return errorResponse('Missing userId', 400);
    }

    // Verify userId matches authenticated user
    if (userId !== authenticatedUser.id) {
      console.error('[apply-retention-discount] UserId mismatch:', { requested: userId, authenticated: authenticatedUser.id });
      return errorResponse('Unauthorized: userId mismatch', 403);
    }

    console.log('[apply-retention-discount] Applying discount for user:', userId.substring(0, 8) + '...');

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

    // Check if retention discount already applied
    if (subscription.discount?.coupon?.id === 'RETENTION_30') {
      return jsonResponse({
        success: true,
        message: 'Retention discount already applied',
        subscriptionId: subscription.id,
      });
    }

    // Create or retrieve retention coupon
    let coupon;
    try {
      coupon = await stripe.coupons.retrieve('RETENTION_30');
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'resource_missing') {
        coupon = await stripe.coupons.create({
          id: 'RETENTION_30',
          percent_off: 30,
          duration: 'forever',
          name: 'Retention Offer - 30% Off',
        });
        console.log('[apply-retention-discount] Created retention coupon');
      } else {
        throw error;
      }
    }

    // Apply coupon to subscription
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      coupon: 'RETENTION_30',
    });

    console.log('[apply-retention-discount] Applied discount to subscription:', subscription.id);
    return jsonResponse({
      success: true,
      subscriptionId: updatedSubscription.id,
      discountApplied: true,
    });
  } catch (error) {
    console.error('[apply-retention-discount] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to apply retention discount',
      500
    );
  }
});

