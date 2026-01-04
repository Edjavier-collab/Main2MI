'use client';

import React from 'react';
import { Button } from './Button';

interface FeaturedResourceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}

export const FeaturedResourceCard: React.FC<FeaturedResourceCardProps> = ({
  icon,
  title,
  description,
  buttonText,
  onClick,
}) => {
  return (
    <div 
      className="
        p-6 
        rounded-[var(--inset-group-radius)] 
        bg-gradient-to-br from-white to-[var(--color-bg-accent)]
        shadow-sm
        border border-white
        transition-transform 
        hover:scale-[1.01]
        cursor-pointer
        w-full
      "
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-12 h-12 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="text-text-secondary mt-1">{description}</p>
        </div>
        <div className="w-full sm:w-auto mt-4 sm:mt-0">
          <Button variant="primary" onClick={onClick} fullWidth>
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
