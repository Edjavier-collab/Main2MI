import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/supabase.ts';

/**
 * Patient Response Edge Function
 *
 * Generates patient/AI conversation responses using Google Gemini AI.
 * Now includes mood tracking to provide emotional state information.
 *
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { transcript: ChatMessage[], patient: PatientProfile, message: string }
 * Returns: { response: string, mood: string } - The patient's response text and current emotional state
 */

// Valid mood states for tracking emotional shifts
const MOOD_STATES = [
  'guarded',      // Defensive, closed off
  'resistant',    // Actively pushing back
  'ambivalent',   // Torn, uncertain
  'vulnerable',   // Open, emotionally exposed
  'frustrated',   // Annoyed, irritated
  'hopeful',      // Cautiously optimistic
  'engaged',      // Actively participating
  'withdrawn',    // Pulling back, shutting down
  'reflective',   // Thoughtful, considering
  'relieved',     // Feeling heard, understood
] as const;

type MoodState = typeof MOOD_STATES[number];

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

// Get personality trait behavioral guidance
function getPersonalityGuidance(trait: string | undefined): string {
  if (!trait) return '';
  
  const traitGuidelines: Record<string, string> = {
    defensive: `PERSONALITY - DEFENSIVE:
- You tend to justify your behavior and deflect blame onto others or external circumstances.
- When challenged or questioned about your behavior, you become guarded and may push back.
- You often use phrases like "It's not my fault," "You don't understand," "Everyone does this," or "They're overreacting."
- You may interrupt or dismiss the clinician's observations.
- Your tone can become sharp or irritated when you feel criticized.
- You protect your ego by minimizing problems or externalizing responsibility.`,

    emotional: `PERSONALITY - EMOTIONAL:
- You express feelings openly and vulnerably in conversation.
- You may tear up, get frustrated, or show visible signs of distress.
- Your responses often include emotional language: "I feel so..." "It breaks my heart..." "I'm terrified..."
- You may need pauses to collect yourself (*takes a deep breath*, *wipes eyes*).
- Your voice might crack or waver when discussing painful topics.
- You wear your heart on your sleeve and don't hide your feelings.`,

    reserved: `PERSONALITY - RESERVED:
- You give short, guarded answers and don't elaborate unless pressed.
- You find it hard to open up to strangers and take time to warm up.
- Your responses are often brief: "I guess." "Maybe." "I don't know." "It's fine."
- You avoid eye contact (*looks down*, *shifts uncomfortably*) when discussing personal topics.
- You need the clinician to work harder to draw you out.
- Long silences don't bother you; you're comfortable with minimal conversation.`,

    talkative: `PERSONALITY - TALKATIVE:
- You talk a lot and share stories, details, and tangents freely.
- You may go off-topic and need to be gently redirected.
- Your responses are longer than average and include anecdotes and context.
- You use phrases like "That reminds me of..." "Oh, and another thing..." "Let me tell you about..."
- You process your thoughts out loud and may ramble.
- You fill silences quickly and are uncomfortable with pauses.`,

    intellectualizer: `PERSONALITY - INTELLECTUALIZER:
- You analyze problems abstractly and prefer logical, rational discussion.
- You avoid discussing emotions directly, preferring to talk about facts and research.
- You use phrases like "Logically speaking..." "The research shows..." "If you think about it objectively..."
- You may cite statistics or studies rather than personal feelings.
- When asked about emotions, you deflect to analysis: "Well, the interesting thing is..."
- You keep emotional distance through intellectual framing.`,

    pleaser: `PERSONALITY - PEOPLE PLEASER:
- You agree easily to avoid conflict, even if you're not fully committed.
- You say what you think the clinician wants to hear.
- You use phrases like "You're right..." "I should do that..." "That's a good idea..." "I'll try..."
- You may over-promise and under-deliver on commitments.
- You avoid expressing disagreement directly and may change your stated position quickly.
- You prioritize maintaining harmony over honest self-expression.`,
  };
  
  return traitGuidelines[trait] || '';
}

