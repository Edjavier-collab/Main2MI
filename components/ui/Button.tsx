'use client';

import React from 'react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-text-primary)] border-2 border-black hover:bg-[var(--color-primary-dark)] hover:border-black focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md',
    secondary: 'bg-[var(--color-bg-accent)] text-[var(--color-text-primary)] border-2 border-black hover:bg-[var(--color-primary-lighter)] focus:ring-[var(--color-primary)]',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-accent)] border border-transparent hover:border-[var(--color-primary-light)] focus:ring-[var(--color-primary)]',
    danger: 'bg-[var(--color-error)] text-white border-2 border-black hover:bg-[var(--color-error-dark)] focus:ring-[var(--color-error)] shadow-sm hover:shadow-md',
    success: 'bg-[var(--color-success)] text-white border-2 border-black hover:bg-[var(--color-success-dark)] focus:ring-[var(--color-success)] shadow-sm hover:shadow-md',
  };
  
  const sizeClasses = {
    sm: 'h-[var(--button-height-sm)] px-4 text-sm gap-2',
    md: 'h-[var(--button-height-md)] px-6 text-base gap-2',
    lg: 'h-[var(--button-height-lg)] px-8 text-xl gap-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
};

export default Button;

