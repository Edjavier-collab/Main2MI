import React from 'react';

interface BackButtonProps {
    onClick: () => void;
    label?: string;
    className?: string;
    icon?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Back', className = '', icon }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Go back"
            className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-neutral-300)] rounded-lg shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 text-[var(--color-text-primary)] font-semibold text-sm ${className}`}
        >
            {icon ?? <i className="fa fa-arrow-left text-[var(--color-text-primary)]" aria-hidden="true"></i>}
            <span>{label}</span>
        </button>
    );
};

export default BackButton;

