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

    // Get badges
    const { unlockedBadges } = useBadges();

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
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-5xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        Welcome, {firstName}!
                    </h1>
                    <p className="text-lg text-[var(--color-text-secondary)] mt-2 font-medium">
                        Ready to sharpen your MI skills?
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Mastery Tier Badge */}
                    {!xpLoading && currentLevel >= 1 && (
                        <MasteryTierBadge currentLevel={currentLevel} />
                    )}
                    {/* Premium Badge */}
                    <span className={`px-4 py-2 text-xs font-medium rounded-full border border-white/10 dark:border-slate-800/30 ${isPremium
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 dark:from-amber-900/20 dark:to-orange-900/20 dark:text-amber-200'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 dark:from-gray-800/20 dark:to-gray-900/20 dark:text-gray-300'
                        }`}>
                        {isPremium ? 'Premium' : 'Free'}
                    </span>
                </div>
            </div>

            <main className="px-8 max-w-7xl mx-auto">
                {/* Hero CTA Block */}
                <Card variant="glass" padding="lg" className="mb-8 relative overflow-hidden">
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-lighter)]/20 to-transparent rounded-[var(--radius-lg)] pointer-events-none" />
                    <div className="relative z-10 text-center">
                        <div className="mb-4">
                            <i className="fa-solid fa-user-doctor text-4xl text-[var(--color-primary)]" aria-hidden="true"></i>
                        </div>
                        {user ? (
                            <>
                                <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                    Start Practicing
                                </h2>
                                <p className="text-base text-[var(--color-text-secondary)] mb-6 font-medium">
                                    Kick off a new MI scenario now
                                </p>

                                <Button
                                    onClick={onStartPractice}
                                    disabled={!isPremium && displayRemaining === 0}
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    loading={isLoadingTier}
                                    icon={<i className="fa-solid fa-play" aria-hidden="true"></i>}
                                    aria-label="Start a new practice session"
                                >
                                    Start a New Practice
                                </Button>

                                {!isPremium && (
                                    <p className={`text-center text-xs font-semibold mt-3 ${displayRemaining === 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'}`}>
                                        {displayRemaining} of 3 free sessions remaining this month
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <h2 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                    Sign in to Start Practicing
                                </h2>
                                <p className="text-base text-[var(--color-text-secondary)] mb-6 font-medium">
                                    Create a free account to practice Motivational Interviewing with AI-powered patient simulations
                                </p>

                                <Button
                                    onClick={() => onNavigate(View.Login)}
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    icon={<i className="fa-solid fa-sign-in-alt" aria-hidden="true"></i>}
                                    aria-label="Sign in to start practicing"
                                >
                                    Sign in to Start
                                </Button>

                                <p className="text-center text-xs text-[var(--color-text-muted)] mt-3">
                                    Free account includes 3 practice sessions per month
                                </p>
                            </>
                        )}

                        {hasSessions && (
                            <Button
                                onClick={() => onNavigate(View.Calendar)}
                                variant="ghost"
                                size="sm"
                                className="mt-3"
                                icon={<i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>}
                            >
                                View history
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Free tier limit reached warning */}
                {!isPremium && displayRemaining === 0 && (
                    <Card
                        variant="glass"
                        padding="md"
                        hoverable
                        onClick={onNavigateToPaywall}
                        className="mb-8 border border-red-200/50 dark:border-red-800/30 bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-[var(--color-error-dark)] font-semibold text-sm mb-1">
                                    Free practices limit reached
                                </p>
                                <p className="text-[var(--color-text-secondary)] text-xs">
                                    Upgrade to Premium for unlimited access
                                </p>
                            </div>
                            <i className="fa-solid fa-arrow-right text-[var(--color-error)] ml-3 flex-shrink-0" aria-hidden="true"></i>
                        </div>
                    </Card>
                )}

                {/* Quick Stats */}
                {hasSessions && (
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <Card variant="glass" padding="md" className="text-center backdrop-blur-md bg-white/5">
                            <div className="flex items-center justify-center mb-1">
                                <i className="fa-solid fa-calendar-check text-[var(--color-primary)] text-sm" aria-hidden="true"></i>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{sessionsThisMonth}</p>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">This Month</p>
                        </Card>
                        <Card variant="glass" padding="md" className="text-center backdrop-blur-md bg-white/5">
                            <div className="flex items-center justify-center mb-1">
                                <i className="fa-solid fa-heart text-[var(--color-error)] text-sm" aria-hidden="true"></i>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {avgScore !== null ? (
                                    <span className={avgScore >= 4 ? 'text-[var(--color-success)]' : avgScore >= 3 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}>
                                        {avgScore}/5
                                    </span>
                                ) : '—'}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">Avg Empathy</p>
                        </Card>
                        <Card variant="glass" padding="md" className="text-center backdrop-blur-md bg-white/5">
                            <div className="flex items-center justify-center mb-1">
                                <i className="fa-solid fa-fire text-[var(--color-warning)] text-sm" aria-hidden="true"></i>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {streak > 0 ? (
                                    <span className={streak >= 7 ? 'text-[var(--color-success)]' : streak >= 3 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'}>
                                        {streak}
                                    </span>
                                ) : '—'}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">Day Streak</p>
                        </Card>
                    </div>
                )}

                {/* Global MI Score */}
                <GlobalMIScore sessions={sessions} />

                {/* BMAD-Powered Mastery Goal Card */}
                <MasteryGoalCard
                    goalData={masteryGoalData}
                    isLoading={xpLoading}
                />

                {/* Level Progress */}
                <Card variant="glass" padding="md" className="mb-8 backdrop-blur-md bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{levelIcon}</span>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                                    {levelName}
                                </span>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {xpLoading ? '...' : `${currentXP.toLocaleString()} XP`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--color-text-secondary)]">
                                    Level {currentLevel}
                                </span>
                                {currentLevel < 4 && (
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {xpToNextLevel.toLocaleString()} to next
                                    </span>
                                )}
                                {currentLevel === 4 && (
                                    <span className="text-xs text-[var(--color-primary-dark)] font-medium">
                                        Max level!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div
                        className="w-full h-2 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700"
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${xpProgress}%`,
                                background: currentLevel === 4
                                    ? 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                                    : 'var(--color-primary)',
                            }}
                            role="progressbar"
                            aria-valuenow={xpProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Level ${currentLevel} progress: ${xpProgress}%`}
                        />
                    </div>
                </Card>

                {/* Your Badges Section - Shows all badges (locked + unlocked) */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-4 px-1">
                        Your Badges
                    </h3>
                    <Card variant="glass" padding="md" className="backdrop-blur-md bg-white/5">
                        <BadgeDisplay showAll={true} />
                    </Card>
                </div>

                {/* Recent Sessions Preview */}
                {hasSessions && recentSessions.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-4 px-1">
                            Recent Sessions
                        </h3>
                        <div className="space-y-3">
                            {recentSessions.map(session => (
                                <Card
                                    key={session.id}
                                    variant="glass"
                                    padding="sm"
                                    hoverable
                                    onClick={() => onNavigate?.(View.Calendar)}
                                    className="text-left backdrop-blur-md bg-white/5"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
                                                {session.patient.topic}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {new Date(session.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })} • {session.patient.stageOfChange}
                                            </p>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-[var(--color-text-muted)] ml-3" aria-hidden="true"></i>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {sessions.length > 3 && (
                            <div className="text-center mt-3">
                                <Button
                                    onClick={() => onNavigate(View.Calendar)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    View all {sessions.length} sessions
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State - First Time User Tips */}
                {!hasSessions && (
                    <Card variant="glass" padding="lg" className="text-center backdrop-blur-md bg-white/5">
                        <div className="mb-4">
                            <div className="mx-auto w-20 h-20 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                <i className="fa-regular fa-lightbulb text-4xl text-[var(--color-primary)]" aria-hidden="true"></i>
                            </div>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                            No Sessions Yet
                        </h3>
                        <p className="text-lg text-[var(--color-text-secondary)] mb-8 font-medium">
                            Start your first practice to track your progress and improve your MI skills!
                        </p>
                        <div className="bg-white/10 dark:bg-slate-800/20 border border-white/10 dark:border-slate-800/30 rounded-lg p-6 mb-8 backdrop-blur-sm">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">How it works:</p>
                            <ul className="text-sm text-[var(--color-text-secondary)] text-left space-y-2">
                                <li className="flex items-start gap-2">
                                    <i className="fa-solid fa-play text-[var(--color-primary)] mt-0.5" aria-hidden="true"></i>
                                    <span>Start a practice session with an AI patient</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <i className="fa-solid fa-comments text-[var(--color-primary)] mt-0.5" aria-hidden="true"></i>
                                    <span>Practice your MI conversation skills</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <i className="fa-solid fa-chart-line text-[var(--color-primary)] mt-0.5" aria-hidden="true"></i>
                                    <span>Get AI-powered feedback to improve</span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <Button
                                onClick={onStartPractice}
                                variant="primary"
                                size="lg"
                                fullWidth
                                icon={<i className="fa-solid fa-play" aria-hidden="true"></i>}
                            >
                                Start Your First Practice
                            </Button>
                            <Button
                                onClick={() => onNavigate(View.ResourceLibrary)}
                                variant="ghost"
                                size="md"
                                fullWidth
                                icon={<i className="fa-solid fa-book-open" aria-hidden="true"></i>}
                            >
                                Browse Learning Resources
                            </Button>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
