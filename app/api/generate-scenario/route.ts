import { NextRequest, NextResponse } from 'next/server';
import { generatePatientProfile } from '@/services/geminiService';
import { StageOfChange, DifficultyLevel } from '@/types';

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
        const { topic, difficulty, stageOfChange } = body as {
            topic: string;
            difficulty: DifficultyLevel;
            stageOfChange: StageOfChange;
        };

        // Validate required fields
        if (!topic || typeof topic !== 'string') {
            return NextResponse.json(
                { error: 'Topic is required and must be a string' },
                { status: 400 }
            );
        }

        if (!difficulty || !Object.values(DifficultyLevel).includes(difficulty)) {
            return NextResponse.json(
                { error: 'Valid difficulty level is required' },
                { status: 400 }
            );
        }

        if (!stageOfChange || !Object.values(StageOfChange).includes(stageOfChange)) {
            return NextResponse.json(
                { error: 'Valid stage of change is required' },
                { status: 400 }
            );
        }

        // Generate patient profile
        const patientProfile = await generatePatientProfile(
            topic,
            difficulty,
            stageOfChange
        );

        return NextResponse.json({ patientProfile });
    } catch (error) {
        console.error('[/api/generate-scenario] Error generating profile:', error);

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

        if (errorMessage.includes('Failed to parse')) {
            return NextResponse.json(
                { error: 'Failed to generate a valid patient profile. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate patient scenario. Please try again.' },
            { status: 500 }
        );
    }
}
