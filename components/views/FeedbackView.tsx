'use client';

import React from 'react';
import { Session, UserTier } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface FeedbackViewProps {
    session: Session;
    onDone: () => void;
    onUpgrade: () => void;
    onStartPractice?: () => void;
}

interface LockedSectionProps {
    children: React.ReactNode;
    onUpgrade: () => void;
    lockMessage?: string;
}

const LockedSection: React.FC<LockedSectionProps> = ({ children, onUpgrade, lockMessage = "Upgrade to see this content" }) => {
    return (
        <div
            className="relative cursor-pointer group"
            onClick={onUpgrade}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onUpgrade();
                }
            }}
            aria-label={`${lockMessage}. Tap to upgrade to premium.`}
        >
            {/* Real content, but blurred - user can see there's text behind */}
            <div className="filter blur-[4px] select-none pointer-events-none" aria-hidden="true">
                {children}
            </div>
            {/* Semi-transparent overlay with lock - allows blurred content to show through */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-2xl transition-all group-hover:bg-white/70 group-focus-visible:ring-2 group-focus-visible:ring-[var(--color-primary)] group-focus-visible:ring-offset-2">
                <div className="bg-[var(--color-primary-lighter)] w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-lock text-2xl text-[var(--color-primary-dark)]" aria-hidden="true"></i>
                </div>
                <p className="text-[var(--color-text-primary)] font-bold text-sm">{lockMessage}</p>
                <p className="text-[var(--color-primary)] text-xs mt-1 font-semibold flex items-center gap-1">
                    <i className="fa-solid fa-arrow-up text-[10px]" aria-hidden="true"></i>
                    Tap to upgrade
                </p>
            </div>
        </div>
    );
};

const EmpathyGauge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = (score / 5) * 100;
    const circumference = 2 * Math.PI * 45; // 2 * pi * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    className="text-[var(--color-neutral-200)]"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                {/* Progress circle */}
                <circle
                    className="text-[var(--color-primary)]"
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.8s ease-out'
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">{score}</span>
                <span className="text-sm font-medium text-[var(--color-text-muted)]">/ 5</span>
            </div>
        </div>
    );
};

const MASTER_SKILL_LIST = [
    'Open Questions',
    'Affirmations',
    'Reflections',
    'Summaries',
    'Developing Discrepancy',
    'Eliciting Change Talk',
    'Rolling with Resistance',
    'Supporting Self-Efficacy'
];

const DEFAULT_NEXT_FOCUS = "Focus on balancing your use of Open Questions and Reflections. Aim to keep the conversation patient-centered while guiding them towards change.";

