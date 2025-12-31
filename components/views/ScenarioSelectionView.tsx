'use client';

import React, { useState, useMemo } from 'react';
import { PatientProfile, DifficultyLevel, StageOfChange } from '../../types';
import { PATIENT_TOPIC_TEMPLATES, PatientTopicTemplate } from '../../constants';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CustomSelect, SelectOptionGroup, SelectOption } from '../ui/CustomSelect';

interface ScenarioSelectionViewProps {
    onBack: () => void;
    onStartPractice: (patientProfile: PatientProfile) => void;
}

// Get unique topics from templates
const getTopicOptions = () => {
    const topics = PATIENT_TOPIC_TEMPLATES.map(t => ({
        value: t.topic,
        label: t.topic,
        category: t.category,
    }));
    return topics;
};

// Get category color classes
const getCategoryStyles = (category: PatientTopicTemplate['category']): string => {
    switch (category) {
        case 'Alcohol':
            return 'bg-purple-100 text-purple-700';
        case 'Nicotine':
            return 'bg-gray-100 text-gray-700';
        case 'Cannabis':
            return 'bg-emerald-100 text-emerald-700';
        case 'Opioids':
            return 'bg-red-100 text-red-700';
        case 'Stimulants':
            return 'bg-orange-100 text-orange-700';
        case 'Other Substances':
            return 'bg-indigo-100 text-indigo-700';
        case 'Behavioral':
            return 'bg-pink-100 text-pink-700';
        case 'Health':
            return 'bg-teal-100 text-teal-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

export const ScenarioSelectionView: React.FC<ScenarioSelectionViewProps> = ({ onBack, onStartPractice }) => {
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.Intermediate);
    const [selectedStage, setSelectedStage] = useState<StageOfChange>(StageOfChange.Contemplation);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const topicOptions = useMemo(() => getTopicOptions(), []);

    // Group topics by category for CustomSelect
    const groupedTopicsForSelect = useMemo((): SelectOptionGroup[] => {
        const groups: Record<string, SelectOption[]> = {};
        topicOptions.forEach(topic => {
            if (!groups[topic.category]) {
                groups[topic.category] = [];
            }
            groups[topic.category].push({ value: topic.value, label: topic.label });
        });
        return Object.entries(groups).map(([label, options]) => ({ label, options }));
    }, [topicOptions]);

    // Stage of change options for CustomSelect
    const stageOptions = useMemo((): SelectOption[] => {
        return Object.values(StageOfChange).map(stage => ({
            value: stage,
            label: stage,
        }));
    }, []);

    const selectedTopicData = useMemo(() => {
        return topicOptions.find(t => t.value === selectedTopic);
    }, [selectedTopic, topicOptions]);

    const handleGenerate = async (topic?: string, difficulty?: DifficultyLevel, stage?: StageOfChange) => {
        const topicToUse = topic || selectedTopic;
        const difficultyToUse = difficulty || selectedDifficulty;
        const stageToUse = stage || selectedStage;

        if (!topicToUse) {
            setError('Please select a topic');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/generate-scenario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topicToUse,
                    difficulty: difficultyToUse,
                    stageOfChange: stageToUse,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate scenario');
            }

            const data = await response.json();
            onStartPractice(data.patientProfile);
        } catch (err) {
            console.error('[ScenarioSelectionView] Error generating scenario:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate scenario. Please try again.');
            setIsGenerating(false);
        }
    };

    const handleSurpriseMe = () => {
        // Pick random values
        const randomTopic = topicOptions[Math.floor(Math.random() * topicOptions.length)];
        const stages = Object.values(StageOfChange);
        const difficulties = Object.values(DifficultyLevel);
        const randomStage = stages[Math.floor(Math.random() * stages.length)];
        const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

        // Update state for visual feedback
        setSelectedTopic(randomTopic.value);
        setSelectedStage(randomStage);
        setSelectedDifficulty(randomDifficulty);

        // Generate with the random values directly
        handleGenerate(randomTopic.value, randomDifficulty, randomStage);
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 p-4 sm:p-6">
            <header className="flex items-center mb-6 pt-2 max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<i className="fa-solid fa-arrow-left" />}
                    aria-label="Go back"
                    className="mr-3"
                    disabled={isGenerating}
                />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Build Your Scenario</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                {/* Introduction */}
                <Card variant="soft" padding="md">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
                        </div>
                        <div>
                            <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">AI-Generated Patient</h2>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Configure your scenario parameters and our AI will create a unique patient with a realistic backstory tailored to your selections.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Topic Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                        Substance / Behavior
                    </label>
                    <CustomSelect
                        value={selectedTopic}
                        onChange={(value) => {
                            setSelectedTopic(value);
                            setError(null);
                        }}
                        groupedOptions={groupedTopicsForSelect}
                        placeholder="Select a topic..."
                        disabled={isGenerating}
                    />
                    {selectedTopicData && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${getCategoryStyles(selectedTopicData.category)}`}>
                            {selectedTopicData.category}
                        </span>
                    )}
                </div>

                {/* Difficulty Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                        Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.values(DifficultyLevel).map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setSelectedDifficulty(level)}
                                disabled={isGenerating}
                                className={`p-3 rounded-[var(--radius-md)] border-2 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                                    selectedDifficulty === level
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-darker)]'
                                        : 'border-[var(--color-neutral-200)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-neutral-300)]'
                                }`}
                            >
                                <span className="font-medium">{level}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {selectedDifficulty === DifficultyLevel.Beginner && 'Cooperative patient, easier to build rapport'}
                        {selectedDifficulty === DifficultyLevel.Intermediate && 'Moderately ambivalent, requires more skill'}
                        {selectedDifficulty === DifficultyLevel.Advanced && 'Resistant or guarded, challenging dynamics'}
                    </p>
                </div>

                {/* Stage of Change Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                        Stage of Change
                    </label>
                    <CustomSelect
                        value={selectedStage}
                        onChange={(value) => setSelectedStage(value as StageOfChange)}
                        options={stageOptions}
                        disabled={isGenerating}
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {selectedStage === StageOfChange.Precontemplation && "Patient doesn't see their behavior as a problem"}
                        {selectedStage === StageOfChange.Contemplation && 'Patient is aware but ambivalent about change'}
                        {selectedStage === StageOfChange.Preparation && 'Patient is ready to make a change soon'}
                        {selectedStage === StageOfChange.Action && 'Patient is actively working on changing'}
                        {selectedStage === StageOfChange.Maintenance && 'Patient has changed and is maintaining progress'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error-dark)]">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-exclamation-circle" aria-hidden="true"></i>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => handleGenerate()}
                    loading={isGenerating}
                    disabled={!selectedTopic || isGenerating}
                    icon={!isGenerating ? <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> : undefined}
                >
                    {isGenerating ? 'Generating Patient...' : 'Generate Scenario'}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-[var(--color-neutral-200)]"></div>
                    <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Or</span>
                    <div className="flex-1 h-px bg-[var(--color-neutral-200)]"></div>
                </div>

                {/* Quick Start with Random */}
                <Card
                    variant="default"
                    padding="md"
                    hoverable={!isGenerating}
                    onClick={isGenerating ? undefined : handleSurpriseMe}
                    className={`bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] border-0 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <i className="fa-solid fa-shuffle text-xl" aria-hidden="true"></i>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">Surprise Me</h3>
                            <p className="text-white/80 text-sm mt-0.5">Generate a completely random scenario</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-white/60" aria-hidden="true"></i>
                    </div>
                </Card>
            </main>
        </div>
    );
};
