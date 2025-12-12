import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Cast window to any to access non-standard SpeechRecognition APIs
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Define event types for better type safety
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

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

/**
 * Simple speech recognition hook with manual toggle control
 * - User taps mic → starts listening continuously
 * - User taps mic again → stops listening
 * - Works the same on all devices (desktop and mobile)
 */
export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef('');
    const stopTriggeredRef = useRef(false);
    const lastProcessedIndexRef = useRef<number>(-1);
    const processedFinalTextsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            const errorMsg = "Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.";
            console.error(errorMsg);
            setError(errorMsg);
            return;
        }

        const isSecureContext = window.isSecureContext ||
                                window.location.protocol === 'https:' ||
                                window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1';

        if (!isSecureContext) {
            const errorMsg = "Speech Recognition requires a secure context (HTTPS or localhost).";
            console.error(errorMsg);
            setError(errorMsg);
            return;
        }

        const recognition: SpeechRecognition = new SpeechRecognitionAPI();
        // Continuous mode on ALL devices - stays on until user manually stops
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        console.log('[useSpeechRecognition] Initialized with continuous mode (manual toggle only)');

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            if (stopTriggeredRef.current) {
                return;
            }

            // Handle recognition restarts (can happen if browser temporarily loses focus)
            if (event.resultIndex < lastProcessedIndexRef.current) {
                console.log('[useSpeechRecognition] Recognition restarted, resetting tracking');
                lastProcessedIndexRef.current = -1;
                processedFinalTextsRef.current.clear();
            }

            let newInterimTranscript = '';
            let hasNewFinal = false;

            const startIndex = Math.max(event.resultIndex, lastProcessedIndexRef.current + 1);
            
            for (let i = startIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                
                if (result.isFinal) {
                    const final_text = result[0].transcript.trim();
                    if (final_text) {
                        // Duplicate prevention
                        const normalizedText = final_text.toLowerCase();
                        const currentTranscriptLower = finalTranscriptRef.current.toLowerCase();
                        const textAlreadyAtEnd = currentTranscriptLower.endsWith(normalizedText) || 
                                                 currentTranscriptLower.endsWith(' ' + normalizedText);
                        
                        if (!processedFinalTextsRef.current.has(normalizedText) && !textAlreadyAtEnd) {
                            processedFinalTextsRef.current.add(normalizedText);
                            const textToAdd = finalTranscriptRef.current ? ' ' + final_text : final_text;
                            finalTranscriptRef.current += textToAdd;
                            hasNewFinal = true;
                            newInterimTranscript = '';
                        } else {
                            console.log('[useSpeechRecognition] Skipping duplicate:', final_text);
                        }
                    }
                } else {
                    if (i >= startIndex) {
                        newInterimTranscript += result[0].transcript;
                    }
                }
                
                lastProcessedIndexRef.current = i;
            }

            if (hasNewFinal) {
                setFinalTranscript(finalTranscriptRef.current);
                setInterimTranscript('');
            } else {
                setInterimTranscript(newInterimTranscript.trim());
            }
        };

        recognition.onend = () => {
            // Only update state if we're not already stopped
            // This handles cases where recognition ends unexpectedly
            setIsListening(false);
            stopTriggeredRef.current = false;
            setInterimTranscript('');
            setFinalTranscript(finalTranscriptRef.current);
            lastProcessedIndexRef.current = -1;
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            stopTriggeredRef.current = false;
            setInterimTranscript('');
            lastProcessedIndexRef.current = -1;
            processedFinalTextsRef.current.clear();

            // Don't show error for aborted (user stopped)
            if (event.error === 'aborted') {
                return;
            }

            // User-friendly error messages
            let errorMessage = 'Microphone error occurred.';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'Microphone not found or access denied.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow access in browser settings.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = `Speech recognition error: ${event.error}`;
            }
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition not initialized. Please refresh the page.');
            return;
        }

        if (isListening) {
            return;
        }

        try {
            stopTriggeredRef.current = false;
            setError(null);
            lastProcessedIndexRef.current = -1;
            processedFinalTextsRef.current.clear();
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setError('Failed to start microphone. Please check browser permissions.');
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            stopTriggeredRef.current = true;
            recognitionRef.current.stop();
            setIsListening(false);
            setInterimTranscript('');
            lastProcessedIndexRef.current = -1;
            processedFinalTextsRef.current.clear();
        }
    };

    const customSetTranscript = useCallback((text: string) => {
        finalTranscriptRef.current = text;
        setFinalTranscript(text);
        setInterimTranscript('');
        lastProcessedIndexRef.current = -1;
        processedFinalTextsRef.current.clear();
    }, []);

    const transcript = finalTranscript + (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');

    const isSecureContext = window.isSecureContext ||
                            window.location.protocol === 'https:' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';
    const hasSupport = !!SpeechRecognitionAPI && isSecureContext;

    return { 
        isListening, 
        transcript,
        finalTranscript,
        interimTranscript,
        startListening, 
        stopListening, 
        hasSupport, 
        error, 
        setTranscript: customSetTranscript 
    };
};
