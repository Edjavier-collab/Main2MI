'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectOptionGroup {
    label: string;
    options: SelectOption[];
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options?: SelectOption[];
    groupedOptions?: SelectOptionGroup[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    groupedOptions,
    placeholder = 'Select an option...',
    disabled = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get all options flattened for finding selected label
    const allOptions: SelectOption[] = options ||
        (groupedOptions?.flatMap(group => group.options) || []);

    const selectedOption = allOptions.find(opt => opt.value === value);
    const displayValue = selectedOption?.label || placeholder;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full p-4 rounded-[var(--radius-md)] border bg-white text-left flex items-center justify-between transition-colors
                    ${isOpen
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                        : 'border-[var(--color-neutral-300)]'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-neutral-400)]'}
                `}
                style={{ fontSize: '18px' }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`block truncate ${!selectedOption ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                    {displayValue}
                </span>
                <i
                    className={`fa-solid fa-chevron-down text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-neutral-300)] rounded-[var(--radius-md)] shadow-lg max-h-72 overflow-y-auto"
                    role="listbox"
                >
                    {/* Simple options */}
                    {options && options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full px-4 py-3 text-left transition-colors
                                ${option.value === value
                                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-darker)] font-medium'
                                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]'
                                }
                            `}
                            style={{ fontSize: '18px' }}
                            role="option"
                            aria-selected={option.value === value}
                        >
                            {option.label}
                        </button>
                    ))}

                    {/* Grouped options */}
                    {groupedOptions && groupedOptions.map((group) => (
                        <div key={group.label}>
                            <div
                                className="px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-neutral-50)] border-t border-b border-[var(--color-neutral-200)] first:border-t-0"
                            >
                                {group.label}
                            </div>
                            {group.options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full px-4 py-3 text-left transition-colors
                                        ${option.value === value
                                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-darker)] font-medium'
                                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]'
                                        }
                                    `}
                                    style={{ fontSize: '18px' }}
                                    role="option"
                                    aria-selected={option.value === value}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
