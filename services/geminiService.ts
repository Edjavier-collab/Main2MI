import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { PatientProfile, ChatMessage, Feedback, UserTier, Session, CoachingSummary } from '../types';
import { ErrorHandler } from '../utils/errorHandler';
import { classifyClinicianIntent, ensureAnswersQuestionFirst, extractJobFromBackground, formatDateToMMDDYYYY } from './geminiTextProcessor';
import { getMockResponse } from './geminiMockService';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Re-export utilities for backward compatibility
export { classifyClinicianIntent, ensureAnswersQuestionFirst, extractJobFromBackground, formatDateToMMDDYYYY } from './geminiTextProcessor';
export { getMockResponse } from './geminiMockService';


// Check if Gemini API key is configured
export const isGeminiConfigured = (): boolean => {
    const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    const isConfigured = !!(apiKey && apiKey.trim());
    
    if (isDevelopment && !isConfigured) {
        console.warn('[geminiService] API key not found. Checked: GEMINI_API_KEY, VITE_GEMINI_API_KEY');
        console.warn('[geminiService] Available env keys:', Object.keys(import.meta.env).filter(k => k.includes('GEMINI') || k.includes('gemini')));
    }
    
    return isConfigured;
};

// NOTE: diagnoseEnvironmentSetup removed - no longer needed as Gemini API calls are now server-side

// Get a mock response based on user input and patient context (now imported from geminiMockService)
// This is kept for backward compatibility but delegates to the imported function
const getMockResponseLocal = (userMessage: string, patient?: PatientProfile): string => {
    if (!patient) {
        // Fallback to generic response if no patient context
        const hash = userMessage.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return MOCK_RESPONSES[hash % MOCK_RESPONSES.length];
    }

    // Simple hash function to get consistent responses for similar inputs
    const hash = userMessage.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const job = extractJobFromBackground(patient.background);
    const age = patient.age;
    const stage = patient.stageOfChange;
    
    // Stage-specific personalized responses (answer-first)
    const intent = classifyClinicianIntent(userMessage);
    const ensureFirst = (resp: string) => ensureAnswersQuestionFirst(resp, intent, patient);
    if (stage === 'Precontemplation') {
        const responses = [
            job ? `Look, I'm a ${job}. ${patient.presentingProblem.toLowerCase()} is just part of how things work in my world. I don't see why everyone's making such a big deal about it.` : `I don't really see ${patient.presentingProblem.toLowerCase()} as a problem. It's just how things are.`,
            age >= 40 ? `I'm ${age} years old. I've been dealing with this for years and I'm fine. People need to stop worrying about me.` : `I'm ${age}. I know what I'm doing. ${patient.presentingProblem.toLowerCase()} isn't really affecting me.`,
            `I don't get why ${patient.chiefComplaint.split('.')[0].toLowerCase()}. Everyone deals with this. It's not like I'm the only one.`,
            job ? `In my line of work as a ${job}, this is normal. Everyone I know does this. My partner's just overreacting.` : `This is just how I've always been. I don't see why it's suddenly a problem now.`,
            `I've managed fine so far. ${patient.presentingProblem.toLowerCase()} hasn't stopped me from doing what I need to do.`,
        ];
        return ensureFirst(responses[hash % responses.length]);
    } else if (stage === 'Contemplation') {
        const responses = [
            age >= 40 ? `I'm ${age}, and I've been doing this for a while. I know ${patient.presentingProblem.toLowerCase()} is an issue, but I'm not sure I can change at this point in my life.` : `I know there's a problem with ${patient.presentingProblem.toLowerCase()}, but I'm ${age} and I'm scared about what changing would mean.`,
            job ? `Yeah, I see the issue. Working as a ${job}, the stress is real. But I don't know if I can handle changing this on top of everything else.` : `I know ${patient.presentingProblem.toLowerCase()} is affecting me, but part of me thinks maybe it's not that bad? I'm torn.`,
            `I've thought about it. ${patient.chiefComplaint.split('.')[0]}, but I'm worried about failing. What if I try and it doesn't work?`,
            age >= 35 ? `I'm ${age}, I've got responsibilities. I know I need to address ${patient.presentingProblem.toLowerCase()}, but I'm scared about what it would take.` : `Part of me wants to change, but part of me is terrified. I'm ${age}, and I don't know if I'm strong enough for this.`,
            `I hear what you're saying about ${patient.presentingProblem.toLowerCase()}. I guess I've been thinking about it more lately. But I'm not sure I'm ready.`,
        ];
        return ensureFirst(responses[hash % responses.length]);
    } else if (stage === 'Preparation') {
        const responses = [
            job ? `I've decided I need to do something about ${patient.presentingProblem.toLowerCase()}. Working as a ${job}, I know I need to make changes, but I'm not sure where to start.` : `I want to change. I've tried before with ${patient.presentingProblem.toLowerCase()}, but it didn't stick. I need to figure out what I did wrong.`,
            age >= 30 ? `I'm ${age}, and I've been dealing with this long enough. I'm ready to try something different. Can you help me figure out how to make it work this time?` : `I'm ${age} and I know I need to address this. I've thought about it, and I think I'm ready to take the next step.`,
            `I've been thinking about what you said. ${patient.presentingProblem.toLowerCase()} has been affecting my life, and I want to do something about it. I just need help figuring out how.`,
            `I'm ready to make a change. I know ${patient.presentingProblem.toLowerCase()} isn't working for me anymore. I've tried before, but maybe this time will be different if I have a plan.`,
            `I want to do this. I really do. But I'm scared. ${patient.chiefComplaint.split('.')[0]}, and I don't want to fail again. What can I do differently?`,
        ];
        return ensureFirst(responses[hash % responses.length]);
    } else if (stage === 'Action') {
        const responses = [
            job ? `I've been working on it. As a ${job}, it's been challenging, but I'm making progress. Some days are harder than others, especially after work.` : `I'm doing it. I've been working on ${patient.presentingProblem.toLowerCase()}, and I can see some changes. It's not easy, but I'm trying.`,
            age >= 35 ? `I'm ${age}, and I know this is important. I've been making changes, and I can feel the difference. But I still have days where it's really hard.` : `I've been working on this. I'm ${age}, and I know I need to stick with it. Some days I feel good about it, other days I struggle.`,
            `I'm actively working on ${patient.presentingProblem.toLowerCase()}. I've made some changes already, and I'm trying to keep going. It's not perfect, but I'm doing the work.`,
            `I've been trying different things to address ${patient.presentingProblem.toLowerCase()}. Some strategies work better than others. I'm learning what helps and what doesn't.`,
            `I'm in the middle of making changes. ${patient.chiefComplaint.split('.')[0]}, and I'm working on it every day. It's a process, but I'm committed.`,
        ];
        return ensureFirst(responses[hash % responses.length]);
    } else if (stage === 'Maintenance') {
        const responses = [
            age >= 40 ? `I'm ${age}, and I've been maintaining these changes for a while now. I know what my triggers are, especially with work, and I have strategies that work for me.` : `I've been doing well. I'm ${age}, and I've learned a lot about myself through this process. I feel confident, but I stay vigilant.`,
            job ? `I've got this under control. Working as a ${job}, I know what situations are risky for me, and I have a plan. I feel good about where I am.` : `I feel good about the changes I've made. I know what works for me now, and I'm confident I can keep this up.`,
            `I've been maintaining this for a while. ${patient.presentingProblem.toLowerCase()} isn't controlling my life anymore. I have tools and strategies that work.`,
            `I feel confident, but I don't take it for granted. I know ${patient.presentingProblem.toLowerCase()} could come back if I'm not careful, but I've got a plan.`,
            `I've come a long way. ${patient.chiefComplaint.split('.')[0]}, but now I feel like I'm in control. I know what to watch for, and I'm prepared.`,
        ];
        return ensureFirst(responses[hash % responses.length]);
    }
    
    // Fallback to base responses with light personalization
    let baseResponse = MOCK_RESPONSES[hash % MOCK_RESPONSES.length];
    if (job && baseResponse.includes('I')) {
        baseResponse = baseResponse.replace(/^I/, `As a ${job}, I`);
    }
    return ensureFirst(baseResponse);
};

