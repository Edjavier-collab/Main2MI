'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send } from 'lucide-react';
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

// Mood indicator configuration
const MOOD_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    guarded: { icon: 'fa-shield', color: 'text-amber-600', label: 'Guarded' },
    resistant: { icon: 'fa-hand', color: 'text-red-500', label: 'Resistant' },
    ambivalent: { icon: 'fa-scale-balanced', color: 'text-yellow-600', label: 'Ambivalent' },
    vulnerable: { icon: 'fa-heart-crack', color: 'text-purple-500', label: 'Vulnerable' },
    frustrated: { icon: 'fa-face-frown', color: 'text-orange-500', label: 'Frustrated' },
    hopeful: { icon: 'fa-sun', color: 'text-emerald-500', label: 'Hopeful' },
    engaged: { icon: 'fa-comments', color: 'text-sky-500', label: 'Engaged' },
    withdrawn: { icon: 'fa-user-slash', color: 'text-gray-500', label: 'Withdrawn' },
    reflective: { icon: 'fa-lightbulb', color: 'text-indigo-500', label: 'Reflective' },
    relieved: { icon: 'fa-face-smile-beam', color: 'text-green-500', label: 'Relieved' },
};

const MoodIndicator: React.FC<{ mood: string | null }> = ({ mood }) => {
    if (!mood) return null;

    const config = MOOD_CONFIG[mood.toLowerCase()] || { icon: 'fa-circle', color: 'text-gray-400', label: mood };

    return (
        <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 border border-neutral-200/50 text-xs font-medium ${config.color} transition-all duration-300 animate-fade-in`}
            title={`Patient mood: ${config.label}`}
        >
            <i className={`fa-solid ${config.icon} text-[10px]`} aria-hidden="true" />
            <span className="capitalize">{config.label}</span>
        </div>
    );
};

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
    const [patientMood, setPatientMood] = useState<string | null>(null);

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
     * Get patient response from local Next.js API route
     * Falls back to Edge Function if local API fails
     * Returns both the response text and patient mood
     */
    const getPatientResponse = useCallback(async (message: string): Promise<{ response: string; mood?: string }> => {
        // Try local Next.js API first (works without Supabase)
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    patient,
                    transcript,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const errorMessage = errorData.error || `Failed to get patient response (${response.status})`;

                // Map HTTP status codes to user-friendly messages
                if (response.status === 429) {
                    throw new Error('AI service is busy. Please try again in a moment.');
                } else if (response.status === 500) {
                    throw new Error(errorMessage);
                } else {
                    throw new Error(errorMessage);
                }
            }

            const data = await response.json();
            return { response: data.response as string, mood: data.mood as string | undefined };
        } catch (error) {
            // If the error is from our API (not a network error), rethrow it
            if (error instanceof Error && !error.message.includes('Failed to fetch')) {
                throw error;
            }

            // Network error - try Edge Function fallback if Supabase is configured
            console.warn('[PracticeView] Local API failed, trying Edge Function fallback');

            if (!isSupabaseConfigured() || !user) {
                throw new Error('Unable to connect to AI service. Please check your connection and try again.');
            }

            // Fall back to Edge Function
            const supabase = getSupabaseClient();
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const { data: invokeData, error: invokeError } = await supabase.functions.invoke('patient-response', {
                body: {
                    transcript,
                    patient,
                    message,
                },
                headers: authSession?.access_token ? {
                    Authorization: `Bearer ${authSession.access_token}`
                } : undefined
            });

            if (invokeError) {
                console.error('[PracticeView] Edge Function error:', invokeError);
                const errorMessage = invokeError.message || 'Failed to get patient response';

                if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                    throw new Error('Your session has expired. Please refresh the page and try again.');
                } else if (errorMessage.includes('429')) {
                    throw new Error('AI service is busy. Please try again in a moment.');
                } else if (errorMessage.includes('504')) {
                    throw new Error('Patient response timed out. Please try again.');
                } else {
                    throw new Error(errorMessage);
                }
            }

            return { response: invokeData.response as string, mood: invokeData.mood as string | undefined };
        }
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
            // Get patient response from local API (falls back to Edge Function)
            const { response: patientResponse, mood } = await getPatientResponse(text);
            const newPatientMessage: ChatMessage = { author: 'patient', text: patientResponse };
            setTranscript(prev => [...prev, newPatientMessage]);

            // Update patient mood if returned
            if (mood) {
                setPatientMood(mood);
            }

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
            setSpeechTranscript(''); // Clear input after sending
            setIsPatientTyping(false);
        }
    }, [getPatientResponse, isPatientTyping, transcript, patient, setSpeechTranscript]);

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
     *
     * Uses dual-run wrapper for Strangler Fig migration:
     * - Calls both legacy and v2 functions in parallel
     * - Compares outputs and tracks semantic-equal matches
     * - Returns legacy output (for now) while monitoring drift
     */
    const getFeedbackFromEdgeFunction = useCallback(async (sessionId: string): Promise<Feedback> => {
        // Check if Supabase is configured before trying to use it
        if (!isSupabaseConfigured()) {
            throw new Error('Feedback analysis requires Supabase to be configured. Please set up your environment variables.');
        }

        const supabase = getSupabaseClient();

        // Use sessionId if available (preferred)
        const payload = {
            sessionId,
            transcript,
            patient
        };

        // Get the current session token - use getSession() which reads from storage
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('[PracticeView] Session error:', sessionError);
            throw new Error('Failed to get session. Please refresh and try again.');
        }

        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
            console.error('[PracticeView] No access token available - user may need to re-login');
            throw new Error('Your session has expired. Please refresh the page and log in again.');
        }

        console.log('[PracticeView] Calling analyze-session with token length:', accessToken.length);

        // Explicitly pass the Authorization header since SSR client may not auto-include it
        const { data, error } = await supabase.functions.invoke('analyze-session', {
            body: payload,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (error) {
            console.error('[PracticeView] Edge Function error:', error);
            const errorMessage = error.message || 'Failed to analyze session';

            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                throw new Error('Your session has expired. Please refresh the page and try again.');
            } else if (errorMessage.includes('429')) {
                throw new Error('AI service is busy. Please try again in a moment.');
            } else if (errorMessage.includes('504')) {
                throw new Error('Analysis timed out. Please try again.');
            } else {
                throw new Error(errorMessage);
            }
        }

        return data as Feedback;
    }, [transcript, patient]);

    const handleEndSession = useCallback(async () => {
        setIsEndingSession(true);
        setFeedbackError(null);

        // Show success toast immediately
        showToast('Session complete! Generating your feedback...', 'success');

        // Clear auto-save on successful completion
        clearAutoSavedSessions();

        try {
            // 1. Save session first to get a sessionId
            let sessionId = '';
            if (user && isSupabaseConfigured()) {
                const sessionToSave = {
                    transcript,
                    patient,
                    timestamp: Date.now(),
                    userTier
                };

                try {
                    const { saveSession } = await import('../../services/databaseService');
                    sessionId = await saveSession(sessionToSave as any, user.id);
                    console.log('[PracticeView] Session saved with ID:', sessionId);
                } catch (saveError) {
                    console.warn('[PracticeView] Failed to save session before analysis. Continuing with ephemeral data.', saveError);
                    showToast('Note: Progress saving failed, but analysis will continue.', 'warning');
                    // Continue anyway, Edge Function can fall back to body transcript
                }
            }

            // 2. Get feedback (using sessionId for analysis)
            const feedback = await getFeedbackFromEdgeFunction(sessionId);
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
    }, [transcript, getFeedbackFromEdgeFunction, onFinish, patient, showToast, user, userTier]);

    const handleRetryFeedback = useCallback(async () => {
        setIsRetryingFeedback(true);
        setFeedbackError(null);

        try {
            // For retry, we don't have the sessionId easily available here unless we store it
            // So we'll pass an empty string and the Edge Function will use the body
            const feedback = await getFeedbackFromEdgeFunction('');
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

            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-bg-accent)] bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-200">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)] truncate">
                            Practice Session
                        </h3>
                        <MoodIndicator mood={patientMood} />
                    </div>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]" aria-hidden="true" />
                        Live with {patient.name}
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="bg-[var(--color-bg-accent)] px-3 py-1.5 rounded-[var(--radius-md)] border border-transparent hover:border-[var(--color-primary-light)] transition-colors">
                        <Timer initialSeconds={sessionDuration} onTimeUp={handleEndSession} />
                    </div>
                    <Button
                        onClick={handleEndSession}
                        disabled={isEndingSession}
                        variant="danger"
                        size="sm"
                        loading={isEndingSession}
                        className="shadow-sm"
                    >
                        {isEndingSession ? 'Ending...' : 'End Session'}
                    </Button>
                </div>
            </header>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 bg-[var(--color-bg-main)] scroll-smooth relative">
                {/* Background Pattern/Texture if desired, otherwise plain */}

                <div className="max-w-3xl mx-auto space-y-6">
                    {transcript.length === 0 && !isPatientTyping && (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--color-text-muted)] animate-slide-fade-in">
                            <div className="w-16 h-16 bg-[var(--color-bg-accent)] rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-105">
                                <i className="fa-solid fa-comments text-2xl opacity-40 text-[var(--color-primary)]" aria-hidden="true"></i>
                            </div>
                            <h4 className="font-medium text-[var(--color-text-primary)] mb-1">Start the conversation</h4>
                            <p className="text-xs text-[var(--color-text-secondary)]">Say "Hi {patient.name}, how are you doing today?"</p>
                        </div>
                    )}
                    {transcript.map((msg, index) => (
                        <ChatBubble key={index} message={msg} />
                    ))}
                    {isPatientTyping && (
                        <div className="animate-slide-fade-in pt-2">
                            {/* Passing a dummy message since we are just showing the typing indicator */}
                            <ChatBubble message={{ author: 'patient', text: '...' }} isTyping={true} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 border-t border-[var(--color-bg-accent)] bg-white/90 backdrop-blur-md sticky bottom-0 z-20">
                <div className="max-w-3xl mx-auto w-full">

                    {/* Screen reader announcement for voice recording status */}
                    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                        {isListening ? 'Recording started. Speak now.' : ''}
                    </div>

                    {sessionExpired && (
                        <div className="mb-4 animate-slide-fade-in">
                            <Card variant="soft-accent" padding="sm" className="border-l-4 border-[var(--color-error)]">
                                <div className="flex flex-col gap-2" role="alert">
                                    <div className="flex items-center gap-2 text-[var(--color-error)] text-sm font-bold">
                                        <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
                                        <span>Session Expired</span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-secondary)]">
                                        Your progress is saved. Please refresh to continue.
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => window.location.reload()}
                                        className="mt-1 w-fit"
                                    >
                                        Refresh & Log In
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {(micError || sendError) && !sessionExpired && (
                        <div className="mb-4 animate-slide-fade-in">
                            <Card variant="soft-accent" padding="sm" className="border-l-4 border-[var(--color-error)]">
                                <div className="flex items-start justify-between gap-3" role="alert">
                                    <div className="flex items-start gap-2 text-[var(--color-error)] text-sm flex-1 font-medium">
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
                        </div>
                    )}

                    <div className="flex items-end gap-3">
                        <div className="flex-1 flex flex-col relative transition-all duration-200">
                            <div className={`relative flex items-end bg-[var(--color-bg-main)] border rounded-[var(--radius-lg)] transition-all duration-200 ${isListening ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : 'border-neutral-200 hover:border-neutral-300 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 shadow-sm'}`}>

                                {isListening && (
                                    <div className="absolute left-3 bottom-3 z-10 pointer-events-none">
                                        <SpeechVisualizer />
                                    </div>
                                )}

                                <textarea
                                    ref={textareaRef}
                                    value={speechTranscript}
                                    onChange={(e) => setSpeechTranscript(e.target.value)}
                                    placeholder={isListening ? "        Listening..." : "Type your response..."}
                                    className={`flex-1 p-3.5 bg-transparent border-none focus:outline-none resize-none w-full max-h-48 overflow-y-auto text-base text-[var(--color-text-primary)] leading-relaxed rounded-[var(--radius-lg)] placeholder:text-[var(--color-text-light)] ${isListening ? 'pl-16 font-medium text-[var(--color-primary-dark)]' : ''}`}
                                    rows={1}
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
                                />

                                <div className="p-2 flex-shrink-0">
                                    <Button
                                        onClick={handleVoiceSend}
                                        disabled={isPatientTyping}
                                        variant={isListening ? "danger" : "ghost"}
                                        size="icon-only"
                                        shape="pill"
                                        className={`transition-all duration-200 ${isListening ? 'animate-pulse shadow-md' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]'}`}
                                        aria-label={isListening ? 'Stop recording' : 'Start recording'}
                                        title={isListening ? 'Stop recording' : 'Start recording'}
                                    >
                                        <Mic size={20} className={isListening ? "text-white" : ""} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleTextSend}
                            disabled={isPatientTyping || !speechTranscript.trim()}
                            variant="primary"
                            size="icon-only"
                            shape="default"
                            className="h-[52px] w-[52px] !rounded-[var(--radius-lg)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0"
                            aria-label="Send message"
                        >
                            <Send size={22} className={!speechTranscript.trim() ? "opacity-70" : ""} />
                        </Button>
                    </div>
                    <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-2.5 font-medium opacity-60">
                        Press Enter to send • Shift + Enter for new line • Server connection secured
                    </p>
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
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 animate-fade-in">
                    <Card variant="soft" padding="lg" className="max-w-md w-full shadow-xl">
                        <div className="text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                    <i className="fa-solid fa-triangle-exclamation text-3xl text-[var(--color-error)]" aria-hidden="true"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                                Analysis Failed
                            </h3>
                            <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
                                {feedbackError}
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleRetryFeedback}
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    loading={isRetryingFeedback}
                                    icon={<i className="fa-solid fa-rotate" aria-hidden="true"></i>}
                                >
                                    Retry Analysis
                                </Button>
                                <Button
                                    onClick={() => {
                                        const fallbackFeedback: Feedback = {
                                            empathyScore: 0,
                                            empathyBreakdown: 'Feedback generation failed.',
                                            whatWentRight: 'Practice session completed.',
                                            areasForGrowth: 'Feedback unavailable.',
                                            skillsDetected: [],
                                            skillCounts: {},
                                            nextFocus: 'Continue practicing.',
                                            analysisStatus: 'error',
                                            analysisMessage: feedbackError,
                                        };
                                        setFeedbackError(null);
                                        onFinish(transcript, fallbackFeedback);
                                    }}
                                    variant="ghost"
                                    size="md"
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