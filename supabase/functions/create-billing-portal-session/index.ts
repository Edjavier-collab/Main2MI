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
      console.error('[create-billing-portal-session] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const { userId, returnUrl } = await req.json();

    if (!userId) {
      return errorResponse('Missing userId', 400, req);
    }

    // Verify userId matches authenticated user
    if (userId !== authenticatedUser.id) {
      console.error('[create-billing-portal-session] UserId mismatch:', { requested: userId, authenticated: authenticatedUser.id });
      return errorResponse('Unauthorized: userId mismatch', 403, req);
    }

    console.log('[create-billing-portal-session] Creating billing portal session for user:', userId.substring(0, 8) + '...');

    const stripe = getStripe();

    // Get user email and find customer
    const userEmail = await getUserEmail(userId);
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return errorResponse('No Stripe customer found', 404, req);
    }

    const customer = customers.data[0];

    // Create billing portal session
    // The return_url should be the app URL where users will be redirected after managing billing
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/settings`,
    });

    console.log('[create-billing-portal-session] Created portal session:', portalSession.id);

    return jsonResponse({
      url: portalSession.url,
    }, 200, req);
  } catch (error) {
    console.error('[create-billing-portal-session] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create billing portal session',
      500,
      req
    );
  }
});