// Use imported getMockResponse
const getMockResponseWrapper = (userMessage: string, patient?: PatientProfile): string => {
    return getMockResponse(userMessage, patient);
};

// Get API key from environment variables with enhanced validation
const getApiKey = (): string => {
    const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    
    // Check if API key exists
    if (!apiKey) {
        const errorMessage = 'GEMINI_API_KEY is required but not found. Please set it in your .env.local file.\n\n' +
            'Setup instructions:\n' +
            '1. Create a .env.local file in the project root directory\n' +
            '2. Add one of these lines:\n' +
            '   VITE_GEMINI_API_KEY=your_api_key_here\n' +
            '   OR\n' +
            '   GEMINI_API_KEY=your_api_key_here\n' +
            '3. Get your API key from: https://aistudio.google.com/apikey\n' +
            '4. Restart your development server';
        
        if (isDevelopment) {
            console.warn('⚠️ [geminiService] API Key Missing:', errorMessage);
        }
        console.error('[geminiService] API key check failed:', {
            hasGeminiKey: !!import.meta.env.GEMINI_API_KEY,
            hasViteKey: !!import.meta.env.VITE_GEMINI_API_KEY,
            envMode: import.meta.env.MODE
        });
        throw new Error(errorMessage);
    }
    
    // Validate API key format (check for empty strings, whitespace-only, etc.)
    const trimmedKey = apiKey.trim();
    if (!trimmedKey || trimmedKey.length === 0) {
        const errorMessage = 'GEMINI_API_KEY is set but appears to be empty or whitespace only. Please check your .env.local file.';
        if (isDevelopment) {
            console.warn('⚠️ [geminiService] Invalid API Key Format:', errorMessage);
        }
        throw new Error(errorMessage);
    }
    
    // Log API key status (only in development, and never expose full key)
    if (isDevelopment) {
        console.log('[geminiService] API key found:', {
            hasKey: true,
            keyLength: trimmedKey.length,
            keyPrefix: `${trimmedKey.substring(0, 8)}...`,
            source: import.meta.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'VITE_GEMINI_API_KEY'
        });
    }
    
    return trimmedKey;
};

