'use client';

import React, { useState } from 'react';
import { Session, UserTier } from '../../types';
import FeedbackView from './FeedbackView';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface HistoryViewProps {
    sessions: Session[];
    onBack: () => void;
    onNavigateToPaywall: () => void;
    userTier: UserTier;
    onStartPractice?: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onBack, onNavigateToPaywall, userTier, onStartPractice }) => {
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    if (selectedSession) {
        return <FeedbackView session={selectedSession} onDone={() => setSelectedSession(null)} onUpgrade={onNavigateToPaywall} />;
    }

    const sortedSessions = sessions.slice().reverse();

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="flex items-center px-6 py-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<i className="fa-solid fa-arrow-left" />}
                    aria-label="Go back"
                    className="mr-3"
                />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Session History</h1>
            </div>

            <main className="px-6">
                {sortedSessions.length === 0 ? (
                    <Card variant="accent" padding="lg" className="mt-6 text-center">
                        <div className="mb-6">
                            <div className="mx-auto w-20 h-20 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <i className="fa-regular fa-clock text-4xl text-[var(--color-primary)]" aria-hidden="true"></i>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Sessions Yet</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">Complete your first practice session to see it here.</p>
                        {onStartPractice && (
                            <Button
                                onClick={onStartPractice}
                                variant="primary"
                                size="lg"
                                fullWidth
                                icon={<i className="fa-solid fa-play" aria-hidden="true"></i>}
                            >
                                Start Your First Practice
                            </Button>
                        )}
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
                                        <p className="font-bold text-lg text-[var(--color-primary-dark)] mb-1">
                                            {session.patient.name}, {session.patient.age}
                                        </p>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{session.patient.topic}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            {new Date(session.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(session.date).toLocaleTimeString()}
                                        </p>
                                        {session.tier === UserTier.Premium && (
                                            <span className="mt-1 inline-block bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] text-xs font-bold px-2 py-0.5 rounded-full">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryView;
