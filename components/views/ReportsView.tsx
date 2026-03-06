'use client';

import React from 'react';
import { Session, UserTier, View } from '../../types';
import { useSkillProgression, MI_SKILLS } from '../../hooks/useSkillProgression';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import SkillProgressBar from '../ui/SkillProgressBar';

interface ReportsViewProps {
  sessions: Session[];
  userTier: UserTier;
  isPremiumVerified: boolean;
  onBack: () => void;
  onUpgrade: () => void;
  onNavigate: (view: View) => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({
  sessions,
  userTier,
  isPremiumVerified,
  onBack,
  onUpgrade,
  onNavigate,
}) => {
  const isPremium = isPremiumVerified || userTier === UserTier.Premium;
  const { skillTotals, mostUsedSkill, leastUsedSkill } = useSkillProgression(sessions);

  // Compute stats
  const totalSessions = sessions.length;
  const totalMinutes = totalSessions * 15;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const practiceTimeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Count unique skills used across all sessions
  const uniqueSkillsUsed = MI_SKILLS.filter(skill => skillTotals[skill] > 0).length;

  // Max count for normalizing progress bars
  const maxSkillCount = Math.max(...Object.values(skillTotals), 1);

  // Compute skill trends (increasing/stable/decreasing) from last 3 sessions vs prior
  const getSkillTrend = (skill: string): 'increasing' | 'stable' | 'decreasing' => {
    if (sessions.length < 3) return 'stable';
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const early = sorted.slice(0, mid);
    const late = sorted.slice(mid);
    const earlyAvg = early.reduce((s, sess) => s + (sess.feedback?.skillCounts?.[skill] ?? 0), 0) / (early.length || 1);
    const lateAvg = late.reduce((s, sess) => s + (sess.feedback?.skillCounts?.[skill] ?? 0), 0) / (late.length || 1);
    const diff = lateAvg - earlyAvg;
    if (diff > 0.3) return 'increasing';
    if (diff < -0.3) return 'decreasing';
    return 'stable';
  };

  // Sorted skills by total count (descending)
  const sortedSkills = [...MI_SKILLS].sort((a, b) => skillTotals[b] - skillTotals[a]);

  // Top strengths (top 3 with count > 0) and areas to develop (bottom 2)
  const strengths = sortedSkills.filter(s => skillTotals[s] > 0).slice(0, 3);
  const areasToDevlop = sortedSkills.filter(s => skillTotals[s] >= 0).slice(-2);

  // Recent sessions (3 most recent)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Empty state
  if (totalSessions === 0) {
    return (
      <div className="min-h-screen bg-transparent pb-24">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                icon={<i className="fa-solid fa-arrow-left" />}
                aria-label="Go back"
                className="mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              />
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Practice Development
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] ml-11">
              Track your MI skill progression
            </p>
          </header>

          <Card variant="accent" padding="lg" className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-chart-line text-4xl text-[var(--color-primary)]" aria-hidden="true" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              No Practice Data Yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Complete sessions to track your development and see your MI skill progression.
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onNavigate(View.ScenarioSelection)}
              icon={<i className="fa-solid fa-play" aria-hidden="true" />}
            >
              Start Practice
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-2">
          <div className="flex items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              icon={<i className="fa-solid fa-arrow-left" />}
              aria-label="Go back"
              className="mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Practice Development
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] ml-11">
            Track your MI skill progression
          </p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="default" padding="md" className="text-center">
            <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-calendar-check text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{totalSessions}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Sessions</p>
          </Card>

          <Card variant="default" padding="md" className="text-center">
            <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-clock text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{practiceTimeLabel}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Practice Time</p>
          </Card>

          <Card variant="default" padding="md" className="text-center">
            <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-chart-bar text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{uniqueSkillsUsed}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Skills Used</p>
          </Card>
        </div>

        {/* Skills Practiced */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-5">
            Skills Practiced
          </h2>

          <div className="space-y-4">
            {sortedSkills.map(skill => (
              <SkillProgressBar
                key={skill}
                skillName={skill}
                totalCount={skillTotals[skill]}
                averagePerSession={totalSessions > 0 ? skillTotals[skill] / totalSessions : 0}
                trend={getSkillTrend(skill)}
                maxCount={maxSkillCount}
              />
            ))}
          </div>

          {/* Strengths & Areas to Develop */}
          {(strengths.length > 0 || areasToDevlop.length > 0) && (
            <div className="mt-6 pt-5 border-t border-[var(--color-neutral-100)] flex flex-wrap gap-2">
              {strengths.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[rgba(34,197,94,0.1)] text-[var(--color-success-dark)]"
                >
                  <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
                  {skill}
                </span>
              ))}
              {areasToDevlop.filter(s => !strengths.includes(s)).map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[rgba(245,158,11,0.1)] text-[var(--color-warning-dark)]"
                >
                  <i className="fa-solid fa-arrow-up text-[10px]" aria-hidden="true" />
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Practice Log */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Recent Practice
            </h2>
            <button
              onClick={() => onNavigate(View.Calendar)}
              className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentSessions.map(session => (
              <button
                key={session.id}
                onClick={() => onNavigate(View.Calendar)}
                className="w-full text-left p-4 rounded-xl bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {session.patient?.topic || 'Practice Session'}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] ml-2 shrink-0">
                    {new Date(session.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {session.patient?.stageOfChange && (
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                    Stage: {session.patient.stageOfChange}
                  </p>
                )}
                {session.feedback?.focusForNextSession && (
                  <p className="text-xs text-[var(--color-text-muted)] italic line-clamp-2">
                    &ldquo;{session.feedback.focusForNextSession}&rdquo;
                  </p>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Print Report */}
        {isPremium ? (
          <button
            onClick={() => onNavigate(View.PrintableReport)}
            className="w-full p-5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors text-white text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-print text-lg" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Print Report</p>
                <p className="text-xs opacity-80">Present to supervisors for documentation</p>
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onUpgrade}
            className="w-full p-5 rounded-xl bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-lock text-[var(--color-primary)]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Print Report</p>
                <p className="text-xs text-[var(--color-text-muted)]">Upgrade to Premium to generate supervisor reports</p>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