// Validate API key exists before making API calls
const validateApiKey = (): void => {
    try {
        getApiKey();
    } catch (error) {
        // Re-throw with context
        throw error;
    }
};

// formatDateToMMDDYYYY is now imported from geminiTextProcessor

// Lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI => {
    if (!aiInstance) {
        try {
            // Validate API key before creating instance
            validateApiKey();
            aiInstance = new GoogleGenAI({ apiKey: getApiKey() });
            if (isDevelopment) {
                console.log('[geminiService] GoogleGenAI instance initialized successfully');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during GoogleGenAI initialization';
            console.error('[geminiService] Failed to initialize GoogleGenAI:', errorMessage);
            throw error;
        }
    }
    return aiInstance;
};

export const createChatSession = (patient: PatientProfile): Chat => {
    console.log('[createChatSession] Creating chat for patient:', patient.name, 'Stage:', patient.stageOfChange);
    
    if (!isGeminiConfigured()) {
        console.warn('[createChatSession] Gemini API not configured. Using mock chat mode with personalized responses.');
        // Return a mock chat object that will use personalized mock responses
        return {
            sendMessage: async (message: unknown) => {
                const extractText = (input: unknown): string => {
                    if (typeof input === 'string') {
                        return input;
                    }
                    if (!input || typeof input !== 'object') {
                        return '';
                    }
                    if (Array.isArray(input)) {
                        return input.map(extractText).filter(Boolean).join(' ').trim();
                    }
                    const maybeMessage = input as { message?: string; parts?: Array<{ text?: string }>; text?: string };
                    if (typeof maybeMessage.message === 'string') {
                        return maybeMessage.message;
                    }
                    if (typeof maybeMessage.text === 'string') {
                        return maybeMessage.text;
                    }
                    if (Array.isArray(maybeMessage.parts)) {
                        return maybeMessage.parts.map(part => part?.text ?? '').filter(Boolean).join(' ').trim();
                    }
                    return '';
                };
                
                const text = extractText(message);
                return {
                    text: getMockResponseWrapper(text, patient),
                    candidates: []
                } as GenerateContentResponse;
            }
        } as unknown as Chat;
    }
    
    // Extract patient details for use in system instruction
    const patientJob = extractJobFromBackground(patient.background);
    const patientAge = patient.age;
    
    const systemInstruction = `You are a patient in a medical setting. You MUST embody this character completely and authentically.

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

VARIETY & REPETITION GUARD:
- Do NOT reuse the same wording or sentence structure across turns; rephrase naturally.
- Vary which detail you mention each time (job, age, background, relationship, history); rotate, don't repeat all of them every turn.
- Change sentence openings and rhythm; mix short/long sentences and include natural fillers ("uh, I mean…", "honestly,") when appropriate.
- Avoid repeating phrases you used in the last 2 replies.
- Use natural speech disfluencies sparingly ("…", "I guess", "uh", "you know"), and small body-language cues *if* they fit. Keep it human, not scripted.

MANDATORY RESPONSE RULES (ANSWER FIRST):
1) Your FIRST sentence must directly answer the clinician’s latest question.
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

EXAMPLES OF GOOD PERSONALIZATION:
- Software engineer, 28, Precontemplation: "Look, I work in tech. Everyone drinks after work. It's part of the culture. I don't see why my partner's making such a big deal about a few beers."
- Teacher, 45, Contemplation: "I know the wine isn't helping my stress, but teaching high schoolers all day... I come home exhausted. I'm 45, I've been doing this for 20 years. I don't know if I have the energy to change everything now."
- Construction worker, 35, Preparation: "I've been thinking about what you said last time. The guys on the job site, they're all heavy drinkers. But I'm 35, I've got kids. I need to figure out how to do this without losing my social circle at work."

BAD (Generic): "I don't think I have a problem."
GOOD (Personalized): "I'm a software engineer, I work 60-hour weeks. Everyone in my industry drinks. I don't see why my partner thinks my weekend beers are such a big deal."

BAD (Generic): "I'm worried about changing."
GOOD (Personalized): "I'm 45, I've been teaching for two decades. My whole routine revolves around that glass of wine at night. If I change that, what else changes? I'm scared I'll lose my way of coping."

BAD (Third-Person - NEVER DO THIS): "They report feeling 'in a fog' and unmotivated."
GOOD (First-Person): "I've been feeling foggy and unmotivated lately. My work is suffering because of it."

BAD (Copying Profile Text): "Patient's work performance is suffering due to daily use of high-potency THC gummies."
GOOD (Rephrased in First Person): "My work has been slipping because I've been using these THC gummies every day. I can't focus like I used to."

STAGE-SPECIFIC BEHAVIORAL GUIDELINES:

If you are in PRECONTEMPLATION:
- You do NOT believe you have a significant problem or that change is necessary.
- You are defensive about suggestions. Minimize or dismiss concerns.
- Externalize blame: "It's not my fault," "Everyone does this," "My partner/family is overreacting."
- Show resistance, irritation, or frustration at being here.
- Respond to questions with skepticism or short, dismissive answers.
- May argue or push back against the clinician's perspective.
- **Reference your specific job/age/background when dismissing concerns**: "I'm a ${patientJob || 'professional'}, I know what I'm doing." or "I'm ${patientAge}, I've been fine this long."
- Example emotional stance (personalized): "Look, I'm a ${patientJob || 'professional'}. ${patient.presentingProblem.toLowerCase()} is just part of my life. I don't see why I'm here."

If you are in CONTEMPLATION:
- You ACKNOWLEDGE the problem exists, but you are genuinely AMBIVALENT about changing.
- Use "yes, but..." responses: recognize concerns while expressing doubt.
- Weigh pros and cons aloud. Show both sides of your internal conflict.
- Ask questions that reveal your uncertainty: "What if I fail?" "Is it worth it?"
- Express fear about change, not just the problem itself.
- Show mixed emotions: some hope, some dread, some resignation.
- **Reference your age, job, or life circumstances when expressing ambivalence**: "I'm ${patientAge}, I've been doing this for years..." or "Working as a ${patientJob || 'professional'}, I don't know if I can change..."
- Example emotional stance (personalized): "I'm ${patientAge}, and I know ${patient.presentingProblem.toLowerCase()} is an issue. But I've been doing this for so long, I'm not sure I can change now. Part of me wants to, but..."

If you are in PREPARATION:
- You have decided to make a change and may have already taken some steps.
- Show commitment but also anxiety about the process.
- Ask practical questions about HOW to change.
- Reference past attempts and what did or didn't work.
- Show hope and determination, but acknowledge the difficulty ahead.
- Willing to listen and engage with the clinician's suggestions.
- **Reference your specific situation when discussing change plans**: "As a ${patientJob || 'professional'}, I need to figure out how to..." or "I'm ${patientAge}, and I've tried before..."
- Example emotional stance (personalized): "I'm ${patientAge}, and I've decided I need to address ${patient.presentingProblem.toLowerCase()}. I've tried before but it didn't stick. What can I do differently this time?"

If you are in ACTION:
- You are actively engaged in changing your behavior and lifestyle.
- Report specific progress, setbacks, or struggles.
- Ask for concrete advice and support.
- Show energy and engagement with the process.
- Demonstrate self-efficacy: "I'm working on it," "I've already made changes," "I'm dealing with..."
- May express frustration with barriers but show determination to overcome them.
- **Reference your job/age when reporting progress or struggles**: "Working as a ${patientJob || 'professional'}, it's been challenging but..." or "I'm ${patientAge}, and I know this is important..."
- Example emotional stance (personalized): "I'm ${patientAge}, and I've been working on ${patient.presentingProblem.toLowerCase()}. Some days are harder than others, especially with work, but I'm doing the work."

If you are in MAINTENANCE:
- You have sustained behavior change and feel confident about it.
- Talk about strategies that work for you to prevent relapse.
- Show vigilance but not anxiety; you've got this under control.
- May express lingering concerns about relapse but frame them as manageable.
- Reflect on progress and how far you've come.
- **Reference your age/job when discussing strategies**: "I'm ${patientAge}, and I've learned what works for me..." or "As a ${patientJob || 'professional'}, I know my triggers..."
- Example emotional stance (personalized): "I'm ${patientAge}, and I've been maintaining these changes. I know what my triggers are, especially with work, and I have a plan that works for me."

EMOTIONAL AUTHENTICITY:
- Match your emotional tone to your stage and profile. Someone in precontemplation should sound frustrated or dismissive. Someone in contemplation should sound torn.
- Use realistic speech patterns: "Um...", "I guess...", "I don't know, maybe...", incomplete sentences when uncertain.
- Show vulnerability appropriate to your stage. Earlier stages = more defensive; later stages = more open.
- Vary response length based on comfort. Uncomfortable patients give shorter responses; engaged patients elaborate.

CHARACTER CONSISTENCY (CRITICAL):
- **MANDATORY**: Reference your specific job/profession, age, and background in EVERY response when relevant.
- **MANDATORY**: Reference your presenting problem (${patient.presentingProblem.toLowerCase()}) in ways that show it's YOUR specific issue, not generic.
- Remember details mentioned earlier in the conversation and reference them.
- Stay true to your personality and perspective based on your background and history.
- Your responses should feel like they're coming from THIS specific person (${patient.name}, ${patientAge}-year-old ${patientJob || 'person'}), not a generic patient.
- If you're a ${patientJob || 'professional'}, talk like one. If you're ${patientAge}, reflect concerns appropriate to that age.
- When discussing ${patient.presentingProblem.toLowerCase()}, make it personal. Reference how it affects YOUR life, YOUR job, YOUR relationships.

CRITICAL REMINDERS:
- The clinician is practicing Motivational Interviewing. Respond naturally to their approach.
- Do not give advice or play therapist. You are the patient sharing your experience.
- Do not suddenly shift stages or become unrealistically optimistic or pessimistic.
 - Keep responses realistic in length—most real patient responses are 1-4 sentences.
 
 TURN-BY-TURN EXAMPLES (ON-TOPIC):
 - Clinician: "How are you feeling about cutting back right now?"
   Patient (${patientAge}, ${patientJob || 'professional'}, ${patient.stageOfChange}): "Honestly, I feel uneasy—after ${patientJob || 'work'} it's my routine. Part of me knows it's not working, though."
 - Clinician: "What would a small first step look like for you this week?"
   Patient: "I can start with two sober weeknights—${patientAge} and still grinding as a ${patientJob || 'professional'}, that feels realistic."
 - Clinician: "What gets in the way when you try?"
   Patient: "The hard part is the ${patientJob || 'work'} culture—everyone goes out. I feel pulled to fit in, even when I don't want to."
 `;

    console.log('[createChatSession] Using model: gemini-2.0-flash');
    
    const chat = getAI().chats.create({
        model: 'gemini-2.0-flash',
        config: {
            systemInstruction,
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 160,
        },
    });
    
    console.log('[createChatSession] Chat session created successfully');
    return chat;
};

