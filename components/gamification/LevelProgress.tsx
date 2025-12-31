'use client';

import React from 'react';
import { useXP } from '../../hooks/useXP';
import { PROFICIENCY_TIERS } from '../../constants';

interface ProficiencyTrackerProps {
  /** Show clinical hours numbers */
  showHours?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// FontAwesome icons for each tier (Dreyfus Model)
const TIER_ICONS = [
  'fa-solid fa-seedling',      // Novice
  'fa-solid fa-leaf',          // Advanced Beginner
  'fa-solid fa-tree',          // Competent
  'fa-solid fa-award',         // Proficient
  'fa-solid fa-graduation-cap', // Expert
];

/**
 * Displays user's current proficiency tier and progress toward next tier
 * Based on the Dreyfus Model of Skill Acquisition
 */
const ProficiencyTracker: React.FC<ProficiencyTrackerProps> = ({
  showHours = true,
  compact = false,
  className = '',
}) => {
  const {
    clinicalHours,
    currentTier,
    tierName,
    tierDescription,
    hoursToNextTier,
    tierProgress,
    isLoading,
  } = useXP();

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div
          className="animate-pulse h-4 rounded-full"
          style={{
            backgroundColor: 'var(--color-neutral-200)',
            width: compact ? '120px' : '100%',
          }}
        />
      </div>
    );
  }

  const tierIcon = TIER_ICONS[currentTier - 1] || TIER_ICONS[0];
  const isMaxTier = currentTier === PROFICIENCY_TIERS.length;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 ${className}`}
        title={`${tierName} - ${clinicalHours.toFixed(1)} Clinical Hours${!isMaxTier ? ` (${hoursToNextTier.toFixed(1)} to next tier)` : ''}`}
      >
        <i className={`${tierIcon} text-[var(--color-primary)]`} aria-hidden="true" />
        <div className="flex flex-col">
          <span
            className="text-xs font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tier {currentTier}
          </span>
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-neutral-200)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${tierProgress}%`,
                backgroundColor: 'var(--color-primary)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-primary-light)',
            }}
          >
            <i
              className={`${tierIcon} text-lg`}
              style={{ color: 'var(--color-primary-dark)' }}
              aria-hidden="true"
            />
          </div>
          <div>
            <span
              className="text-sm font-bold block"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {tierName}
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {tierDescription}
            </span>
          </div>
        </div>

        {showHours && (
          <div
            className="text-right"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="text-sm font-semibold tabular-nums">
              {clinicalHours.toFixed(1)} hrs
            </span>
            {!isMaxTier && (
              <span className="text-xs block">
                {hoursToNextTier.toFixed(1)} to next
              </span>
            )}
            {isMaxTier && (
              <span className="text-xs block" style={{ color: 'var(--color-primary-dark)' }}>
                Expert Level
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-neutral-200)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${tierProgress}%`,
            background: isMaxTier
              ? 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
              : 'var(--color-primary)',
          }}
          role="progressbar"
          aria-valuenow={tierProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${tierName} progress: ${tierProgress}%`}
        />
      </div>

      {/* Tier milestones */}
      {!compact && (
        <div className="flex justify-between mt-2 px-0.5">
          {PROFICIENCY_TIERS.map((tier, index) => (
            <div
              key={tier.tier}
              className="flex flex-col items-center"
              style={{
                opacity: currentTier >= tier.tier ? 1 : 0.4,
              }}
            >
              <i
                className={`${TIER_ICONS[index]} text-xs`}
                style={{
                  color: currentTier >= tier.tier
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
                }}
                aria-hidden="true"
              />
              <span
                className="text-[10px] mt-0.5"
                style={{
                  color: currentTier >= tier.tier
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-text-muted)',
                }}
              >
                {tier.minHours}h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Legacy export alias for backward compatibility
export const LevelProgress = ProficiencyTracker;

export default ProficiencyTracker;
