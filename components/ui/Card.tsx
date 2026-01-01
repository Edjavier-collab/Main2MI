'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'accent' | 'glass' | 'soft' | 'flat' | 'soft-accent' | 'soft-elevated' | 'grouped' | 'grouped-row';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
  className = '',
  style,
}) => {
  // Base classes - bg-white only for non-glass variants
  const baseClasses = variant === 'glass'
    ? 'rounded-[var(--radius-lg)] transition-all duration-200'
    : 'bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] transition-all duration-200';

  const variantClasses = {
    default: 'shadow-sm border border-[#E1E4E8]',
    elevated: 'shadow-md border border-[#E1E4E8]',
    outlined: 'border border-[#E1E4E8]',
    accent: 'bg-[var(--color-bg-accent)] border border-[#E1E4E8] shadow-sm',
    glass: 'backdrop-blur-md bg-white/60 border border-white/40 shadow-lg', // Updated Glassmorphism
    soft: 'bg-white shadow-[var(--shadow-sm)] border border-transparent hover:shadow-md', // Soft, cleaner card
    flat: 'bg-[var(--color-bg-main)] border border-transparent', // Flat, no shadow background
    // Soft variants
    'soft-accent': 'bg-[var(--color-bg-accent)] shadow-[var(--shadow-xs)] border border-[var(--color-primary-light)]',
    'soft-elevated': 'shadow-[var(--shadow-md)] border border-[var(--color-primary-lighter)]',
    // Grouped Inset variants (iOS Settings style)
    'grouped': 'rounded-[var(--grouped-card-radius)] shadow-[var(--grouped-card-shadow)] border border-[var(--grouped-card-border)]',
    'grouped-row': 'rounded-none border-b border-[var(--grouped-card-border)] last:border-b-0 first:rounded-t-[var(--grouped-card-radius)] last:rounded-b-[var(--grouped-card-radius)]',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Enhanced hover effect for soft variants
  const isSoftVariant = variant.startsWith('soft');
  const hoverClasses = hoverable || onClick
    ? isSoftVariant
      ? 'cursor-pointer hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-primary)] active:translate-y-0 active:scale-100 active:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2'
      : 'cursor-pointer tile-hover active:scale-[0.98]'
    : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

export default Card;