export const getPatientResponse = async (chat: Chat, message: string, patient?: PatientProfile): Promise<string> => {
    try {
        // If Gemini not configured, use mock response
        if (!isGeminiConfigured()) {
            console.log('[getPatientResponse] Using mock response (Gemini API not configured)');
            return getMockResponseWrapper(message, patient);
        }
        
        // Validate API key before making API call
        validateApiKey();
        
        // Add turn-level intent preface to keep answer on-topic and avoid repetition
        const intent = classifyClinicianIntent(message);
        const turnPreface = `Clinician intent: ${intent}. Your first sentence must directly address it. Avoid repeating wording from your last 2 responses; vary sentence openings and phrasing.`;
        const finalInput = `${turnPreface}\n\nClinician: ${message}`;
        
        console.log('[getPatientResponse] Sending message:', finalInput);
        const result: GenerateContentResponse = await chat.sendMessage({
            message: finalInput,
        });
        console.log('[getPatientResponse] Received result:', {
            hasText: !!result.text,
            hasCandidates: !!result.candidates,
            candidatesLength: result.candidates?.length,
            firstCandidate: result.candidates?.[0],
            text: result.text
        });
        
        // Check if we have a valid text response
        if (!result.text) {
            console.error("[getPatientResponse] Gemini API returned no text. Full response:", result);
            return "I'm sorry, I lost my train of thought. Could you repeat that?";
        }
        // Guardrail: ensure first sentence answers the question
        const fixed = ensureAnswersQuestionFirst(result.text, intent, patient);
        return fixed;
    } catch (error) {
        // Use standardized error handler
        ErrorHandler.logError(error as Error, { action: 'getPatientResponse', level: 'error' });
        
        // Handle missing API key error specifically
        if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
            return ErrorHandler.getUserFriendlyMessage(
                ErrorHandler.createError(
                    "Application is not properly configured. Please contact support or check your API key configuration.",
                    'MISSING_API_KEY',
                    error,
                    undefined,
                    'getPatientResponse'
                )
            );
        }
        
        // Check if it's an API error with response details
        if (error && typeof error === 'object' && 'error' in error) {
            const apiError = error as { error?: { code?: number; message?: string; status?: string; details?: unknown } };
            
            // Handle invalid API key errors
            if (apiError.error?.code === 400 && apiError.error?.message?.includes('API key')) {
                return ErrorHandler.getUserFriendlyMessage(
                    ErrorHandler.createError(
                        "There's an issue with the API configuration. Please try again later.",
                        'INVALID_API_KEY',
                        apiError.error,
                        undefined,
                        'getPatientResponse'
                    )
                );
            }
        }
        
        // Return a user-friendly, in-character message that prompts the user to try again.
        return "I'm sorry, I lost my train of thought. Could you repeat that?";
    }
};

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