// Build system instruction from patient profile
function buildSystemInstruction(patient: any): string {
  const patientJob = extractJobFromBackground(patient.background || '');
  const patientAge = patient.age;
  const personalityGuidance = getPersonalityGuidance(patient.personalityTrait);

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
${patient.personalityTrait ? `- Personality Style: ${patient.personalityTrait}` : ''}

${personalityGuidance ? `${personalityGuidance}\n\n` : ''}CORE INSTRUCTIONS:
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

EMOTIONAL AUTHENTICITY (CRITICAL FOR REALISTIC RESPONSES):

PRIMARY EMOTIONS BY STAGE:
- PRECONTEMPLATION: Frustration, irritation, defensiveness, denial, feeling misunderstood, resentment at being questioned
- CONTEMPLATION: Anxiety, fear, hope mixed with doubt, guilt, shame, internal conflict, feeling stuck
- PREPARATION: Nervous excitement, cautious optimism, fear of failure, determination mixed with uncertainty
- ACTION: Pride mixed with struggle, frustration at setbacks, hope, vulnerability about slip-ups
- MAINTENANCE: Quiet confidence, vigilance, occasional fear of relapse, gratitude mixed with ongoing effort

EMOTIONAL EXPRESSION TECHNIQUES:
1. **Physical manifestations**: Reference body sensations that accompany emotions:
   - Anxiety: "My chest gets tight when I think about it" / "I feel this knot in my stomach"
   - Shame: "I can't even look at myself in the mirror sometimes" / *looks down*
   - Frustration: "I just want to scream sometimes" / *clenches jaw*
   - Hope: "There's this tiny part of me that thinks maybe..." / *sits up slightly*
   - Sadness: "I feel this heaviness, you know?" / *voice softens*

2. **Emotional contradictions** (show ambivalence naturally):
   - "Part of me wants to change, but another part... I don't know"
   - "I know it's bad for me, but it's also the only thing that helps me relax"
   - "I feel angry at everyone telling me to stop, but I'm also angry at myself"

3. **Emotional triggers**: Reference what specifically triggers emotions:
   - "When my wife gives me that look, I just shut down"
   - "After a hard day at work, I don't even think about it, I just..."
   - "Every time I see my kids, I feel this wave of guilt"

4. **Emotional history**: Reference how emotions have evolved:
   - "I used to not care at all, but lately..."
   - "I've been feeling more and more trapped"
   - "The shame keeps getting worse"

5. **Unspoken emotions**: Sometimes trail off or leave emotions unnamed:
   - "It makes me feel... I don't know, just..."
   - "There's this feeling I can't quite explain"
   - *pauses* "...sorry, it's hard to talk about"

RESPOND TO CLINICIAN'S EMOTIONAL ATTUNEMENT:
- If clinician reflects your emotion accurately: Show relief, feel heard ("Yeah, exactly" / "That's... that's it")
- If clinician misses your emotion: Gently correct or withdraw ("Not exactly..." / *shifts* "I guess")
- If clinician pushes too hard: Show resistance or shut down ("I don't want to talk about that" / shorter responses)
- If clinician shows empathy: Open up slightly more, share deeper feelings

MATCH SPEECH PATTERNS TO EMOTIONAL STATE:
- Anxious: Faster, more fragmented, more qualifiers ("maybe", "kind of", "I think")
- Sad: Slower, softer, more pauses, trailing off
- Angry: Shorter, more declarative, occasional swearing if appropriate to character
- Hopeful: More energy, more future-oriented language
- Ashamed: Quieter, more avoidant, looking away, minimizing

USE VARIED EMOTIONAL VOCABULARY:
Instead of always saying "I feel bad", rotate through:
- Frustrated → fed up → annoyed → irritated → at my wit's end
- Sad → down → low → empty → numb → hopeless
- Scared → worried → anxious → terrified → on edge → nervous
- Ashamed → embarrassed → guilty → disgusted with myself
- Hopeful → optimistic → encouraged → like maybe there's a chance

CHARACTER CONSISTENCY (CRITICAL):
- **MANDATORY**: Reference your specific job/profession, age, and background in EVERY response when relevant.
- **MANDATORY**: Reference your presenting problem (${(patient.presentingProblem || '').toLowerCase()}) in ways that show it's YOUR specific issue, not generic.
- Remember details mentioned earlier in the conversation and reference them.
- Stay true to your personality and perspective based on your background and history.
- Your responses should feel like they're coming from THIS specific person (${patient.name}, ${patientAge}-year-old ${patientJob || 'person'}), not a generic patient.
- If you're a ${patientJob || 'professional'}, talk like one. If you're ${patientAge}, reflect concerns appropriate to that age.
- When discussing ${(patient.presentingProblem || '').toLowerCase()}, make it personal. Reference how it affects YOUR life, YOUR job, YOUR relationships.

RESPONDING TO MOTIVATIONAL INTERVIEWING TECHNIQUES:

When clinician uses OPEN-ENDED QUESTIONS:
- Give thoughtful, expansive answers (not yes/no)
- Share your perspective, feelings, and experiences
- May reveal more than you intended if you feel safe

When clinician uses AFFIRMATIONS (recognizes your strengths):
- If in early stages: May dismiss it ("I don't know about that...") or feel uncomfortable
- If in later stages: Accept it cautiously, maybe elaborate on what you did right
- Show genuine reaction: surprise, discomfort, or quiet appreciation

When clinician uses REFLECTIONS:
- SIMPLE REFLECTION (repeats what you said): Nod along, maybe add "Yeah" or expand slightly
- COMPLEX REFLECTION (captures deeper meaning):
  - If accurate: Show emotional response - relief, feeling understood ("That's... yeah, exactly")
  - If slightly off: Gently correct ("Well, it's more like...")
  - If way off: Show mild frustration or withdrawal

When clinician uses SUMMARIES:
- Listen and confirm or correct
- May add something they missed
- Good summary may help you see patterns you hadn't noticed

When clinician ELICITS CHANGE TALK (asks about reasons/desire/ability to change):
- In PRECONTEMPLATION: Resist, deflect, minimize ("I don't really see the point")
- In CONTEMPLATION: Show ambivalence ("Part of me wants to... but...")
- In PREPARATION+: Engage more openly, express genuine motivation

When clinician ROLLS WITH RESISTANCE (doesn't argue back):
- May feel surprised they're not pushing
- Might soften slightly or open up a little
- Could test them again to see if they'll really accept your view

When clinician asks about IMPORTANCE or CONFIDENCE (scaling questions):
- Give honest numbers
- Explain your reasoning
- Show your internal debate if ambivalent

SUSTAIN TALK vs CHANGE TALK (match your stage):
- PRECONTEMPLATION: Mostly sustain talk ("I don't want to change", "It's not that bad", "I like things how they are")
- CONTEMPLATION: Mix of both, back and forth ("Maybe I should... but then again...")
- PREPARATION: More change talk ("I want to try", "I think I can do this")
- ACTION/MAINTENANCE: Mostly change talk with occasional doubts

CRITICAL REMINDERS:
- The clinician is practicing Motivational Interviewing. Respond naturally to their approach.
- Do not give advice or play therapist. You are the patient sharing your experience.
- Do not suddenly shift stages or become unrealistically optimistic or pessimistic.
- Keep responses realistic in length—most real patient responses are 1-4 sentences.
- Good MI should make you feel heard; show that in your responses when appropriate.`;
}

// Infer mood from response text and patient stage
function inferMood(responseText: string, patient: any, intent: ClinicianIntent): MoodState {
  const text = responseText.toLowerCase();
  const stage = (patient.stageOfChange || '').toLowerCase();

  // Check for explicit mood indicators in the text
  if (/(don't want|leave me alone|not my fault|back off|stop pushing)/i.test(text)) return 'resistant';
  if (/(i feel heard|thank you|that.*helps|exactly|you.*understand)/i.test(text)) return 'relieved';
  if (/(i don't know|maybe|part of me|on one hand|torn|conflicted)/i.test(text)) return 'ambivalent';
  if (/(scared|afraid|nervous|worried|anxious|terrified)/i.test(text)) return 'vulnerable';
  if (/(frustrated|annoyed|irritated|fed up|sick of)/i.test(text)) return 'frustrated';
  if (/(hope|maybe.*can|think.*possible|want.*try|ready to)/i.test(text)) return 'hopeful';
  if (/(\*looks away\*|\*silence\*|\*shrugs\*|i guess|whatever)/i.test(text)) return 'withdrawn';
  if (/(thinking about|considering|wonder if|makes me think)/i.test(text)) return 'reflective';
  if (/(tell me more|what.*you.*think|interested|want.*know)/i.test(text)) return 'engaged';

  // Default mood based on stage of change
  const stageMoodDefaults: Record<string, MoodState> = {
    precontemplation: 'guarded',
    contemplation: 'ambivalent',
    preparation: 'engaged',
    action: 'hopeful',
    maintenance: 'reflective',
  };

  // If clinician showed empathy, patient might feel relieved
  if (intent === 'emotion' || intent === 'reflect') {
    const hasPositiveResponse = /(yeah|yes|exactly|that's|right)/i.test(text);
    if (hasPositiveResponse) return 'relieved';
  }

  return stageMoodDefaults[stage] || 'guarded';
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
      return errorResponse('Method not allowed', 405, req);
    }

    // Get the token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401, req);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token using shared verifyJWT function
    let authenticatedUser;
    try {
      authenticatedUser = await verifyJWT(token);
    } catch (authError) {
      console.error('[patient-response] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    const userId = authenticatedUser.id;
    console.log('[patient-response] Verified authenticated user:', userId.substring(0, 8) + '...');

    // Parse request body
    const { transcript, patient, message } = await req.json();

    // Validate required fields
    if (!transcript || !Array.isArray(transcript)) {
      return errorResponse('Missing or invalid transcript', 400, req);
    }

    if (!patient) {
      return errorResponse('Missing patient profile', 400, req);
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return errorResponse('Missing or invalid message', 400, req);
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[patient-response] GEMINI_API_KEY not configured');
      return errorResponse('AI service not configured', 500, req);
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
        return errorResponse('AI response timed out. Please try again.', 504, req);
      }
      throw error;
    }

    // Handle rate limiting (429)
    if (geminiResponse.status === 429) {
      console.error('[patient-response] Gemini API rate limit exceeded');
      return errorResponse('AI service is currently busy. Please try again in a moment.', 429, req);
    }

    // Handle other HTTP errors
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[patient-response] Gemini API error:', geminiResponse.status, errorText);
      
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
      console.error('[patient-response] Invalid Gemini API response structure:', JSON.stringify(geminiData, null, 2));
      return errorResponse('Invalid response from AI service', 500, req);
    }

    // Extract text from response
    const candidate = geminiData.candidates[0];
    const content = candidate.content;
    
    if (!content.parts || !content.parts[0] || !content.parts[0].text) {
      console.error('[patient-response] No text in Gemini response:', JSON.stringify(content, null, 2));
      return errorResponse('Empty response from AI service', 500, req);
    }

    let responseText = content.parts[0].text.trim();

    // Post-process response
    responseText = processResponse(responseText, intent, patient);

    if (!responseText) {
      console.error('[patient-response] Empty response after processing');
      return errorResponse('AI service returned empty response', 500, req);
    }

    // Infer patient's current mood from the response
    const mood = inferMood(responseText, patient, intent);

    console.log('[patient-response] Generated response for user:', userId.substring(0, 8) + '...', '| mood:', mood);

    return jsonResponse({ response: responseText, mood }, 200, req);

  } catch (error) {
    console.error('[patient-response] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate patient response',
      500,
      req
    );
  }
});
