'use client';

import React, { useMemo } from 'react';
import { Session, BehavioralMetrics } from '../../types';

interface GlobalMIScoreProps {
  sessions: Session[];
  onSettingsClick?: () => void;
}

interface TrendResult {
  percentage: number;
  isPositive: boolean;
}

// Compute a composite MI score (0-100) from behavioral metrics
const computeCompositeScore = (metrics: BehavioralMetrics): number => {
  // Reflection-to-question ratio: target 2.0 = 100%, weight 40%
  const ratioScore = Math.min(metrics.reflectionToQuestionRatio / 2.0, 1.0) * 100;

  // Complex reflection ratio: target 50% of total reflections, weight 25%
  const totalReflections = metrics.simpleReflections + metrics.complexReflections;
  const complexRatio = totalReflections > 0
    ? metrics.complexReflections / totalReflections
    : 0;
  const complexScore = Math.min(complexRatio / 0.5, 1.0) * 100;

  // MI adherent ratio: adherent / (adherent + inconsistent), weight 25%
  const totalMI = metrics.miAdherentStatements + metrics.miInconsistentStatements;
  const adherentRatio = totalMI > 0
    ? metrics.miAdherentStatements / totalMI
    : 1.0; // No MI statements = neutral
  const adherentScore = adherentRatio * 100;

  // Open question ratio: target 70% open, weight 10%
  const totalQuestions = metrics.openQuestions + metrics.closedQuestions;
  const openRatio = totalQuestions > 0
    ? metrics.openQuestions / totalQuestions
    : 0;
  const openScore = Math.min(openRatio / 0.7, 1.0) * 100;

  return Math.round(
    ratioScore * 0.4 +
    complexScore * 0.25 +
    adherentScore * 0.25 +
    openScore * 0.1
  );
};

// Get composite score for a session, falling back to empathyScore for old sessions
const getSessionScore = (session: Session): number | null => {
  if (session.feedback?.behavioralMetrics) {
    return computeCompositeScore(session.feedback.behavioralMetrics);
  }
  // Legacy fallback
  if (session.feedback?.empathyScore && session.feedback.empathyScore > 0) {
    return Math.round(session.feedback.empathyScore * 20);
  }
  return null;
};

// Calculate average MI score across all sessions
const calculateGlobalMIScore = (sessions: Session[]): number => {
  const scores = sessions
    .map(getSessionScore)
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
};

// Calculate trend: last 7 days vs previous 7 days
const calculateTrend = (sessions: Session[]): TrendResult | null => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const last7Days = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= sevenDaysAgo && d < now && getSessionScore(s) !== null;
  });

  const previous7Days = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo && getSessionScore(s) !== null;
  });

  if (last7Days.length === 0 || previous7Days.length === 0) return null;

  const last7Avg = last7Days.reduce((sum, s) => sum + (getSessionScore(s) ?? 0), 0) / last7Days.length;
  const prev7Avg = previous7Days.reduce((sum, s) => sum + (getSessionScore(s) ?? 0), 0) / previous7Days.length;

  const difference = Math.round(last7Avg - prev7Avg);
  return {
    percentage: Math.abs(difference),
    isPositive: difference >= 0,
  };
};

// Analyze skill trends to generate descriptive message
const analyzeSkillTrends = (sessions: Session[]): string => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const last7Days = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= sevenDaysAgo && d < now;
  });

  const previous7Days = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  if (last7Days.length === 0) {
    return 'Complete more sessions to see your skill trends.';
  }

  const aggregateSkillCounts = (sessionList: Session[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    sessionList.forEach((session) => {
      if (session.feedback?.skillCounts) {
        Object.entries(session.feedback.skillCounts).forEach(([skill, count]) => {
          counts[skill] = (counts[skill] || 0) + count;
        });
      }
    });
    return counts;
  };

  const last7DaysSkills = aggregateSkillCounts(last7Days);
  const previous7DaysSkills = aggregateSkillCounts(previous7Days);

  const last7DaysAvg: Record<string, number> = {};
  const previous7DaysAvg: Record<string, number> = {};

  Object.keys(last7DaysSkills).forEach((skill) => {
    last7DaysAvg[skill] = last7DaysSkills[skill] / last7Days.length;
  });

  Object.keys(previous7DaysSkills).forEach((skill) => {
    previous7DaysAvg[skill] = previous7DaysSkills[skill] / previous7Days.length;
  });

  let maxImprovement = 0;
  let improvedSkill = '';

  Object.keys(last7DaysAvg).forEach((skill) => {
    const currentAvg = last7DaysAvg[skill];
    const previousAvg = previous7DaysAvg[skill] || 0;
    const improvement = currentAvg - previousAvg;
    if (improvement > maxImprovement) {
      maxImprovement = improvement;
      improvedSkill = skill;
    }
  });

  if (maxImprovement <= 0) {
    let maxDecline = 0;
    let declinedSkill = '';

    Object.keys(previous7DaysAvg).forEach((skill) => {
      const currentAvg = last7DaysAvg[skill] || 0;
      const previousAvg = previous7DaysAvg[skill];
      const decline = previousAvg - currentAvg;
      if (decline > maxDecline) {
        maxDecline = decline;
        declinedSkill = skill;
      }
    });

    if (maxDecline > 0.1) {
      return `Your MI skill markers show a decline in ${declinedSkill}. Focus on practicing this skill.`;
    }

    if (previous7Days.length === 0) {
      return 'Your MI skill markers are developing. Keep practicing to see trends.';
    }
    return 'Your MI skill markers are stable. Continue practicing to see improvement.';
  }

  if (maxImprovement > 0.5) {
    return `Your MI skill markers are showing strong improvement in ${improvedSkill}.`;
  } else if (maxImprovement > 0.2) {
    return `Your MI skill markers are showing improvement in ${improvedSkill}.`;
  } else {
    return `Your MI skill markers are developing in ${improvedSkill}.`;
  }
};

// Circular progress component
const RadialProgress: React.FC<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}> = ({ value, max, size = 160, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-neutral-200)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[var(--color-text-primary)]">{value}%</span>
      </div>
    </div>
  );
};

const GlobalMIScore: React.FC<GlobalMIScoreProps> = ({
  sessions,
  onSettingsClick,
}) => {
  const globalScore = useMemo(() => calculateGlobalMIScore(sessions), [sessions]);
  const trend = useMemo(() => calculateTrend(sessions), [sessions]);
  const skillMessage = useMemo(() => analyzeSkillTrends(sessions), [sessions]);

  return (
    <div className="bg-white rounded-xl border border-[var(--color-neutral-200)] p-6 mb-8 shadow-sm flex items-center gap-6">
      <div className="flex-shrink-0">
        <RadialProgress value={globalScore} max={100} size={80} strokeWidth={8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Global MI Score
          </h3>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-1"
              aria-label="Settings"
            >
              <i className="fa-solid fa-gear text-sm" aria-hidden="true"></i>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-2">
          {trend ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)]">
              <i
                className={`fa-solid fa-arrow-${trend.isPositive ? 'up' : 'down'}`}
                style={{ color: trend.isPositive ? 'var(--color-success)' : 'var(--color-error)', fontSize: '10px' }}
                aria-hidden="true"
              ></i>
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {trend.percentage}% vs last week
              </span>
            </div>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">
              No trend data yet
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
          {skillMessage}
        </p>
      </div>
    </div>
  );
};

export default GlobalMIScore;
