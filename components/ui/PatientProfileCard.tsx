'use client';

import React from 'react';
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

interface InfoSectionProps {
    icon: string;
    title: string;
    children: React.ReactNode;
    colorClassName: string;
}

const InfoSection: React.FC<InfoSectionProps> = ({ icon, title, children, colorClassName }) => (
    <div>
        <h3 className={`text-sm font-semibold ${colorClassName} uppercase flex items-center mb-2`}>
            <i className={`fa-solid ${icon} w-6 text-center mr-2`}></i>
            {title}
        </h3>
        <div className="text-neutral-700 space-y-2 pl-8">
            {children}
        </div>
    </div>
);

const stageColors: Record<StageOfChange, string> = {
    [StageOfChange.Precontemplation]: 'bg-error-light text-error-dark',
    [StageOfChange.Contemplation]: 'bg-warning-light text-warning-dark',
    [StageOfChange.Preparation]: 'bg-info-light text-info-dark',
    [StageOfChange.Action]: 'bg-success-light text-success-dark',
    [StageOfChange.Maintenance]: 'bg-primary-lighter text-primary-darker',
};


const PatientProfileCard: React.FC<PatientProfileCardProps> = ({ patient, userTier, onUpgrade }) => {
    const isFreeTier = userTier === UserTier.Free;

    const abbreviate = (text: string): string => {
        const sentences = text.split('.');
        if (sentences.length > 1 && sentences[0]) {
            return sentences[0] + '.';
        }
        return text;
    };

    return (
        <Card
            variant="soft"
            padding="none"
            hoverable
            className="w-full max-w-2xl mx-auto overflow-hidden"
        >
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-[var(--color-neutral-200)]">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--color-neutral-900)]">{patient.name}</h2>
                    <p className="text-[var(--color-neutral-500)]">{patient.age}, {patient.sex}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 text-sm font-bold rounded-full ${stageColors[patient.stageOfChange]}`}>
                        {patient.stageOfChange}
                    </div>
                    {patient.personalityTrait && PERSONALITY_TRAIT_LABELS[patient.personalityTrait] && (
                        <div className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${PERSONALITY_TRAIT_LABELS[patient.personalityTrait].colorClass}`}>
                            <i className={`fa-solid ${PERSONALITY_TRAIT_LABELS[patient.personalityTrait].icon} text-[10px]`} aria-hidden="true"></i>
                            {PERSONALITY_TRAIT_LABELS[patient.personalityTrait].label}
                        </div>
                    )}
                </div>
            </header>

            <main className="py-6 px-6 space-y-6">
                {!isFreeTier && (
                    <InfoSection icon="fa-user" title="Background" colorClassName="text-teal-600">
                        <p>{patient.background}</p>
                    </InfoSection>
                )}

                {!isFreeTier && (
                    <InfoSection icon="fa-clipboard-question" title="Presenting Problem" colorClassName="text-amber-600">
                         <p>{patient.presentingProblem}</p>
                    </InfoSection>
                )}

                <InfoSection icon="fa-file-waveform" title="Relevant History" colorClassName="text-sky-600">
                    <p>{isFreeTier ? abbreviate(patient.history) : patient.history}</p>
                </InfoSection>

                 <div>
                    <h3 className="text-sm font-semibold text-indigo-600 uppercase flex items-center mb-2">
                        <i className="fa-solid fa-quote-left w-6 text-center mr-2"></i>
                        Chief Complaint
                    </h3>
                    <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-bg-accent)] p-4 rounded-r-lg ml-8">
                        <p className="text-[var(--color-neutral-800)] italic leading-relaxed">"{patient.chiefComplaint}"</p>
                    </blockquote>
                </div>
            </main>

            {isFreeTier && (
                <footer
                    className={`bg-[var(--color-neutral-50)] border-t border-[var(--color-neutral-200)] px-6 py-4 text-center ${onUpgrade ? 'cursor-pointer hover:bg-[var(--color-neutral-100)] transition-colors' : ''}`}
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
                    <div className="flex items-center justify-center">
                        <i className="fa-solid fa-lock text-[var(--color-neutral-400)] mr-3" aria-hidden="true"></i>
                        <p className="text-sm font-medium text-[var(--color-neutral-600)]">
                            Upgrade to Premium to view the patient's complete profile.
                        </p>
                    </div>
                </footer>
            )}
        </Card>
    );
};

export default PatientProfileCard;
