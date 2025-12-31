import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  children,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--color-error)] ml-1">*</span>}
    </label>
  );
};

export default Label;
