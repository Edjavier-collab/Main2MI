'use client';

import React from 'react';
import { Session, UserTier, View } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import GlobalMIScore from '../ui/GlobalMIScore';

interface DashboardProps {
    onStartPractice: () => void;
    userTier: UserTier;
    sessions: Session[];
    remainingFreeSessions: number | null;
    onNavigateToPaywall: () => void;
    onNavigate: (view: View) => void;
    isLoadingTier?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
    onStartPractice,
    userTier,
    sessions,
    remainingFreeSessions,
    onNavigateToPaywall,
    onNavigate,
    isLoadingTier = false
}) => {
    const { user } = useAuth();
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
    const isPremium = userTier === UserTier.Premium;

    // Calculate sessions this month
    const now = new Date();
    const sessionsThisMonth = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
    }).length;

    const displayRemaining = remainingFreeSessions !== null
        ? remainingFreeSessions
        : (() => {
            const freeSessionsThisMonth = sessions.filter(s => {
                const sessionDate = new Date(s.date);
                return s.tier === UserTier.Free && sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
            }).length;
            return Math.max(0, 3 - freeSessionsThisMonth);
        })();

    // Get recent sessions (last 3)
    const recentSessions = [...sessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    const hasSessions = sessions.length > 0;

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header */}
            <header className="px-6 py-8 md:px-8 bg-transparent">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
                            Welcome, {firstName}
                        </h1>
                        <p className="text-[var(--color-text-secondary)] font-medium">
                            Ready to continue your mastery journey?
                        </p>
                    </div>
                </div>
            </header>

            <main className="px-6 md:px-8 pb-12 max-w-5xl mx-auto space-y-8">
                {/* 1. HERO TILE - Dark Mode "North Star" Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 relative overflow-hidden rounded-xl bg-[var(--color-primary-darker)] text-white shadow-lg p-8 flex flex-col justify-between min-h-[280px]">
                        {/* Abstract Background Decoration */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--color-primary)] opacity-10 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-[var(--color-primary-light)] opacity-10 blur-2xl"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium mb-4">
                                <i className="fa-solid fa-sparkles text-[var(--color-accent)]"></i>
                                <span>AI-Powered Simulation</span>
                            </div>
                            <h2 className="text-3xl font-display font-bold mb-3 leading-tight">
                                Start a New <br />Practice Session
                            </h2>
                            <p className="text-white/70 max-w-md text-sm leading-relaxed">
                                Interact with realistic patient personas to refine your Motivational Interviewing skills in a safe, judgment-free environment.
                            </p>
                        </div>

                        <div className="relative z-10 mt-8 flex flex-wrap gap-4 items-center">
                            <Button
                                onClick={onStartPractice}
                                disabled={!isPremium && displayRemaining === 0}
                                variant="primary"
                                className="!bg-white !text-[var(--color-primary-darker)] !font-bold hover:!bg-gray-50 border-transparent !shadow-lg text-lg transform transition-transform active:scale-95"
                                size="lg"
                                loading={isLoadingTier}
                                icon={<i className="fa-solid fa-play"></i>}
                            >
                                Start Practicing
                            </Button>

                            {hasSessions && (
                                <button
                                    onClick={() => onNavigate(View.Calendar)}
                                    className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium text-sm transition-all"
                                >
                                    View History
                                </button>
                            )}
                        </div>

                        {!isPremium && (
                            <div className="absolute top-6 right-6 text-right">
                                <span className={`text-xs font-bold ${displayRemaining === 0 ? 'text-red-300' : 'text-white/60'}`}>
                                    {displayRemaining}/3 Free Sessions
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Column */}
                    <div className="flex flex-col gap-4">
                        {/* Total Sessions */}
                        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                <i className="fa-solid fa-clipboard-list text-[var(--color-primary)] text-xl"></i>
                            </div>
                            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                                {sessions.length}
                            </h3>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Total Sessions</p>
                        </div>

                        {/* Sessions This Month */}
                        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                <i className="fa-solid fa-calendar-check text-[var(--color-primary)] text-xl"></i>
                            </div>
                            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                                {sessionsThisMonth}
                            </h3>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">This Month</p>
                        </div>
                    </div>
                </div>

                {/* 2. MI Score + View Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Global MI Score */}
                    <div className="lg:col-span-1">
                        <GlobalMIScore sessions={sessions} />
                    </div>

                    {/* Right: View Progress Card */}
                    <div className="lg:col-span-2">
                        <button
                            onClick={() => onNavigate(View.Reports)}
                            className="w-full bg-white rounded-xl border border-[var(--color-neutral-200)] p-8 shadow-sm h-full relative overflow-hidden text-left hover:shadow-md transition-shadow group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <i className="fa-solid fa-chart-line text-9xl"></i>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-lighter)] flex items-center justify-center shadow-sm">
                                        <i className="fa-solid fa-chart-bar text-2xl text-[var(--color-primary)]"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                                            Skill Development
                                        </h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                                    View your MI skill progression, practice history, and generate supervisor reports.
                                </p>
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)]">
                                    View Progress
                                    <i className="fa-solid fa-arrow-right text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"></i>
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 3. RECENT SESSIONS LIST (Simplified) */}
                {hasSessions && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Recent Sessions</h3>
                            <button
                                onClick={() => onNavigate(View.Calendar)}
                                className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                            >
                                View All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentSessions.map((session, index) => (
                                <div
                                    key={session.id || `session-${index}`}
                                    onClick={() => onNavigate?.(View.Calendar)}
                                    className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:bg-[var(--color-primary-lighter)] group-hover:text-[var(--color-primary-dark)] transition-colors">
                                            <i className="fa-solid fa-file-medical"></i>
                                        </div>
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-[var(--color-text-primary)] mb-1 truncate">{session.patient.topic}</h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">{session.patient.age}y • {session.patient.sex} • {session.patient.stageOfChange}</p>

                                    <div className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                                        <span>View Details</span>
                                        <i className="fa-solid fa-arrow-right text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
