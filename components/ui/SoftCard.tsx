import React from 'react';
import './SoftCard.css';

interface SoftCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'elevated';
  onClick?: () => void;
  hoverable?: boolean;
}

export const SoftCard: React.FC<SoftCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
  hoverable = false,
}) => {
  const isInteractive = hoverable || onClick;

  return (
    <div
      className={`soft-card soft-card--${variant} ${isInteractive ? 'soft-card--hoverable' : ''} ${className}`}
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

