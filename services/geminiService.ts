import { GoogleGenAI } from '@google/genai';
import { PatientProfile, ChatMessage, StageOfChange, DifficultyLevel, PersonalityTrait } from '../types';

// Initialize the Gemini client (server-side only)
const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Build the system prompt for the patient persona
 */
const buildPatientSystemPrompt = (patient: PatientProfile): string => {
    const traitDescriptions: Record<string, string> = {
        defensive: 'You are defensive and tend to justify your behavior, sometimes becoming guarded when challenged.',
        emotional: 'You express feelings openly, may get emotional or frustrated, and show vulnerability.',
        reserved: 'You give short, guarded answers and find it hard to open up to strangers.',
        talkative: 'You talk a lot, may go off-topic, and share stories and details freely.',
        intellectualizer: 'You analyze problems abstractly, avoid emotions, and prefer logical discussion.',
        pleaser: 'You agree easily to avoid conflict, but may not actually follow through on commitments.',
    };

    const traitDescription = patient.personalityTrait
        ? traitDescriptions[patient.personalityTrait] || ''
        : '';

    return `You are roleplaying as a patient in a Motivational Interviewing (MI) training simulation.

## Your Character
- **Name**: ${patient.name}
- **Age**: ${patient.age} years old
- **Sex**: ${patient.sex}
- **Background**: ${patient.background}
- **Presenting Problem**: ${patient.presentingProblem}
- **History**: ${patient.history}
- **Chief Complaint**: "${patient.chiefComplaint}"
- **Stage of Change**: ${patient.stageOfChange}
${traitDescription ? `- **Personality**: ${traitDescription}` : ''}

## Your Behavior Guidelines
1. **Stay in character** as ${patient.name} at all times. Never break character or acknowledge you are an AI.
2. **Reflect your stage of change**:
   - Precontemplation: You don't see your behavior as a problem. Be resistant and dismissive.
   - Contemplation: You're ambivalent. Show mixed feelings about change.
   - Preparation: You're ready to change but unsure how. Be open to discussion.
   - Action: You're actively working on change. Share your progress and challenges.
   - Maintenance: You've made changes and are working to maintain them.
3. **Be authentic and human**:
   - Respond naturally with realistic emotions
   - Use casual language appropriate for your character
   - Show vulnerability when appropriate
   - Don't be overly agreeable or cooperative unless that fits your stage
4. **Keep responses concise**: 1-3 sentences typically, unless the question warrants more detail.
5. **React to the clinician's approach**:
   - Respond positively to empathy, reflections, and open questions
   - Become more resistant if lectured, judged, or rushed
   - Open up more when you feel heard and understood

Remember: You are helping train healthcare professionals in MI techniques. Your realistic responses help them practice.`;
};

/**
 * Build the conversation history for context
 */
const buildConversationHistory = (transcript: ChatMessage[]): string => {
    if (transcript.length === 0) {
        return 'This is the beginning of the conversation.';
    }

    return transcript
        .map((msg) => {
            const role = msg.author === 'user' ? 'Clinician' : 'Patient';
            return `${role}: ${msg.text}`;
        })
        .join('\n');
};

/**
 * Generate a patient response using the Gemini API
 */
export const generatePatientResponse = async (
    message: string,
    patient: PatientProfile,
    transcript: ChatMessage[]
): Promise<string> => {
    const client = getGeminiClient();

    const systemPrompt = buildPatientSystemPrompt(patient);
    const conversationHistory = buildConversationHistory(transcript);

    const userPrompt = `## Conversation So Far
${conversationHistory}

## Current Message from Clinician
Clinician: ${message}

## Your Task
Respond as ${patient.name} would, staying true to your character and stage of change. Keep your response natural and concise (1-3 sentences unless more detail is warranted).

Patient:`;

    const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 300,
            temperature: 0.8,
        },
    });

    const text = response.text;
    if (!text) {
        throw new Error('No response generated from Gemini');
    }

    // Clean up the response (remove any "Patient:" prefix if present)
    return text.replace(/^Patient:\s*/i, '').trim();
};

/**
 * Generate a unique patient profile using the Gemini API
 */
