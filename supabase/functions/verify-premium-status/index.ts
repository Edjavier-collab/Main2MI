import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

/**
 * Verify Premium Status Edge Function
 * 
 * This function verifies a user's premium status server-side.
 * It cannot be spoofed by client-side localStorage manipulation.
 * 
 * Authentication: Requires valid JWT token in Authorization header
 * Returns: { isPremium: boolean, tier: string, verifiedAt: string }
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the user's token to verify it
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[verify-premium-status] Missing Supabase environment variables');
      return errorResponse('Server configuration error', 500);
    }

    // Create client with user's JWT to verify authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user's session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('[verify-premium-status] Auth error:', authError);
      return errorResponse('Invalid or expired token', 401);
    }

    console.log('[verify-premium-status] Verified user:', user.id.substring(0, 8) + '...');

    // Now use service role to get the actual tier from profiles table
    // This ensures we're reading the true server-side value
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      console.error('[verify-premium-status] Missing service role key');
      return errorResponse('Server configuration error', 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user's tier from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tier, updated_at')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      // Profile might not exist yet
      if (profileError.code === 'PGRST116') {
        console.log('[verify-premium-status] No profile found for user:', user.id.substring(0, 8) + '...');
        return jsonResponse({
          isPremium: false,
          tier: 'free',
          verifiedAt: new Date().toISOString(),
          userId: user.id,
        });
      }
      console.error('[verify-premium-status] Profile error:', profileError);
      return errorResponse('Failed to verify premium status', 500);
    }

    const tier = profile?.tier || 'free';
    const isPremium = tier === 'premium';

    console.log('[verify-premium-status] User tier:', tier, 'isPremium:', isPremium);

    return jsonResponse({
      isPremium,
      tier,
      verifiedAt: new Date().toISOString(),
      userId: user.id,
      lastUpdated: profile?.updated_at || null,
    });
  } catch (error) {
    console.error('[verify-premium-status] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to verify premium status',
      500
    );
  }
});
