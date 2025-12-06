import React from 'react';
import './SoftInput.css';

interface SoftInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const SoftInput: React.FC<SoftInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  icon,
  className = '',
}) => {
  return (
    <div className={`soft-input ${className}`}>
      {icon && <span className="soft-input__icon">{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="soft-input__field"
      />
    </div>
  );
};

