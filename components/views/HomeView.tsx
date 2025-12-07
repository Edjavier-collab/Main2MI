import React from 'react';

import { GrowthLogo, SeedlingIcon, BranchDecoration } from '../illustrations/GrowthIllustrations';
import { SoftCard } from '../ui/SoftCard';
import { PillButton } from '../ui/PillButton';
import './HomeView.css';

interface HomeViewProps {
  userName: string;
  sessionsThisWeek: number;
  currentStreak: number;
  avgScore: number;
  onStartPractice: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userName,
  sessionsThisWeek,
  currentStreak,
  avgScore,
  onStartPractice,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="home-view">
      {/* Header */}
      <div className="home-view__header">
        <div className="home-view__header-content">
          <GrowthLogo size={60} className="home-view__logo" />
          <h1 className="home-view__greeting">{getGreeting()}, {userName}!</h1>
          <p className="home-view__subtitle">Ready to grow your MI skills?</p>
        </div>
      </div>

      {/* Main content */}
      <div className="home-view__content">
        {/* Start Practice Card */}
        <SoftCard variant="elevated" className="home-view__practice-card">
          <div className="home-view__practice-inner">
            <SeedlingIcon size={48} />
            <div className="home-view__practice-text">
              <h2>Start a New Practice</h2>
              <p>Choose a patient scenario and practice your MI techniques</p>
            </div>
          </div>
          <PillButton onClick={onStartPractice} fullWidth size="lg">
            🌱 Start Practice Session
          </PillButton>
        </SoftCard>

        {/* Stats Row */}
        <div className="home-view__stats">
          <SoftCard className="home-view__stat-card">
            <span className="home-view__stat-icon">🌿</span>
            <span className="home-view__stat-value">{currentStreak}</span>
            <span className="home-view__stat-label">Day Streak</span>
          </SoftCard>
          
          <SoftCard className="home-view__stat-card">
            <span className="home-view__stat-icon">📊</span>
            <span className="home-view__stat-value">{sessionsThisWeek}</span>
            <span className="home-view__stat-label">This Week</span>
          </SoftCard>
          
          <SoftCard className="home-view__stat-card">
            <span className="home-view__stat-icon">⭐</span>
            <span className="home-view__stat-value">{avgScore.toFixed(1)}</span>
            <span className="home-view__stat-label">Avg Score</span>
          </SoftCard>
        </div>

        {/* Quick Tips Card */}
        <SoftCard variant="accent" className="home-view__tips-card">
          <h3>💡 Quick Tip</h3>
          <p>Try using more complex reflections today. Instead of repeating what the patient says, reflect the underlying emotion or meaning.</p>
        </SoftCard>
      </div>

      {/* Decorative elements */}
      <BranchDecoration className="home-view__decoration-left" />
      <BranchDecoration className="home-view__decoration-right" flip />
    </div>
  );
};

