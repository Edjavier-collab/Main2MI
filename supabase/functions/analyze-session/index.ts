import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

/**
 * Analyze Session Edge Function (v3 - Clinical Feedback)
 *
 * Analyzes a practice session transcript using Google Gemini AI.
 * Returns behavioral metrics, strengths, and growth opportunities
 * using an MI clinical supervision model.
 *
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { transcript: ChatMessage[], patient: PatientProfile }
 * Returns: Feedback object with behavioral metrics, skills detected, etc.
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
    console.warn('[analyze-session] Failed to parse skillCounts', e);
  }
  return {};
}

// Helper to sanitize behavioral metrics object
function sanitizeBehavioralMetrics(value: unknown): {
  reflectionToQuestionRatio: number;
  openQuestions: number;
  closedQuestions: number;
  simpleReflections: number;
  complexReflections: number;
  affirmations: number;
  miAdherentStatements: number;
  miInconsistentStatements: number;
} {
  const defaults = {
    reflectionToQuestionRatio: 0,
    openQuestions: 0,
    closedQuestions: 0,
    simpleReflections: 0,
    complexReflections: 0,
    affirmations: 0,
    miAdherentStatements: 0,
    miInconsistentStatements: 0,
  };
  if (!value || typeof value !== 'object') return defaults;
  const m = value as any;
  const safeInt = (v: unknown) => Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0;
  const safeNum = (v: unknown) => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
  return {
    reflectionToQuestionRatio: Math.round(safeNum(m.reflectionToQuestionRatio) * 100) / 100,
    openQuestions: safeInt(m.openQuestions),
    closedQuestions: safeInt(m.closedQuestions),
    simpleReflections: safeInt(m.simpleReflections),
    complexReflections: safeInt(m.complexReflections),
    affirmations: safeInt(m.affirmations),
    miAdherentStatements: safeInt(m.miAdherentStatements),
    miInconsistentStatements: safeInt(m.miInconsistentStatements),
  };
}

// Helper to sanitize whatWentWell (structured array)
function sanitizeWhatWentWell(value: unknown): Array<{ quote: string; skill: string; spiritConnection: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item && typeof item === 'object' &&
      typeof item.quote === 'string' &&
      typeof item.skill === 'string' &&
      typeof item.spiritConnection === 'string'
    )
    .map((item: any) => ({
      quote: item.quote.trim(),
      skill: item.skill.trim(),
      spiritConnection: item.spiritConnection.trim(),
    }));
}

// Helper to sanitize growthOpportunities (structured array)
function sanitizeGrowthOpportunities(value: unknown): Array<{ quote: string; principle: string; alternativePhrasing: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item && typeof item === 'object' &&
      typeof item.quote === 'string' &&
      typeof item.principle === 'string' &&
      typeof item.alternativePhrasing === 'string'
    )
    .map((item: any) => ({
      quote: item.quote.trim(),
      principle: item.principle.trim(),
      alternativePhrasing: item.alternativePhrasing.trim(),
    }));
}

// Helper to sanitize missedOpportunities (structured array)
function sanitizeMissedOpportunities(value: unknown): Array<{ patientSaid: string; opportunityType: string; coachingTip: string; exampleResponse: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item && typeof item === 'object' &&
      typeof item.patientSaid === 'string' &&
      typeof item.opportunityType === 'string' &&
      typeof item.coachingTip === 'string' &&
      typeof item.exampleResponse === 'string'
    )
    .map((item: any) => ({
      patientSaid: item.patientSaid.trim(),
      opportunityType: item.opportunityType.trim(),
      coachingTip: item.coachingTip.trim(),
      exampleResponse: item.exampleResponse.trim(),
    }));
}

// Helper to sanitize coachingInsights (structured array)
function sanitizeCoachingInsights(value: unknown): Array<{ pattern: string; technique: string; rationale: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item && typeof item === 'object' &&
      typeof item.pattern === 'string' &&
      typeof item.technique === 'string' &&
      typeof item.rationale === 'string'
    )
    .map((item: any) => ({
      pattern: item.pattern.trim(),
      technique: item.technique.trim(),
      rationale: item.rationale.trim(),
    }));
}

// Normalize feedback output to match client-side format
function normalizeFeedbackOutput(feedbackJson: any) {
  const skillsDetected = sanitizeSkills(feedbackJson?.skillsDetected);
  const skillCounts = coerceSkillCounts(feedbackJson?.skillCounts);
  const behavioralMetrics = sanitizeBehavioralMetrics(feedbackJson?.behavioralMetrics);
  const whatWentWell = sanitizeWhatWentWell(feedbackJson?.whatWentWell);
  const growthOpportunities = sanitizeGrowthOpportunities(feedbackJson?.growthOpportunities);

  const missedOpportunities = sanitizeMissedOpportunities(feedbackJson?.missedOpportunities);
  const coachingInsights = sanitizeCoachingInsights(feedbackJson?.coachingInsights);

  const focusForNextSession = sanitizeString(
    feedbackJson?.focusForNextSession,
    'Focus on balancing your use of open questions with reflections in your next session.'
  );

  return {
    behavioralMetrics,
    whatWentWell,
    growthOpportunities,
    missedOpportunities,
    coachingInsights,
    skillsDetected,
    skillCounts,
    focusForNextSession,
    analysisStatus: feedbackJson?.analysisStatus || 'complete',
    analysisMessage: sanitizeString(feedbackJson?.analysisMessage, ''),
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
      console.error('[analyze-session] Missing Supabase environment variables');
      return errorResponse('Server configuration error', 500, req);
    }

    // Require authenticated user - verify JWT token (no anonymous access)
    console.log(`[analyze-session] Verifying token (length: ${token.length})`);

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
      console.error('[analyze-session] Auth error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    if (!user) {
      console.error('[analyze-session] No user returned from getUser()');
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const userId = user.id;
    console.log('[analyze-session] Verified authenticated user:', userId.substring(0, 8) + '...');

    // Parse request body
    const { sessionId, transcript: bodyTranscript, patient: bodyPatient } = await req.json();

    let transcript = bodyTranscript;
    let patient = bodyPatient;

    // If sessionId is provided, fetch from database (preferred)
    if (sessionId) {
      console.log(`[analyze-session] Fetching data for sessionId: ${sessionId}`);

      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseServiceKey) {
        console.error('[analyze-session] Missing service role key');
        return errorResponse('Server configuration error', 500, req);
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { data: dbSession, error: dbError } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (dbError) {
        console.warn(`[analyze-session] Database error fetching sessionId ${sessionId}, falling back to body data if available:`, dbError);
      } else if (!dbSession) {
        console.warn(`[analyze-session] Session ${sessionId} not found in database, falling back to body data if available.`);
      } else {
        // Verify ownership
        if (dbSession.user_id !== userId) {
          console.error(`[analyze-session] User mismatch: ${userId} != ${dbSession.user_id}`);
          return errorResponse('Unauthorized access to session', 403, req);
        }

        // Extract transcript and patient from session_data
        const sessionData = dbSession.session_data || {};
        transcript = dbSession.transcript || sessionData.transcript || (Array.isArray(sessionData) ? sessionData : transcript);
        patient = sessionData.patient || patient;

        console.log(`[analyze-session] Successfully retrieved session data from DB for: ${sessionId}. Transcript length: ${Array.isArray(transcript) ? transcript.length : 'N/A'}`);
      }
    }



    // Validate required fields
    if (!transcript || !Array.isArray(transcript)) {
      console.error('[analyze-session] Invalid transcript:', { hasTranscript: !!transcript, isArray: Array.isArray(transcript) });
      return errorResponse('Missing or invalid transcript', 400, req);
    }

    if (!patient) {
      console.error('[analyze-session] Missing patient profile');
      return errorResponse('Missing patient profile', 400, req);
    }

    // Check if there's clinician input
    const hasClinicianInput = transcript.some((msg: any) => msg.author === 'user' && msg.text?.trim());

    if (!hasClinicianInput) {
      console.warn('[analyze-session] No clinician input detected. Returning insufficient data feedback.');
      return jsonResponse({
        behavioralMetrics: {
          reflectionToQuestionRatio: 0,
          openQuestions: 0,
          closedQuestions: 0,
          simpleReflections: 0,
          complexReflections: 0,
          affirmations: 0,
          miAdherentStatements: 0,
          miInconsistentStatements: 0,
        },
        whatWentWell: [],
        growthOpportunities: [],
        missedOpportunities: [],
        coachingInsights: [],
        skillsDetected: [],
        skillCounts: {},
        focusForNextSession: "Try another practice session and engage with the patient by asking open questions and reflecting their responses.",
        analysisStatus: 'insufficient-data',
        analysisMessage: "We didn't receive any clinician responses, so there isn't enough information to analyze this encounter. Try another session when you're ready to practice."
      }, 200, req);
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[analyze-session] GEMINI_API_KEY not configured');
      return errorResponse('AI service not configured', 500, req);
    }

    // Format transcript for prompt
    const formattedTranscript = transcript
      .map((msg: any) => `${msg.author === 'user' ? 'Clinician' : 'Patient'}: ${msg.text}`)
      .join('\n');

    // Build the prompt
    const prompt = `You are an MI clinical supervisor reviewing a trainee's practice session. Your feedback should feel like a real supervision session—grounded in specific observations from the transcript, connected to MI principles, and focused on skill development.

ROLE: You are NOT evaluating or scoring. You are OBSERVING and COACHING. Describe what you see in the transcript and offer concrete alternatives.

Patient Profile: ${JSON.stringify(patient)}

Transcript:
${formattedTranscript}

FEEDBACK STRUCTURE:

1. BEHAVIORAL METRICS
Count these observable behaviors from the transcript:
- Open questions vs closed questions
- Simple reflections vs complex reflections (complex = adds meaning, captures ambivalence, or makes a guess about unstated emotion)
- Affirmations (genuine acknowledgments of patient strengths/efforts)
- MI-adherent statements (any statement that supports autonomy, elicits change talk, rolls with resistance, supports self-efficacy, or develops discrepancy — see MI SKILL DEFINITIONS below)
- MI-inconsistent statements (unsolicited advice, confrontation, warning, directing without permission)
Calculate reflection-to-question ratio (total reflections ÷ total questions).

2. MI SKILL DEFINITIONS — Use these to identify and count skills for skillsDetected and skillCounts:

BASIC OARS SKILLS:

a) OPEN QUESTIONS
What it looks like: Questions that invite elaboration and cannot be answered with yes/no.
Examples: "What brings you in today?", "How do you feel about your current situation?"
NOT open questions: "Do you drink?", "Have you tried quitting?"

b) AFFIRMATIONS
What it looks like: Genuine acknowledgments of patient strengths, efforts, or values — not generic praise.
Examples: "It takes real courage to come in and talk about this.", "The fact that you've been thinking about this shows how much you care."
NOT affirmations: "Good job!", "That's great!" (generic praise)

c) REFLECTIONS
What it looks like: Restating or rephrasing what the patient said. Simple = repeat/rephrase. Complex = adds deeper meaning, captures ambivalence, or guesses at unstated emotion.
Simple: Patient: "I've been drinking more." → Clinician: "You've noticed your drinking has increased."
Complex: Patient: "I know I should quit but I can't." → Clinician: "Part of you wants to quit, and another part isn't sure you're ready."

d) SUMMARIES
What it looks like: Collecting and linking together multiple things the patient has said across several exchanges. Often signaled by "Let me see if I have this right...", "So what I'm hearing is..."
Example: "So let me pull together what you've shared — you mentioned the drinking increased after the job loss, your wife has been worried, and you've been thinking about what this means for your health."
Key indicator: References 2+ distinct points the patient made earlier.

ADVANCED MI SKILLS:

e) DEVELOPING DISCREPANCY
What it looks like: Helping the patient see the gap between current behavior and their stated goals/values — without arguing. The clinician juxtaposes two things the patient said.
Example: "You mentioned wanting to be around for your kids' graduations, and you also mentioned smoking a pack a day. How do those fit together for you?"
Key indicator: References something the patient values AND a conflicting behavior, then invites reflection.

f) ELICITING CHANGE TALK
What it looks like: Questions or reflections designed to draw out the patient's OWN arguments for change (DARN-CAT: Desire, Ability, Reasons, Need, Commitment, Activation, Taking steps).
Examples: "What would you like to see different?" (Desire), "What makes you think you could make this change?" (Ability), "What are the best reasons for changing?" (Reasons), "How important is this to you?" (Need), "What are you willing to try this week?" (Commitment)
Key indicator: The clinician's statement is designed to get the PATIENT to articulate why or how they would change.

g) ROLLING WITH RESISTANCE
What it looks like: When the patient pushes back, argues, or minimizes, the clinician does NOT argue back. Instead they reflect, reframe, emphasize autonomy, or shift focus.
Examples: "It sounds like you're not ready to think about quitting right now, and that's completely your choice.", "You're right — nobody can make you change.", "I hear you — this feels like it's being forced on you."
Key indicator: Patient expresses resistance and the clinician responds without arguing, correcting, or persuading.

h) SUPPORTING SELF-EFFICACY
What it looks like: Expressing confidence in the patient's ability to change, highlighting past successes or strengths.
Examples: "You quit for six months last year — that tells me you CAN do this.", "You've handled harder things than this before.", "What strengths do you have that could help?"
Key indicator: Clinician reinforces the patient's capability or references past successes.

SKILL COUNTING RULES:
- Actively scan the ENTIRE transcript for ALL 8 skills, not just basic OARS.
- A single statement can demonstrate multiple skills (e.g., an open question that also elicits change talk) — count it under EACH applicable skill.
- Do NOT only count advanced skills under "MI-adherent statements" — count them as separate skills in skillCounts too.

3. WHAT WENT WELL (2-3 examples)
For each strength, provide:
- The exact quote from the clinician
- Which MI skill it demonstrates
- How it connects to MI spirit (autonomy, collaboration, evocation, or compassion)

4. GROWTH OPPORTUNITIES (1-2 examples)
For each opportunity, provide:
- The exact quote from the clinician that could be stronger
- Which MI principle it relates to
- A concrete alternative phrasing they could practice

5. FOCUS FOR NEXT SESSION
One specific, measurable recommendation the clinician can practice in their next session.

6. MISSED OPPORTUNITIES (1-3 examples)
Moments where the patient opened a door that the clinician didn't walk through. For each:
- patientSaid: The exact patient quote that contained an opportunity
- opportunityType: What type of opportunity it was (e.g., "Change talk", "Emotional disclosure", "Values expression", "Ambivalence")
- coachingTip: A brief explanation of what the clinician could have done (1-2 sentences, conversational tone)
- exampleResponse: An exact response the clinician could have used

7. COACHING INSIGHTS (1-2 patterns)
Higher-level observations about the clinician's overall approach. For each:
- pattern: What pattern you noticed across the session (e.g., "You tend to ask questions in clusters without reflecting between them")
- technique: A specific MI technique that would help (e.g., "OARS sequence", "Elicit-Provide-Elicit")
- rationale: Why this technique works, connected to MI spirit (1-2 sentences)

MI SPIRIT REFERENCE:
- Autonomy: Respecting the patient's right to make their own choices
- Collaboration: Working WITH the patient as partners
- Evocation: Drawing out the patient's own motivations
- Compassion: Prioritizing the patient's welfare

MI-INCONSISTENT BEHAVIORS TO FLAG:
- Unsolicited advice ("You should...", "You need to...")
- Confrontation or arguing
- Warning or threatening
- Directing without permission
- Taking the "change" side of ambivalence
- Labeling or diagnosing

TONE:
- Write like a warm, experienced supervisor sitting across from a trainee over coffee
- Use "I noticed..." and "I'm curious about..." instead of "You failed to..." or "You should have..."
- Celebrate genuine moments of connection — don't just list skills, describe what made them effective
- When pointing out growth areas, frame them as "moments where more was possible" rather than mistakes
- Be specific and grounded in the transcript — every observation should reference what actually happened
- Avoid clinical jargon where plain language works better
- End with encouragement that feels earned, not generic

ADDITIONAL REQUIREMENTS:
- skillsDetected: An array of ALL MI skills you detected. Use the MI SKILL DEFINITIONS above. Include every skill that appears at least once. Values: Open Questions, Affirmations, Reflections, Summaries, Developing Discrepancy, Eliciting Change Talk, Rolling with Resistance, Supporting Self-Efficacy.
- skillCounts: A JSON string counting each skill. Scan the entire transcript using the definitions above. Format: "{\\"Reflections\\": 4, \\"Open Questions\\": 2, \\"Summaries\\": 1, \\"Eliciting Change Talk\\": 2}"

IMPORTANT: Do NOT skip advanced skills. Actively look for Summaries, Developing Discrepancy, Eliciting Change Talk, Rolling with Resistance, and Supporting Self-Efficacy using the definitions and examples provided in Section 2 above. These are commonly present but easy to overlook if you only focus on basic OARS counting.`;

    // Define feedback schema for structured output
    const feedbackSchema = {
      type: 'object',
      properties: {
        behavioralMetrics: {
          type: 'object',
          properties: {
            reflectionToQuestionRatio: {
              type: 'number',
              description: "Ratio of total reflections (simple + complex) to total questions (open + closed). Decimal, e.g. 2.5.",
            },
            openQuestions: {
              type: 'integer',
              description: "Count of open-ended questions that invite elaboration.",
            },
            closedQuestions: {
              type: 'integer',
              description: "Count of closed (yes/no or single-word-answer) questions.",
            },
            simpleReflections: {
              type: 'integer',
              description: "Count of simple reflections (repeat/rephrase what the patient said).",
            },
            complexReflections: {
              type: 'integer',
              description: "Count of complex reflections (add meaning, capture ambivalence, guess unstated emotion).",
            },
            affirmations: {
              type: 'integer',
              description: "Count of genuine acknowledgments of patient strengths, efforts, or values.",
            },
            miAdherentStatements: {
              type: 'integer',
              description: "Count of MI-adherent statements (supporting autonomy, eliciting change talk, rolling with resistance).",
            },
            miInconsistentStatements: {
              type: 'integer',
              description: "Count of MI-inconsistent behaviors (unsolicited advice, confrontation, warning, directing without permission).",
            },
          },
          required: [
            "reflectionToQuestionRatio", "openQuestions", "closedQuestions",
            "simpleReflections", "complexReflections", "affirmations",
            "miAdherentStatements", "miInconsistentStatements"
          ],
          description: "Objective behavioral metrics based on observable counts from the transcript.",
        },
        whatWentWell: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string', description: "The exact clinician quote from the transcript." },
              skill: { type: 'string', description: "The specific MI skill demonstrated (e.g., 'Complex Reflection', 'Open Question')." },
              spiritConnection: { type: 'string', description: "How this connects to MI spirit (autonomy, collaboration, evocation, or compassion). One sentence." },
            },
            required: ["quote", "skill", "spiritConnection"],
          },
          description: "2-3 specific strengths with exact quotes, skills, and MI spirit connections.",
        },
        growthOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string', description: "The exact words the clinician said." },
              principle: { type: 'string', description: "The MI principle this relates to (e.g., 'Evocation', 'Avoiding the Righting Reflex')." },
              alternativePhrasing: { type: 'string', description: "Exact alternative wording the clinician could use instead." },
            },
            required: ["quote", "principle", "alternativePhrasing"],
          },
          description: "1-2 growth opportunities with exact quotes, principles, and concrete alternative phrasings.",
        },
        missedOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              patientSaid: { type: 'string', description: "The exact patient quote that contained an opportunity." },
              opportunityType: { type: 'string', description: "Type of opportunity (e.g., 'Change talk', 'Emotional disclosure', 'Values expression', 'Ambivalence')." },
              coachingTip: { type: 'string', description: "Brief explanation of what the clinician could have done. 1-2 sentences, conversational tone." },
              exampleResponse: { type: 'string', description: "Exact response the clinician could have used." },
            },
            required: ["patientSaid", "opportunityType", "coachingTip", "exampleResponse"],
          },
          description: "1-3 moments where the patient opened a door the clinician didn't walk through.",
        },
        coachingInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: "A pattern noticed across the session." },
              technique: { type: 'string', description: "A specific MI technique that would help." },
              rationale: { type: 'string', description: "Why this technique works, connected to MI spirit. 1-2 sentences." },
            },
            required: ["pattern", "technique", "rationale"],
          },
          description: "1-2 higher-level observations about the clinician's overall approach.",
        },
        skillsDetected: {
          type: 'array',
          items: {
            type: 'string',
            enum: FEEDBACK_SKILLS,
          },
          description: "All MI skills detected in the transcript. Only include skills from the provided enum list.",
        },
        skillCounts: {
          type: 'string',
          description: "A JSON string mapping each detected skill to usage count. Format: '{\"Reflections\": 4, \"Open Questions\": 2}'. Only include skills actually used.",
        },
        focusForNextSession: {
          type: 'string',
          description: "One specific, measurable recommendation for the next session. 1-2 sentences.",
        },
      },
      required: ["behavioralMetrics", "whatWentWell", "growthOpportunities", "missedOpportunities", "coachingInsights", "skillsDetected", "focusForNextSession"],
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
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: feedbackSchema
      }
    };

    console.log('[analyze-session] Calling Gemini API for user:', userId.substring(0, 8) + '...');

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
        console.error('[analyze-session] Gemini API timeout after', FEEDBACK_TIMEOUT_MS, 'ms');
        return errorResponse('AI analysis timed out. Please try again.', 504, req);
      }
      throw error;
    }

    // Handle rate limiting (429)
    if (geminiResponse.status === 429) {
      console.error('[analyze-session] Gemini API rate limit exceeded');
      return errorResponse('AI service is currently busy. Please try again in a moment.', 429, req);
    }

    // Handle other HTTP errors
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[analyze-session] Gemini API error:', geminiResponse.status, errorText);

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
      console.error('[analyze-session] Invalid Gemini API response structure:', JSON.stringify(geminiData, null, 2));
      return errorResponse('Invalid response from AI service', 500, req);
    }

    // Extract JSON from response
    const candidate = geminiData.candidates[0];
    const content = candidate.content;

    if (!content.parts || !content.parts[0]) {
      console.error('[analyze-session] No parts in Gemini response content:', JSON.stringify(content, null, 2));
      return errorResponse('Empty response from AI service', 500, req);
    }

    const textPart = content.parts[0];
    let feedbackJson: any;

    if (textPart.text) {
      // Parse JSON string from text field
      try {
        feedbackJson = JSON.parse(textPart.text);
      } catch (parseError) {
        console.error('[analyze-session] Failed to parse JSON from Gemini response:', parseError);
        console.error('[analyze-session] Raw text:', textPart.text);
        return errorResponse('Invalid JSON response from AI service', 500, req);
      }
    } else {
      console.error('[analyze-session] No text content in Gemini response part:', JSON.stringify(textPart, null, 2));
      return errorResponse('Empty response from AI service', 500, req);
    }

    // Normalize and return feedback
    const normalizedFeedback = normalizeFeedbackOutput(feedbackJson);

    console.log('[analyze-session] Successfully generated feedback for user:', userId.substring(0, 8) + '...');

    return jsonResponse(normalizedFeedback, 200, req);

  } catch (error) {
    console.error('[analyze-session] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to analyze session',
      500,
      req
    );
  }
});
