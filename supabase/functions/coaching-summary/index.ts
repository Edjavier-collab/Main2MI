import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

/**
 * Coaching Summary Edge Function
 * 
 * Generates a coaching summary from multiple practice sessions using Google Gemini AI.
 * 
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { sessions: Session[] }
 * Returns: CoachingSummary object
 */

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const RESPONSE_TIMEOUT_MS = 60000; // 60 seconds (coaching summaries take longer)

// Helper function to create timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

// Format date as MM/DD/YYYY
function formatDateToMMDDYYYY(dateInput: string | number | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return String(dateInput ?? 'Invalid date');
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Normalize coaching summary response
function normalizeCoachingSummary(
  summaryJson: any,
  totalSessions: number,
  firstSessionDate: string,
  lastSessionDate: string
): any {
  const safeString = (val: unknown, fallback: string) =>
    typeof val === 'string' && val.trim().length ? val : fallback;

  const safeArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string' && v.trim().length) : [];

  const safeProgression = (val: unknown): any[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map(item => {
        if (!item || typeof item !== 'object') return null;
        const skillName = safeString((item as any).skillName, '');
        const totalCount = Number((item as any).totalCount);
        const averagePerSession = Number((item as any).averagePerSession);
        const trend = (item as any).trend;
        if (!skillName) return null;
        return {
          skillName,
          totalCount: Number.isFinite(totalCount) ? totalCount : 0,
          averagePerSession: Number.isFinite(averagePerSession) ? averagePerSession : 0,
          trend: trend === 'increasing' || trend === 'decreasing' ? trend : 'stable'
        };
      })
      .filter(Boolean);
  };

  return {
    totalSessions,
    dateRange: `${firstSessionDate} to ${lastSessionDate}`,
    strengthsAndTrends: safeString(
      summaryJson?.strengthsAndTrends,
      `Across your ${totalSessions} session${totalSessions === 1 ? '' : 's'}, you've shown consistent engagement and rapport-building.`
    ),
    areasForFocus: safeString(
      summaryJson?.areasForFocus,
      'Focus on deepening reflections and eliciting change talk consistently across sessions.'
    ),
    summaryAndNextSteps: safeString(
      summaryJson?.summaryAndNextSteps,
      `Nice work staying consistent across ${totalSessions} session${totalSessions === 1 ? '' : 's'}. For your next session, pick one MI skill to emphasize and measure it.`
    ),
    skillProgression: safeProgression(summaryJson?.skillProgression),
    topSkillsToImprove: safeArray(summaryJson?.topSkillsToImprove),
    specificNextSteps: safeArray(summaryJson?.specificNextSteps),
  };
}

// Coaching summary schema for Gemini
const coachingSummarySchema = {
  type: 'object',
  properties: {
    totalSessions: { 
      type: 'integer',
      description: 'The total number of sessions being analyzed.'
    },
    dateRange: { 
      type: 'string',
      description: 'The date range of the sessions, e.g., "May 1, 2024 to May 30, 2024".'
    },
    strengthsAndTrends: { 
      type: 'string', 
      description: 'A detailed analysis of recurring strengths and positive trends. Use markdown for lists (e.g., "* Point one").' 
    },
    areasForFocus: { 
      type: 'string', 
      description: 'A detailed analysis of 1-2 core themes for continued focus. Use markdown for lists if needed.' 
    },
    summaryAndNextSteps: { 
      type: 'string', 
      description: 'A brief, encouraging summary and a concrete, actionable next step for their next practice session. Use markdown for lists if needed.' 
    },
    skillProgression: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skillName: {
            type: 'string',
            description: 'The name of the MI skill (e.g., "Reflections", "Open Questions", "Affirmations")'
          },
          totalCount: {
            type: 'integer',
            description: 'The total number of times this skill was used across all sessions'
          },
          averagePerSession: {
            type: 'number',
            description: 'The average number of times this skill was used per session'
          },
          trend: {
            type: 'string',
            enum: ['increasing', 'stable', 'decreasing'],
            description: 'Whether the skill usage is increasing, stable, or decreasing across sessions'
          }
        },
        required: ['skillName', 'totalCount', 'averagePerSession', 'trend']
      },
      description: 'An array of skill progression data showing usage counts and trends for each MI skill detected across sessions'
    },
    topSkillsToImprove: {
      type: 'array',
      items: { type: 'string' },
      description: 'An array of 1-2 skill names that need the most focus and improvement (e.g., ["Reflections", "Open Questions"])'
    },
    specificNextSteps: {
      type: 'array',
      items: { type: 'string' },
      description: 'An array of 2-3 specific, measurable action steps for the next practice session (e.g., ["Use at least 5 reflections in your next session", "Ask 3 open-ended questions that explore patient values"])'
    }
  },
  required: ['totalSessions', 'dateRange', 'strengthsAndTrends', 'areasForFocus', 'summaryAndNextSteps']
};

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

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[coaching-summary] Missing Supabase environment variables');
      return errorResponse('Server configuration error', 500, req);
    }

    // Verify JWT token
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('[coaching-summary] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const userId = user.id;
    console.log('[coaching-summary] Verified authenticated user:', userId.substring(0, 8) + '...');

    // Parse request body
    const { sessions } = await req.json();

    // Validate required fields
    if (!sessions || !Array.isArray(sessions)) {
      return errorResponse('Missing or invalid sessions array', 400, req);
    }

    if (sessions.length === 0) {
      return errorResponse('No session data available to generate a summary', 400, req);
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[coaching-summary] GEMINI_API_KEY not configured');
      return errorResponse('AI service not configured', 500, req);
    }

    // Prepare session summaries
    const sessionSummaries = sessions.map((session: any) => ({
      date: formatDateToMMDDYYYY(session.date),
      patientTopic: session.patient?.topic || 'Unknown',
      stageOfChange: session.patient?.stageOfChange || 'Unknown',
      whatWentRight: session.feedback?.whatWentRight || 'Not specified',
      constructiveFeedback: session.feedback?.constructiveFeedback || session.feedback?.areasForGrowth || 'Not specified.',
      empathyScore: session.feedback?.empathyScore || 0,
      keySkillsUsed: session.feedback?.keySkillsUsed || session.feedback?.skillsDetected || [],
      skillCounts: session.feedback?.skillCounts || {},
    }));

    const firstSessionDate = formatDateToMMDDYYYY(sessions[0].date);
    const lastSessionDate = formatDateToMMDDYYYY(sessions[sessions.length - 1].date);

    // Build prompt
    const prompt = `
    You are an expert Motivational Interviewing (MI) coach analyzing a user's practice sessions.
    Your tone should be encouraging, insightful, and focused on growth.
    
    IMPORTANT: This analysis is based on ${sessionSummaries.length} practice session${sessionSummaries.length === 1 ? '' : 's'} that have been aggregated and analyzed together. Make sure to reference this in your analysis where relevant.
    
    Based on the following ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'}, generate a comprehensive "Coaching Summary" for the user.

    Provide a JSON object with the following structure:
    - totalSessions: The total number of sessions analyzed (${sessionSummaries.length}).
    - dateRange: The date range of the sessions analyzed (${firstSessionDate} to ${lastSessionDate}).
    - strengthsAndTrends: 
      * Analyze recurring strengths and patterns across all ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'} from "whatWentRight" fields.
      * Analyze the "keySkillsUsed" across sessions—are they using more complex skills over time (e.g., moving from only Open Questions to more Reflections)? Look for skill progression patterns.
      * Comment on the consistency and trends in "empathyScore" across sessions—are scores improving, stable, or varying? Note any upward trends.
      * Reference specific examples from the sessions when highlighting strengths.
      * Use markdown for bullet points (e.g., "* Point one").
      * Begin by acknowledging the number of sessions analyzed (e.g., "Across your ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'}, you've demonstrated...").
    - areasForFocus: 
      * Synthesize the "constructiveFeedback" fields from all ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'} into 1-2 core themes that appear consistently.
      * Explain *why* focusing on these themes will have the biggest impact on their MI practice.
      * Provide specific, actionable guidance based on patterns observed across multiple sessions.
      * Reference that these patterns emerged from analyzing ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'}.
    - summaryAndNextSteps: 
      * Provide a brief, encouraging summary that acknowledges the ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'} analyzed.
      * Suggest a concrete, actionable next step for their next practice session that builds on the identified themes.
      * Make the recommendation specific and measurable.
    - skillProgression:
      * Analyze the "skillCounts" objects from each session to calculate skill usage progression.
      * For each MI skill that appears in the skillCounts across sessions, calculate:
        - skillName: The name of the skill (e.g., "Reflections", "Open Questions", "Affirmations", "Summaries", "Developing Discrepancy", "Eliciting Change Talk", "Rolling with Resistance", "Supporting Self-Efficacy")
        - totalCount: Sum of all uses of this skill across all sessions
        - averagePerSession: Total count divided by number of sessions
        - trend: "increasing" if the skill is used more in later sessions, "decreasing" if less in later sessions, "stable" if usage is consistent
      * Include ALL skills that appear in any session's skillCounts. If a skill appears in some sessions but not others, include it with counts from sessions where it was used.
      * Order skills by totalCount (highest first) to highlight most-used skills.
    - topSkillsToImprove:
      * Identify 1-2 skills that appear least frequently in skillCounts OR skills where the trend is "decreasing"
      * These should be skills that, if improved, would have the biggest impact on their MI practice
      * Return as an array of skill names (e.g., ["Reflections", "Open Questions"])
    - specificNextSteps:
      * Generate 2-3 specific, measurable action steps based on the skillProgression analysis
      * Each step should be concrete and actionable (e.g., "Use at least 5 reflections in your next practice session", "Ask 3 open-ended questions that explore patient values")
      * Focus on the topSkillsToImprove but also reference skills that are strengths
      * Make each step specific and measurable so the user knows exactly what to do

    Here is the aggregated data from ${sessionSummaries.length} session${sessionSummaries.length === 1 ? '' : 's'}:
    - Total Sessions Analyzed: ${sessionSummaries.length}
    - Date Range: ${firstSessionDate} to ${lastSessionDate}
    - Session Summaries (including skillCounts for trend analysis):
    ${JSON.stringify(sessionSummaries, null, 2)}
    `;

    // Prepare Gemini API request
    const geminiRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
        responseSchema: coachingSummarySchema,
      }
    };

    console.log('[coaching-summary] Calling Gemini API for user:', userId.substring(0, 8) + '...', 'sessions:', sessionSummaries.length);

    // Call Gemini API with timeout
    const geminiUrl = `${GEMINI_API_URL}?key=${geminiApiKey}`;
    
    let geminiResponse: Response;
    try {
      geminiResponse = await Promise.race([
        fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiRequest),
        }),
        createTimeoutPromise(RESPONSE_TIMEOUT_MS)
      ]) as Response;
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        console.error('[coaching-summary] Gemini API timeout after', RESPONSE_TIMEOUT_MS, 'ms');
        return errorResponse('AI response timed out. Please try again.', 504, req);
      }
      throw error;
    }

    // Handle rate limiting (429)
    if (geminiResponse.status === 429) {
      console.error('[coaching-summary] Gemini API rate limit exceeded');
      return errorResponse('AI service is currently busy. Please try again in a moment.', 429, req);
    }

    // Handle other HTTP errors
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[coaching-summary] Gemini API error:', geminiResponse.status, errorText);
      
      if (geminiResponse.status === 400) {
        return errorResponse('Invalid request to AI service', 400, req);
      }
      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        return errorResponse('AI service authentication failed', 500, req);
      }
      
      return errorResponse('AI service error. Please try again later.', 500, req);
    }

    // Parse response
    const geminiData = await geminiResponse.json();

    // Check if response has text content
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('[coaching-summary] Invalid Gemini API response structure:', JSON.stringify(geminiData, null, 2));
      return errorResponse('Invalid response from AI service', 500, req);
    }

    // Extract text from response
    const candidate = geminiData.candidates[0];
    const content = candidate.content;
    
    if (!content.parts || !content.parts[0] || !content.parts[0].text) {
      console.error('[coaching-summary] No text in Gemini response:', JSON.stringify(content, null, 2));
      return errorResponse('Empty response from AI service', 500, req);
    }

    let responseText = content.parts[0].text.trim();

    // Parse JSON response
    let summaryJson: any;
    try {
      summaryJson = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[coaching-summary] Failed to parse JSON response:', parseError);
      return errorResponse('Invalid JSON response from AI service', 500, req);
    }

    // Normalize the response
    const normalizedSummary = normalizeCoachingSummary(
      summaryJson,
      sessionSummaries.length,
      firstSessionDate,
      lastSessionDate
    );

    console.log('[coaching-summary] Successfully generated coaching summary for user:', userId.substring(0, 8) + '...');

    return jsonResponse(normalizedSummary, 200, req);

  } catch (error) {
    console.error('[coaching-summary] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate coaching summary',
      500,
      req
    );
  }
});
