import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientProfile, UserTier, ChatMessage, Feedback } from '../../types';
import { FREE_SESSION_DURATION, PREMIUM_SESSION_DURATION } from '../../constants';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import PatientProfileCard from '../ui/PatientProfileCard';
import ChatBubble from '../ui/ChatBubble';
import Timer from '../ui/Timer';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { getValidAuthToken, autoSaveSession, getAutoSavedSession, clearAutoSavedSessions, isSessionValid } from '../../utils/sessionManager';

interface PracticeViewProps {
    patient: PatientProfile;
    userTier: UserTier;
    onFinish: (transcript: ChatMessage[], feedback: Feedback) => void;
    onUpgrade?: () => void;
}

const SpeechVisualizer: React.FC = () => (
    <div className="flex items-end justify-center space-x-1 pl-3 pr-2 h-6" aria-hidden="true">
        <span className="w-1 h-2 bg-[var(--color-primary)] rounded-full animate-wavey"></span>
        <span className="w-1 h-4 bg-[var(--color-primary)] rounded-full animate-wavey" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-1 h-5 bg-[var(--color-primary)] rounded-full animate-wavey" style={{ animationDelay: '0.4s' }}></span>
        <span className="w-1 h-3 bg-[var(--color-primary)] rounded-full animate-wavey" style={{ animationDelay: '0.1s' }}></span>
    </div>
);