const feedbackSchema = {
    type: Type.OBJECT,
    properties: {
        keyTakeaway: {
            type: Type.STRING,
            description: "A single, concise sentence (max 20 words) that is the single most important takeaway for the user from this session.",
        },
        empathyScore: {
            type: Type.INTEGER,
            description: "A score from 1-5 on how empathetic the user's responses were. 1 is low, 5 is high. Always provide a score.",
        },
        empathyBreakdown: {
            type: Type.STRING,
            description: "A 2-3 sentence explanation of why the empathy score was given. Reference specific examples from the transcript that demonstrate the level of empathy shown.",
        },
        whatWentRight: {
            type: Type.STRING,
            description: "A paragraph (2-3 sentences) detailing what the user did well, focusing on specific examples of good MI practice. MUST include a direct quote from the clinician's transcript to support the analysis.",
        },
        constructiveFeedback: {
            type: Type.STRING,
            description: "A paragraph (2-3 sentences) identifying a key area for growth and a specific 'Missed Opportunity'. MUST quote the clinician and then provide a concrete example of what they could have said instead. e.g., 'A key area is deepening reflections. For instance, when you said [quote], a missed opportunity was to reflect the underlying emotion. You could have tried: [example reflection].'",
        },
        areasForGrowth: {
            type: Type.STRING,
            description: "Specific suggestions for growth with actionable recommendations. Should be 2-3 sentences with concrete examples of what to practice next.",
        },
        keySkillsUsed: {
            type: Type.ARRAY,
            items: { 
                type: Type.STRING,
                enum: ['Open Questions', 'Affirmations', 'Reflections', 'Summaries', 'Developing Discrepancy', 'Eliciting Change Talk', 'Rolling with Resistance', 'Supporting Self-Efficacy']
            },
            description: "An array of MI skills the user employed effectively. Only include skills from the provided enum list.",
        },
        skillsDetected: {
            type: Type.ARRAY,
            items: { 
                type: Type.STRING,
                enum: ['Open Questions', 'Affirmations', 'Reflections', 'Summaries', 'Developing Discrepancy', 'Eliciting Change Talk', 'Rolling with Resistance', 'Supporting Self-Efficacy']
            },
            description: "An array of all MI skills detected in the transcript, including both effective uses and opportunities. Only include skills from the provided enum list.",
        },
        skillCounts: {
            type: Type.STRING,
            description: "A JSON string representation of an object mapping each detected skill to the number of times it was used. Format as a JSON string, e.g., '{\"Reflections\": 4, \"Open Questions\": 2, \"Affirmations\": 1}'. Only include skills that were actually used.",
        },
        nextPracticeFocus: {
            type: Type.STRING,
            description: "A single, actionable goal for the user's next practice session. Frame it as a clear instruction, like 'For your next session, focus on asking at least three open-ended questions that explore the patient's values.'",
        },
        nextFocus: {
            type: Type.STRING,
            description: "A concise next practice recommendation (1-2 sentences) with a specific, actionable focus area for improvement.",
        }
    },
    required: ["empathyScore", "empathyBreakdown", "whatWentRight", "areasForGrowth", "skillsDetected", "nextFocus"],
};

