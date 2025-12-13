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
    const processedFinalTextsRef = useRef<Set<string>>(new Set()); // Track processed final texts to prevent duplicates
    const userExplicitlyStoppedRef = useRef(false); // Track if user explicitly stopped


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
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            // If stop was triggered, ignore any lingering results to prevent race conditions
            if (stopTriggeredRef.current) {
                return;
            }

            // Process results starting from resultIndex (API tells us where new results start)
            // Don't try to detect restarts - just process what the API gives us
            // The API naturally cycles resultIndex (0->1->2->0) as it refines results
            
            // Build interim transcript from ONLY the latest interim results in this event
            // Don't accumulate - rebuild from scratch each time
            let newInterimTranscript = '';
            let hasNewFinal = false;

            // Process results from resultIndex to end of results array
            // The API's resultIndex tells us where new results start, so we trust it
            const startIndex = event.resultIndex;
            
            for (let i = startIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                if (result.isFinal) {
                    // Only append final results - these are confirmed transcriptions
                    let final_text = result[0].transcript.trim();
                    if (final_text) {
                        // Prevent duplicate final results by tracking processed texts
                        // This handles cases where the same audio gets transcribed multiple times
                        // Use a normalized key (lowercase, trimmed) to catch duplicates
                        const normalizedText = final_text.toLowerCase();
                        
                        // Also check if this text already exists at the end of the current transcript
                        const currentTranscriptLower = finalTranscriptRef.current.toLowerCase();
                        const textAlreadyAtEnd = currentTranscriptLower.endsWith(normalizedText) || 
                                                 currentTranscriptLower.endsWith(' ' + normalizedText);
                        
                        if (!processedFinalTextsRef.current.has(normalizedText) && !textAlreadyAtEnd) {
                            // Mark as processed BEFORE adding to prevent race conditions
                            processedFinalTextsRef.current.add(normalizedText);
                            
                            // Add to final transcript
                            const textToAdd = finalTranscriptRef.current ? ' ' + final_text : final_text;
                            finalTranscriptRef.current += textToAdd;
                            // Sync with persisted transcript
                            persistedTranscript = finalTranscriptRef.current;
                            hasNewFinal = true;
                            
                            // Clear interim when we get final results (they're now part of final)
                            newInterimTranscript = '';
                        }
                    }
                } else {
                    // Build interim transcript from ONLY interim results in current event
                    // Don't accumulate - each event rebuilds interim from scratch
                    // Only include interim results from the current processing range
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
                } else {
                    // Update interim transcript (this replaces previous interim, doesn't append)
                    // Only show interim if we don't have new final results
                    setInterimTranscript(newInterimTranscript.trim());
                }
            }
        };

        recognition.onend = () => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
                return;
            }

            setIsListening(false);
            stopTriggeredRef.current = false;
            // On end, clear any interim results and ensure we only show final transcript
            // This cleans up any lingering interim results if recognition ends abruptly
            setInterimTranscript('');
            
            // If user explicitly stopped (sent a message), clear the ref for fresh start
            // Otherwise, preserve the transcript (natural end or error recovery)
            if (userExplicitlyStoppedRef.current) {
                finalTranscriptRef.current = '';
                persistedTranscript = '';
                setFinalTranscript('');
                userExplicitlyStoppedRef.current = false; // Reset flag
            } else {
                // Sync persisted transcript before updating state (preserve for natural end)
                persistedTranscript = finalTranscriptRef.current;
                setFinalTranscript(finalTranscriptRef.current);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Check if component is still mounted
            if (!isMountedRef.current) {
                return;
            }
            
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            stopTriggeredRef.current = false; // Reset on error too
            userExplicitlyStoppedRef.current = false; // Reset on error
            // Clear interim on error
            setInterimTranscript('');
            // Clear processed texts tracking on error
            // processedFinalTextsRef.current.clear(); // Removed - keep history across restarts

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
            setError(errorMessage);

            // Clear error after 5 seconds (only if still mounted)
            setTimeout(() => {
                if (isMountedRef.current) {
                    setError(null);
                }
            }, 5000);
        };

        recognitionRef.current = recognition;

        return () => {
            // Mark component as unmounted
            isMountedRef.current = false;

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
            // DO NOT clear finalTranscriptRef.current - it will be lost on React Strict Mode remounts
            // finalTranscriptRef.current = ''; // Commented out - preserve transcript across remounts
            stopTriggeredRef.current = false;
            // processedFinalTextsRef.current.clear(); // Removed - keep history across restarts
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
            stopTriggeredRef.current = false; // Ensure we are ready for new results
            // DON'T reset userExplicitlyStoppedRef here - preserve it until onend fires
            // This flag is used in onend to determine if we should clear the transcript
            setError(null); // Clear any previous errors
            
            // Clear interim when starting new session
            setInterimTranscript('');
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
        // DON'T set userExplicitlyStoppedRef here - user might just be pausing to review/edit
        // Only set it when the user actually sends the message (in customSetTranscript when clearing)
        
        if (recognitionRef.current && isListening) {
            stopTriggeredRef.current = true; // Signal to ignore subsequent results
            recognitionRef.current.stop();
            setIsListening(false);
            // Clear interim when stopping
            setInterimTranscript('');
            // Clear processed texts tracking when stopping
            // processedFinalTextsRef.current.clear(); // Removed - keep history across restarts
            
            // Sync React state with ref immediately to ensure UI shows transcript
            // This prevents the transcript from disappearing if onend fires later
            setFinalTranscript(finalTranscriptRef.current);
            
            // DON'T clear the ref - preserve transcript so user can review/edit before sending
        }
    };

    // This function allows components to reset the transcript and ensures the ref is also cleared.
    const customSetTranscript = useCallback((text: string) => {
        if (!isMountedRef.current) {
            return;
        }

        // If text is empty, this means user sent the message - clear everything for fresh start
        // Clear ref immediately to prevent race condition if user starts listening again before onend fires
        if (text === '') {
            // Mark that user sent message (so onend doesn't restore transcript)
            userExplicitlyStoppedRef.current = true;
            // Clear ref immediately to prevent race condition
            // If user starts listening again before onend fires, ref will be empty
            finalTranscriptRef.current = '';
            persistedTranscript = '';
            // Clear React state immediately so UI clears right away
            setFinalTranscript('');
            setInterimTranscript('');
            return;
        }

        // Non-empty text: full reset (for explicit transcript setting)
        userExplicitlyStoppedRef.current = true; // Mark as explicitly stopped when transcript is manually set
        
        finalTranscriptRef.current = text;
        // Sync with persisted transcript
        persistedTranscript = text;
        setFinalTranscript(text);
        setInterimTranscript('');
        // Clear processed texts tracking when manually setting transcript
        // processedFinalTextsRef.current.clear(); // Removed - keep history across restarts
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
