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

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    // Fix: The type SpeechRecognition is now correctly resolved via the interface definition above.
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef(''); // Ref to hold only the FINAL transcript text
    const stopTriggeredRef = useRef(false); // Flag to ignore late-coming results after stop is called


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
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            // If stop was triggered, ignore any lingering results to prevent race conditions
            if (stopTriggeredRef.current) {
                return;
            }

            let interim_transcript = '';
            // Iterate from the last known result index to process only new results.
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                if (result.isFinal) {
                    // Append final results to our ref, ensuring proper spacing.
                    const final_text = result[0].transcript.trim();
                    if (final_text) {
                        finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final_text;
                    }
                } else {
                    // Accumulate interim results.
                    interim_transcript += result[0].transcript;
                }
            }

            // Update the display with the final text plus the current interim text.
            // Ensure proper spacing between final and interim parts.
            const currentFinal = finalTranscriptRef.current;
            const currentInterim = interim_transcript.trim();
            setTranscript(currentFinal + (currentInterim ? (currentFinal ? ' ' : '') + currentInterim : ''));
        };

        recognition.onend = () => {
            setIsListening(false);
            stopTriggeredRef.current = false;
            // On end, ensure the displayed transcript is only the final, confirmed text.
            // This cleans up any lingering interim results if recognition ends abruptly.
            setTranscript(finalTranscriptRef.current);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            stopTriggeredRef.current = false; // Reset on error too

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

            // Clear error after 5 seconds
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
            return; // Already listening
        }

        try {
            stopTriggeredRef.current = false; // Ensure we are ready for new results
            setError(null); // Clear any previous errors
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setError('Failed to start microphone. Please check your browser permissions.');
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            stopTriggeredRef.current = true; // Signal to ignore subsequent results
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // This function allows components to reset the transcript and ensures the ref is also cleared.
    const customSetTranscript = useCallback((text: string) => {
        finalTranscriptRef.current = text;
        setTranscript(text);
    }, []);

    // Check if Speech Recognition API is supported and we're in a secure context
    const isSecureContext = window.isSecureContext ||
                            window.location.protocol === 'https:' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';
    const hasSupport = !!SpeechRecognitionAPI && isSecureContext;

    return { isListening, transcript, startListening, stopListening, hasSupport, error, setTranscript: customSetTranscript };
};
