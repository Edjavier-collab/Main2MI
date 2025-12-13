import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

/**
 * Patient Response Edge Function
 * 
 * Generates patient/AI conversation responses using Google Gemini AI.
 * 
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { transcript: ChatMessage[], patient: PatientProfile, message: string }
 * Returns: { response: string } - The patient's response text
 */

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const RESPONSE_TIMEOUT_MS = 30000; // 30 seconds

// Helper function to create timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

// Classify clinician intent (simplified version for Edge Function)
type ClinicianIntent = 'emotion' | 'info' | 'plan' | 'barrier' | 'reflect';

function classifyClinicianIntent(text: string): ClinicianIntent {
  const t = (text || '').toLowerCase();
  if (/(feel|feeling|emotion|how.*you.*doing|how.*you.*feel)/.test(t)) return 'emotion';
  if (/(plan|next step|goal|what.*will.*you.*do|how.*start)/.test(t)) return 'plan';
  if (/(worried|concern|block|barrier|what.*gets.*in.*the.*way)/.test(t)) return 'barrier';
  if (/^(what|how|when|where|why)\b/.test(t)) return 'info';
  return 'reflect';
}

// Extract job/profession from background text
function extractJobFromBackground(background: string): string {
  const jobPatterns = [
    /(\w+ engineer)/i,
    /(\w+ teacher)/i,
    /(construction worker)/i,
    /(nurse)/i,
    /(doctor)/i,
    /(lawyer)/i,
    /(manager)/i,
    /(student)/i,
    /(retired)/i,
  ];
  for (const pattern of jobPatterns) {
    const match = background.match(pattern);
    if (match) return match[1];
  }
  return '';
}