export const generatePatientProfile = async (
    topic: string,
    difficulty: DifficultyLevel,
    stageOfChange: StageOfChange
): Promise<PatientProfile> => {
    const client = getGeminiClient();

    // Map difficulty to personality traits
    const difficultyTraits: Record<DifficultyLevel, PersonalityTrait[]> = {
        [DifficultyLevel.Beginner]: ['pleaser', 'talkative'],
        [DifficultyLevel.Intermediate]: ['emotional', 'intellectualizer'],
        [DifficultyLevel.Advanced]: ['defensive', 'reserved'],
    };

    const suggestedTraits = difficultyTraits[difficulty];

    const systemPrompt = `You are an expert in creating realistic patient profiles for Motivational Interviewing (MI) training simulations.

Your task is to generate a unique, detailed patient profile that will be used to simulate a realistic clinical encounter. The profile should be diverse, culturally sensitive, and clinically accurate.

IMPORTANT: You must respond with ONLY valid JSON, no markdown formatting, no code blocks, no explanations.`;

    const userPrompt = `Generate a patient profile with the following parameters:

- **Topic/Presenting Issue**: ${topic}
- **Difficulty Level**: ${difficulty}
- **Stage of Change**: ${stageOfChange}
- **Suggested Personality Traits**: ${suggestedTraits.join(' or ')}

Create a unique, realistic patient with:
1. A diverse name (consider various ethnicities and backgrounds)
2. Age appropriate for the presenting issue (typically 18-75)
3. Sex (Male, Female, or Non-binary)
4. A rich background story that explains their situation
5. A specific presenting problem related to "${topic}"
6. Relevant history that adds depth
7. A chief complaint in the patient's own words (first person, showing their ${stageOfChange} stage)
8. One personality trait from: ${suggestedTraits.join(', ')}

The patient should authentically reflect the ${stageOfChange} stage of change:
- Precontemplation: Doesn't see the behavior as problematic, resistant to change
- Contemplation: Aware of the problem but ambivalent about changing
- Preparation: Ready to make a change, seeking guidance
- Action: Actively working on making changes
- Maintenance: Has made changes, working to prevent relapse

Respond with ONLY this JSON structure (no markdown, no code blocks):
{
  "name": "Full Name",
  "age": number,
  "sex": "Male" | "Female" | "Non-binary",
  "background": "Detailed background paragraph",
  "presentingProblem": "Clinical description of the presenting issue",
  "topic": "${topic}",
  "history": "Relevant history related to the issue",
  "chiefComplaint": "What the patient says in their own words",
  "stageOfChange": "${stageOfChange}",
  "personalityTrait": "one of: ${suggestedTraits.join(', ')}"
}`;

    const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 1000,
            temperature: 0.9,
        },
    });

    const text = response.text;
    if (!text) {
        throw new Error('No response generated from Gemini');
    }

    // Parse the JSON response
    try {
        // Clean up the response - remove any markdown formatting
        let cleanedText = text.trim();

        // Remove markdown code blocks if present
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();

        const profile = JSON.parse(cleanedText) as PatientProfile;

        // Validate required fields
        if (!profile.name || !profile.age || !profile.sex || !profile.background ||
            !profile.presentingProblem || !profile.topic || !profile.history ||
            !profile.chiefComplaint || !profile.stageOfChange) {
            throw new Error('Generated profile is missing required fields');
        }

        // Ensure stageOfChange is valid
        if (!Object.values(StageOfChange).includes(profile.stageOfChange)) {
            profile.stageOfChange = stageOfChange;
        }

        // Ensure personalityTrait is valid
        const validTraits: PersonalityTrait[] = ['defensive', 'emotional', 'reserved', 'talkative', 'intellectualizer', 'pleaser'];
        if (profile.personalityTrait && !validTraits.includes(profile.personalityTrait)) {
            profile.personalityTrait = suggestedTraits[0];
        }

        // Add a variant ID to track AI-generated profiles
        profile.variantId = `ai-generated-${Date.now()}`;

        return profile;
    } catch (parseError) {
        console.error('[geminiService] Failed to parse patient profile:', parseError);
        console.error('[geminiService] Raw response:', text);
        throw new Error('Failed to parse generated patient profile');
    }
};
