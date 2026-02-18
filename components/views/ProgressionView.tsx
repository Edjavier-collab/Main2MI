'use client';

import React from 'react';
import { Session } from '../../types';
import { useXP } from '../../hooks/useXP';
import { useStreak } from '../../hooks/useStreak';
import { useBadges } from '../../hooks/useBadges';
import { useSkillProgression, MI_SKILLS, SkillTrendPoint } from '../../hooks/useSkillProgression';
import { Button } from '../ui/Button';
import BadgeDisplay from '../gamification/BadgeDisplay';
import SkillProgressBar from '../ui/SkillProgressBar';

interface ProgressionViewProps {
  sessions: Session[];
  onBack: () => void;
}

function computeSkillTrend(
  skillTrend: SkillTrendPoint[],
  skill: string
): 'increasing' | 'stable' | 'decreasing' {
  if (skillTrend.length < 2) return 'stable';

  const midpoint = Math.floor(skillTrend.length / 2);
  const olderPoints = skillTrend.slice(0, midpoint);
  const newerPoints = skillTrend.slice(midpoint);

  const olderAvg =
    olderPoints.reduce((sum, p) => sum + (p.counts[skill] ?? 0), 0) / olderPoints.length;
  const newerAvg =
    newerPoints.reduce((sum, p) => sum + (p.counts[skill] ?? 0), 0) / newerPoints.length;

  const delta = newerAvg - olderAvg;
  if (delta > 0.5) return 'increasing';
  if (delta < -0.5) return 'decreasing';
  return 'stable';
}

function scoreToColor(score: number): string {
  if (score >= 4) return 'var(--color-success)';
  if (score >= 3) return 'var(--color-primary)';
  return 'var(--color-warning)';
}

const ProgressionView: React.FC<ProgressionViewProps> = ({ sessions, onBack }) => {
  const { currentXP, currentLevel, levelName, xpToNextLevel, xpProgress } = useXP();
  const { currentStreak, longestStreak } = useStreak();
  const { unlockedCertificates } = useBadges();
  const {
    skillTotals,
    skillTrend,
    mostUsedSkill,
    leastUsedSkill,
    avgEmpathyScore,
    empathyTrend,
  } = useSkillProgression(sessions);

  const levelIcons = ['🌱', '🌿', '🌳', '🏆'];
  const levelIcon = levelIcons[currentLevel - 1] || '🌱';
  const maxCount = Math.max(...Object.values(skillTotals), 1);

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] pb-24">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            icon={<i className="fa-solid fa-arrow-left" />}
            aria-label="Go back"
            className="mb-6 pl-0"
          >
            Back
          </Button>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Skill Progression
          </h1>

          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-chart-bar text-4xl text-[var(--color-text-muted)]"></i>
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              No sessions yet
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">
              Complete practice sessions to see your skill progression and trend data.
            </p>
            <Button variant="primary" onClick={onBack} className="mt-6">
              Start Practicing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-24">
      <div className="max-w-3xl mx-auto px-6 py-4">
        {/* Back + Header */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<i className="fa-solid fa-arrow-left" />}
          aria-label="Go back"
          className="mb-6 pl-0"
        >
          Back
        </Button>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Skill Progression
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} analyzed
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* XP Level */}
          <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-lighter)] flex items-center justify-center text-2xl mb-3">
              {levelIcon}
            </div>
            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              Level {currentLevel}
            </h3>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              {levelName}
            </p>
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
                <span>{currentXP} XP</span>
                <span>{xpToNextLevel} to next</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <i className="fa-solid fa-fire text-orange-500 text-xl"></i>
            </div>
            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {currentStreak}
            </h3>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Day Streak
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Longest: {longestStreak} days
            </p>
          </div>

          {/* Avg Empathy */}
          <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
              <i className="fa-solid fa-heart text-purple-500 text-xl"></i>
            </div>
            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {avgEmpathyScore.toFixed(1)}
            </h3>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Avg Empathy
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">out of 5.0</p>
          </div>
        </div>

        {/* Empathy Trend */}
        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Empathy Trend</h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              Last {empathyTrend.length} session{empathyTrend.length !== 1 ? 's' : ''}
            </span>
          </div>

          {empathyTrend.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-chart-line text-4xl text-[var(--color-neutral-200)] mb-3 block"></i>
              <p className="text-sm text-[var(--color-text-muted)]">
                Complete sessions to see your empathy trend
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2 h-32 relative">
                {/* Reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="flex items-center">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-4 mr-1">5</span>
                    <div className="flex-1 border-t border-dashed border-[var(--color-neutral-100)]" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-4 mr-1">3</span>
                    <div className="flex-1 border-t border-dashed border-[var(--color-neutral-100)]" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-4 mr-1">1</span>
                    <div className="flex-1 border-t border-dashed border-[var(--color-neutral-100)]" />
                  </div>
                </div>

                {/* Bars */}
                <div className="flex items-end gap-2 flex-1 h-full ml-6">
                  {empathyTrend.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center flex-1 h-full justify-end"
                    >
                      <div
                        className="w-full rounded-t-md transition-all duration-500 ease-out"
                        style={{
                          height: `${Math.max((point.score / 5) * 100, 4)}%`,
                          backgroundColor: scoreToColor(point.score),
                          minHeight: '4px',
                        }}
                        role="img"
                        aria-label={`${point.label}: ${point.score}/5`}
                        title={`${point.label}: ${point.score}/5`}
                      />
                      <span className="text-[10px] text-[var(--color-text-muted)] mt-1 truncate w-full text-center">
                        {idx === 0 || idx === empathyTrend.length - 1 ? point.label : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  />
                  4-5 Strong
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  3 Good
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: 'var(--color-warning)' }}
                  />
                  1-2 Needs focus
                </span>
              </div>
            </>
          )}
        </div>

        {/* MI Skills Breakdown */}
        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              MI Skills Breakdown
            </h2>
            {mostUsedSkill && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                Strongest: {mostUsedSkill}
              </span>
            )}
          </div>

          {leastUsedSkill && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-[var(--color-primary-lighter)] border border-[var(--color-primary-light)]">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-bullseye text-[var(--color-primary-dark)]"></i>
                <span className="text-sm font-medium text-[var(--color-primary-darker)]">
                  Focus area:
                </span>
                <span className="text-sm text-[var(--color-primary-dark)]">
                  {leastUsedSkill} — practice this skill in your next session
                </span>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {MI_SKILLS.map(skill => {
              const total = skillTotals[skill] ?? 0;
              const avgPerSession = sessions.length > 0 ? total / sessions.length : 0;
              const trend = computeSkillTrend(skillTrend, skill);

              return (
                <SkillProgressBar
                  key={skill}
                  skillName={skill}
                  totalCount={total}
                  averagePerSession={avgPerSession}
                  trend={trend}
                  maxCount={maxCount}
                />
              );
            })}
          </div>
        </div>

        {/* Badges & Certificates */}
        <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Certificates & Badges
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {unlockedCertificates.length} earned
            </span>
          </div>
          <BadgeDisplay showAll={true} />
        </div>
      </div>
    </div>
  );
};

export default ProgressionView;
