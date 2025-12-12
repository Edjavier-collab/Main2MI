import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientProfile, UserTier, ChatMessage, Feedback } from '../../types';
import { FREE_SESSION_DURATION, PREMIUM_SESSION_DURATION } from '../../constants';
import { createChatSession, getPatientResponse } from '../../services/geminiService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Chat } from '@google/genai';
import PatientProfileCard from '../ui/PatientProfileCard';
import ChatBubble from '../ui/ChatBubble';
import Timer from '../ui/Timer';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';

interface PracticeViewProps {
    patient: PatientProfile;
    userTier: UserTier;
    onFinish: (transcript: ChatMessage[], feedback: Feedback) => void;
    onUpgrade?: () => void;
}

const SpeechVisualizer: React.FC = () => (
    <div className="flex items-end justify-center space-x-1 pl-3 pr-2 h-6" aria-hidden="true">
        <span className="w-1 h-2 bg-sky-400 rounded-full animate-wavey"></span>
        <span className="w-1 h-4 bg-sky-400 rounded-full animate-wavey" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-1 h-5 bg-sky-400 rounded-full animate-wavey" style={{ animationDelay: '0.4s' }}></span>
        <span className="w-1 h-3 bg-sky-400 rounded-full animate-wavey" style={{ animationDelay: '0.1s' }}></span>
    </div>
);

