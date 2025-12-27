'use client';

import React, { useState } from 'react';
import { Session, UserTier } from '../../types';
import FeedbackView from './FeedbackView';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface CalendarViewProps {
    sessions: Session[];
    onBack: () => void;
    userTier: UserTier;
    onGenerateCoachingSummary: () => void;
    isGeneratingSummary: boolean;
    hasCoachingSummary: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions, onBack, userTier, onGenerateCoachingSummary, isGeneratingSummary, hasCoachingSummary }) => {
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    const isPremium = userTier === UserTier.Premium;

    const handleGenerateClick = () => {
        if (!isPremium) {
            onGenerateCoachingSummary(); // This will navigate to the paywall via App.tsx
            return;
        }
        
        const premiumSessions = sessions.filter(s => s.tier === UserTier.Premium);
        if (premiumSessions.length === 0 && !hasCoachingSummary) {
             showToast("You need to complete at least one Premium session to generate a summary.", 'warning');
             return;
        }
        
        onGenerateCoachingSummary();
    };

    if (selectedSession) {
        return (
            <FeedbackView
                session={selectedSession}
                onDone={() => setSelectedSession(null)}
                onUpgrade={() => {}} // This view doesn't trigger upgrades
            />
        );
    }

    // Sort sessions by date, most recent first
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            
            {/* Header */}
            <div className="flex items-center px-6 py-4">
                <BackButton onClick={onBack} className="mr-3" />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Calendar</h1>
            </div>
            
            <main className="px-6">
                {sortedSessions.length === 0 ? (
                    <Card variant="accent" padding="lg" className="mt-6 text-center">
                        <div className="mb-6">
                            <i className="fa-regular fa-calendar-times text-6xl text-[var(--color-text-muted)]" aria-hidden="true"></i>
                        </div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Sessions Yet</h2>
                        <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto">
                            Your completed practice sessions will appear here once you finish one.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3 mt-6">
                        {sortedSessions.map(session => (
                            <Card
                                key={session.id}
                                variant="elevated"
                                padding="md"
                                hoverable
                                onClick={() => setSelectedSession(session)}
                                className="min-h-[60px]"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-bold text-[var(--color-primary-dark)] text-lg mb-1">
                                            {new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                                            {`${session.patient.age} y/o ${session.patient.sex.toLowerCase()}, ${session.patient.topic}, ${session.patient.stageOfChange}`}
                                        </p>
                                    </div>
                                    <i className="fa fa-chevron-right text-[var(--color-text-muted)] ml-4" aria-hidden="true"></i>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Progress Report Section */}
                {sortedSessions.length > 0 && (
                    <div className="mt-10">
                        <Card
                            variant="accent"
                            padding="lg"
                            className="border-4 border-black shadow-2xl bg-white"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <span className="inline-flex h-16 w-16 items-center justify-center rounded-none border-4 border-black bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 text-white shadow-xl">
                                    <i className="fa-solid fa-wand-magic-sparkles text-3xl text-white drop-shadow-2xl font-bold" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} aria-hidden="true"></i>
                                </span>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-[var(--color-primary-dark)] uppercase tracking-wide">
                                        AI Progress Report
                                    </p>
                                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
                                        Coaching Summary
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                        Compile a clear, AI-powered snapshot of your recent sessions.
                                    </p>
                                </div>
                                {hasCoachingSummary && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-lighter)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
                                        <i className="fa-solid fa-check-circle" aria-hidden="true"></i>
                                        Ready
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]">
                                        <i className="fa-solid fa-brain" aria-hidden="true"></i>
                                        Personalized insights
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]">
                                        <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
                                        Progress trends
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]">
                                        <i className="fa-solid fa-bullseye" aria-hidden="true"></i>
                                        Next-step focus
                                    </span>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={handleGenerateClick}
                                        disabled={isGeneratingSummary}
                                        className={`inline-flex items-center gap-3 px-7 py-3.5 bg-white border border-[var(--color-neutral-300)] rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 text-[var(--color-text-primary)] font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed ${isPremium ? 'hover:bg-[var(--color-bg-accent)]' : ''}`}
                                    >
                                        {isGeneratingSummary ? (
                                            <i className="fa-solid fa-spinner fa-spin text-lg" aria-hidden="true"></i>
                                        ) : (
                                            <i className={`fa-solid ${hasCoachingSummary ? 'fa-eye' : (isPremium ? 'fa-wand-magic-sparkles' : 'fa-lock')} text-lg`} aria-hidden="true"></i>
                                        )}
                                        <span>{hasCoachingSummary ? 'View Summary' : 'Generate Summary'}</span>
                                    </button>
                                </div>

                                {!isPremium && (
                                    <p className="text-center text-sm text-[var(--color-text-muted)]">
                                        Upgrade to Premium to unlock your AI-powered Coaching Summary.
                                    </p>
                                )}
                                {(isPremium && sessions.filter(s => s.tier === UserTier.Premium).length === 0 && sessions.length > 0) && (
                                    <p className="text-center text-sm text-[var(--color-text-muted)]">
                                        Complete a premium session to generate your first summary.
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CalendarView;