import { NextRequest, NextResponse } from 'next/server';
import { generatePatientResponse, inferMood } from '@/services/geminiService';
import { PatientProfile, ChatMessage } from '@/types';

export async function POST(request: NextRequest) {
    try {
        // Check for API key
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not configured on the server' },
                { status: 500 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { message, patient, transcript } = body as {
            message: string;
            patient: PatientProfile;
            transcript: ChatMessage[];
        };

        // Validate required fields
        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 }
            );
        }

        if (!patient || !patient.name) {
            return NextResponse.json(
                { error: 'Patient profile is required' },
                { status: 400 }
            );
        }

        // Generate patient response
        const response = await generatePatientResponse(
            message,
            patient,
            transcript || []
        );

        // Infer patient mood from the response
        const mood = inferMood(response, patient);

        return NextResponse.json({ response, mood });
    } catch (error) {
        console.error('[/api/chat] Error generating response:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check for specific error types
        if (errorMessage.includes('GEMINI_API_KEY')) {
            return NextResponse.json(
                { error: 'AI service is not configured' },
                { status: 500 }
            );
        }

        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            return NextResponse.json(
                { error: 'AI service is busy. Please try again in a moment.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate patient response. Please try again.' },
            { status: 500 }
        );
    }
}
