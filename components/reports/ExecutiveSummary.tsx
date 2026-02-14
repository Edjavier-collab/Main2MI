import React from 'react';
import { ReportData } from '../../hooks/useReportData';

interface ExecutiveSummaryProps {
  data: ReportData;
  isLoading?: boolean;
  className?: string;
}

/**
 * Get score color based on value (0-100)
 * Uses Growth Garden theme semantic colors
 */
const getScoreColor = (score: number): string => {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-score-good, #84cc16)';
  if (score >= 40) return 'var(--color-warning)';
  if (score >= 20) return 'var(--color-score-developing, #f97316)';
  return 'var(--color-error)';
};

/**
 * Get trend display info
 */
const getTrendInfo = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving':
      return {
        icon: '↑',
        label: 'Improving',
        color: 'var(--color-success)',
      };
    case 'declining':
      return {
        icon: '↓',
        label: 'Declining',
        color: 'var(--color-error)',
      };
    default:
      return {
        icon: '→',
        label: 'Stable',
        color: 'var(--color-text-muted)',
      };
  }
};

/**
 * Executive Summary Component
 * 
 * Professional, McKinsey-style summary of MI competency performance.
 * Always visible to FREE tier users.
 * 
 * Features:
 * - Large overall score display (0-100)
 * - Trend indicator with arrow
 * - One-sentence performance summary
 * - Top strength and area to improve
 */
const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  data,
  isLoading = false,
  className = '',
}) => {
  const {
    overallScore,
    previousScore,
    trend,
    sessionCount,
    topStrength,
    areaToImprove,
    performanceSummary,
  } = data;

  const trendInfo = getTrendInfo(trend);
  const scoreChange = overallScore - previousScore;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`${className} bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6`}>
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 bg-[var(--color-neutral-200)] rounded" />
          <div className="flex items-baseline gap-2">
            <div className="h-12 w-24 bg-[var(--color-neutral-200)] rounded" />
            <div className="h-6 w-12 bg-[var(--color-neutral-200)] rounded" />
          </div>
          <div className="h-4 w-full bg-[var(--color-neutral-200)] rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="h-24 bg-[var(--color-neutral-100)] rounded-xl" />
            <div className="h-24 bg-[var(--color-neutral-100)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (sessionCount === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 text-center ${className}`}>
        <div className="w-16 h-16 bg-[var(--color-neutral-100)] rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-chart-simple text-2xl text-[var(--color-text-muted)]" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-[var(--color-text-primary)]">No Data Yet</h3>
        <p className="text-[var(--color-text-secondary)]">Complete a session to see your MI Competency Score.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 ${className}`}>
      {/* Header / Score Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            MI Competency Score
          </h3>
          {/* Trend Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: trend === 'improving' ? 'rgba(34, 197, 94, 0.1)' : trend === 'declining' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              color: trendInfo.color
            }}
          >
            <span>{trendInfo.label}</span>
            <span>{trendInfo.icon}</span>
            {scoreChange !== 0 && (
              <span className="ml-1 opacity-80">
                ({scoreChange > 0 ? '+' : ''}{scoreChange} pts)
              </span>
            )}
          </div>
        </div>

        {/* Big Score */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-bold text-[var(--color-text-primary)]">
            {overallScore}
          </span>
          <span className="text-xl font-medium text-[var(--color-text-muted)]">
            / 100
          </span>
        </div>

        {/* Summary Text */}
        <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
          {performanceSummary}
        </p>
      </div>

      {/* Insights Cards */}
      {(topStrength || areaToImprove) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top Strength */}
          {topStrength && topStrength.count > 0 && (
            <div className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-[var(--color-neutral-100)] p-5">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-success)]" />
              <div className="mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Top Strength
                </span>
              </div>
              <p className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                {topStrength.name}
              </p>
            </div>
          )}

          {/* Priority Focus */}
          {areaToImprove && (
            <div className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-[var(--color-neutral-100)] p-5">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-warning)]" />
              <div className="mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Priority Focus
                </span>
              </div>
              <p className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                {areaToImprove.name}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
