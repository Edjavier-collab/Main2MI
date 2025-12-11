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
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-40 bg-[var(--color-neutral-200)] rounded" />
            <div className="h-4 w-20 bg-[var(--color-neutral-200)] rounded" />
          </div>
          <div className="flex items-center gap-8 mb-6">
            <div className="w-32 h-32 rounded-full bg-[var(--color-neutral-200)]" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-full bg-[var(--color-neutral-200)] rounded" />
              <div className="h-4 w-3/4 bg-[var(--color-neutral-200)] rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-[var(--color-neutral-200)] rounded-xl" />
            <div className="h-20 bg-[var(--color-neutral-200)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (sessionCount === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div 
          className="text-6xl mb-4 opacity-40"
          aria-hidden="true"
        >
          📊
        </div>
        <h3 
          className="text-lg font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          No Sessions Yet
        </h3>
        <p 
          className="text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {performanceSummary}
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: 'var(--color-text-muted)' }}
        >
          MI Competency Score
        </h3>
        <span 
          className="text-xs px-2 py-1 rounded-full"
          style={{ 
            backgroundColor: 'var(--color-primary-50)',
            color: 'var(--color-primary-dark)',
          }}
        >
          {sessionCount} session{sessionCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-6 mb-6">
        {/* Large Score Circle */}
        <div 
          className="relative w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${getScoreColor(overallScore)} ${overallScore}%, var(--color-neutral-100) ${overallScore}%)`,
          }}
        >
          <div 
            className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
            style={{ backgroundColor: 'var(--color-bg-card, white)' }}
          >
            <span 
              className="text-3xl font-bold"
              style={{ color: getScoreColor(overallScore) }}
            >
              {overallScore}
            </span>
            <span 
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              / 100
            </span>
          </div>
        </div>

        {/* Trend and Summary */}
        <div className="flex-1">
          {/* Trend Indicator */}
          <div className="flex items-center gap-2 mb-3">
            <span 
              className="text-2xl font-bold"
              style={{ color: trendInfo.color }}
              aria-hidden="true"
            >
              {trendInfo.icon}
            </span>
            <span 
              className="text-sm font-semibold"
              style={{ color: trendInfo.color }}
            >
              {trendInfo.label}
            </span>
            {scoreChange !== 0 && sessionCount > 1 && (
              <span 
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ({scoreChange > 0 ? '+' : ''}{scoreChange} pts)
              </span>
            )}
          </div>

          {/* Performance Summary */}
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {performanceSummary}
          </p>
        </div>
      </div>

      {/* Strength and Improvement Areas */}
      {(topStrength || areaToImprove) && (
        <div className="grid grid-cols-2 gap-3">
          {/* Top Strength */}
          {topStrength && topStrength.count > 0 && (
            <div 
              className="p-4 rounded-xl"
              style={{ 
                backgroundColor: 'var(--color-success-light, rgba(34, 197, 94, 0.1))',
                border: '1px solid var(--color-success)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <i 
                  className="fa-solid fa-trophy text-sm"
                  style={{ color: 'var(--color-success)' }}
                  aria-hidden="true"
                />
                <span 
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--color-success)' }}
                >
                  Strength
                </span>
              </div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {topStrength.name}
              </p>
            </div>
          )}

          {/* Area to Improve */}
          {areaToImprove && (
            <div 
              className="p-4 rounded-xl"
              style={{ 
                backgroundColor: 'var(--color-warning-light, rgba(234, 179, 8, 0.1))',
                border: '1px solid var(--color-warning)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <i 
                  className="fa-solid fa-seedling text-sm"
                  style={{ color: 'var(--color-warning)' }}
                  aria-hidden="true"
                />
                <span 
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--color-warning)' }}
                >
                  Focus Area
                </span>
              </div>
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
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
