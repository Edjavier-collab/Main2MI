'use client';

import React, { useMemo } from 'react';
import { PatientProfile, StageOfChange, UserTier, PersonalityTrait } from '../../types';
import { Card } from './Card';

interface PatientProfileCardProps {
    patient: PatientProfile;
    userTier?: UserTier;
    onUpgrade?: () => void;
}

// Personality trait display configuration
const PERSONALITY_TRAIT_LABELS: Record<PersonalityTrait, { label: string; icon: string; colorClass: string }> = {
    defensive: { label: 'Defensive', icon: 'fa-shield', colorClass: 'bg-red-100 text-red-700' },
    emotional: { label: 'Emotional', icon: 'fa-heart', colorClass: 'bg-pink-100 text-pink-700' },
    reserved: { label: 'Reserved', icon: 'fa-lock', colorClass: 'bg-slate-100 text-slate-700' },
    talkative: { label: 'Talkative', icon: 'fa-comments', colorClass: 'bg-blue-100 text-blue-700' },
    intellectualizer: { label: 'Intellectualizer', icon: 'fa-brain', colorClass: 'bg-purple-100 text-purple-700' },
    pleaser: { label: 'People Pleaser', icon: 'fa-handshake', colorClass: 'bg-green-100 text-green-700' },
};

// Stage colors for pills
const stageColors: Record<StageOfChange, { bg: string; text: string }> = {
    [StageOfChange.Precontemplation]: { bg: 'var(--color-error-light)', text: 'var(--color-error-dark)' },
    [StageOfChange.Contemplation]: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)' },
    [StageOfChange.Preparation]: { bg: 'var(--color-info-light)', text: 'var(--color-info-dark)' },
    [StageOfChange.Action]: { bg: 'var(--color-success-light)', text: 'var(--color-success-dark)' },
    [StageOfChange.Maintenance]: { bg: 'var(--color-primary-light)', text: 'var(--color-primary-dark)' },
};

