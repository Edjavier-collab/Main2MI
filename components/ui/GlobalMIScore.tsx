import React, { useMemo } from 'react';
import { Session } from '../../types';

interface GlobalMIScoreProps {
  sessions: Session[];
  onSettingsClick?: () => void;
}

interface TrendResult {
  percentage: number;
  isPositive: boolean;
}

// Convert empathy score (1-5) to percentage (0-100)
const empathyToPercentage = (score: number): number => {
  return Math.round(score * 20);
};

// Calculate average empathy score across all sessions and convert to percentage
const calculateGlobalMIScore = (sessions: Session[]): number => {
  const sessionsWithScore = sessions.filter(
    (s) => s.feedback?.empathyScore !== undefined && s.feedback.empathyScore > 0
  );

  if (sessionsWithScore.length === 0) {
    return 0;
  }

  const avgScore =
    sessionsWithScore.reduce(
      (sum, s) => sum + (s.feedback.empathyScore || 0),
      0
    ) / sessionsWithScore.length;

  return empathyToPercentage(avgScore);
};

// Calculate trend: last 7 days vs previous 7 days (8-14 days ago)
const calculateTrend = (sessions: Session[]): TrendResult | null => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Filter sessions from last 7 days
  const last7Days = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    return (
      sessionDate >= sevenDaysAgo &&
      sessionDate < now &&
      s.feedback?.empathyScore !== undefined &&
      s.feedback.empathyScore > 0
    );
  });

  // Filter sessions from previous 7 days (8-14 days ago)
  const previous7Days = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    return (
      sessionDate >= fourteenDaysAgo &&
      sessionDate < sevenDaysAgo &&
      s.feedback?.empathyScore !== undefined &&
      s.feedback.empathyScore > 0
    );
  });

  // Need at least one session in each period to calculate trend
  if (last7Days.length === 0 || previous7Days.length === 0) {
    return null;
  }

  const last7DaysAvg =
    last7Days.reduce(
      (sum, s) => sum + (s.feedback.empathyScore || 0),
      0
    ) / last7Days.length;

  const previous7DaysAvg =
    previous7Days.reduce(
      (sum, s) => sum + (s.feedback.empathyScore || 0),
      0
    ) / previous7Days.length;

  const last7DaysPercent = empathyToPercentage(last7DaysAvg);
  const previous7DaysPercent = empathyToPercentage(previous7DaysAvg);

  const difference = last7DaysPercent - previous7DaysPercent;

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

  // Get sessions from last 7 days
  const last7Days = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    return sessionDate >= sevenDaysAgo && sessionDate < now;
  });

  // Get sessions from previous 7 days
  const previous7Days = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    return sessionDate >= fourteenDaysAgo && sessionDate < sevenDaysAgo;
  });

  if (last7Days.length === 0) {
    return 'Complete more sessions to see your skill trends.';
  }

  // Aggregate skill counts for each period
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

  // Calculate average per session for each skill
  const last7DaysAvg: Record<string, number> = {};
  const previous7DaysAvg: Record<string, number> = {};

  Object.keys(last7DaysSkills).forEach((skill) => {
    last7DaysAvg[skill] = last7DaysSkills[skill] / last7Days.length;
  });

  Object.keys(previous7DaysSkills).forEach((skill) => {
    previous7DaysAvg[skill] = previous7DaysSkills[skill] / previous7Days.length;
  });

  // Find skill with largest improvement
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

  // If no improvement found, check for decline
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
      return `Your empathy markers show a decline in ${declinedSkill}. Focus on practicing this skill.`;
    }

    // Stable or insufficient data
    if (previous7Days.length === 0) {
      return 'Your empathy markers are developing. Keep practicing to see trends.';
    }
    return 'Your empathy markers are stable. Continue practicing to see improvement.';
  }

  // Generate improvement message
  if (maxImprovement > 0.5) {
    return `Your empathy markers are showing strong improvement in ${improvedSkill}.`;
  } else if (maxImprovement > 0.2) {
    return `Your empathy markers are showing improvement in ${improvedSkill}.`;
  } else {
    return `Your empathy markers are developing in ${improvedSkill}.`;
  }
};

// Circular progress component with dark theme styling
const DarkRadialProgress: React.FC<{
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
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#60A5FA"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{value}%</span>
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

  // Show component even if no sessions - will display 0% score
  // This ensures the component is always visible for better UX

  return (
    <div
      className="rounded-2xl p-6 mb-6 shadow-lg"
      style={{
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      {/* Header with title and settings icon */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Global MI Score</h3>
          <p className="text-sm text-gray-400">Average across all sessions</p>
        </div>
        <button
          onClick={onSettingsClick}
          className="text-gray-400 hover:text-gray-300 transition-colors p-2 -mr-2"
          aria-label="Settings"
        >
          <i className="fa-solid fa-gear text-lg" aria-hidden="true"></i>
        </button>
      </div>

      {/* Main content: Circular progress and trend */}
      <div className="flex items-start gap-8">
        {/* Circular progress indicator */}
        <div className="flex-shrink-0">
          <DarkRadialProgress value={globalScore} max={100} />
        </div>

        {/* Trend and message */}
        <div className="flex-1 pt-2">
          {trend && (
            <div className="flex items-center gap-2 mb-4">
              <i
                className={`fa-solid fa-arrow-${
                  trend.isPositive ? 'up' : 'down'
                }`}
                style={{
                  color: trend.isPositive ? '#4ADE80' : '#F87171',
                  fontSize: '14px',
                }}
                aria-hidden="true"
              ></i>
              <span
                className="text-sm font-semibold"
                style={{
                  color: trend.isPositive ? '#4ADE80' : '#F87171',
                }}
              >
                {trend.isPositive ? '+' : '-'}
                {trend.percentage}% vs last week
              </span>
            </div>
          )}
          {!trend && (
            <div className="mb-4">
              <span className="text-sm text-gray-400">
                Complete more sessions to see trends
              </span>
            </div>
          )}
          <p className="text-sm text-gray-300 leading-relaxed" style={{ lineHeight: '1.6' }}>
            {skillMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalMIScore;
