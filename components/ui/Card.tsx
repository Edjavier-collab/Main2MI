'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'accent' | 'glass';
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
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hoverable || onClick ? 'cursor-pointer tile-hover active:scale-[0.98]' : '';

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

