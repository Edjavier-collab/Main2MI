import React from 'react';
import { useXP } from '../../hooks/useXP';

interface LevelProgressProps {
  /** Show XP numbers (current/next) */
  showXPNumbers?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays user's current level and XP progress toward next level
 * Uses the useXP hook for data
 */
const LevelProgress: React.FC<LevelProgressProps> = ({
  showXPNumbers = true,
  compact = false,
  className = '',
}) => {
  const { currentXP, currentLevel, levelName, xpToNextLevel, xpProgress, isLoading } = useXP();

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div 
          className="animate-pulse h-4 rounded-full"
          style={{ 
            backgroundColor: 'var(--color-neutral-200, #e5e7eb)',
            width: compact ? '120px' : '100%',
          }}
        />
      </div>
    );
  }

  // Level icons/emojis for visual interest
  const levelIcons = ['🌱', '🌿', '🌳', '🏆'];
  const levelIcon = levelIcons[currentLevel - 1] || '🌱';

  // Check if at max level
  const isMaxLevel = currentLevel === 4;

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-2 ${className}`}
        title={`${levelName} - ${currentXP} XP${!isMaxLevel ? ` (${xpToNextLevel} to next level)` : ''}`}
      >
        <span className="text-base">{levelIcon}</span>
        <div className="flex flex-col">
          <span 
            className="text-xs font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Lvl {currentLevel}
          </span>
          <div 
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-neutral-200, #e5e7eb)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${xpProgress}%`,
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
        <div className="flex items-center gap-2">
          <span className="text-xl">{levelIcon}</span>
          <div>
            <span 
              className="text-sm font-bold block"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Level {currentLevel}
            </span>
            <span 
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {levelName}
            </span>
          </div>
        </div>
        
        {showXPNumbers && (
          <div 
            className="text-right"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="text-sm font-semibold tabular-nums">
              {currentXP.toLocaleString()} XP
            </span>
            {!isMaxLevel && (
              <span className="text-xs block">
                {xpToNextLevel.toLocaleString()} to next
              </span>
            )}
            {isMaxLevel && (
              <span className="text-xs block" style={{ color: 'var(--color-primary-dark)' }}>
                Max level!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div 
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-neutral-200, #e5e7eb)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${xpProgress}%`,
            background: isMaxLevel 
              ? 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
              : 'var(--color-primary)',
          }}
          role="progressbar"
          aria-valuenow={xpProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${currentLevel} progress: ${xpProgress}%`}
        />
      </div>

      {/* Level milestones (optional visual) */}
      {!compact && (
        <div className="flex justify-between mt-1 px-0.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="flex flex-col items-center"
              style={{ 
                opacity: currentLevel >= level ? 1 : 0.4,
              }}
            >
              <span className="text-xs">{levelIcons[level - 1]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LevelProgress;