// Generate avatar URL based on patient demographics
const getAvatarUrl = (name: string, sex: string, age: number): string => {
    // Use UI Avatars service for consistent, seeded avatars
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const bgColor = sex === 'Male' ? '4A90A4' : sex === 'Female' ? 'A4789B' : '7A8B99';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=128&bold=true&font-size=0.4`;
};

// MI Session Objectives based on stage of change
const getSessionObjectives = (stage: StageOfChange): string[] => {
    const commonObjectives = [
        'Resist the righting reflex',
        'Express empathy through reflections',
    ];

    const stageSpecific: Record<StageOfChange, string[]> = {
        [StageOfChange.Precontemplation]: [
            'Raise awareness without confrontation',
            'Explore patient\'s perspective on the behavior',
            'Plant seeds of doubt about current patterns',
        ],
        [StageOfChange.Contemplation]: [
            'Explore ambivalence about change',
            'Evoke change talk and personal values',
            'Develop discrepancy between values and behavior',
        ],
        [StageOfChange.Preparation]: [
            'Support autonomy in decision-making',
            'Explore potential change strategies',
            'Build confidence for upcoming changes',
        ],
        [StageOfChange.Action]: [
            'Affirm progress and efforts made',
            'Identify and address barriers',
            'Strengthen commitment to change',
        ],
        [StageOfChange.Maintenance]: [
            'Reinforce sustained changes',
            'Discuss relapse prevention strategies',
            'Celebrate successes and growth',
        ],
    };

    return [...commonObjectives, ...stageSpecific[stage]];
};

const PatientProfileCard: React.FC<PatientProfileCardProps> = ({ patient, userTier, onUpgrade }) => {
    const isFreeTier = userTier === UserTier.Free;
    const avatarUrl = useMemo(() => getAvatarUrl(patient.name, patient.sex, patient.age), [patient.name, patient.sex, patient.age]);
    const sessionObjectives = useMemo(() => getSessionObjectives(patient.stageOfChange), [patient.stageOfChange]);

    return (
        <Card
            variant="soft"
            padding="none"
            className="w-full max-w-2xl mx-auto overflow-hidden"
        >
            {/* Header - Centered Avatar Layout */}
            <header className="pt-6 pb-4 px-6 text-center border-b border-[var(--color-neutral-200)]">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                    <img
                        src={avatarUrl}
                        alt={`${patient.name}'s avatar`}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                    />
                    {/* Online indicator */}
                    <span
                        className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white"
                        style={{ backgroundColor: 'var(--color-success)' }}
                        aria-label="Available for session"
                    />
                </div>

                {/* Name and basic info */}
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{patient.name}</h2>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    {patient.age} years old, {patient.sex}
                </p>

                {/* Stat Pills */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    {/* Stage of Change Pill */}
                    <span
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{
                            backgroundColor: stageColors[patient.stageOfChange].bg,
                            color: stageColors[patient.stageOfChange].text,
                        }}
                    >
                        <i className="fa-solid fa-circle-dot mr-1 text-[10px]" aria-hidden="true" />
                        {patient.stageOfChange}
                    </span>

                    {/* Focus Area Pill */}
                    <span
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{
                            backgroundColor: 'var(--color-primary-light)',
                            color: 'var(--color-primary-dark)',
                        }}
                    >
                        <i className="fa-solid fa-bullseye mr-1 text-[10px]" aria-hidden="true" />
                        {patient.topic}
                    </span>

                    {/* Personality Trait Pill (if available) */}
                    {patient.personalityTrait && PERSONALITY_TRAIT_LABELS[patient.personalityTrait] && (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${PERSONALITY_TRAIT_LABELS[patient.personalityTrait].colorClass}`}>
                            <i className={`fa-solid ${PERSONALITY_TRAIT_LABELS[patient.personalityTrait].icon} text-[10px]`} aria-hidden="true" />
                            {PERSONALITY_TRAIT_LABELS[patient.personalityTrait].label}
                        </span>
                    )}
                </div>
            </header>

            <main className="p-6 space-y-5">
                {/* Reason for Visit / Chief Complaint */}
                <section>
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2 flex items-center">
                        <i className="fa-solid fa-quote-left text-[var(--color-primary)] mr-2" aria-hidden="true" />
                        Reason for Visit
                    </h3>
                    <blockquote
                        className="border-l-4 pl-4 py-2 italic text-[var(--color-text-primary)]"
                        style={{ borderColor: 'var(--color-primary)' }}
                    >
                        "{patient.chiefComplaint}"
                    </blockquote>
                </section>

                {/* Clinical Context (Premium) */}
                {!isFreeTier && (
                    <section
                        className="rounded-xl p-4"
                        style={{ backgroundColor: 'var(--color-neutral-50)' }}
                    >
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3 flex items-center">
                            <i className="fa-solid fa-stethoscope text-[var(--color-primary)] mr-2" aria-hidden="true" />
                            Clinical Context
                        </h3>

                        <div className="space-y-4">
                            {/* Usage Pattern */}
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-1">
                                    Usage Pattern
                                </h4>
                                <p className="text-sm text-[var(--color-text-primary)]">
                                    {patient.presentingProblem}
                                </p>
                            </div>

                            {/* Health Impact */}
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-1">
                                    Health Impact
                                </h4>
                                <p className="text-sm text-[var(--color-text-primary)]">
                                    {patient.history}
                                </p>
                            </div>

                            {/* Background */}
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-1">
                                    Background
                                </h4>
                                <p className="text-sm text-[var(--color-text-primary)]">
                                    {patient.background}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* Brief History for Free Tier */}
                {isFreeTier && (
                    <section>
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2 flex items-center">
                            <i className="fa-solid fa-file-medical text-[var(--color-primary)] mr-2" aria-hidden="true" />
                            Relevant History
                        </h3>
                        <p className="text-sm text-[var(--color-text-primary)]">
                            {patient.history.split('.')[0]}.
                        </p>
                    </section>
                )}

                {/* Session Objectives */}
                <section
                    className="rounded-xl p-4"
                    style={{ backgroundColor: 'var(--color-primary-light)' }}
                >
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center" style={{ color: 'var(--color-primary-dark)' }}>
                        <i className="fa-solid fa-clipboard-list mr-2" aria-hidden="true" />
                        Session Objectives
                    </h3>
                    <ul className="space-y-2">
                        {sessionObjectives.map((objective, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <i
                                    className="fa-solid fa-circle-check mt-0.5 text-sm flex-shrink-0"
                                    style={{ color: 'var(--color-primary)' }}
                                    aria-hidden="true"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">{objective}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>

            {/* Free Tier Upgrade CTA */}
            {isFreeTier && (
                <footer
                    className={`border-t border-[var(--color-neutral-200)] px-6 py-4 text-center ${onUpgrade ? 'cursor-pointer hover:bg-[var(--color-neutral-50)] transition-colors' : ''}`}
                    style={{ backgroundColor: 'var(--color-bg-card)' }}
                    onClick={onUpgrade}
                    role={onUpgrade ? 'button' : undefined}
                    tabIndex={onUpgrade ? 0 : undefined}
                    onKeyDown={onUpgrade ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onUpgrade();
                        }
                    } : undefined}
                >
                    <div className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-lock text-[var(--color-neutral-400)]" aria-hidden="true" />
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            Upgrade to Premium for full clinical context
                        </p>
                        <i className="fa-solid fa-arrow-right text-[var(--color-primary)] text-sm" aria-hidden="true" />
                    </div>
                </footer>
            )}
        </Card>
    );
};

export default PatientProfileCard;