const SkillsChecklist: React.FC<{ skillsUsed: string[] }> = ({ skillsUsed }) => (
    <div>
        <h3 className="text-lg font-bold text-slate-700 mb-3">MI Skills Checklist</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {MASTER_SKILL_LIST.map(skill => {
                const wasUsed = skillsUsed.includes(skill);
                return (
                    <div key={skill} className={`flex items-center transition-colors duration-300 ${wasUsed ? 'text-slate-800' : 'text-slate-400'}`}>
                        <i className={`fa-solid ${wasUsed ? 'fa-check-square text-success' : 'fa-square'} mr-3 text-lg`}></i>
                        <span className="font-medium">{skill}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

const FeedbackSectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <Card variant="elevated" padding="md">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center">
            <i className={`fa-solid ${icon} mr-3 text-[var(--color-primary)]`} aria-hidden="true"></i>
            {title}
        </h3>
        <p className="text-[var(--color-text-secondary)] leading-relaxed pl-8 whitespace-pre-wrap">{children}</p>
    </Card>
);

const FeedbackView: React.FC<FeedbackViewProps> = ({ session, onDone, onUpgrade, onStartPractice }) => {
    const { feedback, tier } = session;
    const isInsufficientData = feedback.analysisStatus === 'insufficient-data';
    const insufficientMessage = feedback.analysisMessage ?? "We didn’t capture any clinician responses during this session, so there isn’t enough information to generate feedback. Try another session when you’re ready to practice.";

    if (isInsufficientData) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center pb-24">
                <Card variant="elevated" padding="lg" className="w-full max-w-md">
                    <div className="mb-6 flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-[var(--color-warning-light)] flex items-center justify-center">
                            <i className="fa-solid fa-circle-exclamation text-4xl text-[var(--color-warning)]" aria-hidden="true"></i>
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-3">Not Enough Data</h1>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{insufficientMessage}</p>
                    <div className="mt-8 space-y-3">
                        {tier === UserTier.Free && (
                            <Button
                                onClick={onUpgrade}
                                variant="primary"
                                size="lg"
                                fullWidth
                                icon={<i className="fa fa-award" />}
                            >
                                Upgrade to Premium
                            </Button>
                        )}
                        {onStartPractice && (
                            <Button
                                onClick={onStartPractice}
                                variant="primary"
                                size="lg"
                                fullWidth
                                className="shadow-md"
                            >
                                Start a New Practice
                            </Button>
                        )}
                        <Button
                            onClick={onDone}
                            variant="ghost"
                            size="lg"
                            fullWidth
                            className="border border-[var(--color-neutral-200)]"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (tier === UserTier.Free) {
        const empathyScore = feedback.empathyScore ?? 0;
        // Use skillsDetected (new field) with fallback to keySkillsUsed (old field)
        // IMPORTANT: Only use detected skills, never show all 8 from master list
        const allSkills = feedback.skillsDetected || feedback.keySkillsUsed || [];
        // Ensure we only show detected skills, never the full master list
        const visibleSkills = Array.isArray(allSkills) ? allSkills.slice(0, 2) : [];
        const lockedCount = Math.max(0, allSkills.length - 2);
        // Use areasForGrowth (new field) with fallback to constructiveFeedback (old field)
        const areasForGrowthContent = feedback.areasForGrowth || feedback.constructiveFeedback || '';
        // Use nextFocus (new field) with fallback to nextPracticeFocus (old field)
        const nextFocusContent = feedback.nextFocus || feedback.nextPracticeFocus || '';

        // Detect if feedback generation failed (error messages in whatWentRight)
        const isFeedbackError = feedback.whatWentRight?.includes('encountered an issue') ||
            feedback.whatWentRight?.includes('having trouble connecting') ||
            feedback.whatWentRight?.includes('technical issues');

        return (
            <div className="bg-transparent min-h-screen pb-24">
                <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                    <header className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDone}
                                icon={<i className="fa fa-arrow-left" />}
                                aria-label="Go back"
                                className="mr-3"
                            />
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Encounter Summary</h1>
                        </div>
                    </header>

                    {/* Empathy Score Section - Show score with locked breakdown */}
                    <Card variant="elevated" padding="md" className="mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="flex flex-col items-center">
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Empathy Score</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-4xl font-bold text-[var(--color-text-primary)]">{empathyScore}</span>
                                    <span className="text-xl font-medium text-[var(--color-text-muted)]">/ 5</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-48 h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--color-primary)] transition-all duration-500"
                                        style={{ width: `${(empathyScore / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <Button
                                onClick={onUpgrade}
                                variant="ghost"
                                size="sm"
                                icon={<i className="fa-solid fa-lock" />}
                            >
                                Upgrade to see score breakdown
                            </Button>
                        </div>
                    </Card>

                    {/* What Went Right - Fully visible */}
                    <section className="mb-6">
                        <FeedbackSectionCard title="What Went Right" icon="fa-thumbs-up">
                            {feedback.whatWentRight}
                        </FeedbackSectionCard>
                    </section>

                    {/* Issue 1: Key Areas for Growth - BLURRED with real content visible behind */}
                    {areasForGrowthContent && (
                        <section className="mb-6">
                            <LockedSection onUpgrade={onUpgrade} lockMessage="Unlock with Premium">
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center">
                                        <i className="fa-solid fa-seedling mr-3 text-sky-500"></i>
                                        Key Areas for Growth
                                    </h3>
                                    <p className="text-neutral-700 leading-relaxed pl-8 whitespace-pre-wrap">{areasForGrowthContent}</p>
                                </div>
                            </LockedSection>
                        </section>
                    )}

                    {/* Issue 2: MI Skills Checklist - Show first 2 skills, lock the rest */}
                    <Card variant="elevated" padding="md" className="mb-6">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">MI Skills Checklist</h3>
                        {/* Free tier: Only show first 2 detected skills, never show all 8 */}
                        {isFeedbackError ? (
                            // Show error message when feedback generation failed
                            <div className="flex flex-col items-center gap-3 text-center py-4">
                                <i className="fa-solid fa-circle-exclamation text-warning text-2xl"></i>
                                <p className="text-neutral-600 text-sm">
                                    Skills analysis couldn't be completed due to a technical issue. Please try another practice session.
                                </p>
                            </div>
                        ) : visibleSkills.length > 0 ? (
                            <div className="space-y-3">
                                {visibleSkills.slice(0, 2).map((skill, index) => (
                                    <div key={`${skill}-${index}`} className="flex items-center gap-3">
                                        <i className="fa-solid fa-check text-[var(--color-success)] text-lg" aria-hidden="true"></i>
                                        <span className="text-[var(--color-text-secondary)] font-medium">{skill}</span>
                                    </div>
                                ))}
                                {lockedCount > 0 && (
                                    <Button
                                        onClick={onUpgrade}
                                        variant="ghost"
                                        size="sm"
                                        className="mt-3 pt-3 border-t border-[var(--color-neutral-200)]"
                                        icon={<i className="fa-solid fa-lock" />}
                                    >
                                        + {lockedCount} more skill{lockedCount !== 1 ? 's' : ''} analyzed in Premium
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={onUpgrade}
                                variant="ghost"
                                size="sm"
                                icon={<i className="fa-solid fa-lock" />}
                            >
                                Upgrade to see skills analysis
                            </Button>
                        )}
                    </Card>

                    {/* Issue 3: Next Practice Focus - Show as locked card (not blurred) */}
                    <Card
                        variant="accent"
                        padding="md"
                        hoverable
                        onClick={onUpgrade}
                        className="mb-6"
                    >
                        <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
                            <i className="fa-solid fa-lock text-2xl" aria-hidden="true"></i>
                            <div>
                                <h3 className="font-bold text-[var(--color-text-primary)] text-lg">Next Practice Focus</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">Upgrade to get personalized practice recommendations</p>
                            </div>
                        </div>
                    </Card>

                    <footer className="mt-6 space-y-3">
                        <Button
                            onClick={onUpgrade}
                            variant="primary"
                            size="lg"
                            fullWidth
                            icon={<i className="fa fa-award" />}
                        >
                            Upgrade to Premium
                        </Button>
                        <Button
                            onClick={onDone}
                            variant="secondary"
                            size="lg"
                            fullWidth
                        >
                            Done
                        </Button>
                    </footer>
                </div>
            </div>
        );
    }

    // Premium View - Show everything unlocked
    const premiumSkills = feedback.skillsDetected || feedback.keySkillsUsed || [];
    const premiumAreasForGrowth = feedback.areasForGrowth || feedback.constructiveFeedback || '';
    // Always ensure we have content for Next Practice Focus - use fallback if empty
    const rawNextFocus = feedback.nextFocus || feedback.nextPracticeFocus || '';
    const premiumNextFocus = rawNextFocus.trim() || DEFAULT_NEXT_FOCUS;

    // Detect if feedback generation failed (error messages in whatWentRight)
    const isPremiumFeedbackError = feedback.whatWentRight?.includes('encountered an issue') ||
        feedback.whatWentRight?.includes('having trouble connecting') ||
        feedback.whatWentRight?.includes('technical issues');


    return (
        <div className="bg-transparent pb-24">
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDone}
                            icon={<i className="fa fa-arrow-left" />}
                            aria-label="Go back"
                            className="mr-3"
                        />
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Encounter Summary</h1>
                    </div>
                </header>

                {/* At a Glance Section */}
                <Card variant="elevated" padding="md" className="mb-6 animate-slide-fade-in">
                    <div className="flex justify-center text-center">
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Empathy Score</h3>
                            <EmpathyGauge score={feedback.empathyScore ?? 0} />
                            {/* Premium: Show empathy breakdown */}
                            {feedback.empathyBreakdown && (
                                <p className="text-[var(--color-text-secondary)] text-sm mt-3 max-w-md text-center">{feedback.empathyBreakdown}</p>
                            )}
                        </div>
                    </div>
                </Card>

                <main className="space-y-4 mb-6">
                    <FeedbackSectionCard title="What Went Right" icon="fa-thumbs-up">
                        {feedback.whatWentRight}
                    </FeedbackSectionCard>

                    {premiumAreasForGrowth && (
                        <FeedbackSectionCard title="Key Areas for Growth" icon="fa-seedling">
                            {premiumAreasForGrowth}
                        </FeedbackSectionCard>
                    )}
                </main>

                <Card variant="elevated" padding="md" className="mb-6">
                    {isPremiumFeedbackError ? (
                        // Show error message when feedback generation failed
                        <div className="flex flex-col items-center gap-3 text-center py-4">
                            <i className="fa-solid fa-circle-exclamation text-[var(--color-warning)] text-2xl" aria-hidden="true"></i>
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">MI Skills Checklist</h3>
                            <p className="text-[var(--color-text-secondary)] text-sm">
                                Skills analysis couldn't be completed due to a technical issue. Please try another practice session.
                            </p>
                        </div>
                    ) : (
                        <SkillsChecklist skillsUsed={premiumSkills} />
                    )}
                </Card>

                <div className="mb-6">
                    <Card variant="soft-accent" padding="lg" className="text-center min-h-[120px] flex flex-col justify-center">
                        <i className="fa-solid fa-bullseye text-3xl mb-3 text-[var(--color-primary)]" aria-hidden="true"></i>
                        <h3 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">Your Next Practice Focus</h3>
                        <p className="text-[var(--color-text-secondary)] text-lg">
                            {premiumNextFocus || DEFAULT_NEXT_FOCUS}
                        </p>
                    </Card>
                </div>

                <footer className="mt-4 pb-4">
                    <Button
                        onClick={onStartPractice}
                        variant="primary"
                        size="lg"
                        fullWidth
                    >
                        Start a New Practice
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default FeedbackView;