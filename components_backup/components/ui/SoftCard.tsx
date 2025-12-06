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
  return (
    <div 
      className={`soft-card soft-card--${variant} ${hoverable ? 'soft-card--hoverable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

