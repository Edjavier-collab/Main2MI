import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { getSupabaseAdmin, verifyJWT } from '../_shared/supabase.ts';

/**
 * Dual-Run Coaching Summary Edge Function
 * 
 * This function implements the dual-run comparison system for Strangler Fig migration.
 * 
 * Strategy:
 * 1. Call both legacy (coaching-summary) and new (coaching-summary-v2) functions
 * 2. Compare outputs using BridgeAdapter comparison logic
 * 3. Track semantic-equal matches
 * 4. Return legacy output (for now) while logging comparison results
 * 
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { sessions: Session[] }
 * Returns: CoachingSummary object (legacy format) + comparison metadata
 */

const FUNCTION_NAME = 'coaching-summary';
const LEGACY_FUNCTION = 'coaching-summary';
const NEW_FUNCTION = 'coaching-summary-v2';
const CUTOVER_THRESHOLD = 10; // N=10 consecutive semantic-equal matches

// Get Supabase URL for internal function calls
function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) {
    throw new Error('SUPABASE_URL not configured');
  }
  return url;
}

// Call an Edge Function internally (same deployment)
async function callEdgeFunction(
  functionName: string,
  token: string,
  body: unknown
): Promise<Response> {
  const supabaseUrl = getSupabaseUrl();
  const functionsUrl = `${supabaseUrl}/functions/v1/${functionName}`;

  const response = await fetch(functionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return response;
}

// Compare two coaching summary outputs
interface DriftComparison {
  exactMatch: boolean;
  semanticEqual: boolean;
  differences: Array<{
    field: string;
    legacy: unknown;
    new: unknown;
    severity: 'critical' | 'moderate' | 'minor';
  }>;
}

function compareCoachingSummaryOutputs(legacy: any, newOutput: any): DriftComparison {
  const differences: DriftComparison['differences'] = [];

  // Critical fields (must match exactly)
  const criticalFields = ['totalSessions'];
  for (const field of criticalFields) {
    if (JSON.stringify(legacy[field]) !== JSON.stringify(newOutput[field])) {
      differences.push({
        field,
        legacy: legacy[field],
        new: newOutput[field],
        severity: 'critical',
      });
    }
  }

  // Moderate fields (semantic equivalence allowed)
  const moderateFields = ['strengthsAndTrends', 'areasForFocus', 'summaryAndNextSteps', 'dateRange'];
  for (const field of moderateFields) {
    const legacyVal = String(legacy[field] || '').trim().toLowerCase();
    const newVal = String(newOutput[field] || '').trim().toLowerCase();

    // Simple semantic check: significant length difference indicates drift
    if (Math.abs(legacyVal.length - newVal.length) > legacyVal.length * 0.3 && legacyVal.length > 0) {
      differences.push({
        field,
        legacy: legacy[field],
        new: newOutput[field],
        severity: 'moderate',
      });
    }
  }

  // Minor fields (can differ)
  const minorFields = ['skillProgression', 'topSkillsToImprove', 'specificNextSteps'];
  for (const field of minorFields) {
    if (JSON.stringify(legacy[field]) !== JSON.stringify(newOutput[field])) {
      differences.push({
        field,
        legacy: legacy[field],
        new: newOutput[field],
        severity: 'minor',
      });
    }
  }

  const exactMatch = differences.length === 0;
  const semanticEqual = differences.filter(d => d.severity === 'critical').length === 0;

  return {
    exactMatch,
    semanticEqual,
    differences,
  };
}

// Get current consecutive match count for a function
async function getConsecutiveMatches(
  supabase: any,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('dual_run_tracking')
    .select('consecutive_semantic_matches')
    .eq('function_name', FUNCTION_NAME)
    .eq('user_id', userId)
    .order('run_timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.consecutive_semantic_matches || 0;
}

// Record dual-run comparison result
async function recordComparison(
  supabase: any,
  userId: string,
  comparison: DriftComparison,
  legacyOutput: any,
  newOutput: any,
  errorMessage?: string
): Promise<void> {
  const previousMatches = await getConsecutiveMatches(supabase, userId);
  const newConsecutiveMatches = comparison.semanticEqual
    ? previousMatches + 1
    : 0;

  // Get total runs
  const { count } = await supabase
    .from('dual_run_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('function_name', FUNCTION_NAME)
    .eq('user_id', userId);

  const totalRuns = (count || 0) + 1;

  await supabase.from('dual_run_tracking').insert({
    function_name: FUNCTION_NAME,
    user_id: userId,
    exact_match: comparison.exactMatch,
    semantic_equal: comparison.semanticEqual,
    differences: comparison.differences,
    consecutive_semantic_matches: newConsecutiveMatches,
    total_runs: totalRuns,
    legacy_output: legacyOutput,
    adapted_output: newOutput,
    error_message: errorMessage,
  });

  console.log(`[dual-run-coaching-summary] Recorded comparison: semanticEqual=${comparison.semanticEqual}, consecutiveMatches=${newConsecutiveMatches}/${CUTOVER_THRESHOLD}`);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405, req);
    }

    // Get the token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401, req);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token and get user
    let authenticatedUser;
    try {
      authenticatedUser = await verifyJWT(token);
    } catch (authError) {
      console.error('[dual-run-coaching-summary] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const userId = authenticatedUser.id;
    console.log('[dual-run-coaching-summary] Verified authenticated user:', userId.substring(0, 8) + '...');

    // Parse request body
    const requestBody = await req.json();
    const { sessions } = requestBody;

    // Validate required fields
    if (!sessions || !Array.isArray(sessions)) {
      return errorResponse('Missing or invalid sessions array', 400, req);
    }

    if (sessions.length === 0) {
      return errorResponse('No session data available to generate a summary', 400, req);
    }

    // Call both legacy and new functions in parallel
    console.log('[dual-run-coaching-summary] Calling legacy and new functions in parallel...');

    const [legacyResponse, newResponse] = await Promise.allSettled([
      callEdgeFunction(LEGACY_FUNCTION, token, requestBody),
      callEdgeFunction(NEW_FUNCTION, token, requestBody),
    ]);

    // Handle legacy response (required - this is what we return)
    let legacyOutput: any;
    if (legacyResponse.status === 'fulfilled' && legacyResponse.value.ok) {
      legacyOutput = await legacyResponse.value.json();
    } else {
      const error = legacyResponse.status === 'rejected'
        ? legacyResponse.reason
        : `Legacy function returned ${legacyResponse.value.status}`;
      console.error('[dual-run-coaching-summary] Legacy function failed:', error);
      return errorResponse('Failed to generate coaching summary', 500, req);
    }

    // Handle new response (optional - for comparison)
    let newOutput: any;
    let comparisonError: string | undefined;

    if (newResponse.status === 'fulfilled' && newResponse.value.ok) {
      newOutput = await newResponse.value.json();
    } else {
      const error = newResponse.status === 'rejected'
        ? String(newResponse.reason)
        : `New function returned ${newResponse.value.status}`;
      console.warn('[dual-run-coaching-summary] New function failed (non-critical):', error);
      comparisonError = error;
      newOutput = null;
    }

    // Compare outputs if both succeeded
    let comparison: DriftComparison | null = null;
    if (newOutput) {
      comparison = compareCoachingSummaryOutputs(legacyOutput, newOutput);
      console.log('[dual-run-coaching-summary] Comparison result:', {
        exactMatch: comparison.exactMatch,
        semanticEqual: comparison.semanticEqual,
        differencesCount: comparison.differences.length,
      });
    }

    // Record comparison in database
    const supabaseAdmin = getSupabaseAdmin();
    try {
      if (comparison) {
        await recordComparison(
          supabaseAdmin,
          userId,
          comparison,
          legacyOutput,
          newOutput,
          comparisonError
        );
      } else {
        // Record error case
        await recordComparison(
          supabaseAdmin,
          userId,
          {
            exactMatch: false,
            semanticEqual: false,
            differences: [],
          },
          legacyOutput,
          null,
          comparisonError
        );
      }
    } catch (dbError) {
      console.error('[dual-run-coaching-summary] Failed to record comparison:', dbError);
      // Don't fail the request if tracking fails
    }

    // Return legacy output (for now - until cutover)
    return jsonResponse(legacyOutput, 200, req);

  } catch (error) {
    console.error('[dual-run-coaching-summary] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate coaching summary',
      500,
      req
    );
  }
});