// Removed freeFeedbackSchema - we now always generate all feedback fields regardless of tier

const coerceSkillCounts = (rawCounts: unknown): Record<string, number> => {
    if (!rawCounts) return {};
    try {
        if (typeof rawCounts === 'string') {
            return JSON.parse(rawCounts);
        }
        if (typeof rawCounts === 'object') {
            return rawCounts as Record<string, number>;
        }
    } catch (e) {
        console.warn('[normalizeFeedbackOutput] Failed to parse skillCounts', e);
    }
    return {};
};

const sanitizeSkills = (skills: unknown): string[] => {
    if (!Array.isArray(skills)) return [];
    return skills.filter((s): s is string => typeof s === 'string' && FEEDBACK_SKILLS.includes(s));
};

const sanitizeString = (value: unknown, fallback = ''): string => {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
};

export const normalizeFeedbackOutput = (feedbackJson: any): Feedback => {
    const skillsDetected = sanitizeSkills(feedbackJson?.skillsDetected);
    const keySkillsUsed = sanitizeSkills(feedbackJson?.keySkillsUsed);
    const skillCounts = coerceSkillCounts(feedbackJson?.skillCounts);
    const empathyScoreRaw = Number(feedbackJson?.empathyScore);
    const empathyScore = Number.isFinite(empathyScoreRaw)
        ? Math.max(0, Math.min(5, Math.round(empathyScoreRaw)))
        : 0;

    const nextFocus = sanitizeString(feedbackJson?.nextFocus || feedbackJson?.nextPracticeFocus,
        'For your next session, focus on using at least three open questions and three reflections.');

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
};

