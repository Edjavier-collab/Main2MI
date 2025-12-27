'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { MasteryGoalData } from '../../services/masteryGoalService';
import { MasteryTier } from '../../utils/northStarLogic';

interface MasteryGoalCardProps {
  goalData: MasteryGoalData | null;
  isLoading?: boolean;
}

/**
 * Mastery Goal Card - Glassmorphism styled card displaying BMAD-powered mastery goals
 * 
 * Features:
 * - Glassmorphism effect (backdrop-blur, semi-transparent)
 * - Tier-based color theming (Pastel/Seafoam/Multi-chrome)
 * - Growth Garden theme integration
 */
export const MasteryGoalCard: React.FC<MasteryGoalCardProps> = ({
  goalData,
  isLoading = false,
}) => {
  const tierStyles = useMemo(() => {
    if (!goalData) return {};

    const baseStyles = {
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    };

    switch (goalData.masteryTier) {
      case 'novice':
        return {
          ...baseStyles,
          background: 'rgba(255, 179, 186, 0.15)', // Pastel pink
          borderColor: 'rgba(255, 179, 186, 0.4)',
        };
      case 'intermediate':
        return {
          ...baseStyles,
          background: 'rgba(127, 212, 193, 0.15)', // Seafoam green
          borderColor: 'rgba(127, 212, 193, 0.4)',
        };
      case 'master':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, rgba(127, 212, 193, 0.15) 0%, rgba(180, 181, 252, 0.15) 100%)',
          borderColor: 'rgba(127, 212, 193, 0.5)',
        };
      default:
        return baseStyles;
    }
  }, [goalData]);

  const tierIcon = useMemo(() => {
    if (!goalData) return '🌱';
    switch (goalData.masteryTier) {
      case 'novice':
        return '🌱';
      case 'intermediate':
        return '🌿';
      case 'master':
        return '🏆';
      default:
        return '🌱';
    }
  }, [goalData]);

  if (isLoading) {
    return (
      <Card variant="accent" padding="md" className="mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--color-neutral-200)] rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-[var(--color-neutral-200)] rounded w-full mb-2"></div>
          <div className="h-3 bg-[var(--color-neutral-200)] rounded w-5/6"></div>
        </div>
      </Card>
    );
  }

  if (!goalData) {
    return null;
  }

  return (
    <Card
      variant="accent"
      padding="md"
      className="mb-6 border-2"
      style={tierStyles}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{tierIcon}</span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">
            Your Mastery Goal
          </h3>
          <p 
            className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
            style={{ 
              // Parse markdown-style bold (**text**)
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{
              __html: goalData.goal
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--color-primary-dark)]">$1</strong>')
            }}
          />
          {goalData.focusArea && (
            <div className="mt-3 pt-3 border-t border-[var(--color-primary-lighter)]">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Focus Area: <span className="text-[var(--color-primary-dark)]">{goalData.focusArea}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MasteryGoalCard;
