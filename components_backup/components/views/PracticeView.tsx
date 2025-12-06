import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientProfile, UserTier, ChatMessage, Feedback } from '../../types';
import { FREE_SESSION_DURATION, PREMIUM_SESSION_DURATION } from '../../constants';
import { createChatSession, getPatientResponse, getFeedbackForTranscript } from '../../services/geminiService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Chat } from '@google/genai';
import PatientProfileCard from '../ui/PatientProfileCard';
import ChatBubble from '../ui/ChatBubble';
import Timer from '../ui/Timer';
import { PillButton } from '../ui/PillButton';
import { HeaderWave } from '../illustrations/GrowthIllustrations';
import './PracticeView.css';

interface PracticeViewProps {
    patient: PatientProfile;
    userTier: UserTier;
    onFinish: (transcript: ChatMessage[], feedback: Feedback) => void;
}

const SpeechVisualizer: React.FC = () => (
    <div className="practice-view__speech-visualizer" aria-hidden="true">
        <span className="practice-view__wave-bar" style={{ animationDelay: '0s' }}></span>
        <span className="practice-view__wave-bar" style={{ animationDelay: '0.2s' }}></span>
        <span className="practice-view__wave-bar" style={{ animationDelay: '0.4s' }}></span>
        <span className="practice-view__wave-bar" style={{ animationDelay: '0.1s' }}></span>
    </div>
);

const PracticeView: React.FC<PracticeViewProps> = ({ patient, userTier, onFinish }) => {
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
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [speechTranscript]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !chat || isPatientTyping) return;

        const newUserMessage: ChatMessage = { author: 'user', text };
        setTranscript(prev => [...prev, newUserMessage]);
        setIsPatientTyping(true);

        try {
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
            <div className="practice-view practice-view--pre-session">
                <PatientProfileCard patient={patient} userTier={userTier} />
                <PillButton 
                    onClick={() => setIsSessionStarted(true)}
                    size="lg"
                    className="practice-view__begin-button"
                >
                    Begin Session
                </PillButton>
            </div>
        );
    }

    return (
        <div className="practice-view">
            <div className="practice-view__header">
                <HeaderWave className="practice-view__header-wave" />
                <div className="practice-view__header-content">
                    <h3 className="practice-view__header-title">Session with {patient.name}</h3>
                    <div className="practice-view__header-actions">
                        <Timer initialSeconds={sessionDuration} onTimeUp={handleEndSession} />
                        <PillButton 
                            onClick={handleEndSession} 
                            disabled={isEndingSession}
                            variant="danger"
                            size="sm"
                        >
                            {isEndingSession ? 'Analyzing...' : 'End Session'}
                        </PillButton>
                    </div>
                </div>
            </div>

            <div ref={chatContainerRef} className="practice-view__chat-area">
                <div className="practice-view__chat-messages">
                    {transcript.map((msg, index) => (
                        <ChatBubble key={index} message={msg} />
                    ))}
                    {isPatientTyping && (
                        <div className="practice-view__typing-wrapper">
                            <ChatBubble message={{ author: 'patient', text: '...' }} isTyping={true} />
                        </div>
                    )}
                </div>
            </div>

            <div className="practice-view__composer">
                {micError && (
                    <div className="practice-view__error-message">
                        <i className="fa fa-exclamation-circle"></i>
                        <span>{micError}</span>
                    </div>
                )}
                <div className="practice-view__input-wrapper">
                    <div className="practice-view__input-container">
                        {isListening && <SpeechVisualizer />}
                        <textarea
                            ref={textareaRef}
                            value={speechTranscript}
                            onChange={(e) => setSpeechTranscript(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Type your response or use the microphone..."}
                            className="practice-view__textarea"
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
                        <div className="practice-view__mic-wrapper">
                            <button 
                                type="button"
                                onClick={handleVoiceSend} 
                                disabled={isPatientTyping}
                                className={`practice-view__mic-button ${isListening ? 'practice-view__mic-button--listening' : ''}`}
                                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                            >
                                <i className="fa fa-microphone"></i>
                            </button>
                            <div className="practice-view__mic-tooltip">
                                {isListening ? 'Stop Recording' : 'Start Recording'}
                            </div>
                        </div>
                    )}
                    <button 
                        type="button"
                        onClick={handleTextSend} 
                        disabled={isPatientTyping || !speechTranscript.trim()} 
                        className="practice-view__send-button"
                        aria-label="Send message"
                    >
                        <i className="fa fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            {isEndingSession && (
                <div className="practice-view__overlay">
                    <div className="practice-view__spinner"></div>
                    <p className="practice-view__overlay-text">Generating your feedback...</p>
                </div>
            )}
        </div>
    );
};

export default PracticeView;