const PracticeView: React.FC<PracticeViewProps> = ({ patient, userTier, onFinish, onUpgrade }) => {
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [isPatientTyping, setIsPatientTyping] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);
    const [isRetryingFeedback, setIsRetryingFeedback] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState(false);
    
    const { user } = useAuth();
    const { showToast, ToastContainer, toasts, removeToast } = useToast();
    const { isListening, finalTranscript, interimTranscript, startListening, stopListening, hasSupport, error: micError, setTranscript: setSpeechTranscript } = useSpeechRecognition();
    // Combine final and interim for display (interim shows as live preview)
    const speechTranscript = finalTranscript + (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const sessionDuration = userTier === UserTier.Premium ? PREMIUM_SESSION_DURATION : FREE_SESSION_DURATION;

    // Restore auto-saved session on mount
    useEffect(() => {
        const savedSession = getAutoSavedSession();
        if (savedSession && savedSession.transcript.length > 0) {
            const shouldRestore = window.confirm(
                'We found a saved practice session. Would you like to restore it?'
            );
            if (shouldRestore) {
                setTranscript(savedSession.transcript);
                setIsSessionStarted(true);
            } else {
                clearAutoSavedSessions();
            }
        }

        // Cleanup on unmount
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
            if (sessionCheckIntervalRef.current) {
                clearInterval(sessionCheckIntervalRef.current);
            }
        };
    }, []);

    // Warn user before leaving the page if session is in progress
    useEffect(() => {
        const hasUnsavedSession = isSessionStarted && transcript.length > 0 && !isEndingSession;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedSession) {
                // Auto-save before leaving
                autoSaveSession({
                    transcript,
                    patient,
                    timestamp: Date.now(),
                });
                e.preventDefault();
                e.returnValue = 'You have an active practice session. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        const handlePopState = (e: PopStateEvent) => {
            if (hasUnsavedSession) {
                const shouldLeave = window.confirm(
                    'You have an active practice session. Your progress will be saved. Are you sure you want to leave?'
                );
                if (!shouldLeave) {
                    // Prevent navigation by pushing the current state back
                    window.history.pushState({ view: 'Practice' }, '', '/practice');
                } else {
                    // Save before leaving
                    autoSaveSession({
                        transcript,
                        patient,
                        timestamp: Date.now(),
                    });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isSessionStarted, transcript, patient, isEndingSession]);

    // Auto-save session data every 30 seconds
    useEffect(() => {
        if (isSessionStarted && transcript.length > 0) {
            autoSaveIntervalRef.current = setInterval(() => {
                autoSaveSession({
                    transcript,
                    patient,
                    timestamp: Date.now(),
                });
            }, 30000); // Auto-save every 30 seconds

            return () => {
                if (autoSaveIntervalRef.current) {
                    clearInterval(autoSaveIntervalRef.current);
                }
            };
        }
    }, [isSessionStarted, transcript, patient]);

    // Check session validity every 2 minutes
    useEffect(() => {
        if (isSessionStarted && user) {
            sessionCheckIntervalRef.current = setInterval(async () => {
                const isValid = await isSessionValid();
                if (!isValid) {
                    setSessionExpired(true);
                    if (sessionCheckIntervalRef.current) {
                        clearInterval(sessionCheckIntervalRef.current);
                    }
                }
            }, 120000); // Check every 2 minutes

            return () => {
                if (sessionCheckIntervalRef.current) {
                    clearInterval(sessionCheckIntervalRef.current);
                }
            };
        }
    }, [isSessionStarted, user]);

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

    /**
     * Get patient response from Edge Function
     */
    const getPatientResponseFromEdgeFunction = useCallback(async (message: string): Promise<string> => {
        // Check session validity before making request
        const authToken = await getValidAuthToken();
        if (!authToken) {
            setSessionExpired(true);
            throw new Error('Your session has expired. Please refresh the page and log in again.');
        }

        // Get Supabase URL and construct Edge Function URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            throw new Error('Supabase URL not configured');
        }

        const functionsUrl = `${supabaseUrl}/functions/v1/patient-response`;

        // Require authentication
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Please check your environment variables.');
        }

        if (!user) {
            throw new Error('You must be logged in to chat with the patient. Please log in and try again.');
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
                message,
            }),
        });

        // Handle errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.error || `Failed to get patient response (${response.status})`;

            // Map HTTP status codes to user-friendly messages
            if (response.status === 401) {
                throw new Error('Your session has expired. Please refresh the page and try again.');
            } else if (response.status === 429) {
                throw new Error('AI service is busy. Please try again in a moment.');
            } else if (response.status === 504) {
                throw new Error('Patient response timed out. Please try again.');
            } else if (response.status === 500) {
                throw new Error('AI service error. Please try again later.');
            } else {
                throw new Error(errorMessage);
            }
        }

        // Parse and return response
        const data = await response.json();
        return data.response as string;
    }, [transcript, patient, user]);

    const handleSendMessage = useCallback(async (text: string, isRetry = false) => {
        // Clear any previous send error
        setSendError(null);
        setLastFailedMessage(null);

        if (!text.trim()) return;

        if (isPatientTyping) {
            setSendError('Please wait for the patient to respond.');
            return;
        }

        // Only add user message if not a retry (retry means we already have the message)
        if (!isRetry) {
            const newUserMessage: ChatMessage = { author: 'user', text };
            setTranscript(prev => [...prev, newUserMessage]);
        }
        setIsPatientTyping(true);

        try {
            // Get patient response from Edge Function
            const patientResponse = await getPatientResponseFromEdgeFunction(text);
            const newPatientMessage: ChatMessage = { author: 'patient', text: patientResponse };
            setTranscript(prev => [...prev, newPatientMessage]);
            
            // Auto-save after successful response
            autoSaveSession({
                transcript: [...transcript, { author: 'user', text }, { author: 'patient', text: patientResponse }],
                patient,
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error('[PracticeView] Failed to get patient response:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to get patient response.';
            
            // Check if it's a network error
            const isNetworkError = errorMessage.includes('Failed to fetch') || 
                                   errorMessage.includes('NetworkError') || 
                                   errorMessage.includes('network');
            
            if (isNetworkError) {
                setSendError('Network connection lost. Check your connection and tap Retry.');
            } else {
                setSendError(errorMessage);
            }
            
            // Store the failed message for retry
            setLastFailedMessage(text);
            
            // Auto-save transcript on error (don't add fallback message, let user retry)
            autoSaveSession({
                transcript: [...transcript, { author: 'user', text }],
                patient,
                timestamp: Date.now(),
            });
        } finally {
            setIsPatientTyping(false);
        }
    }, [getPatientResponseFromEdgeFunction, isPatientTyping, transcript, patient]);

    const handleRetryLastMessage = useCallback(() => {
        if (lastFailedMessage) {
            handleSendMessage(lastFailedMessage, true);
        }
    }, [lastFailedMessage, handleSendMessage]);
    
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
        const transcriptToSend = speechTranscript;
        handleSendMessage(transcriptToSend);
        setSpeechTranscript('');
    };

    /**
     * Call the analyze-session Edge Function to get feedback
     */
    const getFeedbackFromEdgeFunction = useCallback(async (): Promise<Feedback> => {
        // Check session validity before making request
        const authToken = await getValidAuthToken();
        if (!authToken) {
            setSessionExpired(true);
            throw new Error('Your session has expired. Please refresh the page and log in again.');
        }

        // Get Supabase URL and construct Edge Function URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            throw new Error('Supabase URL not configured');
        }

        const functionsUrl = `${supabaseUrl}/functions/v1/analyze-session`;

        // Require authentication
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase is not configured. Please check your environment variables.');
        }

        if (!user) {
            throw new Error('You must be logged in to generate feedback. Please log in and try again.');
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
        
        // Show success toast immediately
        showToast('Session complete! Generating your feedback...', 'success');

        // Clear auto-save on successful completion
        clearAutoSavedSessions();

        try {
            const feedback = await getFeedbackFromEdgeFunction();
            setIsEndingSession(false);
            onFinish(transcript, feedback);
        } catch (error) {
            console.error('[PracticeView] Failed to get feedback:', error);
            setIsEndingSession(false);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback. Please try again.';
            setFeedbackError(errorMessage);
            
            // If session expired, auto-save before showing error
            if (errorMessage.includes('session has expired')) {
                autoSaveSession({
                    transcript,
                    patient,
                    timestamp: Date.now(),
                });
            }
        }
    }, [transcript, getFeedbackFromEdgeFunction, onFinish, patient, showToast]);

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
            <ToastContainer toasts={toasts} onRemove={removeToast} />
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
                        className={`px-4 min-h-[var(--touch-target-min)] text-white font-semibold border-2 border-black disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
                            isEndingSession 
                                ? 'bg-red-600' 
                                : 'bg-red-500 hover:bg-red-600'
                        }`}
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
                {sessionExpired && (
                    <Card variant="accent" padding="sm" className="mb-3 border-l-4 border-[var(--color-error)]">
                        <div className="flex flex-col gap-2" role="alert">
                            <div className="flex items-center gap-2 text-[var(--color-error)] text-sm font-semibold">
                                <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
                                <span>Your session has expired</span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                Your practice session has been saved. Please refresh the page and log in again to continue.
                            </p>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => window.location.reload()}
                                className="mt-2"
                            >
                                Refresh & Log In
                            </Button>
                        </div>
                    </Card>
                )}
                {(micError || sendError) && !sessionExpired && (
                    <Card variant="accent" padding="sm" className="mb-3 border-l-4 border-[var(--color-error)]">
                        <div className="flex items-start justify-between gap-2" role="alert">
                            <div className="flex items-start gap-2 text-[var(--color-error)] text-sm flex-1">
                                <i className="fa fa-exclamation-circle mt-0.5" aria-hidden="true"></i>
                                <span>{micError || sendError}</span>
                            </div>
                            {sendError && lastFailedMessage && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleRetryLastMessage}
                                    disabled={isPatientTyping}
                                    icon={<i className="fa-solid fa-redo" aria-hidden="true"></i>}
                                >
                                    Retry
                                </Button>
                            )}
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
                            onFocus={() => {
                                // Scroll textarea into view when mobile keyboard opens
                                setTimeout(() => {
                                    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 300);
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
                                className={`w-[var(--touch-target-min)]...`}
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
                        disabled={isPatientTyping || !speechTranscript.trim()}
                        className="w-[var(--touch-target-min)] h-[var(--touch-target-min)] flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-text-primary)] border-2 border-black hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-neutral-300)] disabled:text-[var(--color-neutral-500)] disabled:border-[var(--color-neutral-400)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                        aria-label="Send message"
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