import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/supabase.ts';

/**
 * Generate Patient Profile Edge Function
 *
 * Uses Gemini AI to generate unique, realistic patient profiles for MI practice.
 * This provides infinite variety compared to static template-based profiles.
 *
 * Authentication: Requires valid JWT token in Authorization header
 * Request Body: { topic?: string, difficulty?: string, stageOfChange?: string }
 * Returns: PatientProfile object
 */

// Valid values for patient profile fields
const STAGES_OF_CHANGE = ['Precontemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance'];
const PERSONALITY_TRAITS = ['defensive', 'emotional', 'reserved', 'talkative', 'intellectualizer', 'pleaser'];
const TOPICS = [
  'Substance Use',
  'Alcohol',
  'Smoking',
  'Diet & Exercise',
  'Medication Adherence',
  'Mental Health',
  'Chronic Disease Management',
  'Stress Management'
];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GENERATION_TIMEOUT_MS = 15000;

// Helper function to create timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

// Get random element from array
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Get random age based on topic
function getRandomAge(topic: string): { min: number; max: number } {
  const ageRanges: Record<string, { min: number; max: number }> = {
    'Substance Use': { min: 18, max: 55 },
    'Alcohol': { min: 21, max: 65 },
    'Smoking': { min: 18, max: 70 },
    'Diet & Exercise': { min: 25, max: 65 },
    'Medication Adherence': { min: 40, max: 80 },
    'Mental Health': { min: 18, max: 60 },
    'Chronic Disease Management': { min: 35, max: 75 },
    'Stress Management': { min: 22, max: 55 },
  };
  return ageRanges[topic] || { min: 25, max: 55 };
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
      console.error('[generate-patient-profile] Auth error:', authError);
      return errorResponse('Invalid or expired token. Please log in and try again.', 401, req);
    }

    console.log('[generate-patient-profile] Generating profile for user:', authenticatedUser.id.substring(0, 8) + '...');

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const {
      topic = randomChoice(TOPICS),
      difficulty = randomChoice(DIFFICULTIES),
      stageOfChange = randomChoice(STAGES_OF_CHANGE),
    } = body;

    // Validate inputs
    const validTopic = TOPICS.includes(topic) ? topic : randomChoice(TOPICS);
    const validDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : randomChoice(DIFFICULTIES);
    const validStage = STAGES_OF_CHANGE.includes(stageOfChange) ? stageOfChange : randomChoice(STAGES_OF_CHANGE);

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[generate-patient-profile] GEMINI_API_KEY not configured');
      return errorResponse('AI service not configured', 500, req);
    }

    // Calculate age range
    const ageRange = getRandomAge(validTopic);
    const targetAge = Math.floor(Math.random() * (ageRange.max - ageRange.min + 1)) + ageRange.min;

    // Build the prompt
    const prompt = `Generate a unique, realistic patient profile for a Motivational Interviewing practice session.

Requirements:
- Topic: ${validTopic}
- Stage of Change: ${validStage}
- Difficulty Level: ${validDifficulty}
- Target Age: Around ${targetAge} years old

Guidelines based on difficulty:
- Beginner: Patient is somewhat open, responds to basic MI techniques, shows some ambivalence but is relatively easy to engage
- Intermediate: Patient has more resistance, requires skilled use of reflections and open questions, may have complex backstory
- Advanced: Patient is highly resistant, has deep-seated ambivalence, may test the clinician with challenging responses or deflection

Create a patient with:
1. A realistic first and last name (diverse backgrounds)
2. Age close to ${targetAge}
3. Sex (Male, Female, or Non-binary)
4. A detailed background (2-3 sentences about their life, work, relationships)
5. A presenting problem specific to the topic
6. Relevant history related to the topic
7. A chief complaint in the patient's own words
8. A personality trait that will affect their behavior in the session

Return ONLY valid JSON with this exact structure:
{
  "name": "string",
  "age": number,
  "sex": "Male" | "Female" | "Non-binary",
  "background": "string",
  "presentingProblem": "string",
  "topic": "${validTopic}",
  "history": "string",
  "chiefComplaint": "string",
  "stageOfChange": "${validStage}",
  "personalityTrait": "defensive" | "emotional" | "reserved" | "talkative" | "intellectualizer" | "pleaser"
}`;

    // Define response schema
    const responseSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        sex: { type: 'string', enum: ['Male', 'Female', 'Non-binary'] },
        background: { type: 'string' },
        presentingProblem: { type: 'string' },
        topic: { type: 'string' },
        history: { type: 'string' },
        chiefComplaint: { type: 'string' },
        stageOfChange: { type: 'string', enum: STAGES_OF_CHANGE },
        personalityTrait: { type: 'string', enum: PERSONALITY_TRAITS },
      },
      required: ['name', 'age', 'sex', 'background', 'presentingProblem', 'topic', 'history', 'chiefComplaint', 'stageOfChange', 'personalityTrait'],
    };

    // Call Gemini API
    const geminiRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1.0, // High temperature for variety
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema,
      }
    };

    const geminiUrl = `${GEMINI_API_URL}?key=${geminiApiKey}`;

    let geminiResponse: Response;
    try {
      geminiResponse = await Promise.race([
        fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiRequest),
        }),
        createTimeoutPromise(GENERATION_TIMEOUT_MS)
      ]) as Response;
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        console.error('[generate-patient-profile] Gemini API timeout');
        return errorResponse('AI service timed out. Please try again.', 504, req);
      }
      throw error;
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[generate-patient-profile] Gemini API error:', geminiResponse.status, errorText);
      return errorResponse('Failed to generate patient profile', 500, req);
    }

    const geminiData = await geminiResponse.json();

    // Extract the generated profile
    const candidate = geminiData.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('[generate-patient-profile] Empty response from Gemini');
      return errorResponse('Failed to generate patient profile', 500, req);
    }

    let patientProfile;
    try {
      patientProfile = JSON.parse(content);
    } catch (parseError) {
      console.error('[generate-patient-profile] Failed to parse response:', content);
      return errorResponse('Invalid response from AI service', 500, req);
    }

    // Add a unique variant ID
    patientProfile.variantId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('[generate-patient-profile] Generated profile:', patientProfile.name, '-', patientProfile.topic);

    return jsonResponse(patientProfile, 200, req);

  } catch (error) {
    console.error('[generate-patient-profile] Unexpected error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate patient profile',
      500,
      req
    );
  }
});
