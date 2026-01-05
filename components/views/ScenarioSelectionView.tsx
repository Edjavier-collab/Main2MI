'use client';

import React, { useState, useMemo } from 'react';
import { PatientProfile, DifficultyLevel, StageOfChange } from '../../types';
import { PATIENT_TOPIC_TEMPLATES } from '../../constants';
import { Button } from '../ui/Button';
import { FeaturedResourceCard } from '../ui/FeaturedResourceCard';
import { CustomSelect, SelectOption, SelectOptionGroup } from '../ui/CustomSelect';
import { FlaskConical, Shuffle } from 'lucide-react';

interface ScenarioSelectionViewProps {
    onBack: () => void;
    onStartPractice: (patientProfile: PatientProfile) => void;
}

const SectionHeader: React.FC<{ title: string, children?: React.ReactNode }> = ({ title, children }) => (
    <div className="flex justify-between items-center">
        <h2 className="px-1 pt-6 pb-2 text-sm font-semibold text-text-secondary uppercase tracking-wider">
            {title}
        </h2>
        {children}
    </div>
);

const IconBox = ({ icon, className }: { icon: React.ReactNode; className?: string }) => (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${className}`}>
        {icon}
    </div>
);

export const ScenarioSelectionView: React.FC<ScenarioSelectionViewProps> = ({ onBack, onStartPractice }) => {
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.Intermediate);
    const [selectedStage, setSelectedStage] = useState<StageOfChange>(StageOfChange.Contemplation);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create grouped options for the topic dropdown
    const groupedTopicOptions = useMemo((): SelectOptionGroup[] => {
        const grouped = PATIENT_TOPIC_TEMPLATES.reduce((acc, template) => {
            const category = template.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({
                value: template.topic,
                label: template.topic,
            });
            return acc;
        }, {} as Record<string, SelectOption[]>);

        return Object.entries(grouped).map(([label, options]) => ({
            label,
            options,
        }));
    }, []);

    // Flat list for random selection
    const allTopicOptions = useMemo(() => {
        return PATIENT_TOPIC_TEMPLATES.map(t => ({
            value: t.topic,
            label: t.topic,
        }));
    }, []);

    const stageOptions = useMemo((): SelectOption[] => {
        return Object.values(StageOfChange).map(stage => ({
            value: stage,
            label: stage,
        }));
    }, []);

    const difficultyOptions = useMemo((): SelectOption[] => {
        return Object.values(DifficultyLevel).map(d => ({
            value: d,
            label: d,
        }));
    }, []);

    const handleGenerate = async (topic?: string, difficulty?: DifficultyLevel, stage?: StageOfChange) => {
        const topicToUse = topic || selectedTopic;
        const difficultyToUse = difficulty || selectedDifficulty;
        const stageToUse = stage || selectedStage;

        if (!topicToUse) {
            setError('Please select a scenario');
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const response = await fetch('/api/generate-scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        const randomTopic = allTopicOptions[Math.floor(Math.random() * allTopicOptions.length)];
        const stages = Object.values(StageOfChange);
        const difficulties = Object.values(DifficultyLevel);
        const randomStage = stages[Math.floor(Math.random() * stages.length)];
        const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

        setSelectedTopic(randomTopic.value);
        setSelectedStage(randomStage);
        setSelectedDifficulty(randomDifficulty);

        handleGenerate(randomTopic.value, randomDifficulty, randomStage);
    };

    const featuredScenario = PATIENT_TOPIC_TEMPLATES.find(t => t.topic.includes('Tobacco'));

    return (
        <div className="min-h-screen bg-transparent pb-24 p-4 sm:p-6">
            <header className="flex items-center mb-6 pt-2 max-w-3xl mx-auto">
                <Button variant="ghost" size="sm" onClick={onBack} icon={<i className="fa-solid fa-arrow-left" />} aria-label="Go back" className="mr-3" disabled={isGenerating} />
                <h1 className="text-2xl font-bold text-text-primary">Select a Scenario</h1>
            </header>

            <main className="max-w-3xl mx-auto space-y-6">

                {featuredScenario && (
                    <>
                        <SectionHeader title="Featured" />
                        <FeaturedResourceCard
                            title={featuredScenario.topic}
                            description={featuredScenario.variants[0]?.presentingProblem || 'Practice with this common scenario'}
                            icon={<IconBox icon={<FlaskConical size={28} />} className="bg-primary/10 text-primary" />}
                            buttonText="Start Practice"
                            onClick={() => {
                                setSelectedTopic(featuredScenario.topic);
                                handleGenerate(featuredScenario.topic);
                            }}
                        />
                    </>
                )}

                <SectionHeader title="Customize Your Scenario" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted px-1 mb-2">Topic</label>
                        <CustomSelect
                            value={selectedTopic}
                            onChange={setSelectedTopic}
                            groupedOptions={groupedTopicOptions}
                            placeholder="Select a topic..."
                            disabled={isGenerating}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted px-1 mb-2">Difficulty</label>
                        <CustomSelect
                            value={selectedDifficulty}
                            onChange={(v) => setSelectedDifficulty(v as DifficultyLevel)}
                            options={difficultyOptions}
                            disabled={isGenerating}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted px-1 mb-2">Stage of Change</label>
                        <CustomSelect
                            value={selectedStage}
                            onChange={(v) => setSelectedStage(v as StageOfChange)}
                            options={stageOptions}
                            disabled={isGenerating}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-[var(--radius-md)] bg-error-light border border-error text-error-dark">
                        <p>{error}</p>
                    </div>
                )}

                <div className="sticky bottom-4 z-10 pt-4 space-y-3">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={() => handleGenerate()}
                        loading={isGenerating}
                        disabled={!selectedTopic || isGenerating}
                    >
                        {isGenerating ? 'Generating Patient...' : 'Start Practice'}
                    </Button>
                    <Button
                        variant="soft"
                        size="lg"
                        fullWidth
                        onClick={handleSurpriseMe}
                        icon={<Shuffle size={20} />}
                        disabled={isGenerating}
                    >
                        Surprise Me
                    </Button>
                </div>
            </main>
        </div>
    );
};
