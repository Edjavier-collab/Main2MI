'use client';

import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  id,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseTextareaClasses = `
    w-full bg-[var(--color-bg-card)] border rounded-[var(--radius-md)]
    text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 focus:border-[var(--color-primary)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-100)]
    p-4 text-base resize-y min-h-[100px]
  `;

  const borderClasses = error
    ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
    : 'border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`${baseTextareaClasses} ${borderClasses}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
