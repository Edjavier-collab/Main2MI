'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'accent';
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
  const baseClasses = 'bg-white rounded-[var(--radius-lg)] transition-all duration-200';
  
  const variantClasses = {
    default: 'shadow-sm border border-[var(--color-primary-lighter)]',
    elevated: 'shadow-md border border-[var(--color-primary-lighter)]',
    outlined: 'border-2 border-[var(--color-primary-light)]',
    accent: 'bg-[var(--color-bg-accent)] border border-[var(--color-primary-light)] shadow-sm',
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

