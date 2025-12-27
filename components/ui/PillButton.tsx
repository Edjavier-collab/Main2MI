'use client';

import React from 'react';
import './PillButton.css';

interface PillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const PillButton: React.FC<PillButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon,
  className = '',
}) => {
  return (
    <button
      type="button"
      className={`pill-btn pill-btn--${variant} pill-btn--${size} ${fullWidth ? 'pill-btn--full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="pill-btn__icon">{icon}</span>}
      {children}
    </button>
  );
};

