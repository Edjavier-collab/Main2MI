'use client';

import React, { useState } from 'react';
import { useBadges } from '../../hooks/useBadges';
import { CERTIFICATES, CertificateDefinition } from '../../constants';

interface CompetencyGridProps {
  /** Show all certificates (locked and unlocked) or just unlocked */
  showAll?: boolean;
  /** Maximum number of certificates to show (for compact view) */
  maxDisplay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays user's professional certificates in a grid
 * Based on Professional Growth System with FontAwesome icons
 */
const CompetencyGrid: React.FC<CompetencyGridProps> = ({
  showAll = false,
  maxDisplay,
  className = '',
}) => {
  const { unlockedCertificates, isLoading } = useBadges();
  const [selectedCert, setSelectedCert] = useState<(CertificateDefinition & { unlocked: boolean }) | null>(null);

  if (isLoading) {
    return (
      <div className={`flex gap-3 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-16 h-16 rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--color-neutral-200)' }}
          />
        ))}
      </div>
    );
  }

  const unlockedIds = new Set(unlockedCertificates.map(c => c.id));

  // Determine which certificates to show
  let certsToShow: (CertificateDefinition & { unlocked: boolean })[];

  if (showAll) {
    // Show all certificates, marking locked ones
    certsToShow = CERTIFICATES.map(cert => ({
      ...cert,
      unlocked: unlockedIds.has(cert.id),
    }));
  } else {
    // Show only unlocked certificates
    certsToShow = unlockedCertificates.map(cert => ({
      ...cert,
      unlocked: true,
    }));
  }

  // Apply maxDisplay limit if specified
  if (maxDisplay && certsToShow.length > maxDisplay) {
    certsToShow = certsToShow.slice(0, maxDisplay);
  }

  if (certsToShow.length === 0 && !showAll) {
    return (
      <div
        className={`text-center py-6 ${className}`}
        style={{ color: 'var(--color-text-muted)' }}
      >
        <div
          className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-neutral-100)' }}
        >
          <i className="fa-solid fa-certificate text-2xl" style={{ color: 'var(--color-neutral-400)' }} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">No certificates earned yet</p>
        <p className="text-xs mt-1">Complete sessions to earn certificates</p>
      </div>
    );
  }

  const handleCertClick = (cert: CertificateDefinition & { unlocked: boolean }) => {
    if (cert.unlocked) {
      setSelectedCert(selectedCert?.id === cert.id ? null : cert);
    }
  };

  // Category styles for visual differentiation
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

  return (
    <div className={`${className}`}>
      {/* Certificate Grid */}
      <div className="grid grid-cols-4 gap-4">
        {certsToShow.map(cert => {
          const colors = getCategoryColor(cert.category);
          return (
            <button
              key={cert.id}
              className={`
                flex flex-col items-center p-2 rounded-xl transition-all duration-200
                ${cert.unlocked
                  ? 'cursor-pointer hover:bg-[var(--color-primary-50)] active:scale-95'
                  : 'cursor-default'
                }
                ${selectedCert?.id === cert.id ? 'bg-[var(--color-primary-100)]' : ''}
              `}
              onClick={() => handleCertClick(cert)}
              disabled={!cert.unlocked}
              aria-label={cert.unlocked ? `${cert.name}: ${cert.description}` : `Locked: ${cert.name}`}
            >
              <div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center
                  transition-all duration-300 relative
                `}
                style={{
                  backgroundColor: cert.unlocked ? colors.bg : 'var(--color-neutral-200)',
                  opacity: cert.unlocked ? 1 : 0.5,
                }}
              >
                {cert.unlocked ? (
                  <i
                    className={`${cert.icon} text-xl`}
                    style={{ color: colors.icon }}
                    aria-hidden="true"
                  />
                ) : (
                  <>
                    <i
                      className={`${cert.icon} text-xl opacity-30`}
                      style={{ color: 'var(--color-neutral-500)' }}
                      aria-hidden="true"
                    />
                    <span
                      className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{
                        backgroundColor: 'var(--color-neutral-400)',
                        color: 'white',
                      }}
                    >
                      <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
                    </span>
                  </>
                )}
              </div>
              <span
                className="text-xs mt-2 text-center leading-tight"
                style={{
                  color: cert.unlocked
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  fontWeight: cert.unlocked ? 600 : 400,
                }}
              >
                {cert.shortName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Certificate Details */}
      {selectedCert && (
        <div
          className="mt-4 p-4 rounded-xl animate-fade-in"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            border: '1px solid var(--color-primary-lighter)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: getCategoryColor(selectedCert.category).bg }}
            >
              <i
                className={`${selectedCert.icon} text-xl`}
                style={{ color: getCategoryColor(selectedCert.category).icon }}
                aria-hidden="true"
              />
            </div>
            <div>
              <h4
                className="font-bold text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {selectedCert.name}
              </h4>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {selectedCert.description}
              </p>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                style={{
                  backgroundColor: getCategoryColor(selectedCert.category).bg,
                  color: getCategoryColor(selectedCert.category).icon,
                }}
              >
                {selectedCert.category}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Legacy export alias for backward compatibility
export const BadgeDisplay = CompetencyGrid;

export default CompetencyGrid;
