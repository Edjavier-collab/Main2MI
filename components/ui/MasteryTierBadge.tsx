'use client';

import React from 'react';
import { getMasteryTier } from '../../utils/northStarLogic';

interface MasteryTierBadgeProps {
  currentLevel: number;
  className?: string;
}

/**
 * Mastery Tier Badge - Prominent badge displaying user's mastery tier
 * Uses North Star Logic to determine tier based on current level
 */
export const MasteryTierBadge: React.FC<MasteryTierBadgeProps> = ({ 
  currentLevel, 
  className = '' 
}) => {
  const masteryTier = getMasteryTier(currentLevel);
  
  const tierConfig = {
    novice: {
      label: 'Novice',
      icon: '🌱',
      gradient: 'from-pink-50 to-rose-50',
      border: 'border-pink-200/50',
      text: 'text-pink-700',
      bg: 'bg-gradient-to-r from-pink-50 to-rose-50',
    },
    intermediate: {
      label: 'Intermediate',
      icon: '🌿',
      gradient: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200/50',
      text: 'text-emerald-700',
      bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    },
    master: {
      label: 'Master',
      icon: '🏆',
      gradient: 'from-amber-50 via-purple-50 to-pink-50',
      border: 'border-amber-300/50',
      text: 'text-amber-800',
      bg: 'bg-gradient-to-r from-amber-50 via-purple-50 to-pink-50',
    },
  };
  
  const config = tierConfig[masteryTier];
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.border} ${config.bg} ${config.text} ${className}`}>
      <span className="text-lg">{config.icon}</span>
      <span className="text-sm font-semibold">{config.label} Tier</span>
    </div>
  );
};

export default MasteryTierBadge;
