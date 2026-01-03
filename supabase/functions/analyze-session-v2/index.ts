import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

/**
 * Analyze Session Edge Function V2
 * 
 * MODERNIZED VERSION - Initially identical to legacy, will be refactored incrementally.
 * 
 * This function will be modernized behind the Bridge Adapter pattern.
 * For now, it's a copy of analyze-session/index.ts to enable dual-run comparison.
 * 
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { transcript: ChatMessage[], patient: PatientProfile }
 * Returns: Feedback object with empathy score, skills detected, etc.
 */

// Feedback schema enum values
const FEEDBACK_SKILLS = [
  'Open Questions',
  'Affirmations',
  'Reflections',
  'Summaries',
  'Developing Discrepancy',
  'Eliciting Change Talk',
  'Rolling with Resistance',
  'Supporting Self-Efficacy'
];

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const FEEDBACK_TIMEOUT_MS = 30000; // 30 seconds

// Helper function to create timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

// Helper function to sanitize skills array
function sanitizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return skills.filter((s): s is string => typeof s === 'string' && FEEDBACK_SKILLS.includes(s));
}

// Helper function to sanitize string
function sanitizeString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

// Helper function to coerce skill counts
function coerceSkillCounts(rawCounts: unknown): Record<string, number> {
  if (!rawCounts) return {};
  try {
    if (typeof rawCounts === 'string') {
      return JSON.parse(rawCounts);
    }
    if (typeof rawCounts === 'object') {
      return rawCounts as Record<string, number>;
    }
  } catch (e) {
    console.warn('[analyze-session-v2] Failed to parse skillCounts', e);
  }
  return {};
}