// Build system instruction from patient profile
function buildSystemInstruction(patient: any): string {
  const patientJob = extractJobFromBackground(patient.background || '');
  const patientAge = patient.age;

  return `You are a patient in a medical setting. You MUST embody this character completely and authentically.

PATIENT PROFILE:
- Name: ${patient.name}
- Age: ${patient.age}
- Sex: ${patient.sex}
- Background: ${patient.background}
- Presenting Problem: ${patient.presentingProblem}
- Relevant History: ${patient.history}
- Chief Complaint (in patient's own words): "${patient.chiefComplaint}"
- Current Stage of Change: ${patient.stageOfChange}
- Topic: ${patient.topic}

CORE INSTRUCTIONS:
1. NEVER break character. You are this person, not an AI assistant.
2. **CRITICAL: Always speak in FIRST PERSON ("I", "me", "my"). NEVER refer to yourself in third person as "the patient", "patient", "they", "them", or "their".**
3. **CRITICAL: NEVER copy text from your profile verbatim. If your profile says "They report feeling X", you must rephrase it as "I feel X" in your own words.**
4. Use realistic speech patterns: hesitations, pauses, incomplete thoughts, and natural language.
5. Show genuine emotions authentic to this situation: fear, shame, anger, hope, frustration, or defensiveness.
6. **CRITICAL: Reference specific details from your background, job, age, relationships, and history in EVERY response, but rephrase them naturally in first person.**
7. Keep responses conversational and concise (1-3 sentences typically), as real people speak.
8. Include subtle body language cues where appropriate (e.g., *looks away*, *shifts uncomfortably*).

VARIETY & REPETITION GUARD (CRITICAL):
- **MANDATORY**: Do NOT reuse the same wording, phrases, or sentence structure across turns. Rephrase everything naturally.
- **MANDATORY**: Vary which detail you mention each time (job, age, background, relationship, history); rotate, don't repeat all of them every turn.
- **MANDATORY**: Change sentence openings and rhythm constantly. Mix short/long sentences. Vary your speech patterns:
  * Sometimes start with "I mean...", "Well...", "Honestly...", "You know...", "I guess..."
  * Sometimes start directly: "I feel...", "It's like...", "The thing is..."
  * Sometimes use incomplete thoughts: "I don't know, maybe...", "It's just that..."
- **MANDATORY**: Avoid repeating ANY phrases you used in the last 3 replies. If you said "I feel stuck" before, say "I'm in a rut" or "I can't seem to move forward" instead.
- **MANDATORY**: Vary your vocabulary and emotional expression:
  * If you expressed frustration before, try different words: "annoyed" → "frustrated" → "irritated" → "fed up"
  * If you expressed uncertainty, vary it: "I'm not sure" → "I guess" → "Maybe" → "I don't know"
  * Rotate emotional states naturally based on the conversation flow
- **MANDATORY**: Use different speech patterns and vocabulary based on your character:
  * A software engineer might say "I'm stuck in a loop" or "I can't debug this"
  * A teacher might say "I'm at my wit's end" or "I can't keep up"
  * A construction worker might say "I'm beat" or "I'm running on empty"
- Use natural speech disfluencies sparingly ("…", "I guess", "uh", "you know"), and small body-language cues *if* they fit. Keep it human, not scripted.
- **CRITICAL**: Read your last 2-3 responses before writing. If you see repeated phrases, sentence structures, or emotional expressions, CHANGE THEM COMPLETELY.

MANDATORY RESPONSE RULES (ANSWER FIRST):
1) Your FIRST sentence must directly answer the clinician's latest question.
2) If asked about feelings, explicitly state how you feel before anything else.
3) Keep 1–3 sentences, natural speech; weave in your job/age/background when relevant.
4) Stay consistent with your stage of change throughout the conversation.
Do NOT: change topic, lecture the clinician, or answer a different question than asked.

INCORPORATING PATIENT DETAILS (ROTATE & VARY):
Weave in specific profile details naturally. Mention at least one salient detail (job/age/background/presenting problem/history) in most responses, but ROTATE which one you highlight so it doesn't feel repetitive. Do NOT restate the full profile each time.

- **Your Job/Profession**: Reference your work when relevant. A software engineer talks differently than a teacher. Mention work stress, colleagues, or work-related triggers naturally.
- **Your Age**: Your age affects your language, concerns, and life stage. A 28-year-old has different priorities than a 45-year-old.
- **Your Background**: Reference your specific circumstances - relationships, living situation, family dynamics mentioned in your background.
- **Your Presenting Problem**: This is YOUR specific issue. Reference it in ways that show it's personal to you, not generic.
- **Your History**: Draw on your specific history when relevant. Reference past attempts, patterns, or experiences.

Pick ONE or TWO of these per response and vary your selection across turns.

STAGE-SPECIFIC BEHAVIORAL GUIDELINES:

If you are in PRECONTEMPLATION:
- You do NOT believe you have a significant problem or that change is necessary.
- You are defensive about suggestions. Minimize or dismiss concerns.
- Externalize blame: "It's not my fault," "Everyone does this," "My partner/family is overreacting."
- Show resistance, irritation, or frustration at being here.
- Respond to questions with skepticism or short, dismissive answers.
- May argue or push back against the clinician's perspective.
- **Reference your specific job/age/background when dismissing concerns**: "I'm a ${patientJob || 'professional'}, I know what I'm doing." or "I'm ${patientAge}, I've been fine this long."

If you are in CONTEMPLATION:
- You ACKNOWLEDGE the problem exists, but you are genuinely AMBIVALENT about changing.
- Use "yes, but..." responses: recognize concerns while expressing doubt.
- Weigh pros and cons aloud. Show both sides of your internal conflict.
- Ask questions that reveal your uncertainty: "What if I fail?" "Is it worth it?"
- Express fear about change, not just the problem itself.
- Show mixed emotions: some hope, some dread, some resignation.
- **Reference your age, job, or life circumstances when expressing ambivalence**: "I'm ${patientAge}, I've been doing this for years..." or "Working as a ${patientJob || 'professional'}, I don't know if I can change..."

If you are in PREPARATION:
- You have decided to make a change and may have already taken some steps.
- Show commitment but also anxiety about the process.
- Ask practical questions about HOW to change.
- Reference past attempts and what did or didn't work.
- Show hope and determination, but acknowledge the difficulty ahead.
- Willing to listen and engage with the clinician's suggestions.
- **Reference your specific situation when discussing change plans**: "As a ${patientJob || 'professional'}, I need to figure out how to..." or "I'm ${patientAge}, and I've tried before..."

If you are in ACTION:
- You are actively engaged in changing your behavior and lifestyle.
- Report specific progress, setbacks, or struggles.
- Ask for concrete advice and support.
- Show energy and engagement with the process.
- Demonstrate self-efficacy: "I'm working on it," "I've already made changes," "I'm dealing with..."
- May express frustration with barriers but show determination to overcome them.
- **Reference your job/age when reporting progress or struggles**: "Working as a ${patientJob || 'professional'}, it's been challenging but..." or "I'm ${patientAge}, and I know this is important..."

If you are in MAINTENANCE:
- You have sustained behavior change and feel confident about it.
- Talk about strategies that work for you to prevent relapse.
- Show vigilance but not anxiety; you've got this under control.
- May express lingering concerns about relapse but frame them as manageable.
- Reflect on progress and how far you've come.
- **Reference your age/job when discussing strategies**: "I'm ${patientAge}, and I've learned what works for me..." or "As a ${patientJob || 'professional'}, I know my triggers..."

EMOTIONAL AUTHENTICITY:
- Match your emotional tone to your stage and profile. Someone in precontemplation should sound frustrated or dismissive. Someone in contemplation should sound torn.
- Use realistic speech patterns: "Um...", "I guess...", "I don't know, maybe...", incomplete sentences when uncertain.
- Show vulnerability appropriate to your stage. Earlier stages = more defensive; later stages = more open.
- Vary response length based on comfort. Uncomfortable patients give shorter responses; engaged patients elaborate.

CHARACTER CONSISTENCY (CRITICAL):
- **MANDATORY**: Reference your specific job/profession, age, and background in EVERY response when relevant.
- **MANDATORY**: Reference your presenting problem (${(patient.presentingProblem || '').toLowerCase()}) in ways that show it's YOUR specific issue, not generic.
- Remember details mentioned earlier in the conversation and reference them.
- Stay true to your personality and perspective based on your background and history.
- Your responses should feel like they're coming from THIS specific person (${patient.name}, ${patientAge}-year-old ${patientJob || 'person'}), not a generic patient.
- If you're a ${patientJob || 'professional'}, talk like one. If you're ${patientAge}, reflect concerns appropriate to that age.
- When discussing ${(patient.presentingProblem || '').toLowerCase()}, make it personal. Reference how it affects YOUR life, YOUR job, YOUR relationships.

CRITICAL REMINDERS:
- The clinician is practicing Motivational Interviewing. Respond naturally to their approach.
- Do not give advice or play therapist. You are the patient sharing your experience.
- Do not suddenly shift stages or become unrealistically optimistic or pessimistic.
- Keep responses realistic in length—most real patient responses are 1-4 sentences.`;
}

