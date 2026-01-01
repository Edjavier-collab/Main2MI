'use client';

import React from 'react';

/**
 * GroupedSection - Container for grouped rows with optional header/footer
 * Inspired by iOS Settings grouped table view
 */
interface GroupedSectionProps {
  children: React.ReactNode;
  title?: string;
  footer?: string;
  className?: string;
}

export const GroupedSection: React.FC<GroupedSectionProps> = ({
  children,
  title,
  footer,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-2 px-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {title}
        </h3>
      )}
      <div
        className="bg-white overflow-hidden"
        style={{
          borderRadius: 'var(--grouped-card-radius)',
          boxShadow: 'var(--grouped-card-shadow)',
          border: '1px solid var(--grouped-card-border)',
        }}
      >
        {children}
      </div>
      {footer && (
        <p
          className="text-xs mt-2 px-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {footer}
        </p>
      )}
    </div>
  );
};

/**
 * GroupedRow - Single row within a grouped section
 */
interface GroupedRowProps {
  children?: React.ReactNode;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}

export const GroupedRow: React.FC<GroupedRowProps> = ({
  children,
  label,
  sublabel,
  icon,
  iconBg = 'var(--color-primary-lighter)',
  trailing,
  showChevron = false,
  onClick,
  className = '',
  destructive = false,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        flex items-center px-4 min-h-[var(--grouped-row-height)]
        border-b last:border-b-0
        ${isClickable ? 'cursor-pointer active:bg-neutral-100 transition-colors' : ''}
        ${className}
      `}
      style={{ borderColor: 'var(--grouped-card-border)' }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Icon */}
      {icon && (
        <div
          className="flex items-center justify-center mr-3 rounded-lg"
          style={{
            width: 'var(--grouped-icon-size)',
            height: 'var(--grouped-icon-size)',
            backgroundColor: iconBg,
          }}
        >
          {icon}
        </div>
      )}

      {/* Label and sublabel */}
      <div className="flex-1 min-w-0 py-3">
        <span
          className="text-base font-medium block truncate"
          style={{
            color: destructive ? 'var(--color-error)' : 'var(--color-text-primary)'
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className="text-sm block truncate"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {sublabel}
          </span>
        )}
      </div>

      {/* Trailing content or children */}
      {trailing || children}

      {/* Chevron */}
      {showChevron && (
        <i
          className="fa-solid fa-chevron-right text-xs ml-2"
          style={{ color: 'var(--color-text-muted)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

/**
 * GroupedToggleRow - Row with a toggle switch
 */
interface GroupedToggleRowProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const GroupedToggleRow: React.FC<GroupedToggleRowProps> = ({
  label,
  sublabel,
  icon,
  iconBg = 'var(--color-primary-lighter)',
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <GroupedRow
      label={label}
      sublabel={sublabel}
      icon={icon}
      iconBg={iconBg}
      className={className}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-[var(--color-primary)]
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-neutral-200)',
        }}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full
            bg-white shadow-lg ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </GroupedRow>
  );
};

/**
 * GroupedValueRow - Row displaying a label with a value
 */
interface GroupedValueRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

export const GroupedValueRow: React.FC<GroupedValueRowProps> = ({
  label,
  value,
  icon,
  iconBg,
  onClick,
  showChevron = false,
  className = '',
}) => {
  return (
    <GroupedRow
      label={label}
      icon={icon}
      iconBg={iconBg}
      onClick={onClick}
      showChevron={showChevron}
      className={className}
    >
      <span
        className="text-base"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {value}
      </span>
    </GroupedRow>
  );
};

export default {
  Section: GroupedSection,
  Row: GroupedRow,
  ToggleRow: GroupedToggleRow,
  ValueRow: GroupedValueRow,
};
