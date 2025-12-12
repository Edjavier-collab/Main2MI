import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientProfile, UserTier, ChatMessage, Feedback } from '../../types';
import { FREE_SESSION_DURATION, PREMIUM_SESSION_DURATION } from '../../constants';
import { createChatSession, getPatientResponse, getFeedbackForTranscript } from '../../services/geminiService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Chat } from '@google/genai';
import PatientProfileCard from '../ui/PatientProfileCard';
import ChatBubble from '../ui/ChatBubble';
import Timer from '../ui/Timer';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [isPatientTyping, setIsPatientTyping] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
    
    const { isListening, transcript: speechTranscript, startListening, stopListening, hasSupport, error: micError, setTranscript: setSpeechTranscript } = useSpeechRecognition();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sessionDuration = userTier === UserTier.Premium ? PREMIUM_SESSION_DURATION : FREE_SESSION_DURATION;

    useEffect(() => {
        setChat(createChatSession(patient));
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
        if (!text.trim() || !chat || isPatientTyping) return;

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
    }, [chat, patient, isPatientTyping]);
    
    const handleVoiceSend = () => {
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

    const handleEndSession = useCallback(async () => {
        setIsEndingSession(true);
        const feedback = await getFeedbackForTranscript(transcript, patient, userTier);
        onFinish(transcript, feedback);
    }, [transcript, patient, userTier, onFinish]);

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
                    <h3 className="font-bold text-lg text-[var(--color-text-primary)] truncate">Session with {patient.name}</h3>
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
                        className="px-4 min-h-[var(--touch-target-min)] bg-error text-white font-semibold border-2 border-black hover:bg-error-dark disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
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

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-white">
                <div className="space-y-4">
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
                {micError && (
                    <Card variant="accent" padding="sm" className="mb-3 border-l-4 border-[var(--color-error)]">
                        <div className="flex items-center gap-2 text-[var(--color-error)] text-sm" role="alert">
                            <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <span>{micError}</span>
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
                        disabled={isPatientTyping || !speechTranscript.trim()}
                        className="w-[var(--touch-target-min)] h-[var(--touch-target-min)] flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-text-primary)] border-2 border-black hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-neutral-300)] disabled:text-[var(--color-neutral-500)] disabled:border-[var(--color-neutral-400)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                        aria-label="Send message"
                    >
                        <i className="fa-solid fa-paper-plane text-xl" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            {isEndingSession && (
                 <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center rounded-2xl z-10">
                    <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Generating your feedback...</p>
                </div>
            )}
        </div>
    );
};

export default PracticeView;