import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Cast window to any to access non-standard SpeechRecognition APIs and rename the variable to avoid type name collision.
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

/**
 * Detect if the current device is a mobile device
 * Mobile devices have unreliable continuous mode, so we use single utterance mode instead
 */
const isMobileDevice = (): boolean => {
    // Check user agent for mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    // Also check for touch capability and screen size
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    
    return mobileRegex.test(userAgent.toLowerCase()) || (hasTouchScreen && isSmallScreen);
};

/**
 * Remove overlapping text at the boundary between existing and new text
 * Used on mobile to prevent duplicate words when recognition re-transcribes overlapping audio
 */
function removeOverlap(existing: string, newText: string): string {
    const existingWords = existing.trim().split(/\s+/);
    const newWords = newText.trim().split(/\s+/);
    
    // Check for overlap at the boundary (last N words of existing = first N words of new)
    for (let overlap = Math.min(10, newWords.length); overlap > 0; overlap--) {
        const existingEnd = existingWords.slice(-overlap).join(' ').toLowerCase();
        const newStart = newWords.slice(0, overlap).join(' ').toLowerCase();
        if (existingEnd === newStart) {
            // Remove the overlapping portion from new text
            return newWords.slice(overlap).join(' ');
        }
    }
    return newText;
}

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

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState(''); // Only FINAL confirmed text
    const [interimTranscript, setInterimTranscript] = useState(''); // Live preview of interim results
    const [error, setError] = useState<string | null>(null);
    const [isWaitingToRestart, setIsWaitingToRestart] = useState(false); // Mobile auto-restart delay indicator
    const isMountedRef = useRef(true); // Track if component is mounted
    // Fix: The type SpeechRecognition is now correctly resolved via the interface definition above.
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef(''); // Ref to hold only the FINAL transcript text
    const stopTriggeredRef = useRef(false); // Flag to ignore late-coming results after stop is called
    const lastProcessedIndexRef = useRef<number>(-1); // Track last processed result index to prevent duplicates
    const sessionIdRef = useRef<number>(0); // Track recognition sessions to reset index tracking
    const processedFinalTextsRef = useRef<Set<string>>(new Set()); // Track processed final texts to prevent duplicates
    const isMobileRef = useRef(isMobileDevice()); // Cache mobile detection result
    const isContinuousModeRef = useRef(!isMobileRef.current); // Use continuous mode only on desktop
    const autoRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track auto-restart timeout
    const userExplicitlyStoppedRef = useRef(false); // Track if user explicitly stopped (don't auto-restart)


    useEffect(() => {
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
        // On mobile, use single utterance mode (continuous = false) to prevent duplicates
        // Mobile devices have unreliable continuous mode that causes re-transcription
        recognition.continuous = isContinuousModeRef.current;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        console.log('[useSpeechRecognition] Initialized with continuous mode:', isContinuousModeRef.current, '(mobile:', isMobileRef.current, ')');

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            // If stop was triggered, ignore any lingering results to prevent race conditions
            if (stopTriggeredRef.current) {
                return;
            }

            // On mobile (single utterance mode), each recognition session is independent
            // On desktop (continuous mode), we need to track restarts
            if (isContinuousModeRef.current) {
                // On desktop continuous mode, check if recognition restarted
                if (event.resultIndex < lastProcessedIndexRef.current) {
                    console.log('[useSpeechRecognition] Recognition restarted, resetting index tracking');
                    lastProcessedIndexRef.current = -1;
                    sessionIdRef.current += 1;
                    // Clear processed texts tracking on restart to allow same text in new session
                    processedFinalTextsRef.current.clear();
                }
            } else {
                // On mobile single utterance mode, each result event is a fresh start
                // Reset tracking for each new utterance to prevent cross-utterance duplicates
                if (event.resultIndex === 0) {
                    console.log('[useSpeechRecognition] New utterance on mobile, resetting tracking');
                    lastProcessedIndexRef.current = -1;
                    sessionIdRef.current += 1;
                    // Don't clear processed texts - we want to prevent duplicates within the same session
                }
            }

            // Build interim transcript from ONLY the latest interim results in this event
            // Don't accumulate - rebuild from scratch each time
            let newInterimTranscript = '';
            let hasNewFinal = false;

            // Process only NEW results (from resultIndex onwards, but skip already processed ones)
            const startIndex = Math.max(event.resultIndex, lastProcessedIndexRef.current + 1);
            
            for (let i = startIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                
                if (result.isFinal) {
                    // Only append final results - these are confirmed transcriptions
                    let final_text = result[0].transcript.trim();
                    if (final_text) {
                        // On mobile, remove overlapping text at the boundary to prevent duplicates
                        // This handles cases where mobile re-transcribes overlapping audio segments
                        if (!isContinuousModeRef.current && finalTranscriptRef.current) {
                            const textWithoutOverlap = removeOverlap(finalTranscriptRef.current, final_text);
                            if (textWithoutOverlap !== final_text) {
                                console.log('[useSpeechRecognition] Removed overlap on mobile:', {
                                    original: final_text,
                                    afterOverlapRemoval: textWithoutOverlap
                                });
                            }
                            final_text = textWithoutOverlap;
                        }
                        
                        // Skip if overlap removal resulted in empty text
                        if (!final_text) {
                            console.log('[useSpeechRecognition] Skipping empty text after overlap removal');
                            continue;
                        }
                        
                        // Prevent duplicate final results by tracking processed texts
                        // This handles cases where the same audio gets transcribed multiple times
                        // Use a normalized key (lowercase, trimmed) to catch duplicates
                        const normalizedText = final_text.toLowerCase();
                        
                        // Also check if this text already exists at the end of the current transcript
                        // This catches cases where mobile re-transcribes the same audio
                        const currentTranscriptLower = finalTranscriptRef.current.toLowerCase();
                        const textAlreadyAtEnd = currentTranscriptLower.endsWith(normalizedText) || 
                                                 currentTranscriptLower.endsWith(' ' + normalizedText);
                        
                        if (!processedFinalTextsRef.current.has(normalizedText) && !textAlreadyAtEnd) {
                            // Mark as processed BEFORE adding to prevent race conditions
                            processedFinalTextsRef.current.add(normalizedText);
                            
                            // Add to final transcript
                            const textToAdd = finalTranscriptRef.current ? ' ' + final_text : final_text;
                            finalTranscriptRef.current += textToAdd;
                            hasNewFinal = true;
                            
                            // Clear interim when we get final results (they're now part of final)
                            newInterimTranscript = '';
                        } else {
                            console.log('[useSpeechRecognition] Skipping duplicate final result:', final_text, {
                                inSet: processedFinalTextsRef.current.has(normalizedText),
                                atEnd: textAlreadyAtEnd
                            });
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
                
                // Update last processed index
                lastProcessedIndexRef.current = i;
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
            setFinalTranscript(finalTranscriptRef.current);
            // Reset index tracking for next session
            lastProcessedIndexRef.current = -1;
            
            // On mobile (single utterance mode), auto-restart after a delay unless user explicitly stopped
            if (!isContinuousModeRef.current && !userExplicitlyStoppedRef.current && isMountedRef.current) {
                // Clear any existing timeout
                if (autoRestartTimeoutRef.current) {
                    clearTimeout(autoRestartTimeoutRef.current);
                }
                
                // Show "listening..." indicator during delay
                setIsWaitingToRestart(true);
                
                // Auto-restart after 600ms delay (between 500-800ms as requested)
                autoRestartTimeoutRef.current = setTimeout(() => {
                    // Check if component is still mounted and user hasn't explicitly stopped
                    if (!isMountedRef.current) {
                        return;
                    }

                    if (!userExplicitlyStoppedRef.current && recognitionRef.current) {
                        console.log('[useSpeechRecognition] Auto-restarting recognition on mobile after pause');
                        try {
                            recognitionRef.current.start();
                            setIsListening(true);
                            setIsWaitingToRestart(false);
                        } catch (err) {
                            // If start fails (e.g., already started), just clear the waiting state
                            console.log('[useSpeechRecognition] Auto-restart failed (may already be running):', err);
                            if (isMountedRef.current) {
                                setIsWaitingToRestart(false);
                            }
                        }
                    } else {
                        if (isMountedRef.current) {
                            setIsWaitingToRestart(false);
                        }
                    }
                    autoRestartTimeoutRef.current = null;
                }, 600);
                
                // Clear processed texts on end to allow same text in new utterance
                processedFinalTextsRef.current.clear();
            } else {
                // Desktop (continuous mode) or user explicitly stopped - don't auto-restart
                if (!isContinuousModeRef.current) {
                    processedFinalTextsRef.current.clear();
                }
                if (isMountedRef.current) {
                    setIsWaitingToRestart(false);
                }
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Check if component is still mounted
            if (!isMountedRef.current) {
                return;
            }

            // Clear any pending auto-restart timeout on error
            if (autoRestartTimeoutRef.current) {
                clearTimeout(autoRestartTimeoutRef.current);
                autoRestartTimeoutRef.current = null;
            }
            
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            setIsWaitingToRestart(false);
            stopTriggeredRef.current = false; // Reset on error too
            userExplicitlyStoppedRef.current = false; // Reset on error
            // Clear interim on error
            setInterimTranscript('');
            // Reset index tracking
            lastProcessedIndexRef.current = -1;
            // Clear processed texts tracking on error
            processedFinalTextsRef.current.clear();

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

            // Clear any pending auto-restart timeout
            if (autoRestartTimeoutRef.current) {
                clearTimeout(autoRestartTimeoutRef.current);
                autoRestartTimeoutRef.current = null;
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

            // Reset all refs
            finalTranscriptRef.current = '';
            stopTriggeredRef.current = false;
            lastProcessedIndexRef.current = -1;
            sessionIdRef.current = 0;
            processedFinalTextsRef.current.clear();
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
            // Clear any pending auto-restart timeout
            if (autoRestartTimeoutRef.current) {
                clearTimeout(autoRestartTimeoutRef.current);
                autoRestartTimeoutRef.current = null;
            }
            
            stopTriggeredRef.current = false; // Ensure we are ready for new results
            userExplicitlyStoppedRef.current = false; // Reset explicit stop flag
            setError(null); // Clear any previous errors
            setIsWaitingToRestart(false); // Clear waiting state
            
            // Reset tracking for new session
            lastProcessedIndexRef.current = -1;
            sessionIdRef.current += 1;
            
            // On mobile (single utterance mode), clear processed texts for new utterance
            // This allows building up text across multiple taps, but prevents duplicates within each utterance
            // On desktop (continuous mode), keep tracking to prevent duplicates within the same session
            if (!isContinuousModeRef.current) {
                processedFinalTextsRef.current.clear();
            }
            
            // Clear interim when starting new session
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            if (isMountedRef.current) {
                setError('Failed to start microphone. Please check your browser permissions.');
                setIsListening(false);
                setIsWaitingToRestart(false);
            }
        }
    };

    const stopListening = () => {
        // Clear any pending auto-restart timeout
        if (autoRestartTimeoutRef.current) {
            clearTimeout(autoRestartTimeoutRef.current);
            autoRestartTimeoutRef.current = null;
        }
        
        // Mark that user explicitly stopped (don't auto-restart)
        userExplicitlyStoppedRef.current = true;
        setIsWaitingToRestart(false);
        
        if (recognitionRef.current && isListening) {
            stopTriggeredRef.current = true; // Signal to ignore subsequent results
            recognitionRef.current.stop();
            setIsListening(false);
            // Clear interim when stopping
            setInterimTranscript('');
            // Reset index tracking
            lastProcessedIndexRef.current = -1;
            // Clear processed texts tracking when stopping
            processedFinalTextsRef.current.clear();
        }
    };

    // This function allows components to reset the transcript and ensures the ref is also cleared.
    const customSetTranscript = useCallback((text: string) => {
        if (!isMountedRef.current) {
            return;
        }

        // Clear any pending auto-restart timeout when transcript is manually set (e.g., message sent)
        if (autoRestartTimeoutRef.current) {
            clearTimeout(autoRestartTimeoutRef.current);
            autoRestartTimeoutRef.current = null;
        }
        userExplicitlyStoppedRef.current = true; // Don't auto-restart after sending
        setIsWaitingToRestart(false);
        
        finalTranscriptRef.current = text;
        setFinalTranscript(text);
        setInterimTranscript('');
        // Reset tracking when manually setting transcript
        lastProcessedIndexRef.current = -1;
        // Clear processed texts tracking when manually setting transcript
        processedFinalTextsRef.current.clear();
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
        isWaitingToRestart, // Mobile auto-restart delay indicator
        startListening, 
        stopListening, 
        hasSupport, 
        error, 
        setTranscript: customSetTranscript 
    };
};
