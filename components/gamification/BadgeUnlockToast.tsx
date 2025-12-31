'use client';

import React, { useEffect, useState } from 'react';
import { BadgeDefinition, CertificateDefinition, getCertificateById } from '../../constants';

interface CertificateUnlockToastProps {
  certificate: CertificateDefinition;
  onClose: () => void;
  duration?: number;
}

// Legacy props interface for backward compatibility
interface BadgeUnlockToastProps {
  badge: BadgeDefinition;
  onClose: () => void;
  duration?: number;
}

// Category colors for certificates
const getCategoryColor = (category: CertificateDefinition['category']) => {
  switch (category) {
    case 'consistency':
      return { bg: 'var(--color-primary-light)', icon: 'var(--color-primary-dark)' };
    case 'dedication':
      return { bg: 'var(--color-success-light, #dcfce7)', icon: 'var(--color-success, #22c55e)' };
    case 'competency':
      return { bg: 'var(--color-warning-light, #fef3c7)', icon: 'var(--color-warning, #f59e0b)' };
    default:
      return { bg: 'var(--color-neutral-100)', icon: 'var(--color-neutral-500)' };
  }
};

/**
 * Celebration toast shown when a user unlocks a new certificate
 * Features animation and auto-dismiss
 */
const CertificateUnlockToast: React.FC<CertificateUnlockToastProps> = ({
  certificate,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const colors = getCategoryColor(certificate.category);

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
        {/* Certificate Icon with bounce animation */}
        <div
          className="
            w-16 h-16 rounded-xl flex items-center justify-center
            animate-bounce-once
          "
          style={{
            backgroundColor: colors.bg,
          }}
        >
          <i
            className={`${certificate.icon} text-2xl`}
            style={{ color: colors.icon }}
            aria-hidden="true"
          />
        </div>

        {/* Text content */}
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: 'var(--color-primary-dark)' }}
          >
            <i className="fa-solid fa-certificate mr-1" aria-hidden="true" />
            Certificate Earned!
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {certificate.name}
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {certificate.description}
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

/**
 * Legacy BadgeUnlockToast component
 * Converts badge to certificate and renders CertificateUnlockToast
 */
const BadgeUnlockToast: React.FC<BadgeUnlockToastProps> = ({
  badge,
  onClose,
  duration = 5000,
}) => {
  // Try to find corresponding certificate
  const certId = badge.id.replace('streak-', 'consistency-');
  const certificate = getCertificateById(certId);

  // If we have a certificate, use the new component
  if (certificate) {
    return (
      <CertificateUnlockToast
        certificate={certificate}
        onClose={onClose}
        duration={duration}
      />
    );
  }

  // Fallback: render legacy badge toast (for any badges without certificate mapping)
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
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

export { CertificateUnlockToast };
export default BadgeUnlockToast;
