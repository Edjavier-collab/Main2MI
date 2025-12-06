import React from 'react';

import { HeaderWave, SeedlingIcon, GrowingPlant, FlourishingPlant } from '../illustrations/GrowthIllustrations';
import { SoftCard } from '../ui/SoftCard';
import { PillButton } from '../ui/PillButton';
import './CalendarView.css';

interface Session {
  id: string;
  date: string;
  patientAge: number;
  patientGender: string;
  issue: string;
  stage: string;
  score?: number;
}

interface CalendarViewProps {
  sessions: Session[];
  onSessionClick: (id: string) => void;
  onGenerateSummary: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  onSessionClick,
  onGenerateSummary,
}) => {
  const getPlantIcon = (score?: number) => {
    if (!score) return <SeedlingIcon size={32} />;
    if (score >= 4) return <FlourishingPlant size={32} />;
    if (score >= 3) return <GrowingPlant size={32} />;
    return <SeedlingIcon size={32} />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="calendar-view__header">
        <HeaderWave className="calendar-view__wave" />
        <div className="calendar-view__header-content">
          <h1>My Sessions</h1>
          <p>Review your practice history</p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="calendar-view__content">
        {sessions.length === 0 ? (
          <div className="calendar-view__empty">
            <SeedlingIcon size={80} />
            <h3>No sessions yet</h3>
            <p>Start your first practice session to begin growing your skills!</p>
          </div>
        ) : (
          <div className="calendar-view__sessions">
            {sessions.map((session) => (
              <SoftCard
                key={session.id}
                className="calendar-view__session-card"
                hoverable
                onClick={() => onSessionClick(session.id)}
              >
                <div className="calendar-view__session-icon">
                  {getPlantIcon(session.score)}
                </div>
                <div className="calendar-view__session-info">
                  <span className="calendar-view__session-date">
                    {formatDate(session.date)}
                  </span>
                  <span className="calendar-view__session-patient">
                    {session.patientAge} Y/O {session.patientGender}, {session.issue}
                  </span>
                  <span className="calendar-view__session-stage">
                    {session.stage}
                  </span>
                </div>
                {session.score && (
                  <div className="calendar-view__session-score">
                    <span className="score-value">{session.score}</span>
                    <span className="score-max">/5</span>
                  </div>
                )}
              </SoftCard>
            ))}
          </div>
        )}

        {/* Generate Summary Button */}
        {sessions.length > 0 && (
          <div className="calendar-view__actions">
            <PillButton onClick={onGenerateSummary} fullWidth>
              ✨ Generate Coaching Summary
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
};
