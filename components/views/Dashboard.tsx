'use client';

import React, { useMemo } from 'react';
import { Session, UserTier, View } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useStreak } from '../../hooks/useStreak';
import { useXP } from '../../hooks/useXP';
import { useBadges } from '../../hooks/useBadges';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import BadgeDisplay from '../gamification/BadgeDisplay';
import GlobalMIScore from '../ui/GlobalMIScore';
import { MasteryGoalCard } from '../ui/MasteryGoalCard';
import { MasteryTierBadge } from '../ui/MasteryTierBadge';
import { generateMasteryGoal } from '../../services/masteryGoalService';
import { getMasteryTier } from '../../utils/northStarLogic';

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

    // Calculate average feedback score (empathy score if available)
    const sessionsWithScore = sessions.filter(s => s.feedback?.empathyScore !== undefined);
    const avgScore = sessionsWithScore.length > 0
        ? Math.round(sessionsWithScore.reduce((sum, s) => sum + (s.feedback.empathyScore || 0), 0) / sessionsWithScore.length)
        : null;

    // Get streak from the useStreak hook (persisted in Supabase)
    const { currentStreak: streak } = useStreak();

    // Get XP and level from the useXP hook
    const { currentXP, currentLevel, levelName, xpToNextLevel, xpProgress, isLoading: xpLoading } = useXP();

    // Level icons for Growth Garden theme
    const levelIcons = ['🌱', '🌿', '🌳', '🏆'];
    const levelIcon = levelIcons[currentLevel - 1] || '🌱';

    // Get badges and certificates
    const { unlockedBadges, unlockedCertificates } = useBadges();

    // BMAD Integration: Generate Mastery Goal using North Star Logic
    const masteryGoalData = useMemo(() => {
        if (xpLoading || currentLevel < 1) return null;

        // Get mastery tier from North Star Logic
        const masteryTier = getMasteryTier(currentLevel);

        // Generate goal based on tier, level, and session history
        return generateMasteryGoal(currentLevel, sessions);
    }, [currentLevel, sessions, xpLoading]);

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
                                variant="primary" // We might want a custom white button here, but primary is safe for now or overrides
                                className="bg-white text-[var(--color-primary-darker)] hover:bg-white/90 border-transparent shadow-none"
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
                        {/* Streak Card */}
                        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                                <i className="fa-solid fa-fire text-orange-500 text-xl"></i>
                            </div>
                            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                                {streak}
                            </h3>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Day Streak</p>
                        </div>

                        {/* Sessions Count */}
                        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                <i className="fa-solid fa-calendar-check text-[var(--color-primary)] text-xl"></i>
                            </div>
                            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                                {sessionsThisMonth}
                            </h3>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Sessions (Mo)</p>
                        </div>
                    </div>
                </div>

                {/* 2. HYBRID MASTERY CARD + Global Score */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Global MI Score */}
                    <div className="lg:col-span-1">
                        <GlobalMIScore sessions={sessions} />

                        {/* Badges Preview (Mini) */}
                        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Badges</h3>
                                <button className="text-xs text-[var(--color-primary)] font-medium hover:underline">View All</button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {unlockedCertificates.slice(0, 4).map(cert => (
                                    <div key={cert.id} className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-lg text-[var(--color-primary)]" title={cert.name}>
                                        <i className={cert.icon}></i>
                                    </div>
                                ))}
                                {unlockedCertificates.length === 0 && (
                                    <p className="text-xs text-[var(--color-text-muted)]">No badges yet. Start practicing!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Hybrid Mastery & Progress Card */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-8 shadow-sm h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <i className="fa-solid fa-trophy text-9xl"></i>
                            </div>

                            <div className="relative z-10">
                                {/* Header: Level Info */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-lighter)] flex items-center justify-center text-3xl shadow-sm">
                                        {levelIcon}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-wider mb-1">
                                            Current Status
                                        </div>
                                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {levelName}
                                        </h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Level {currentLevel} • {xpLoading ? '...' : `${currentXP.toLocaleString()} XP`}
                                        </p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-[var(--color-neutral-100)] w-full mb-6"></div>

                                {/* Mastery Goal Content */}
                                {masteryGoalData ? (
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2.5 py-1 rounded-md bg-[var(--color-accent-light)] text-[var(--color-accent-dark)] text-xs font-bold">
                                                FOCUS AREA
                                            </span>
                                            {masteryGoalData.focusArea && (
                                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                    {masteryGoalData.focusArea}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed italic border-l-4 border-[var(--color-primary-light)] pl-4 py-1">
                                            "{masteryGoalData.goal.replace(/\*\*/g, '')}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mb-8 p-4 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] text-sm italic">
                                        Complete more sessions to unlock your personalized Mastery Goal.
                                    </div>
                                )}

                                {/* XP Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-medium text-[var(--color-text-muted)] mb-2">
                                        <span>Progress to next level</span>
                                        <span>{currentLevel < 4 ? `${xpToNextLevel} XP remaining` : 'Max Level'}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${xpProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                            {recentSessions.map(session => (
                                <div
                                    key={session.id}
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
