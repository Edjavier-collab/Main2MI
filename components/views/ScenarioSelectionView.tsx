import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PatientProfileFilters, StageOfChange, DifficultyLevel } from '../../types';
import { PATIENT_PROFILE_TEMPLATES, STAGE_DESCRIPTIONS } from '../../constants';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';

interface ScenarioSelectionViewProps {
    onBack: () => void;
    onStartPractice: (filters: PatientProfileFilters) => void;
}

interface CustomSelectProps {
    id: string;
    label: string;
    icon: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    helperText?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ id, label, icon, value, onChange, options, helperText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const selectedOption = options.find(opt => opt.value === value);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside as EventListener);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside as EventListener);
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
    
    return (
        <div ref={containerRef} className="relative">
            <label id={`${id}-label`} className="block text-lg font-bold text-[var(--color-text-primary)] mb-2">
                <i className={`${icon} mr-2 text-[var(--color-primary)]`} aria-hidden="true"></i>
                {label}
            </label>
            {helperText && (
                <p className="text-sm text-[var(--color-text-muted)] mb-3">{helperText}</p>
            )}
            
            {/* Trigger Button */}
            <button
                type="button"
                id={id}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={`${id}-label`}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 pr-12 text-left text-lg border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-medium cursor-pointer transition-all text-[var(--color-text-primary)] hover:bg-[var(--color-bg-accent)]"
                style={{ minHeight: '56px' }}
            >
                <span className={selectedOption?.value !== 'any' ? 'text-[var(--color-primary-dark)] font-semibold' : ''}>
                    {selectedOption?.label || 'Select...'}
                </span>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <i className={`fa-solid fa-chevron-down text-[var(--color-text-muted)] text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                </div>
            </button>
            
            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div 
                        className="fixed inset-0 z-40 bg-black/20 sm:hidden" 
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                    
                    {/* Options List */}
                    <ul
                        role="listbox"
                        aria-labelledby={`${id}-label`}
                        className="absolute left-0 right-0 mt-1 bg-white border-2 border-black shadow-lg z-50 max-h-72 overflow-y-auto"
                    >
                        {options.map((option, index) => (
                            <li
                                key={option.value}
                                role="option"
                                aria-selected={option.value === value}
                                onClick={() => handleSelect(option.value)}
                                className={`
                                    px-4 py-3 cursor-pointer transition-colors text-base
                                    ${option.value === value 
                                        ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' 
                                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-accent)]'
                                    }
                                    ${index !== options.length - 1 ? 'border-b border-[var(--color-neutral-200)]' : ''}
                                `}
                            >
                                <span className="flex items-center">
                                    {option.value === value && (
                                        <i className="fa-solid fa-check mr-2 text-[var(--color-primary)]" aria-hidden="true"></i>
                                    )}
                                    {option.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
    [DifficultyLevel.Beginner]: "Patient is collaborative and open to change (Preparation/Action stages).",
    [DifficultyLevel.Intermediate]: "Patient is ambivalent about changing (Contemplation stage).",
    [DifficultyLevel.Advanced]: "Patient is resistant and doesn't see behavior as a problem (Precontemplation stage).",
};

export const ScenarioSelectionView: React.FC<ScenarioSelectionViewProps> = ({ onBack, onStartPractice }) => {
    const [selectedTopic, setSelectedTopic] = useState('any');
    const [selectedStage, setSelectedStage] = useState('any');
    const [selectedDifficulty, setSelectedDifficulty] = useState('any');

    // Memoize the list of unique topics from the constants file
    const uniqueTopics = useMemo(() => {
        const topics = new Set(PATIENT_PROFILE_TEMPLATES.map(t => t.topic));
        return Array.from(topics).sort();
    }, []);
    
    const allStages = Object.values(StageOfChange);
    const allDifficulties = Object.values(DifficultyLevel);

    const handleStart = () => {
        const filters: PatientProfileFilters = {};
        if (selectedTopic !== 'any') {
            filters.topic = selectedTopic;
        }
        if (selectedStage !== 'any') {
            filters.stageOfChange = selectedStage as StageOfChange;
        } else if (selectedDifficulty !== 'any') {
            // Only apply difficulty if a specific stage isn't chosen
            filters.difficulty = selectedDifficulty as DifficultyLevel;
        }
        onStartPractice(filters);
    };
    
    const handleRandomStart = () => {
        onStartPractice({});
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 p-4 sm:p-6">
            <header className="flex items-center mb-6 pt-2 max-w-2xl mx-auto">
                <BackButton onClick={onBack} className="mr-3" />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Scenario Selection</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                {/* Form Card */}
                <Card variant="elevated" padding="lg" className="border-2 border-black shadow-lg">
                    <div className="space-y-6">
                        {/* Section: Topic */}
                        <div>
                            <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                                What would you like to practice?
                            </h2>
                            <CustomSelect
                                id="topic-select"
                                label="Topic of Conversation"
                                icon="fa-solid fa-comments"
                                value={selectedTopic}
                                onChange={setSelectedTopic}
                                helperText="Choose a specific behavioral health topic or leave as 'Any' for variety."
                                options={[
                                    { value: 'any', label: 'Any Topic' },
                                    ...uniqueTopics.map(topic => ({ value: topic, label: topic }))
                                ]}
                            />
                        </div>

                        <hr className="border-[var(--color-neutral-200)]" />

                        {/* Section: Difficulty */}
                        <div>
                            <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                                Choose your challenge level
                            </h2>
                            <CustomSelect
                                id="difficulty-select"
                                label="Difficulty Level"
                                icon="fa-solid fa-gauge-high"
                                value={selectedDifficulty}
                                onChange={setSelectedDifficulty}
                                helperText="Higher difficulty means more resistant patients."
                                options={[
                                    { value: 'any', label: 'Any Difficulty' },
                                    ...allDifficulties.map(level => ({ value: level, label: level }))
                                ]}
                            />
                            {selectedDifficulty !== 'any' && (
                                <div className="mt-3 p-3 bg-[var(--color-warning-light)] border border-[var(--color-warning)] text-[var(--color-warning-dark)] text-sm rounded-md">
                                    <i className="fa-solid fa-circle-info mr-2" aria-hidden="true"></i>
                                    {DIFFICULTY_DESCRIPTIONS[selectedDifficulty as DifficultyLevel]}
                                </div>
                            )}
                        </div>

                        <hr className="border-[var(--color-neutral-200)]" />

                        {/* Section: Stage of Change (Advanced) */}
                        <div>
                            <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                                Advanced: Target a specific stage
                            </h2>
                            <CustomSelect
                                id="stage-select"
                                label="Stage of Change"
                                icon="fa-solid fa-stairs"
                                value={selectedStage}
                                onChange={setSelectedStage}
                                helperText="Optional. Overrides difficulty setting if selected."
                                options={[
                                    { value: 'any', label: 'Any Stage' },
                                    ...allStages.map(stage => ({ value: stage, label: stage }))
                                ]}
                            />
                            {selectedStage !== 'any' && (
                                <div className="mt-3 p-3 bg-[var(--color-info-light)] border border-[var(--color-info)] text-[var(--color-info-dark)] text-sm rounded-md">
                                    <i className="fa-solid fa-circle-info mr-2" aria-hidden="true"></i>
                                    {STAGE_DESCRIPTIONS[selectedStage as StageOfChange]}
                                </div>
                            )}
                            {selectedStage !== 'any' && selectedDifficulty !== 'any' && (
                                <div className="mt-2 p-2 bg-[var(--color-bg-accent)] border border-[var(--color-primary-light)] text-[var(--color-text-secondary)] text-xs">
                                    <i className="fa-solid fa-triangle-exclamation mr-1 text-amber-500" aria-hidden="true"></i>
                                    Stage selection will override your difficulty choice.
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* CTA Buttons */}
                <div>
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full mb-3">
                            <i className="fa-solid fa-rocket text-3xl text-[var(--color-primary-dark)]" aria-hidden="true"></i>
                        </div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Ready to Start?</h2>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Choose how you'd like to begin your practice session</p>
                    </div>

                    <div className="shadow-lg rounded-lg overflow-hidden">
                        <button
                            onClick={handleStart}
                            className="w-full min-h-[var(--touch-target-min)] py-3 px-4 bg-white border-2 border-b border-[var(--color-neutral-400)] text-[var(--color-text-primary)] font-semibold text-base hover:bg-[var(--color-bg-accent)] transition-colors"
                        >
                            Start Selected Scenario
                        </button>
                        <button
                            onClick={handleRandomStart}
                            className="w-full min-h-[var(--touch-target-min)] py-3 px-4 bg-white border-2 border-t-0 border-[var(--color-neutral-400)] text-[var(--color-text-primary)] font-semibold text-base hover:bg-[var(--color-bg-accent)] transition-colors"
                        >
                            Start a Random Scenario
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};