// Normalize feedback output to match client-side format
function normalizeFeedbackOutput(feedbackJson: any) {
  const skillsDetected = sanitizeSkills(feedbackJson?.skillsDetected);
  const keySkillsUsed = sanitizeSkills(feedbackJson?.keySkillsUsed);
  const skillCounts = coerceSkillCounts(feedbackJson?.skillCounts);
  const empathyScoreRaw = Number(feedbackJson?.empathyScore);
  const empathyScore = Number.isFinite(empathyScoreRaw)
    ? Math.max(0, Math.min(5, Math.round(empathyScoreRaw)))
    : 0;

  const nextFocus = sanitizeString(
    feedbackJson?.nextFocus || feedbackJson?.nextPracticeFocus,
    'For your next session, focus on using at least three open questions and three reflections.'
  );

  return {
    keyTakeaway: sanitizeString(feedbackJson?.keyTakeaway, undefined as unknown as string),
    empathyScore,
    empathyBreakdown: sanitizeString(feedbackJson?.empathyBreakdown, 'No empathy analysis generated.'),
    whatWentRight: sanitizeString(feedbackJson?.whatWentRight, 'No strengths were detected.'),
    constructiveFeedback: sanitizeString(
      feedbackJson?.constructiveFeedback || feedbackJson?.areasForGrowth,
      'No constructive feedback generated.'
    ),
    areasForGrowth: sanitizeString(
      feedbackJson?.areasForGrowth || feedbackJson?.constructiveFeedback,
      'No areas for growth generated.'
    ),
    skillsDetected,
    keySkillsUsed: keySkillsUsed.length ? keySkillsUsed : skillsDetected,
    skillCounts,
    nextPracticeFocus: sanitizeString(
      feedbackJson?.nextPracticeFocus || feedbackJson?.nextFocus,
      'Practice delivering at least three complex reflections that capture both sides of ambivalence.'
    ),
    nextFocus,
    analysisStatus: feedbackJson?.analysisStatus || 'complete',
    analysisMessage: sanitizeString(feedbackJson?.analysisMessage, '')
  };
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

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[analyze-session-v2] Missing Supabase environment variables');
      return errorResponse('Server configuration error', 500, req);
    }

    // Require authenticated user - verify JWT token (no anonymous access)
    console.log(`[analyze-session-v2] Verifying token (length: ${token.length})`);
    
    // Create Supabase client for Edge Function
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Pass the JWT token directly to getUser() - Edge Functions have no session context
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError) {
      console.error('[analyze-session-v2] Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    if (!user) {
      console.error('[analyze-session-v2] No user returned from getUser()');
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const userId = user.id;
    console.log('[analyze-session-v2] Verified authenticated user:', userId.substring(0, 8) + '...');

    // Parse request body
    const { transcript, patient } = await req.json();

    // Validate required fields
    if (!transcript || !Array.isArray(transcript)) {
      return errorResponse('Missing or invalid transcript', 400, req);
    }

    if (!patient) {
      return errorResponse('Missing patient profile', 400, req);
    }

    // Check if there's clinician input
    const hasClinicianInput = transcript.some((msg: any) => msg.author === 'user' && msg.text?.trim());

    if (!hasClinicianInput) {
      console.warn('[analyze-session-v2] No clinician input detected. Returning insufficient data feedback.');
      return jsonResponse({
        empathyScore: 0,
        empathyBreakdown: "No clinician responses were captured in this session, so empathy cannot be assessed.",
        whatWentRight: "There's not enough clinician input from this session to generate feedback.",
        areasForGrowth: "No clinician responses were captured. Please try another session when you're ready to practice.",
        skillsDetected: [],
        skillCounts: {},
        nextFocus: "Try another practice session and engage with the patient to receive detailed feedback.",
        analysisStatus: 'insufficient-data',
        analysisMessage: "We didn't receive any clinician responses, so there isn't enough information to interpret this encounter. Try another session when you're ready to practice."
      }, 200, req);
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[analyze-session-v2] GEMINI_API_KEY not configured');
      return errorResponse('AI service not configured', 500, req);
    }

    // Format transcript for prompt
    const formattedTranscript = transcript
      .map((msg: any) => `${msg.author === 'user' ? 'Clinician' : 'Patient'}: ${msg.text}`)
      .join('\n');

    // Build the prompt (same as client-side)
    const prompt = `You are an expert MI coach, trained by Miller and Rollnick, the founders of Motivational Interviewing. Your tone is supportive, educational, and never judgmental. You focus on building the user's confidence while providing concrete, evidence-based suggestions for improvement.

Analyze the clinician's performance in the following transcript.

Patient Profile: ${JSON.stringify(patient)}

Transcript:
${formattedTranscript}

Crucially, you MUST ground your feedback in the transcript. When you mention something the clinician did well or could improve, quote the specific phrase they used to illustrate your point.

Based on your analysis, provide a detailed report in the requested JSON format with ALL required fields:

- empathyScore: A number from 1-5 rating the clinician's overall empathy level
- empathyBreakdown: Explain WHY you gave that score, referencing 2-3 specific examples from the transcript
- whatWentRight: What the clinician did well, with direct quotes from the transcript
- constructiveFeedback: Coaching-style feedback using the pattern: "Instead of saying '[exact quote from clinician]', you could have said '[your suggested alternative]'." Provide 1-2 concrete coaching suggestions in this format.
- areasForGrowth: Coaching-style growth suggestions. For each suggestion, use the pattern: "Instead of '[quote from clinician]', try '[improved version]'." Focus on actionable rewrites the clinician can practice.
- skillsDetected: An array of ALL MI skills you detected in the transcript (from: Open Questions, Affirmations, Reflections, Summaries, Developing Discrepancy, Eliciting Change Talk, Rolling with Resistance, Supporting Self-Efficacy)
- skillCounts: A JSON string representation of an object counting how many times each skill was used. Count all instances in the transcript. Format as a JSON string: "{\"Reflections\": 4, \"Open Questions\": 2, \"Affirmations\": 1}"
- nextFocus: A concise, actionable recommendation for the next practice session (1-2 sentences)

COACHING STYLE REQUIREMENT: For constructiveFeedback and areasForGrowth, you MUST use the "Instead of [quote], you could have said [suggestion]" pattern. This makes feedback actionable and concrete. Always quote the clinician's exact words, then provide a specific alternative they could practice.

IMPORTANT: Count every instance of each skill in the transcript. For example, if the clinician used 4 reflections, 2 open questions, and 1 affirmation, skillCounts should be: {"Reflections": 4, "Open Questions": 2, "Affirmations": 1}`;

    // Define feedback schema for structured output
    const feedbackSchema = {
      type: 'object',
      properties: {
        keyTakeaway: {
          type: 'string',
          description: "A single, concise sentence (max 20 words) that is the single most important takeaway for the user from this session.",
        },
        empathyScore: {
          type: 'integer',
          description: "A score from 1-5 on how empathetic the user's responses were. 1 is low, 5 is high. Always provide a score.",
        },
        empathyBreakdown: {
          type: 'string',
          description: "A 2-3 sentence explanation of why the empathy score was given. Reference specific examples from the transcript that demonstrate the level of empathy shown.",
        },
        whatWentRight: {
          type: 'string',
          description: "A paragraph (2-3 sentences) detailing what the user did well, focusing on specific examples of good MI practice. MUST include a direct quote from the clinician's transcript to support the analysis.",
        },
        constructiveFeedback: {
          type: 'string',
          description: "Coaching-style feedback using the 'Instead of [quote], you could have said [suggestion]' pattern. Provide 1-2 specific examples where you quote the clinician's exact words, then offer an improved alternative. Example: 'Instead of saying \"Why don't you just stop drinking?\", you could have said \"What would be different in your life if you decided to cut back on drinking?\"'",
        },
        areasForGrowth: {
          type: 'string',
          description: "Coaching-style growth suggestions using the 'Instead of [quote], try [improved version]' pattern. Focus on 1-2 actionable rewrites the clinician can practice. Always quote the clinician's actual words and provide a specific MI-aligned alternative.",
        },
        keySkillsUsed: {
          type: 'array',
          items: {
            type: 'string',
            enum: FEEDBACK_SKILLS
          },
          description: "An array of MI skills the user employed effectively. Only include skills from the provided enum list.",
        },
        skillsDetected: {
          type: 'array',
          items: {
            type: 'string',
            enum: FEEDBACK_SKILLS
          },
          description: "An array of all MI skills detected in the transcript, including both effective uses and opportunities. Only include skills from the provided enum list.",
        },
        skillCounts: {
          type: 'string',
          description: "A JSON string representation of an object mapping each detected skill to the number of times it was used. Format as a JSON string, e.g., '{\"Reflections\": 4, \"Open Questions\": 2, \"Affirmations\": 1}'. Only include skills that were actually used.",
        },
        nextPracticeFocus: {
          type: 'string',
          description: "A single, actionable goal for the user's next practice session. Frame it as a clear instruction, like 'For your next session, focus on asking at least three open-ended questions that explore the patient's values.'",
        },
        nextFocus: {
          type: 'string',
          description: "A concise next practice recommendation (1-2 sentences) with a specific, actionable focus area for improvement.",
        }
      },
      required: ["empathyScore", "empathyBreakdown", "whatWentRight", "areasForGrowth", "skillsDetected", "nextFocus"],
    };

    // Prepare Gemini API request
    const geminiRequest = {
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: feedbackSchema
      }
    };

    console.log('[analyze-session-v2] Calling Gemini API for user:', userId.substring(0, 8) + '...');

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
        createTimeoutPromise(FEEDBACK_TIMEOUT_MS)
      ]) as Response;
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        console.error('[analyze-session-v2] Gemini API timeout after', FEEDBACK_TIMEOUT_MS, 'ms');
        return errorResponse('AI analysis timed out. Please try again.', 504, req);
      }
      throw error;
    }

    // Handle rate limiting (429)
    if (geminiResponse.status === 429) {
      console.error('[analyze-session-v2] Gemini API rate limit exceeded');
      return errorResponse('AI service is currently busy. Please try again in a moment.', 429, req);
    }

    // Handle other HTTP errors
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[analyze-session-v2] Gemini API error:', geminiResponse.status, errorText);
      
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
      console.error('[analyze-session-v2] Invalid Gemini API response structure:', JSON.stringify(geminiData, null, 2));
      return errorResponse('Invalid response from AI service', 500, req);
    }

    // Extract JSON from response
    const candidate = geminiData.candidates[0];
    const content = candidate.content;
    
    if (!content.parts || !content.parts[0]) {
      console.error('[analyze-session-v2] No parts in Gemini response content:', JSON.stringify(content, null, 2));
      return errorResponse('Empty response from AI service', 500, req);
    }

    const textPart = content.parts[0];
    let feedbackJson: any;

    if (textPart.text) {
      // Parse JSON string from text field
      try {
        feedbackJson = JSON.parse(textPart.text);
      } catch (parseError) {
        console.error('[analyze-session-v2] Failed to parse JSON from Gemini response:', parseError);
        console.error('[analyze-session-v2] Raw text:', textPart.text);
        return errorResponse('Invalid JSON response from AI service', 500, req);
      }
    } else {
      console.error('[analyze-session-v2] No text content in Gemini response part:', JSON.stringify(textPart, null, 2));
      return errorResponse('Empty response from AI service', 500, req);
    }

    // Normalize and return feedback
    const normalizedFeedback = normalizeFeedbackOutput(feedbackJson);

    console.log('[analyze-session-v2] Successfully generated feedback for user:', userId.substring(0, 8) + '...');

    return jsonResponse(normalizedFeedback, 200, req);

  } catch (error) {
    console.error('[analyze-session-v2] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to analyze session',
      500,
      req
    );
  }
});
