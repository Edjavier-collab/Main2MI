import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  options?: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className = '',
  error,
  label,
  helperText,
  fullWidth = true,
  options,
  children,
  id,
  disabled,
  ...props
}, ref) => {
  const selectId = id || React.useId();

  const baseSelectClasses = 'block rounded-[var(--radius-md)] border text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all sm:text-sm appearance-none bg-no-repeat';

  const stateClasses = error
    ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
    : 'border-neutral-300 hover:border-neutral-400';

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed bg-neutral-50' : 'bg-white';

  // Custom chevron icon
  const bgImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
  const bgPosition = `right 0.5rem center`;
  const bgSize = `1.5em 1.5em`;

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
          {props.required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`${baseSelectClasses} ${stateClasses} ${widthClass} ${disabledClass} py-2.5 pl-3 pr-10 shadow-sm`}
          style={{
            backgroundImage: bgImage,
            backgroundPosition: bgPosition,
            backgroundSize: bgSize
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {options
            ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
            : children
          }
        </select>
      </div>

      {error ? (
        <p className="mt-1.5 text-sm text-[var(--color-error)] slide-fade-in" id={`${selectId}-error`}>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-[var(--color-text-muted)]" id={`${selectId}-helper`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