const PracticeView: React.FC<PracticeViewProps> = ({ patient, userTier, onFinish, onUpgrade }) => {
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isChatReady, setIsChatReady] = useState(false);
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [isPatientTyping, setIsPatientTyping] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);
    const [isRetryingFeedback, setIsRetryingFeedback] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    
    const { user } = useAuth();
    const { isListening, transcript: speechTranscript, startListening, stopListening, hasSupport, error: micError, setTranscript: setSpeechTranscript } = useSpeechRecognition();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sessionDuration = userTier === UserTier.Premium ? PREMIUM_SESSION_DURATION : FREE_SESSION_DURATION;

    useEffect(() => {
        setIsChatReady(false);
        const chatSession = createChatSession(patient);
        setChat(chatSession);
        setIsChatReady(true);
    }, [patient]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcript, isPatientTyping]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to shrink if text is deleted
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`; // Set height to content height
        }
    }, [speechTranscript]);

    const handleSendMessage = useCallback(async (text: string) => {
        // Clear any previous send error
        setSendError(null);

        if (!text.trim()) return;

        if (!chat || !isChatReady) {
            setSendError('Still connecting to patient. Please wait a moment.');
            return;
        }

        if (isPatientTyping) {
            setSendError('Please wait for the patient to respond.');
            return;
        }

        const newUserMessage: ChatMessage = { author: 'user', text };
        setTranscript(prev => [...prev, newUserMessage]);
        setIsPatientTyping(true);

        try {
            // Pass patient profile to ensure responses are personalized for this specific patient
            const patientResponse = await getPatientResponse(chat, text, patient);
            const newPatientMessage: ChatMessage = { author: 'patient', text: patientResponse };
            setTranscript(prev => [...prev, newPatientMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { author: 'patient', text: "I'm sorry, I'm having trouble focusing right now." };
            setTranscript(prev => [...prev, errorMessage]);
        } finally {
            setIsPatientTyping(false);
        }
    }, [chat, isChatReady, patient, isPatientTyping]);
    
    const handleVoiceSend = () => {
        // Clear any previous send error when user interacts with mic
        setSendError(null);
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };
    
    const handleTextSend = () => {
        if (!speechTranscript.trim()) return;
        if (isListening) {
            stopListening();
        }
        handleSendMessage(speechTranscript);
        setSpeechTranscript('');
    };

    /**
     * Call the analyze-session Edge Function to get feedback
     */
    const getFeedbackFromEdgeFunction = useCallback(async (): Promise<Feedback> => {
        // Get Supabase URL and construct Edge Function URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            throw new Error('Supabase URL not configured');
        }

        const functionsUrl = `${supabaseUrl}/functions/v1/analyze-session`;

        // Require authentication - get JWT token from session
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Please check your environment variables.');
        }

        if (!user) {
            throw new Error('You must be logged in to generate feedback. Please log in and try again.');
        }

        let authToken: string | null = null;
        try {
            const supabase = getSupabaseClient();
            
            // Get the current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('[PracticeView] Session error:', sessionError);
                throw new Error('Failed to get session. Please refresh the page and try again.');
            }
            
            if (!session) {
                console.error('[PracticeView] No session found');
                throw new Error('Your session has expired. Please refresh the page and log in again.');
            }
            
            if (!session.access_token) {
                console.error('[PracticeView] Session exists but no access_token');
                throw new Error('Your session has expired. Please refresh the page and log in again.');
            }
            
            // Check if token is expired (basic check - JWT exp claim)
            try {
                const tokenParts = session.access_token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.exp && payload.exp < now) {
                        console.warn('[PracticeView] Token expired, attempting refresh...');
                        // Try to refresh the session
                        if (session.refresh_token) {
                            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession(session);
                            if (!refreshError && refreshedSession?.access_token) {
                                authToken = refreshedSession.access_token;
                                console.log('[PracticeView] Session refreshed successfully');
                            } else {
                                console.error('[PracticeView] Failed to refresh session:', refreshError);
                                throw new Error('Your session has expired. Please refresh the page and log in again.');
                            }
                        } else {
                            throw new Error('Your session has expired. Please refresh the page and log in again.');
                        }
                    } else {
                        authToken = session.access_token;
                    }
                } else {
                    authToken = session.access_token;
                }
            } catch (parseError) {
                // If we can't parse the token, just use it as-is (let the server validate it)
                console.warn('[PracticeView] Could not parse token, using as-is:', parseError);
                authToken = session.access_token;
            }
            
            if (!authToken) {
                throw new Error('Failed to get valid authentication token.');
            }
            
            console.log('[PracticeView] Using auth token for Edge Function call (token length:', authToken.length, ')');
        } catch (error) {
            if (error instanceof Error) {
                // Re-throw our custom error messages
                if (error.message.includes('must be logged in') || 
                    error.message.includes('session has expired') ||
                    error.message.includes('not configured') ||
                    error.message.includes('Failed to get')) {
                    throw error;
                }
            }
            console.error('[PracticeView] Failed to get auth token:', error);
            throw new Error('Failed to authenticate. Please refresh the page and try again.');
        }

        // Prepare request with required Authorization header
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        };

        // Make request to Edge Function
        const response = await fetch(functionsUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                transcript,
                patient,
            }),
        });

        // Handle errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.error || `Failed to analyze session (${response.status})`;

            // Map HTTP status codes to user-friendly messages
            if (response.status === 401) {
                throw new Error('Your session has expired. Please refresh the page and try again.');
            } else if (response.status === 429) {
                throw new Error('AI service is busy. Please try again in a moment.');
            } else if (response.status === 504) {
                throw new Error('Analysis timed out. Please try again.');
            } else if (response.status === 500) {
                throw new Error('AI service error. Please try again later.');
            } else {
                throw new Error(errorMessage);
            }
        }

        // Parse and return feedback
        const feedback = await response.json();
        return feedback as Feedback;
    }, [transcript, patient, user]);

    const handleEndSession = useCallback(async () => {
        setIsEndingSession(true);
        setFeedbackError(null);

        try {
            const feedback = await getFeedbackFromEdgeFunction();
            setIsEndingSession(false);
            onFinish(transcript, feedback);
        } catch (error) {
            console.error('[PracticeView] Failed to get feedback:', error);
            setIsEndingSession(false);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback. Please try again.';
            setFeedbackError(errorMessage);
        }
    }, [transcript, getFeedbackFromEdgeFunction, onFinish]);

    const handleRetryFeedback = useCallback(async () => {
        setIsRetryingFeedback(true);
        setFeedbackError(null);

        try {
            const feedback = await getFeedbackFromEdgeFunction();
            setIsRetryingFeedback(false);
            onFinish(transcript, feedback);
        } catch (error) {
            console.error('[PracticeView] Retry failed:', error);
            setIsRetryingFeedback(false);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback. Please try again.';
            setFeedbackError(errorMessage);
        }
    }, [transcript, getFeedbackFromEdgeFunction, onFinish]);

    if (!isSessionStarted) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
                <PatientProfileCard patient={patient} userTier={userTier} onUpgrade={onUpgrade} />
                <Button
                    onClick={() => setIsSessionStarted(true)}
                    variant="primary"
                    size="lg"
                    className="mt-8 px-12 py-4 text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] border-2 border-black"
                >
                    Begin Session
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-transparent">
            <div className="flex justify-between items-center p-4 border-b-2 border-black bg-white">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] truncate">with {patient.name}</h3>
                    {/* Progress indicator showing message count */}
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {transcript.length === 0 ? 'Start the conversation...' : `${transcript.length} message${transcript.length !== 1 ? 's' : ''} exchanged`}
                    </p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                    <Timer initialSeconds={sessionDuration} onTimeUp={handleEndSession} />
                    <button
                        onClick={handleEndSession}
                        disabled={isEndingSession}
                        className="px-4 min-h-[var(--touch-target-min)] text-white font-semibold border-2 border-black disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2"
                        style={{ 
                            backgroundColor: isEndingSession ? '#dc2626' : '#ef4444',
                        }}
                        onMouseEnter={(e) => {
                            if (!isEndingSession) {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isEndingSession) {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                            }
                        }}
                    >
                        {isEndingSession ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Ending...
                            </span>
                        ) : (
                            'End Session'
                        )}
                    </button>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-white relative">
                <div className="space-y-4">
                    {transcript.length === 0 && !isPatientTyping && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-[var(--color-text-muted)]">
                            <i className="fa-solid fa-comments text-4xl mb-3 opacity-40" aria-hidden="true"></i>
                            <p className="text-sm">Say something to start the conversation</p>
                        </div>
                    )}
                    {transcript.map((msg, index) => (
                        <ChatBubble key={index} message={msg} />
                    ))}
                    {isPatientTyping && (
                        <div className="animate-slide-fade-in pt-4">
                            <ChatBubble message={{ author: 'patient', text: '...' }} isTyping={true} />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t-2 border-black bg-[var(--color-bg-accent)]">
                {/* Screen reader announcement for voice recording status */}
                <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {isListening ? 'Recording started. Speak now.' : ''}
                </div>
                {(micError || sendError) && (
                    <Card variant="accent" padding="sm" className="mb-3 border-l-4 border-[var(--color-error)]">
                        <div className="flex items-center gap-2 text-[var(--color-error)] text-sm" role="alert">
                            <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <span>{micError || sendError}</span>
                        </div>
                    </Card>
                )}
                <div className="flex items-end space-x-3">
                    <div className="flex-1 flex items-end bg-white border-2 border-black focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-shadow duration-200">
                        {isListening && <SpeechVisualizer />}
                        <textarea
                            ref={textareaRef}
                            value={speechTranscript}
                            onChange={(e) => setSpeechTranscript(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Type your response or use the microphone..."}
                            className="flex-1 p-3 bg-transparent focus:outline-none resize-none w-full max-h-56 overflow-y-auto text-[var(--color-text-primary)]"
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleTextSend();
                                }
                            }}
                            disabled={isPatientTyping}
                            readOnly={isListening}
                            style={{ caretColor: isListening ? 'transparent' : 'auto' }}
                        />
                    </div>
                    {hasSupport && (
                        <div className="relative group flex items-center">
                            <button
                                onClick={handleVoiceSend}
                                disabled={isPatientTyping}
                                className={`w-[var(--touch-target-min)] h-[var(--touch-target-min)] flex items-center justify-center border-2 border-black transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isListening ? 'bg-[var(--color-error)] text-white animate-pulse focus-visible:ring-[var(--color-error)]' : 'bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-primary-lighter)] focus-visible:ring-[var(--color-primary)]'}`}
                                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                                aria-pressed={isListening}
                            >
                                <i className="fa-solid fa-microphone text-xl" aria-hidden="true"></i>
                            </button>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--color-neutral-800)] text-white text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-nowrap rounded">
                                {isListening ? 'Stop Recording' : 'Start Recording'}
                                <svg className="absolute text-[var(--color-neutral-800)] h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleTextSend}
                        disabled={isPatientTyping || !speechTranscript.trim() || !isChatReady}
                        className="w-[var(--touch-target-min)] h-[var(--touch-target-min)] flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-text-primary)] border-2 border-black hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-neutral-300)] disabled:text-[var(--color-neutral-500)] disabled:border-[var(--color-neutral-400)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                        aria-label={!isChatReady ? "Connecting to patient..." : "Send message"}
                    >
                        <i className="fa-solid fa-paper-plane text-xl" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            {(isEndingSession || isRetryingFeedback) && (
                 <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center rounded-2xl z-10">
                    <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                        {isRetryingFeedback ? 'Retrying feedback generation...' : 'Generating your feedback...'}
                    </p>
                </div>
            )}
            
            {feedbackError && !isEndingSession && !isRetryingFeedback && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-2xl z-10 p-6">
                    <Card variant="elevated" padding="lg" className="max-w-md w-full">
                        <div className="text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-[var(--color-error-light)] flex items-center justify-center">
                                    <i className="fa-solid fa-exclamation-triangle text-2xl text-[var(--color-error)]" aria-hidden="true"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                                Feedback Generation Failed
                            </h3>
                            <p className="text-[var(--color-text-secondary)] mb-6">
                                {feedbackError}
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleRetryFeedback}
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    disabled={isRetryingFeedback}
                                    icon={<i className="fa-solid fa-redo" aria-hidden="true"></i>}
                                >
                                    {isRetryingFeedback ? 'Retrying...' : 'Retry Feedback Generation'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Create a fallback feedback object
                                        const fallbackFeedback: Feedback = {
                                            empathyScore: 0,
                                            empathyBreakdown: 'Feedback generation failed. Your practice session was still valuable!',
                                            whatWentRight: 'We encountered an issue generating detailed feedback, but every practice session helps you improve your MI skills.',
                                            areasForGrowth: 'Please try another session to receive detailed feedback.',
                                            skillsDetected: [],
                                            skillCounts: {},
                                            nextFocus: 'Try another practice session to receive detailed feedback.',
                                            analysisStatus: 'error',
                                            analysisMessage: feedbackError,
                                        };
                                        setFeedbackError(null);
                                        onFinish(transcript, fallbackFeedback);
                                    }}
                                    variant="secondary"
                                    size="lg"
                                    fullWidth
                                >
                                    Continue Without Feedback
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PracticeView;