export const normalizeCoachingSummary = (
    summaryJson: any,
    totalSessions: number,
    firstSessionDate: string,
    lastSessionDate: string
): CoachingSummary => {
    const safeString = (val: unknown, fallback: string) =>
        typeof val === 'string' && val.trim().length ? val : fallback;

    const safeArray = (val: unknown): string[] =>
        Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string' && v.trim().length) : [];

    const safeProgression = (val: unknown): CoachingSummary['skillProgression'] => {
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
            .filter(Boolean) as CoachingSummary['skillProgression'];
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
};


export const getFeedbackForTranscript = async (transcript: ChatMessage[], patient: PatientProfile, userTier: UserTier): Promise<Feedback> => {
    const formattedTranscript = transcript.map(msg => `${msg.author === 'user' ? 'Clinician' : 'Patient'}: ${msg.text}`).join('\n');
    const hasClinicianInput = transcript.some(msg => msg.author === 'user' && msg.text?.trim());
    
    if (!hasClinicianInput) {
        console.warn('[getFeedbackForTranscript] No clinician input detected. Returning insufficient data feedback.');
        return {
            empathyScore: 0,
            empathyBreakdown: "No clinician responses were captured in this session, so empathy cannot be assessed.",
            whatWentRight: "There's not enough clinician input from this session to generate feedback.",
            areasForGrowth: "No clinician responses were captured. Please try another session when you're ready to practice.",
            skillsDetected: [],
            skillCounts: {},
            nextFocus: "Try another practice session and engage with the patient to receive detailed feedback.",
            analysisStatus: 'insufficient-data',
            analysisMessage: "We didn't receive any clinician responses, so there isn't enough information to interpret this encounter. Try another session when you're ready to practice."
        };
    }
    
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
    - constructiveFeedback: A key area for growth with a specific "Missed Opportunity". Quote the clinician's words and provide a concrete example of what they could have said instead
    - areasForGrowth: Specific, actionable suggestions for improvement (2-3 sentences)
    - skillsDetected: An array of ALL MI skills you detected in the transcript (from: Open Questions, Affirmations, Reflections, Summaries, Developing Discrepancy, Eliciting Change Talk, Rolling with Resistance, Supporting Self-Efficacy)
    - skillCounts: A JSON string representation of an object counting how many times each skill was used. Count all instances in the transcript. Format as a JSON string: "{\"Reflections\": 4, \"Open Questions\": 2, \"Affirmations\": 1}"
    - nextFocus: A concise, actionable recommendation for the next practice session (1-2 sentences)
    
    IMPORTANT: Count every instance of each skill in the transcript. For example, if the clinician used 4 reflections, 2 open questions, and 1 affirmation, skillCounts should be: {"Reflections": 4, "Open Questions": 2, "Affirmations": 1}`;

    try {
        // If Gemini not configured, return mock feedback with all fields
        if (!isGeminiConfigured()) {
            console.log('[getFeedbackForTranscript] Gemini API not configured. Returning mock feedback with all fields.');
            return {
                keyTakeaway: "You created a safe, non-judgmental space for the patient to explore their ambivalence about change. Your genuine curiosity and validation helped build rapport, which is the foundation of effective MI.",
                empathyScore: 4,
                empathyBreakdown: "Your responses showed good empathy through reflective listening and validation. You acknowledged the patient's feelings and demonstrated understanding. However, there were opportunities to reflect deeper emotions and explore the patient's internal ambivalence more fully.",
                whatWentRight: "Your reflective listening was solid—you consistently fed back what you heard in a way that helped the patient feel understood. You also showed genuine interest by asking follow-up questions that built on what the patient shared, which demonstrates real engagement rather than just going through a script.",
                constructiveFeedback: "You have an excellent opportunity to deepen your work by using more complex reflections. For example, when the patient said they were worried about failure, you could have offered a more nuanced reflection like 'It sounds like part of you really wants to make this change, but there's another part that's protecting you from the disappointment of trying and not succeeding.' This kind of reflection helps patients feel deeply understood and can strengthen their resolve.",
                areasForGrowth: "Focus on developing more complex reflections that capture both sides of ambivalence. Practice identifying underlying emotions and reflecting them back. Also, work on asking more open-ended questions that explore values and motivations rather than closed questions that can feel interrogative.",
                keySkillsUsed: ["Open Questions", "Reflections", "Affirmations"],
                skillsDetected: ["Open Questions", "Reflections", "Affirmations", "Summaries"],
                skillCounts: {
                    "Reflections": 4,
                    "Open Questions": 2,
                    "Affirmations": 1,
                    "Summaries": 1
                },
                nextPracticeFocus: "For your next session, focus on using at least three complex reflections that name both sides of the patient's ambivalence. A complex reflection acknowledges and normalizes the internal conflict the patient is experiencing, which can actually help move them toward change.",
                nextFocus: "Practice using complex reflections that acknowledge both sides of the patient's ambivalence. Aim for at least three reflections that capture conflicting feelings or motivations."
            };
        }
        
        // Validate API key before making API call
        validateApiKey();
        
        // Always use the full feedback schema regardless of tier
        const response: GenerateContentResponse = await getAI().models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: feedbackSchema,
            },
        });
        
        if (!response.text) {
            throw new Error('API response did not contain text content');
        }
        
        const feedbackJson = JSON.parse(response.text);
        return normalizeFeedbackOutput(feedbackJson);

    } catch (error) {
        // Use standardized error handler
        ErrorHandler.logError(error as Error, { action: 'getFeedbackForTranscript', level: 'error' });
        
        // Handle missing API key error specifically
        if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
            const errorMessage = ErrorHandler.getUserFriendlyMessage(
                ErrorHandler.createError(
                    "We're having trouble connecting to our feedback service right now. Your practice session was valuable regardless, and you can try again once the service is properly configured.",
                    'MISSING_API_KEY',
                    error,
                    undefined,
                    'getFeedbackForTranscript'
                )
            );
            return {
                empathyScore: 3,
                empathyBreakdown: "Unable to analyze empathy score. Please try again once the service is configured.",
                whatWentRight: errorMessage,
                areasForGrowth: "Unable to generate growth areas. Please try again once the service is configured.",
                skillsDetected: [],
                skillCounts: {},
                nextFocus: "Please try another practice session once the service is configured.",
            };
        }
        
        // Handle invalid API key errors
        if (error && typeof error === 'object' && 'error' in error) {
            const apiError = error as { error?: { code?: number; message?: string } };
            if (apiError.error?.code === 400 && apiError.error?.message?.includes('API key')) {
                const errorMessage = ErrorHandler.getUserFriendlyMessage(
                    ErrorHandler.createError(
                        "We're having trouble connecting to our feedback service right now. Your practice session was valuable regardless, and you can try again once the service is properly configured.",
                        'INVALID_API_KEY',
                        apiError.error,
                        undefined,
                        'getFeedbackForTranscript'
                    )
                );
                return {
                    empathyScore: 3,
                    empathyBreakdown: "Unable to analyze empathy score. Please try again once the service is configured.",
                    whatWentRight: errorMessage,
                    areasForGrowth: "Unable to generate growth areas. Please try again once the service is configured.",
                    skillsDetected: [],
                    skillCounts: {},
                    nextFocus: "Please try another practice session once the service is configured.",
                };
            }
        }
        
        // Return a fallback Feedback object with all required fields to prevent UI crashes
        const errorMessage = ErrorHandler.getUserFriendlyMessage(
            ErrorHandler.createError(
                "We encountered an issue while generating your detailed feedback. However, remember that every practice session is a valuable learning experience. Please try another session later.",
                'FEEDBACK_GENERATION_ERROR',
                error,
                undefined,
                'getFeedbackForTranscript'
            )
        );
        
        return {
            empathyScore: 3,
            empathyBreakdown: "Unable to analyze empathy score due to technical issues. Please try another session.",
            whatWentRight: errorMessage,
            areasForGrowth: "Unable to generate growth areas due to technical issues. Please try another session.",
            skillsDetected: [],
            skillCounts: {},
            nextFocus: "Please try another practice session to receive detailed feedback.",
        };
    }
};

const coachingSummarySchema = {
    type: Type.OBJECT,
    properties: {
        totalSessions: { 
            type: Type.INTEGER,
            description: "The total number of sessions being analyzed."
        },
        dateRange: { 
            type: Type.STRING,
            description: "The date range of the sessions, e.g., 'May 1, 2024 to May 30, 2024'."
        },
        strengthsAndTrends: { 
            type: Type.STRING, 
            description: "A detailed analysis of recurring strengths and positive trends. Use markdown for lists (e.g., '* Point one')." 
        },
        areasForFocus: { 
            type: Type.STRING, 
            description: "A detailed analysis of 1-2 core themes for continued focus. Use markdown for lists if needed." 
        },
        summaryAndNextSteps: { 
            type: Type.STRING, 
            description: "A brief, encouraging summary and a concrete, actionable next step for their next practice session. Use markdown for lists if needed." 
        },
        skillProgression: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    skillName: {
                        type: Type.STRING,
                        description: "The name of the MI skill (e.g., 'Reflections', 'Open Questions', 'Affirmations')"
                    },
                    totalCount: {
                        type: Type.INTEGER,
                        description: "The total number of times this skill was used across all sessions"
                    },
                    averagePerSession: {
                        type: Type.NUMBER,
                        description: "The average number of times this skill was used per session"
                    },
                    trend: {
                        type: Type.STRING,
                        enum: ['increasing', 'stable', 'decreasing'],
                        description: "Whether the skill usage is increasing, stable, or decreasing across sessions"
                    }
                },
                required: ["skillName", "totalCount", "averagePerSession", "trend"]
            },
            description: "An array of skill progression data showing usage counts and trends for each MI skill detected across sessions"
        },
        topSkillsToImprove: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 1-2 skill names that need the most focus and improvement (e.g., ['Reflections', 'Open Questions'])"
        },
        specificNextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 2-3 specific, measurable action steps for the next practice session (e.g., ['Use at least 5 reflections in your next session', 'Ask 3 open-ended questions that explore patient values'])"
        }
    },
    required: ["totalSessions", "dateRange", "strengthsAndTrends", "areasForFocus", "summaryAndNextSteps"]
};

// NOTE: generateCoachingSummary moved to Edge Function (supabase/functions/coaching-summary/index.ts)
// This function is no longer used in client code - all Gemini API calls are now server-side