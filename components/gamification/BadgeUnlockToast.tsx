'use client';

import React, { useEffect, useState } from 'react';
import { BadgeDefinition } from '../../constants';

interface BadgeUnlockToastProps {
  badge: BadgeDefinition;
  onClose: () => void;
  duration?: number;
}

/**
 * Celebration toast shown when a user unlocks a new badge
 * Features animation and auto-dismiss
 */
const BadgeUnlockToast: React.FC<BadgeUnlockToastProps> = ({
  badge,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className="
          flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl
          border-2
        "
        style={{
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          borderColor: 'var(--color-primary)',
          boxShadow: '0 8px 32px rgba(127, 212, 193, 0.3)',
        }}
      >
        {/* Badge Icon with bounce animation */}
        <div
          className="
            w-16 h-16 rounded-full flex items-center justify-center text-3xl
            animate-bounce-once
          "
          style={{
            backgroundColor: 'var(--color-primary-lighter)',
          }}
        >
          {badge.emoji}
        </div>

        {/* Text content */}
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: 'var(--color-primary-dark)' }}
          >
            Badge Unlocked!
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {badge.name}
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {badge.description}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="
            w-8 h-8 rounded-full flex items-center justify-center
            hover:bg-[var(--color-neutral-100)] transition-colors
          "
          aria-label="Close"
        >
          <i 
            className="fa-solid fa-times text-sm"
            style={{ color: 'var(--color-text-muted)' }}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* CSS for bounce animation */}
      <style>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.05); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BadgeUnlockToast;