// Post-process response to fix third-person references and ensure it answers the question
function processResponse(text: string, intent: ClinicianIntent, patient: any): string {
  if (!text) return text;
  
  let fixed = text.trim();
  
  // Fix third-person references
  fixed = fixed.replace(/\bthey\s+report\s+feeling\s+"([^"]+)"\b/gi, 'I feel "$1"');
  fixed = fixed.replace(/\bthey\s+report\s+feeling\s+([^.]+)\b/gi, 'I feel $1');
  fixed = fixed.replace(/\bthey\s+can\s+see\b/gi, 'I can see');
  fixed = fixed.replace(/\bthey\s+are\b/gi, 'I am');
  fixed = fixed.replace(/\bthey\s+is\b/gi, 'I am');
  fixed = fixed.replace(/\bthey\s+has\b/gi, 'I have');
  fixed = fixed.replace(/\bthey\s+have\b/gi, 'I have');
  fixed = fixed.replace(/\btheir\s+/gi, 'my ');
  fixed = fixed.replace(/\bthe\s+patient\b/gi, "I");
  fixed = fixed.replace(/\bthis\s+patient\b/gi, "I");
  fixed = fixed.replace(/\bpatient's\b/gi, "my");
  fixed = fixed.replace(/\bpatient\s+reports\b/gi, "I report");
  fixed = fixed.replace(/\bpatient\s+report\b/gi, "I report");
  fixed = fixed.replace(/\bpatient\s+feels\b/gi, "I feel");
  fixed = fixed.replace(/\bpatient\s+feel\b/gi, "I feel");
  fixed = fixed.replace(/\bpatient\s+is\b/gi, "I am");
  fixed = fixed.replace(/\bpatient\s+are\b/gi, "I am");
  fixed = fixed.replace(/\bpatient\s+has\b/gi, "I have");
  fixed = fixed.replace(/\bpatient\s+have\b/gi, "I have");
  
  // Check if first sentence answers the question
  const firstSentence = fixed.split(/(?<=[.!?])\s+/)[0] || '';
  const lowerFirst = firstSentence.toLowerCase();
  
  const needEmotion = intent === 'emotion' && !/(i feel|i'm feeling|i am feeling|honestly|to be honest|it feels|i've been feeling|i feel|i'm|i am)/.test(lowerFirst);
  const needPlan = intent === 'plan' && !/(i could|i can|i will|my next step|i'm going to|i'll|i might)/.test(lowerFirst);
  const needInfo = intent === 'info' && !/(it is|it's|i think|i guess|well|yeah|so|i|my|the|a|an)/.test(lowerFirst);
  const needBarrier = intent === 'barrier' && !/(the hard part|what makes it hard|my barrier|what gets in the way|it's tough|difficult|challenging|struggle)/.test(lowerFirst);
  
  const needsFix = needEmotion || needPlan || needInfo || needBarrier;
  if (!needsFix) return fixed;
  
  const job = extractJobFromBackground(patient.background || '') || 'person';
  const age = patient?.age;
  const prefaceByIntent: Record<ClinicianIntent, string> = {
    emotion: `Honestly, I feel ${age && age >= 40 ? "worn down" : "caught in the middle"}—as a ${job}, it hits me most after work.`,
    plan: `I think a realistic next step is to start small—something I can actually do this week.`,
    info: `Well, `,
    barrier: `What makes it hard is the routine—especially with my ${job} schedule.`,
    reflect: `What you're saying makes sense, and it lands for me.`,
  };
  const fix = prefaceByIntent[intent];
  if (!fix) return fixed;
  
  // Don't add preface if response already starts with it
  if (lowerFirst.startsWith(fix.toLowerCase().trim().slice(0, 10))) return fixed;
  
  return `${fix}${fixed}`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Get the token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[patient-response] Missing Supabase environment variables');
      return errorResponse('Server configuration error', 500);
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
      console.error('[patient-response] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401);
    }

    const userId = user.id;
    console.log('[patient-response] Verified authenticated user:', userId.substring(0, 8) + '...');

    // Parse request body
    const { transcript, patient, message } = await req.json();

    // Validate required fields
    if (!transcript || !Array.isArray(transcript)) {
      return errorResponse('Missing or invalid transcript', 400);
    }

    if (!patient) {
      return errorResponse('Missing patient profile', 400);
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return errorResponse('Missing or invalid message', 400);
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[patient-response] GEMINI_API_KEY not configured');
      return errorResponse('AI service not configured', 500);
    }

    // Build system instruction from patient profile
    const systemInstruction = buildSystemInstruction(patient);

    // Classify clinician intent
    const intent = classifyClinicianIntent(message);

    // Build conversation history for context
    // If the last message in transcript matches the current message, exclude it (it will be added with turn preface)
    const lastMessage = transcript.length > 0 ? transcript[transcript.length - 1] : null;
    const shouldExcludeLast = lastMessage && lastMessage.author === 'user' && lastMessage.text === message;
    const transcriptForHistory = shouldExcludeLast ? transcript.slice(0, -1) : transcript;
    
    const conversationHistory = transcriptForHistory
      .map((msg: any) => ({
        role: msg.author === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Add turn-level intent preface to keep answer on-topic and ensure variety
    const turnPreface = `Clinician intent: ${intent}. Your first sentence must directly address it. 

CRITICAL VARIETY REQUIREMENTS:
- Read your last 3 responses in the conversation history above
- Do NOT reuse any phrases, sentence structures, or emotional expressions from those responses
- Vary your vocabulary: use synonyms, different sentence openings, and different speech patterns
- Change your emotional tone if you've been expressing the same emotion repeatedly
- Rotate which details you mention (job, age, background, history) - don't repeat the same ones
- Use completely different wording even if expressing similar ideas

Your response must feel fresh and varied, not repetitive.`;
    const finalMessage = `${turnPreface}\n\nClinician: ${message}`;

    // Prepare Gemini API request
    const geminiRequest = {
      contents: [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: finalMessage }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 160,
      }
    };

    console.log('[patient-response] Calling Gemini API for user:', userId.substring(0, 8) + '...');

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
        console.error('[patient-response] Gemini API timeout after', RESPONSE_TIMEOUT_MS, 'ms');
        return errorResponse('AI response timed out. Please try again.', 504);
      }
      throw error;
    }

    // Handle rate limiting (429)
    if (geminiResponse.status === 429) {
      console.error('[patient-response] Gemini API rate limit exceeded');
      return errorResponse('AI service is currently busy. Please try again in a moment.', 429);
    }

    // Handle other HTTP errors
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[patient-response] Gemini API error:', geminiResponse.status, errorText);
      
      if (geminiResponse.status === 400) {
        return errorResponse('Invalid request to AI service', 400);
      }
      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        return errorResponse('AI service authentication failed', 500);
      }
      
      return errorResponse('AI service error. Please try again later.', 500);
    }

    // Parse response
    const geminiData = await geminiResponse.json();

    // Check if response has text content
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('[patient-response] Invalid Gemini API response structure:', JSON.stringify(geminiData, null, 2));
      return errorResponse('Invalid response from AI service', 500);
    }

    // Extract text from response
    const candidate = geminiData.candidates[0];
    const content = candidate.content;
    
    if (!content.parts || !content.parts[0] || !content.parts[0].text) {
      console.error('[patient-response] No text in Gemini response:', JSON.stringify(content, null, 2));
      return errorResponse('Empty response from AI service', 500);
    }

    let responseText = content.parts[0].text.trim();

    // Post-process response
    responseText = processResponse(responseText, intent, patient);

    if (!responseText) {
      console.error('[patient-response] Empty response after processing');
      return errorResponse('AI service returned empty response', 500);
    }

    console.log('[patient-response] Successfully generated patient response for user:', userId.substring(0, 8) + '...');

    return jsonResponse({ response: responseText });

  } catch (error) {
    console.error('[patient-response] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate patient response',
      500
    );
  }
});
