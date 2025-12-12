import React from 'react';
import { Session, UserTier, View } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useStreak } from '../../hooks/useStreak';
import { useXP } from '../../hooks/useXP';
import { useBadges } from '../../hooks/useBadges';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import BadgeDisplay from '../gamification/BadgeDisplay';

interface DashboardProps {
    onStartPractice: () => void;
    userTier: UserTier;
    sessions: Session[];
    remainingFreeSessions: number | null;
    onNavigateToPaywall: () => void;
    onNavigate?: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    onStartPractice, 
    userTier, 
    sessions, 
    remainingFreeSessions, 
    onNavigateToPaywall,
    onNavigate 
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
        <div className="min-h-screen bg-transparent pb-24">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        Welcome, {firstName}!
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Ready to sharpen your MI skills?
                    </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-none border-2 border-black ${
                    isPremium 
                        ? 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]' 
                        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]'
                }`}>
                    {isPremium ? 'Premium' : 'Free'}
                </span>
            </div>

            <main className="px-6 max-w-lg mx-auto">
                {/* Hero CTA Block */}
                <Card variant="elevated" padding="lg" className="mb-6 border-2 border-black">
                    <div className="text-center">
                        <div className="mb-4">
                            <i className="fa-solid fa-user-doctor text-4xl text-[var(--color-primary)]" aria-hidden="true"></i>
                        </div>
                        {user ? (
                            <>
                                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                                    Start Practicing
                                </h2>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                    Kick off a new MI scenario now
                                </p>
                                
                                <Button
                                    onClick={onStartPractice}
                                    disabled={!isPremium && displayRemaining === 0}
                                    variant="primary"
                                    size="lg"
                                    fullWidth
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
                                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                                    Sign in to Start Practicing
                                </h2>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                    Create a free account to practice Motivational Interviewing with AI-powered patient simulations
                                </p>
                                
                                <Button
                                    onClick={() => onNavigate && onNavigate(View.Login)}
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

                        {hasSessions && onNavigate && (
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
                        variant="accent" 
                        padding="md" 
                        hoverable 
                        onClick={onNavigateToPaywall}
                        className="mb-6 border-2 border-[var(--color-error)] bg-gradient-to-r from-red-50 to-orange-50"
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
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <Card variant="default" padding="sm" className="text-center">
                            <div className="flex items-center justify-center mb-1">
                                <i className="fa-solid fa-calendar-check text-[var(--color-primary)] text-sm" aria-hidden="true"></i>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{sessionsThisMonth}</p>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">This Month</p>
                        </Card>
                        <Card variant="default" padding="sm" className="text-center">
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
                        <Card variant="default" padding="sm" className="text-center">
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

                {/* Level Progress */}
                <Card variant="default" padding="md" className="mb-6">
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
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-neutral-200, #e5e7eb)' }}
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
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-3 px-1">
                        Your Badges
                    </h3>
                    <Card variant="default" padding="md">
                        <BadgeDisplay showAll={true} />
                    </Card>
                </div>

                {/* Recent Sessions Preview */}
                {hasSessions && recentSessions.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-3 px-1">
                            Recent Sessions
                        </h3>
                        <div className="space-y-2">
                            {recentSessions.map(session => (
                                <Card
                                    key={session.id}
                                    variant="default"
                                    padding="sm"
                                    hoverable
                                    onClick={() => onNavigate?.(View.Calendar)}
                                    className="text-left"
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
                        
                        {sessions.length > 3 && onNavigate && (
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
                    <Card variant="accent" padding="lg" className="text-center">
                        <div className="mb-4">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                <i className="fa-regular fa-lightbulb text-3xl text-[var(--color-primary)]" aria-hidden="true"></i>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                            Welcome to MI Practice Coach!
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                            Here's how to get started:
                        </p>
                        <ul className="text-sm text-[var(--color-text-secondary)] text-left space-y-2 mb-4">
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-primary)] font-bold">1.</span>
                                <span>Tap "Start a New Practice" above</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-primary)] font-bold">2.</span>
                                <span>Review your patient's profile</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-primary)] font-bold">3.</span>
                                <span>Practice your MI conversation skills</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[var(--color-primary)] font-bold">4.</span>
                                <span>Get AI-powered feedback to improve</span>
                            </li>
                        </ul>
                        {onNavigate && (
                            <Button
                                onClick={() => onNavigate(View.ResourceLibrary)}
                                variant="ghost"
                                size="sm"
                                icon={<i className="fa-solid fa-book-open" aria-hidden="true"></i>}
                            >
                                Browse Learning Resources
                            </Button>
                        )}
                    </Card>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
