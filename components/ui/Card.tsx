'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'accent' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
  className = '',
}) => {
  // Base classes - bg-white only for non-glass variants
  const baseClasses = variant === 'glass' 
    ? 'rounded-[var(--radius-lg)] transition-all duration-200'
    : 'bg-white rounded-[var(--radius-lg)] transition-all duration-200';
  
  const variantClasses = {
    default: 'shadow-sm border border-white/10 dark:border-slate-800/30',
    elevated: 'shadow-md border border-white/10 dark:border-slate-800/30',
    outlined: 'border border-white/20 dark:border-slate-800/40',
    accent: 'bg-[var(--color-bg-accent)] border border-white/10 dark:border-slate-800/30 shadow-sm',
    glass: 'backdrop-blur-md bg-white/5 dark:bg-slate-800/5 border border-white/10 dark:border-slate-800/30 shadow-2xl', // NEW: Glassmorphism variant
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

