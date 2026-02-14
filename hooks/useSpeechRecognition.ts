import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Cast window to any to access non-standard SpeechRecognition APIs and rename the variable to avoid type name collision.
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Define event types for better type safety, as they are not standard on the SpeechRecognition object type.
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

// Fix: Add an interface for the non-standard SpeechRecognition object to resolve the type error.
interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    start: () => void;
    stop: () => void;
}

// Module-level variable to persist transcript across React Strict Mode remounts
let persistedTranscript = '';

// Mobile detection function
const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState(''); // Only FINAL confirmed text
    const [interimTranscript, setInterimTranscript] = useState(''); // Live preview of interim results
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true); // Track if component is mounted
    // Fix: The type SpeechRecognition is now correctly resolved via the interface definition above.
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef(persistedTranscript); // Ref to hold only the FINAL transcript text, initialized from persisted value
    const stopTriggeredRef = useRef(false); // Flag to ignore late-coming results after stop is called
    const userExplicitlyStoppedRef = useRef(false); // Track if user explicitly stopped
    const stateSyncedInStopRef = useRef(false); // Track if state was synced in stopListening() to prevent onend from overwriting
    const interimTranscriptRef = useRef(''); // Mirror interim transcript in a ref (avoids stale state in stop/onend)


    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const SILENCE_TIMEOUT_MS = 5000; // 5 seconds of silence on desktop before committing text (but keeping mic open)

    useEffect(() => {
        // Reset mounted state on mount
        isMountedRef.current = true;

        // Restore transcript from persisted value (survives React Strict Mode remounts)
        finalTranscriptRef.current = persistedTranscript;
        setFinalTranscript(persistedTranscript);

        if (!SpeechRecognitionAPI) {
            const errorMsg = "Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.";
            console.error(errorMsg);
            setError(errorMsg);
            return;
        }

        // Check if we're in a secure context (required for Speech Recognition API)
        // Secure context is required by the Speech Recognition API - this includes:
        // 1. HTTPS connections
        // 2. localhost or 127.0.0.1 (development)
        // 3. Explicitly secure contexts as defined by window.isSecureContext
        const isSecureContext = window.isSecureContext ||
            window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (!isSecureContext) {
            const errorMsg = "Speech Recognition requires a secure context (HTTPS or localhost). Please access this app via HTTPS or localhost.";
            console.error(errorMsg);
            setError(errorMsg);
            return;
        }

        const recognition: SpeechRecognition = new SpeechRecognitionAPI();
        const isMobile = isMobileDevice();
        recognition.continuous = !isMobile; // continuous on desktop, single-utterance on mobile
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            // Clear any existing silence timer when we hear speech
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            // Build interim transcript from ONLY the latest interim results in this event
            // Don't accumulate - rebuild from scratch each time
            let newInterimTranscript = '';
            let hasNewFinal = false;

            // Process results from resultIndex to end of results array
            const startIndex = event.resultIndex;

            for (let i = startIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                if (result.isFinal) {
                    const final_text = result[0].transcript.trim();
                    if (final_text) {
                        // Simply append final results to the transcript
                        const textToAdd = finalTranscriptRef.current ? ' ' + final_text : final_text;
                        finalTranscriptRef.current += textToAdd;
                        persistedTranscript = finalTranscriptRef.current;
                        hasNewFinal = true;
                        newInterimTranscript = '';
                        interimTranscriptRef.current = '';
                    }
                } else {
                    // After stop is pressed, ignore late interim updates
                    if (stopTriggeredRef.current) {
                        continue;
                    }
                    // Build interim transcript from ONLY interim results in current event
                    if (i >= startIndex) {
                        newInterimTranscript += result[0].transcript;
                    }
                }
            }

            // Update final transcript state only if we got new final results
            // Check if component is still mounted before updating state
            if (isMountedRef.current) {
                if (hasNewFinal) {
                    setFinalTranscript(finalTranscriptRef.current);
                    // Always clear interim when we get final results
                    setInterimTranscript('');
                    interimTranscriptRef.current = '';
                } else {
                    // Update interim transcript (this replaces previous interim, doesn't append)
                    const nextInterim = newInterimTranscript.trim();
                    setInterimTranscript(nextInterim);
                    interimTranscriptRef.current = nextInterim;

                    // On Desktop: Set a silence timer to commit interim as final if user stops speaking but mic stays open
                    if (!isMobile && nextInterim) {
                        silenceTimerRef.current = setTimeout(() => {
                            if (interimTranscriptRef.current) {
                                // Commit current interim to final
                                const textToAdd = finalTranscriptRef.current ? ' ' + interimTranscriptRef.current : interimTranscriptRef.current;
                                finalTranscriptRef.current = textToAdd;
                                persistedTranscript = finalTranscriptRef.current;

                                // Update state
                                if (isMountedRef.current) {
                                    setFinalTranscript(finalTranscriptRef.current);
                                    setInterimTranscript('');
                                    interimTranscriptRef.current = '';
                                }
                            }
                        }, SILENCE_TIMEOUT_MS);
                    }
                }
            }
        };

        recognition.onend = () => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
                return;
            }

            // If user explicitly stopped, we're done
            if (userExplicitlyStoppedRef.current) {
                setIsListening(false);
                stopTriggeredRef.current = false;

                // If we never received a final result, preserve whatever interim we had at stop time
                if (!finalTranscriptRef.current && interimTranscriptRef.current.trim()) {
                    finalTranscriptRef.current = interimTranscriptRef.current.trim();
                    persistedTranscript = finalTranscriptRef.current;
                    setFinalTranscript(() => finalTranscriptRef.current);
                }
                // Clear interim at end
                setInterimTranscript('');
                interimTranscriptRef.current = '';

                // Always preserve the transcript in onend
                persistedTranscript = finalTranscriptRef.current;
                setFinalTranscript(() => finalTranscriptRef.current);
                stateSyncedInStopRef.current = false;
                userExplicitlyStoppedRef.current = false;
                return;
            }

            // If NOT explicitly stopped (cutoff happening):

            // On Mobile: Auto-restart to simulate continuous listening
            if (isMobile) {
                // Determine if we should restart immediately
                // We restart if we weren't stopped explicitly
                setTimeout(() => {
                    if (isMountedRef.current && !userExplicitlyStoppedRef.current && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            // Ignore restart errors
                        }
                    }
                }, 500); // 500ms delay before restart
            } else {
                // On Desktop: Just update state, but usually continuous mode keeps it open
                // If it closed unexpectedly on desktop, we let it close to avoid infinite loops if permission revoked
                setIsListening(false);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Check if component is still mounted
            if (!isMountedRef.current) {
                return;
            }

            // If we are on mobile and get 'no-speech' or 'aborted', we might want to just restart silently
            // instead of showing error, to keep the "continuous" feel
            if (isMobile && (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network')) {
                // Don't set error, just let onend handle the restart
                return;
            }

            console.error('Speech recognition error', event.error);
            setIsListening(false);
            stopTriggeredRef.current = false;
            // Only set explicitly stopped if it's a fatal error, otherwise let onend retry if mobile
            if (event.error === 'not-allowed' || event.error === 'audio-capture') {
                userExplicitlyStoppedRef.current = true;
            }

            setInterimTranscript('');

            // Provide user-friendly error messages
            let errorMessage = 'Microphone error occurred.';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Microphone not found or access denied. Please check your microphone permissions.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your internet connection.';
                    break;
                case 'aborted':
                    // User stopped, not really an error
                    return;
                default:
                    errorMessage = `Speech recognition error: ${event.error}`;
            }

            // On mobile, suppress some errors to avoid UI flicker during auto-restart
            if (!isMobile) {
                setError(errorMessage);
                // Clear error after 5 seconds (only if still mounted)
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setError(null);
                    }
                }, 5000);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            // Mark component as unmounted
            isMountedRef.current = false;

            // Clear silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }

            // Remove all event listeners by stopping recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    // Ignore errors when stopping (may already be stopped)
                }
                // Clear the ref
                recognitionRef.current = null;
            }

            // Reset refs (but preserve transcript refs to survive React Strict Mode remounts)
            stopTriggeredRef.current = false;
            userExplicitlyStoppedRef.current = false;
        };
    }, []);

    const startListening = () => {
        if (!isMountedRef.current) {
            return;
        }

        if (!recognitionRef.current) {
            setError('Speech recognition not initialized. Please refresh the page.');
            return;
        }

        if (isListening) {
            return; // Already listening
        }

        try {
            stopTriggeredRef.current = false;
            userExplicitlyStoppedRef.current = false;
            stateSyncedInStopRef.current = false;
            setError(null);

            // Clear interim when starting new session
            setInterimTranscript('');
            interimTranscriptRef.current = '';
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            if (isMountedRef.current) {
                setError('Failed to start microphone. Please check your browser permissions.');
                setIsListening(false);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            stopTriggeredRef.current = true;
            userExplicitlyStoppedRef.current = true; // MARK EXPLICIT STOP

            // Clear silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            recognitionRef.current.stop();
            setIsListening(false);
            // Preserve whatever interim we have by promoting it to final if we don't have a final yet
            const interimAtStop = interimTranscriptRef.current.trim();
            if (!finalTranscriptRef.current && interimAtStop) {
                finalTranscriptRef.current = interimAtStop;
                persistedTranscript = finalTranscriptRef.current;
                setFinalTranscript(() => finalTranscriptRef.current);
            }
            // Clear interim when stopping
            setInterimTranscript('');
            interimTranscriptRef.current = '';

            // Sync React state with ref immediately
            setFinalTranscript(() => finalTranscriptRef.current);
            stateSyncedInStopRef.current = true;
        }
    };

    // This function allows components to reset the transcript and ensures the ref is also cleared.
    const customSetTranscript = useCallback((text: string) => {
        if (!isMountedRef.current) {
            return;
        }

        // If text is empty, this means user sent the message - clear everything for fresh start
        if (text === '') {
            userExplicitlyStoppedRef.current = true;
            finalTranscriptRef.current = '';
            persistedTranscript = '';
            setFinalTranscript('');
            setInterimTranscript('');
            interimTranscriptRef.current = '';
            return;
        }

        // Non-empty text: full reset (for explicit transcript setting)
        userExplicitlyStoppedRef.current = true;

        finalTranscriptRef.current = text;
        persistedTranscript = text;
        setFinalTranscript(text);
        setInterimTranscript('');
        interimTranscriptRef.current = '';
    }, []);

    // Combined transcript for backward compatibility (final + interim)
    const transcript = finalTranscript + (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');

    // Check if Speech Recognition API is supported and we're in a secure context
    const isSecureContext = window.isSecureContext ||
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
    const hasSupport = !!SpeechRecognitionAPI && isSecureContext;

    return {
        isListening,
        transcript, // Combined (backward compatibility)
        finalTranscript, // Only final confirmed text
        interimTranscript, // Live preview (temporary)
        startListening,
        stopListening,
        hasSupport,
        error,
        setTranscript: customSetTranscript
    };
};
