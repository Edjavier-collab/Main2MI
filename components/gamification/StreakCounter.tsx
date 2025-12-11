import React from 'react';
import { useStreak } from '../../hooks/useStreak';

interface StreakCounterProps {
  /** Show longest streak below current streak */
  showLongest?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact streak counter displaying current practice streak
 * Uses the useStreak hook to track consecutive practice days
 */
const StreakCounter: React.FC<StreakCounterProps> = ({
  showLongest = false,
  className = '',
}) => {
  const { currentStreak, longestStreak, isLoading } = useStreak();

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <span className="text-lg opacity-50">🔥</span>
        <span 
          className="text-sm font-semibold animate-pulse"
          style={{ color: 'var(--color-text-muted)' }}
        >
          —
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      {/* Current streak */}
      <div 
        className="inline-flex items-center gap-1 streak-counter"
        title={`${currentStreak} day${currentStreak !== 1 ? 's' : ''} streak`}
      >
        <span 
          className="text-lg transition-transform duration-300 ease-out"
          style={{
            filter: currentStreak > 0 ? 'none' : 'grayscale(100%)',
          }}
          role="img"
          aria-label="fire"
        >
          🔥
        </span>
        <span 
          className="text-sm font-bold tabular-nums"
          style={{ 
            color: currentStreak > 0 
              ? 'var(--color-warning, #f59e0b)' 
              : 'var(--color-text-muted)',
          }}
        >
          {currentStreak}
        </span>
      </div>

      {/* Longest streak (optional) */}
      {showLongest && longestStreak > 0 && (
        <span 
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Best: {longestStreak}
        </span>
      )}

      {/* CSS for subtle animation on update */}
      <style>{`
        .streak-counter {
          transition: transform var(--transition-fast, 150ms) ease-out;
        }
        .streak-counter:hover {
          transform: scale(1.05);
        }
        @keyframes streak-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StreakCounter;
