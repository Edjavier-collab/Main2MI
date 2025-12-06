import React from 'react';
import { Session, UserTier } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { HeaderWave, GrowthLogo, SeedlingIcon, BranchDecoration } from '../illustrations/GrowthIllustrations';
import { SoftCard } from '../ui/SoftCard';
import { PillButton } from '../ui/PillButton';
import './Dashboard.css';

interface DashboardProps {
    onStartPractice: () => void;
    userTier: UserTier;
    sessions: Session[];
    remainingFreeSessions: number | null;
    onNavigateToPaywall: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    onStartPractice, 
    userTier, 
    sessions, 
    remainingFreeSessions, 
    onNavigateToPaywall 
}) => {
    const { user } = useAuth();
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Guest';
    
    const displayRemaining = remainingFreeSessions !== null 
        ? remainingFreeSessions 
        : (() => {
            const freeSessionsThisMonth = sessions.filter(s => {
                const sessionDate = new Date(s.date);
                const now = new Date();
                return s.tier === UserTier.Free && sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
            }).length;
            return Math.max(0, 3 - freeSessionsThisMonth);
        })();

    // Calculate stats
    const sessionsThisWeek = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
    }).length;

    // Calculate current streak (simplified - counts consecutive days with sessions)
    const currentStreak = 0; // TODO: Implement proper streak calculation

    // Calculate average score
    const scoredSessions = sessions.filter(s => s.score !== undefined && s.score !== null);
    const avgScore = scoredSessions.length > 0
        ? scoredSessions.reduce((sum, s) => sum + (s.score || 0), 0) / scoredSessions.length
        : 0;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const canStartPractice = userTier === UserTier.Premium || displayRemaining > 0;

    return (
        <div className="dashboard">
            {/* Header with wave */}
            <div className="dashboard__header">
                <HeaderWave className="dashboard__wave" />
                <div className="dashboard__header-content">
                    <GrowthLogo size={60} className="dashboard__logo" />
                    <h1 className="dashboard__greeting">{getGreeting()}, {firstName}!</h1>
                    <p className="dashboard__subtitle">Ready to grow your MI skills?</p>
                </div>
            </div>

            {/* Main content */}
            <div className="dashboard__content">
                {/* Start Practice Card */}
                <SoftCard variant="elevated" className="dashboard__practice-card">
                    <div className="dashboard__practice-inner">
                        <SeedlingIcon size={48} />
                        <div className="dashboard__practice-text">
                            <h2>Start a New Practice</h2>
                            <p>Choose a patient scenario and practice your MI techniques</p>
                            {userTier === UserTier.Free && (
                                <p className="dashboard__remaining-sessions">
                                    {displayRemaining} of 3 free sessions remaining this month
                                </p>
                            )}
                        </div>
                    </div>
                    <PillButton 
                        onClick={onStartPractice} 
                        fullWidth 
                        size="lg"
                        disabled={!canStartPractice}
                    >
                        🌱 Start Practice Session
                    </PillButton>
                </SoftCard>

                {/* Free tier limit reached warning */}
                {userTier === UserTier.Free && displayRemaining === 0 && (
                    <SoftCard variant="accent" className="dashboard__limit-warning">
                        <div className="dashboard__limit-warning-content">
                            <span className="dashboard__limit-icon">⚠️</span>
                            <div className="dashboard__limit-text">
                                <h3>Free practices limit reached</h3>
                                <p>Upgrade to Premium for unlimited access</p>
                            </div>
                            <PillButton 
                                onClick={onNavigateToPaywall} 
                                variant="secondary" 
                                size="sm"
                            >
                                Upgrade
                            </PillButton>
                        </div>
                    </SoftCard>
                )}

                {/* Stats Row */}
                <div className="dashboard__stats">
                    <SoftCard className="dashboard__stat-card">
                        <span className="dashboard__stat-icon">🌿</span>
                        <span className="dashboard__stat-value">{currentStreak}</span>
                        <span className="dashboard__stat-label">Day Streak</span>
                    </SoftCard>
                    
                    <SoftCard className="dashboard__stat-card">
                        <span className="dashboard__stat-icon">📊</span>
                        <span className="dashboard__stat-value">{sessionsThisWeek}</span>
                        <span className="dashboard__stat-label">This Week</span>
                    </SoftCard>
                    
                    <SoftCard className="dashboard__stat-card">
                        <span className="dashboard__stat-icon">⭐</span>
                        <span className="dashboard__stat-value">{avgScore.toFixed(1)}</span>
                        <span className="dashboard__stat-label">Avg Score</span>
                    </SoftCard>
                </div>

                {/* Quick Tips Card */}
                <SoftCard variant="accent" className="dashboard__tips-card">
                    <h3>💡 Quick Tip</h3>
                    <p>Try using more complex reflections today. Instead of repeating what the patient says, reflect the underlying emotion or meaning.</p>
                </SoftCard>
            </div>

            {/* Decorative elements */}
            <BranchDecoration className="dashboard__decoration-left" />
            <BranchDecoration className="dashboard__decoration-right" flip />
        </div>
    );
};

export default Dashboard;
