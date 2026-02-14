'use client';

import React, { useMemo } from 'react';
import { PatientProfile, StageOfChange, UserTier, PersonalityTrait } from '../../types';
import { Card } from './Card';

interface PatientProfileCardProps {
    patient: PatientProfile;
    userTier?: UserTier;
    onUpgrade?: () => void;
}

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

const AVATAR_COLORS = ['#6B8E7B', '#7B8FA1', '#9B8EA7', '#A1887F', '#8D9E72', '#7E9AAB'];

/**
 * Generate a consistent muted color based on the patient's name.
 */
const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

/**
 * Get initials from name (max 2 characters).
 */
const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

const PERSONALITY_TRAIT_LABELS: Record<PersonalityTrait, string> = {
    defensive: 'Defensive',
    emotional: 'Emotional',
    reserved: 'Reserved',
    talkative: 'Talkative',
    intellectualizer: 'Intellectualizer',
    pleaser: 'People Pleaser',
};

// MI Session Objectives based on stage of change (Unchanged logic)
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
    const sessionObjectives = useMemo(() => getSessionObjectives(patient.stageOfChange), [patient.stageOfChange]);
    const avatarColor = useMemo(() => getAvatarColor(patient.name), [patient.name]);
    const initials = useMemo(() => getInitials(patient.name), [patient.name]);

    return (
        <Card
            variant="soft"
            padding="none"
            className="w-full max-w-2xl mx-auto overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl"
        >
            {/* ----------------------------------------------------------------------
                HEADER: Avatar, Name, Demographics, Clinical Tags
               ---------------------------------------------------------------------- */}
            <header className="pt-8 pb-6 px-6 text-center border-b border-[#F0F0F0]">
                {/* Avatar */}
                <div
                    className="relative inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: avatarColor }}
                >
                    <span className="text-white text-2xl font-bold tracking-wide">
                        {initials}
                    </span>
                </div>

                {/* Name & Demographics */}
                <h2 className="text-[22px] font-bold text-[var(--color-text-primary)] mb-1">
                    {patient.name}
                </h2>
                <p className="text-[14px] text-[var(--color-text-muted)] mb-6">
                    {patient.age} years old, {patient.sex}
                </p>

                {/* Clinical Tags Row */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
                    {/* Stage of Change */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 opacity-70">
                            Stage
                        </span>
                        <div className="px-3.5 py-2 rounded-md border border-[#D4D4D4] bg-white text-[13px] font-medium text-[#555]">
                            {patient.stageOfChange}
                        </div>
                    </div>

                    {/* Presenting Issue */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 opacity-70">
                            Issue
                        </span>
                        <div className="px-3.5 py-2 rounded-md border border-[#D4D4D4] bg-white text-[13px] font-medium text-[#555]">
                            {patient.topic}
                        </div>
                    </div>

                    {/* Personality Style (Optional) */}
                    {patient.personalityTrait && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 opacity-70">
                                Style
                            </span>
                            <div className="px-3.5 py-2 rounded-md border border-[#D4D4D4] bg-white text-[13px] font-medium text-[#555]">
                                {PERSONALITY_TRAIT_LABELS[patient.personalityTrait] || patient.personalityTrait}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* ----------------------------------------------------------------------
                MAIN CONTENT: Reason, Context, Objectives
               ---------------------------------------------------------------------- */}
            <main className="p-6 space-y-6 bg-[var(--color-bg-main)]">

                {/* 1. Reason for Visit */}
                <section>
                    <h3 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-3">
                        Reason for Visit
                    </h3>
                    <div
                        className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex"
                    >
                        <div className="w-[3px] bg-[var(--color-primary)] flex-shrink-0" />
                        <div className="p-6 flex-1 bg-[#FAFAFA]">
                            <p className="text-[15px] italic text-[var(--color-text-primary)] leading-relaxed">
                                "{patient.chiefComplaint}"
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. Clinical Context (Premium) */}
                {!isFreeTier && (
                    <section>
                        <h3 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-3">
                            Clinical Context
                        </h3>
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
                            <div className="space-y-4">
                                {/* Usage */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-1.5">
                                        Usage Pattern
                                    </h4>
                                    <p className="text-[15px] text-[var(--color-text-primary)] leading-relaxed">
                                        {patient.presentingProblem}
                                    </p>
                                </div>
                                <div className="h-px bg-[#F0F0F0]" />

                                {/* Health Impact */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-1.5">
                                        Health Impact
                                    </h4>
                                    <p className="text-[15px] text-[var(--color-text-primary)] leading-relaxed">
                                        {patient.history}
                                    </p>
                                </div>
                                <div className="h-px bg-[#F0F0F0]" />

                                {/* Background */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#999] uppercase tracking-wider mb-1.5">
                                        Background
                                    </h4>
                                    <p className="text-[15px] text-[var(--color-text-primary)] leading-relaxed">
                                        {patient.background}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Brief History for Free Tier */}
                {isFreeTier && (
                    <section>
                        <h3 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-3">
                            Clinical Context
                        </h3>
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
                            <p className="text-[15px] text-[var(--color-text-primary)] leading-relaxed">
                                {patient.history.split('.')[0]}.
                            </p>
                        </div>
                    </section>
                )}

                {/* 3. Session Objectives */}
                <section>
                    <h3 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-3">
                        Session Objectives
                    </h3>
                    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex">
                        <div className="w-[3px] bg-[var(--color-primary)] flex-shrink-0" />
                        <div className="p-6 flex-1">
                            <ul className="space-y-3">
                                {sessionObjectives.map((objective, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span
                                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="text-[15px] text-[var(--color-text-primary)] leading-snug">
                                            {objective}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            {/* Free Tier Upgrade CTA */}
            {isFreeTier && (
                <footer
                    className={`border-t border-[#F0F0F0] px-6 py-5 text-center bg-white ${onUpgrade ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                    onClick={onUpgrade}
                >
                    <div className="flex items-center justify-center gap-2">
                        <i className="fa-solid fa-lock text-[var(--color-text-muted)] text-sm" aria-hidden="true" />
                        <p className="text-[14px] font-medium text-[var(--color-text-secondary)]">
                            Upgrade to Premium for full clinical context
                        </p>
                        <i className="fa-solid fa-arrow-right text-[var(--color-primary)] text-sm ml-1" aria-hidden="true" />
                    </div>
                </footer>
            )}
        </Card>
    );
};

export default PatientProfileCard;
