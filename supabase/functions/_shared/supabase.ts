import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Verify JWT token and return authenticated user
export async function verifyJWT(token: string): Promise<{ id: string; email?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  console.log('[verifyJWT] Starting verification, token length:', token?.length);
  console.log('[verifyJWT] SUPABASE_URL:', supabaseUrl?.substring(0, 30) + '...');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[verifyJWT] Missing env vars:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });
    throw new Error('Supabase environment variables not set');
  }

  // Decode JWT to check the issuer (iss) claim
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('[verifyJWT] Token payload:', {
        iss: payload.iss,
        ref: payload.ref || 'N/A',
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat,
        now: Math.floor(Date.now() / 1000),
        expired: payload.exp < Math.floor(Date.now() / 1000)
      });

      // Check if token is for a different project
      const expectedRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (expectedRef && payload.ref && payload.ref !== expectedRef) {
        console.error('[verifyJWT] TOKEN PROJECT MISMATCH! Token ref:', payload.ref, 'Expected:', expectedRef);
        throw new Error(`Token was issued for project "${payload.ref}" but this function is running on "${expectedRef}". Please clear your browser data and log in again.`);
      }
    }
  } catch (decodeError) {
    console.warn('[verifyJWT] Could not decode token for debugging:', decodeError);
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

  if (authError) {
    console.error('[verifyJWT] Auth error:', {
      message: authError.message,
      status: authError.status,
      name: authError.name,
      code: (authError as any).code,
      __isAuthError: (authError as any).__isAuthError
    });
    throw new Error(authError.message || 'Invalid or expired token');
  }

  if (!user) {
    console.error('[verifyJWT] No user returned from getUser');
    throw new Error('Invalid or expired token');
  }

  console.log('[verifyJWT] Successfully verified user:', user.id.substring(0, 8) + '...');
  return { id: user.id, email: user.email };
}

// Create Supabase admin client with service role key
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not set');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Update user tier in profiles table (uses upsert to handle missing profiles)
export async function updateUserTier(userId: string, tier: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  console.log(`[supabase] Updating tier for user ${userId.substring(0, 8)}... to ${tier}`);

  // First try to update existing profile
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({
      tier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select();

  // If update succeeded and affected rows, we're done
  if (!updateError && updateData && updateData.length > 0) {
    console.log(`[supabase] Successfully updated tier to ${tier}`);
    return;
  }

  // If no rows updated, try to insert (profile might not exist)
  if (!updateError && (!updateData || updateData.length === 0)) {
    console.log(`[supabase] No profile found, creating new profile for user ${userId.substring(0, 8)}...`);

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        tier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      // If insert fails due to duplicate, try update again (race condition)
      if (insertError.code === '23505') {
        console.log(`[supabase] Profile was created concurrently, retrying update`);
        const { error: retryError } = await supabase
          .from('profiles')
          .update({ tier, updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (retryError) {
          console.error('[supabase] Failed to update tier on retry:', retryError);
          throw new Error(`Failed to update user tier: ${retryError.message}`);
        }
      } else {
        console.error('[supabase] Failed to insert profile:', insertError);
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }
    }

    console.log(`[supabase] Successfully created profile with tier ${tier}`);
    return;
  }

  if (updateError) {
    console.error('[supabase] Failed to update tier:', updateError);
    throw new Error(`Failed to update user tier: ${updateError.message}`);
  }

  console.log(`[supabase] Successfully updated tier to ${tier}`);
}

// Update user subscription plan in profiles table
export async function updateUserPlan(userId: string, plan: string): Promise<void> {
  if (!['monthly', 'annual'].includes(plan)) {
    console.warn(`[supabase] Invalid plan: ${plan}, skipping update`);
    return;
  }

  const supabase = getSupabaseAdmin();

  console.log(`[supabase] Updating plan for user ${userId.substring(0, 8)}... to ${plan}`);

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      // Check if error is due to missing column
      if (error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.warn('[supabase] subscription_plan column does not exist yet');
        return;
      }
      throw error;
    }

    console.log(`[supabase] Successfully updated plan to ${plan}`);
  } catch (err) {
    console.error('[supabase] Failed to update plan:', err);
    // Don't throw - plan update is not critical
  }
}

// Get user email from Supabase auth
export async function getUserEmail(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data?.user?.email) {
    throw new Error(`Failed to get user email: ${error?.message || 'No email found'}`);
  }

  return data.user.email;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<{ tier: string; subscription_plan?: string } | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('tier, subscription_plan')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    // Handle missing column gracefully
    if (error.message?.includes('column') || error.message?.includes('does not exist')) {
      const { data: tierData, error: tierError } = await supabase
        .from('profiles')
        .select('tier')
        .eq('user_id', userId)
        .single();

      if (tierError) return null;
      return tierData;
    }
    console.error('[supabase] Failed to get profile:', error);
    return null;
  }

  return data;
}

