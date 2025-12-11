import React, { useState } from 'react';
import { useBadges } from '../../hooks/useBadges';
import { BADGES, BadgeDefinition } from '../../constants';

interface BadgeDisplayProps {
  /** Show all badges (locked and unlocked) or just unlocked */
  showAll?: boolean;
  /** Maximum number of badges to show (for compact view) */
  maxDisplay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays user's badges in a grid
 * Shows unlocked badges with full color, locked badges grayed out with lock icon
 * Click on unlocked badge to see name + description in a detail panel
 */
const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  showAll = false,
  maxDisplay,
  className = '',
}) => {
  const { unlockedBadges, isLoading } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<(BadgeDefinition & { unlocked: boolean }) | null>(null);

  if (isLoading) {
    return (
      <div className={`flex gap-3 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-16 h-16 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-neutral-200, #e5e7eb)' }}
          />
        ))}
      </div>
    );
  }

  const unlockedIds = new Set(unlockedBadges.map(b => b.id));

  // Determine which badges to show
  let badgesToShow: (BadgeDefinition & { unlocked: boolean })[];
  
  if (showAll) {
    // Show all badges, marking locked ones
    badgesToShow = BADGES.map(badge => ({
      ...badge,
      unlocked: unlockedIds.has(badge.id),
    }));
  } else {
    // Show only unlocked badges
    badgesToShow = unlockedBadges.map(badge => ({
      ...badge,
      unlocked: true,
    }));
  }

  // Apply maxDisplay limit if specified
  if (maxDisplay && badgesToShow.length > maxDisplay) {
    badgesToShow = badgesToShow.slice(0, maxDisplay);
  }

  if (badgesToShow.length === 0 && !showAll) {
    return (
      <div 
        className={`text-center py-6 ${className}`}
        style={{ color: 'var(--color-text-muted)' }}
      >
        <div className="text-4xl mb-2 opacity-40">🏅</div>
        <p className="text-sm font-medium">No badges earned yet</p>
        <p className="text-xs mt-1">Complete sessions to earn badges!</p>
      </div>
    );
  }

  const handleBadgeClick = (badge: BadgeDefinition & { unlocked: boolean }) => {
    if (badge.unlocked) {
      setSelectedBadge(selectedBadge?.id === badge.id ? null : badge);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Badge Grid */}
      <div className="grid grid-cols-4 gap-4">
        {badgesToShow.map(badge => (
          <button
            key={badge.id}
            className={`
              flex flex-col items-center p-2 rounded-xl transition-all duration-200
              ${badge.unlocked 
                ? 'cursor-pointer hover:bg-[var(--color-primary-50)] active:scale-95' 
                : 'cursor-default'
              }
              ${selectedBadge?.id === badge.id ? 'bg-[var(--color-primary-100)]' : ''}
            `}
            onClick={() => handleBadgeClick(badge)}
            disabled={!badge.unlocked}
            aria-label={badge.unlocked ? `${badge.name}: ${badge.description}` : `Locked: ${badge.name}`}
          >
            <div
              className={`
                w-14 h-14 rounded-full flex items-center justify-center text-2xl
                transition-all duration-300 relative
                ${badge.unlocked 
                  ? 'bg-[var(--color-primary-lighter)] shadow-md' 
                  : 'bg-[var(--color-neutral-200)]'
                }
              `}
              style={{
                filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                opacity: badge.unlocked ? 1 : 0.5,
              }}
            >
              {badge.unlocked ? (
                badge.emoji
              ) : (
                <>
                  <span className="opacity-30">{badge.emoji}</span>
                  <span 
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ 
                      backgroundColor: 'var(--color-neutral-400)',
                      color: 'white',
                    }}
                  >
                    <i className="fa-solid fa-lock" aria-hidden="true" />
                  </span>
                </>
              )}
            </div>
            <span
              className="text-xs mt-2 text-center leading-tight"
              style={{ 
                color: badge.unlocked 
                  ? 'var(--color-text-primary)' 
                  : 'var(--color-text-muted)',
                fontWeight: badge.unlocked ? 600 : 400,
              }}
            >
              {badge.name}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Badge Details */}
      {selectedBadge && (
        <div 
          className="mt-4 p-4 rounded-xl animate-fade-in"
          style={{ 
            backgroundColor: 'var(--color-primary-50)',
            border: '1px solid var(--color-primary-lighter)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedBadge.emoji}</span>
            <div>
              <h4 
                className="font-bold text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {selectedBadge.name}
              </h4>
              <p 
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {selectedBadge.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BadgeDisplay;
