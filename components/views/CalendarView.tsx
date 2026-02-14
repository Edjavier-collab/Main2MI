'use client';

import React, { useState } from 'react';
import { Session, UserTier } from '../../types';
import FeedbackView from './FeedbackView';
import { Button } from '../ui/Button';
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

// Safely format a session date string, returning a fallback if invalid
const formatSessionDate = (dateStr: string): string => {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
        return 'Date unavailable';
    }
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

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
                onUpgrade={() => { }} // This view doesn't trigger upgrades
            />
        );
    }

    // Sort sessions by date, most recent first
    const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        // Push invalid dates to the end
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
    });

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Header */}
            <div className="flex items-center px-6 py-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<i className="fa-solid fa-arrow-left" />}
                    aria-label="Go back"
                    className="mr-3"
                />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Calendar</h1>
            </div>

            <main className="px-6">
                {/* Coaching Summary Tile — Dark Premium Card */}
                {sortedSessions.length > 0 && (
                    <div
                        className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                        style={{
                            backgroundColor: '#0c4a6e',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '32px',
                        }}
                        onClick={handleGenerateClick}
                    >
                        {/* Subtle decorative arc in top-right */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                top: '-40px',
                                right: '-40px',
                                width: '160px',
                                height: '160px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                            }}
                        />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                letterSpacing: '0.08em',
                                                color: 'rgba(255,255,255,0.6)',
                                                textTransform: 'uppercase' as const,
                                            }}
                                        >
                                            MI PROGRESS REPORT
                                        </span>
                                    </div>

                                    <h2
                                        style={{
                                            fontSize: '20px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Coaching Summary
                                    </h2>

                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: 'rgba(255,255,255,0.7)',
                                            marginBottom: '16px',
                                            maxWidth: '32rem',
                                        }}
                                    >
                                        Compile a clear, AI-powered snapshot of your recent sessions
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {['Personalized insights', 'Progress trends', 'Next-step focus'].map(tag => (
                                            <span
                                                key={tag}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                    color: 'rgba(255,255,255,0.8)',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="ml-4 flex flex-col items-end">
                                    {hasCoachingSummary ? (
                                        <span
                                            className="inline-flex items-center gap-1.5"
                                            style={{
                                                padding: '4px 12px',
                                                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                                                color: '#34d399',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                borderRadius: '9999px',
                                                marginBottom: '12px',
                                            }}
                                        >
                                            <i className="fa-solid fa-check-circle"></i>
                                            Ready
                                        </span>
                                    ) : !isPremium ? (
                                        <span
                                            className="inline-flex items-center gap-1.5"
                                            style={{
                                                padding: '4px 12px',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                color: 'rgba(255,255,255,0.6)',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                borderRadius: '9999px',
                                                marginBottom: '12px',
                                            }}
                                        >
                                            <i className="fa-solid fa-lock"></i>
                                            Premium
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* View/Generate Report Button */}
                            <div className="mt-2">
                                {isGeneratingSummary ? (
                                    <span
                                        className="inline-flex items-center gap-2"
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#0ea5e9',
                                            color: '#ffffff',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            opacity: 0.7,
                                        }}
                                    >
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        Generating Report...
                                    </span>
                                ) : (
                                    <button
                                        className="inline-flex items-center gap-2 transition-colors duration-200"
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#0ea5e9',
                                            color: '#ffffff',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0284c7')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleGenerateClick();
                                        }}
                                    >
                                        {hasCoachingSummary ? 'View Report' : 'Generate Report'}
                                        <span aria-hidden="true">&rarr;</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Recent Sessions</h3>
                        {sortedSessions.map(session => (
                            <div
                                key={session.id}
                                className="bg-white cursor-pointer transition-colors duration-200 hover:bg-[var(--color-neutral-50)] min-h-[60px]"
                                style={{
                                    border: '1px solid #E5E5E5',
                                    borderRadius: '12px',
                                    padding: '16px 24px',
                                }}
                                onClick={() => setSelectedSession(session)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-bold text-[var(--color-primary-dark)] text-lg mb-1">
                                            {formatSessionDate(session.date)}
                                        </p>
                                        <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                                            {`${session.patient.age} y/o ${session.patient.sex.toLowerCase()}, ${session.patient.topic}, ${session.patient.stageOfChange}`}
                                        </p>
                                    </div>
                                    <i className="fa fa-chevron-right text-[var(--color-text-muted)] ml-4" aria-hidden="true"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CalendarView;
