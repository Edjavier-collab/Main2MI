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
        <div className="grid grid-cols-1 gap-y-3">
            {MASTER_SKILL_LIST.map(skill => {
                const wasUsed = skillsUsed.includes(skill);
                // Only show skills that were used, or if looking at full list? 
                // The request was specifically to use `skillsDetected`.
                // For now, mirroring previous behavior but listing all.
                return (
                    <div key={skill} className={`flex items-center transition-colors duration-300 ${wasUsed ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                        <i className={`fa-solid ${wasUsed ? 'fa-check-square text-[var(--color-success)]' : 'fa-square'} mr-3 text-lg`}></i>
                        <span className="font-medium">{skill}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

// --- NEW SECTIONS ---

const QuickWinsSection: React.FC<{ quickWins: string[] }> = ({ quickWins }) => {
    if (!quickWins || quickWins.length === 0) return null;
    return (
        <Card variant="soft-accent" padding="md" className="mb-6 border-l-4 border-l-[var(--color-info)] bg-sky-50">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center">
                <i className="fa-solid fa-bolt mr-2 text-[var(--color-info)]"></i>
                Quick Wins
            </h3>
            <ul className="space-y-2">
                {quickWins.map((win, idx) => (
                    <li key={idx} className="flex items-start text-[var(--color-text-secondary)]">
                        <i className="fa-solid fa-check text-[var(--color-success)] mt-1 mr-2 text-sm"></i>
                        <span>{win}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const StrengthsSection: React.FC<{ whatWentRight: string | any[] }> = ({ whatWentRight }) => {
    return (
        <Card variant="elevated" padding="md" className="mb-6 border-l-4 border-l-[var(--color-success)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center">
                <i className="fa-solid fa-thumbs-up mr-2 text-[var(--color-success)]"></i>
                What Went Right
            </h3>

            {Array.isArray(whatWentRight) ? (
                <ul className="space-y-4">
                    {whatWentRight.map((item, idx) => (
                        <li key={idx} className="flex flex-col">
                            <div className="flex items-center mb-1">
                                <span className="font-bold text-[var(--color-text-primary)] mr-2">{item.skill}</span>
                            </div>
                            <p className="italic text-[var(--color-text-secondary)] border-l-2 border-[var(--color-neutral-200)] pl-3 py-1 mb-1">
                                "{item.quote}"
                            </p>
                            {item.explanation && (
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">{item.explanation}</p>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{whatWentRight}</p>
            )}
        </Card>
    );
};

const GrowthAreasSection: React.FC<{ areasForGrowth: string | any[]; premium?: boolean }> = ({ areasForGrowth, premium }) => {
    // Legacy support for string (although we try to force array now)
    if (typeof areasForGrowth === 'string') {
        return (
            <Card variant="elevated" padding="md" className={`mb-6 ${premium ? 'border-l-4 border-l-[var(--color-warning)]' : ''}`}>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center">
                    <i className="fa-solid fa-seedling mr-2 text-[var(--color-warning)]"></i>
                    Key Areas for Growth
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{areasForGrowth}</p>
            </Card>
        );
    }

    // Structured Cards
    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center">
                <i className="fa-solid fa-seedling mr-2 text-[var(--color-warning)]"></i>
                Key Areas for Growth
            </h3>
            <div className="space-y-4">
                {areasForGrowth.map((area, idx) => (
                    <Card key={idx} variant="elevated" padding="md" className="border-l-4 border-l-[var(--color-warning)]">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">What you said</p>
                                <p className="italic text-[var(--color-text-secondary)] border-l-2 border-[var(--color-neutral-200)] pl-3 py-1">
                                    "{area.quote}"
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Why it could improve</p>
                                <p className="text-[var(--color-text-primary)]">{area.reason}</p>
                            </div>
                            <div className="bg-[var(--color-primary-lighter)]/30 rounded-lg p-3">
                                <p className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-wide mb-1">Try instead</p>
                                <p className="italic text-[var(--color-text-primary)]">
                                    "{area.suggestion}"
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const FocusSection: React.FC<{ focus: string }> = ({ focus }) => {
    return (
        <Card variant="soft-accent" padding="lg" className="mb-6 relative overflow-hidden border border-[var(--color-primary-light)]">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[var(--color-primary-light)] rounded-full opacity-20 blur-xl"></div>

            <div className="text-center relative z-10">
                <i className="fa-solid fa-crosshairs text-3xl mb-3 text-[var(--color-primary)]" aria-hidden="true"></i>
                <h3 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">Focus for Next Session</h3>
                <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed font-medium">
                    {focus || DEFAULT_NEXT_FOCUS}
                </p>
            </div>
        </Card>
    );
};

// --- MAIN VIEW ---

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

    const empathyScore = feedback.empathyScore ?? 0;
    const allSkills = feedback.skillsDetected || feedback.keySkillsUsed || [];

    // Fallback logic for new fields
    const quickWins = feedback.quickWins || (feedback.keyTakeaway ? [feedback.keyTakeaway] : []);
    const whatWentRight = feedback.whatWentRight || "No strengths detected.";
    const areasForGrowth = feedback.areasForGrowth || feedback.constructiveFeedback || "No specific growth areas detected.";
    const focusForNextSession = feedback.focusForNextSession || feedback.nextFocus || feedback.nextPracticeFocus || DEFAULT_NEXT_FOCUS;

    // Free Tier Specifics
    const visibleSkills = Array.isArray(allSkills) ? allSkills.slice(0, 2) : [];
    const lockedCount = Math.max(0, allSkills.length - 2);

    const isFeedbackError = typeof whatWentRight === 'string' && (
        whatWentRight.includes('encountered an issue') ||
        whatWentRight.includes('having trouble connecting') ||
        whatWentRight.includes('technical issues')
    );

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

                {/* Empathy Score Section */}
                <Card variant="elevated" padding="md" className="mb-6">
                    <div className="flex justify-center text-center">
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Empathy Score</h3>
                            <EmpathyGauge score={empathyScore} />

                            {tier === UserTier.Premium && feedback.empathyBreakdown && (
                                <p className="text-[var(--color-text-secondary)] text-sm mt-3 max-w-md text-center">{feedback.empathyBreakdown}</p>
                            )}

                            {tier === UserTier.Free && (
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
                            )}
                        </div>
                    </div>
                </Card>

                {/* Quick Wins (New Section) */}
                <QuickWinsSection quickWins={quickWins} />

                {/* What Went Right (Updated Section) */}
                <StrengthsSection whatWentRight={whatWentRight} />

                {/* Areas for Growth (Updated Section - Locked for Free) */}
                {tier === UserTier.Free ? (
                    <section className="mb-6">
                        <LockedSection onUpgrade={onUpgrade} lockMessage="Unlock with Premium">
                            <GrowthAreasSection areasForGrowth={areasForGrowth} premium={false} />
                        </LockedSection>
                    </section>
                ) : (
                    <GrowthAreasSection areasForGrowth={areasForGrowth} premium={true} />
                )}

                {/* MI Skills Checklist (Existing logic) */}
                <Card variant="elevated" padding="md" className="mb-6">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">MI Skills Checklist</h3>
                    {isFeedbackError ? (
                        <div className="flex flex-col items-center gap-3 text-center py-4">
                            <i className="fa-solid fa-circle-exclamation text-[var(--color-warning)] text-2xl" aria-hidden="true"></i>
                            <p className="text-[var(--color-text-secondary)] text-sm">
                                Skills analysis couldn't be completed due to a technical issue.
                            </p>
                        </div>
                    ) : tier === UserTier.Free ? (
                        // Free view
                        visibleSkills.length > 0 ? (
                            <div className="space-y-3">
                                {visibleSkills.map((skill, index) => (
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
                                        className="mt-3 pt-3 border-t border-[var(--color-neutral-200)] w-full"
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
                        )
                    ) : (
                        // Premium view
                        <SkillsChecklist skillsUsed={allSkills} />
                    )}
                </Card>

                {/* Focus for Next Session (New Section - Locked for Free) */}
                {tier === UserTier.Free ? (
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
                ) : (
                    <FocusSection focus={focusForNextSession} />
                )}

                <footer className="mt-4 pb-4 space-y-3">
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
                    <Button
                        onClick={onStartPractice}
                        variant={tier === UserTier.Free ? "secondary" : "primary"}
                        size="lg"
                        fullWidth
                    >
                        Start a New Practice
                    </Button>
                    <Button
                        onClick={onDone}
                        variant="ghost"
                        size="lg"
                        fullWidth
                        className="border border-[var(--color-neutral-200)]"
                    >
                        Back to Dashboard
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default FeedbackView;