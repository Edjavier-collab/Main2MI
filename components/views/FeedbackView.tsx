'use client';

import React, { useState } from 'react';
import { Session, UserTier, BehavioralMetrics, WhatWentWellItem, GrowthOpportunityItem, MissedOpportunityItem, CoachingInsightItem } from '../../types';
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
            <div className="filter blur-[4px] select-none pointer-events-none" aria-hidden="true">
                {children}
            </div>
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

const DEFAULT_NEXT_FOCUS = "Focus on balancing your use of Open Questions and Reflections. Aim to keep the conversation patient-centered while guiding them towards change.";

// --- BEHAVIORAL METRICS ---

const MetricRow: React.FC<{ label: string; value: number | string; icon: string; colorClass?: string }> = ({ label, value, icon, colorClass = 'text-[var(--color-primary)]' }) => (
    <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
            <i className={`fa-solid ${icon} ${colorClass} text-sm w-5 text-center`} aria-hidden="true"></i>
            <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        </div>
        <span className="font-bold text-[var(--color-text-primary)]">{value}</span>
    </div>
);

const BehavioralMetricsSection: React.FC<{ metrics: BehavioralMetrics; isExpanded: boolean; onToggle: () => void }> = ({ metrics, isExpanded, onToggle }) => {
    const totalReflections = metrics.simpleReflections + metrics.complexReflections;
    const totalQuestions = metrics.openQuestions + metrics.closedQuestions;

    return (
        <Card variant="elevated" padding="md" className="mb-6">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between cursor-pointer"
                aria-expanded={isExpanded}
            >
                <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center">
                        <i className="fa-solid fa-chart-bar mr-2 text-[var(--color-primary)]"></i>
                        Session Stats
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Observable skill counts from your session</p>
                </div>
                <i className={`fa-solid fa-chevron-down text-sm text-[var(--color-text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true"></i>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                {/* Ratio highlight */}
                <div className="bg-[var(--color-primary-lighter)]/30 rounded-lg p-4 mb-4 text-center">
                    <p className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-wide mb-1">Reflection-to-Question Ratio</p>
                    <p className="text-3xl font-bold text-[var(--color-primary)]">{metrics.reflectionToQuestionRatio.toFixed(1)}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {totalReflections} reflection{totalReflections !== 1 ? 's' : ''} / {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="divide-y divide-[var(--color-neutral-100)]">
                    <MetricRow label="Open Questions" value={metrics.openQuestions} icon="fa-comment-dots" />
                    <MetricRow label="Closed Questions" value={metrics.closedQuestions} icon="fa-comment" />
                    <MetricRow label="Simple Reflections" value={metrics.simpleReflections} icon="fa-rotate-left" />
                    <MetricRow label="Complex Reflections" value={metrics.complexReflections} icon="fa-rotate" colorClass="text-[var(--color-success)]" />
                    <MetricRow label="Affirmations" value={metrics.affirmations} icon="fa-heart" colorClass="text-[var(--color-success)]" />
                    <MetricRow label="MI-Adherent" value={metrics.miAdherentStatements} icon="fa-circle-check" colorClass="text-[var(--color-success)]" />
                    <MetricRow label="MI-Inconsistent" value={metrics.miInconsistentStatements} icon="fa-circle-xmark" colorClass="text-[var(--color-error)]" />
                </div>
            </div>
        </Card>
    );
};

// --- WHAT WENT WELL ---

const WhatWentWellSection: React.FC<{ items: WhatWentWellItem[] }> = ({ items }) => {
    return (
        <Card variant="elevated" padding="md" className="mb-6 border-l-4 border-l-[var(--color-success)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center">
                <i className="fa-solid fa-check mr-2 text-[var(--color-success)]"></i>
                What Went Well
            </h3>
            {!items || items.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] italic">
                    Keep practicing — we&apos;ll highlight your strengths as you develop your skills.
                </p>
            ) : (
                <ul className="space-y-4">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex flex-col">
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 mb-2 w-fit">
                                {item.skill}
                            </span>
                            <p className="italic text-[var(--color-text-secondary)] border-l-2 border-[var(--color-neutral-200)] pl-3 py-1 mb-1">
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                <i className="fa-solid fa-link text-xs mr-1 text-[var(--color-primary)]" aria-hidden="true"></i>
                                {item.spiritConnection}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};

// --- GROWTH OPPORTUNITIES ---

const GrowthOpportunitiesSection: React.FC<{ items: GrowthOpportunityItem[] }> = ({ items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center">
                <i className="fa-solid fa-lightbulb mr-2 text-[var(--color-warning)]"></i>
                Growth Opportunities
            </h3>
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <Card key={idx} variant="elevated" padding="md" className="border-l-4 border-l-[var(--color-warning)]">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">What you said</p>
                                <p className="italic text-[var(--color-text-secondary)] border-l-2 border-[var(--color-neutral-200)] pl-3 py-1">
                                    &ldquo;{item.quote}&rdquo;
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">MI Principle</p>
                                <p className="text-[var(--color-text-primary)]">{item.principle}</p>
                            </div>
                            <div className="bg-[var(--color-primary-lighter)]/30 rounded-lg p-3">
                                <p className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-wide mb-1">Try instead</p>
                                <p className="italic text-[var(--color-text-primary)]">
                                    &ldquo;{item.alternativePhrasing}&rdquo;
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- MISSED OPPORTUNITIES ---

const MissedOpportunitiesSection: React.FC<{ items: MissedOpportunityItem[]; isExpanded: boolean; onToggle: () => void }> = ({ items, isExpanded, onToggle }) => {
    if (!items || items.length === 0) return null;
    const visibleItems = items.length > 2 && !isExpanded ? items.slice(0, 2) : items;
    const hasMore = items.length > 2;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center">
                <i className="fa-solid fa-arrow-rotate-right mr-2 text-[var(--color-primary)]"></i>
                Moments to Revisit
            </h3>
            <div className="space-y-4">
                {visibleItems.map((item, idx) => (
                    <Card key={idx} variant="elevated" padding="md" className="border-l-4 border-l-[var(--color-primary-light)]">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">The patient said</p>
                                <p className="italic text-[var(--color-text-secondary)] border-l-2 border-[var(--color-neutral-200)] pl-3 py-1">
                                    &ldquo;{item.patientSaid}&rdquo;
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">This was an opportunity for</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-medium">
                                    {item.opportunityType}
                                </span>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Coaching tip</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">{item.coachingTip}</p>
                            </div>
                            <div className="bg-[var(--color-primary-lighter)]/30 rounded-lg p-3">
                                <p className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-wide mb-1">You could try</p>
                                <p className="italic font-medium text-[var(--color-text-primary)]">
                                    &ldquo;{item.exampleResponse}&rdquo;
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
                {hasMore && (
                    <button
                        onClick={onToggle}
                        className="w-full text-center py-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isExpanded ? (
                            <>Show Less <i className="fa-solid fa-chevron-up text-xs" aria-hidden="true"></i></>
                        ) : (
                            <>Show {items.length - 2} More <i className="fa-solid fa-chevron-down text-xs" aria-hidden="true"></i></>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- COACHING INSIGHTS ---

const CoachingInsightsSection: React.FC<{ items: CoachingInsightItem[] }> = ({ items }) => {
    return (
        <Card variant="elevated" padding="md" className="mb-6 border-l-4 border-l-purple-300">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center">
                <i className="fa-solid fa-comments mr-2 text-purple-500"></i>
                Tips for Next Time
            </h3>
            {!items || items.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] italic">
                    <span className="font-semibold not-italic text-[var(--color-text-secondary)]">General MI Tip:</span>{' '}
                    Focus on maintaining a 2:1 ratio of reflections to questions. This keeps the conversation patient-centered while building trust.
                </p>
            ) : (
                <div className="space-y-4">
                    {items.map((item, idx) => (
                        <div key={idx} className={idx > 0 ? 'pt-4 border-t border-[var(--color-neutral-100)]' : ''}>
                            <p className="text-sm text-[var(--color-text-primary)] font-medium mb-2">
                                {item.pattern} <span className="text-[var(--color-text-muted)]">&rarr;</span>{' '}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                                    {item.technique}
                                </span>
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">{item.rationale}</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

// --- FOCUS FOR NEXT SESSION ---

const FocusSection: React.FC<{ focus: string }> = ({ focus }) => {
    return (
        <Card variant="soft-accent" padding="lg" className="mb-6 relative overflow-hidden border-2 border-[var(--color-primary-light)]">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[var(--color-primary-light)] rounded-full opacity-20 blur-xl"></div>
            <div className="text-center relative z-10">
                <i className="fa-solid fa-crosshairs text-4xl mb-4 text-[var(--color-primary)]" aria-hidden="true"></i>
                <h3 className="text-2xl font-bold mb-3 text-[var(--color-text-primary)]">Focus for Next Session</h3>
                <p className="text-[var(--color-text-secondary)] text-xl leading-relaxed font-medium">
                    {focus || DEFAULT_NEXT_FOCUS}
                </p>
            </div>
        </Card>
    );
};

// --- MAIN VIEW ---

const DEFAULT_METRICS: BehavioralMetrics = {
    reflectionToQuestionRatio: 0,
    openQuestions: 0,
    closedQuestions: 0,
    simpleReflections: 0,
    complexReflections: 0,
    affirmations: 0,
    miAdherentStatements: 0,
    miInconsistentStatements: 0,
};

const FeedbackView: React.FC<FeedbackViewProps> = ({ session, onDone, onUpgrade, onStartPractice }) => {
    const { feedback, tier } = session;
    const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
    const [isMissedExpanded, setIsMissedExpanded] = useState(false);

    const isInsufficientData = feedback.analysisStatus === 'insufficient-data';
    const insufficientMessage = feedback.analysisMessage ?? "We didn't capture any clinician responses during this session, so there isn't enough information to generate feedback. Try another session when you're ready to practice.";

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

    const metrics = feedback.behavioralMetrics ?? DEFAULT_METRICS;
    const whatWentWell = feedback.whatWentWell || [];
    const growthOpportunities = feedback.growthOpportunities || [];
    const missedOpportunities = feedback.missedOpportunities || [];
    const coachingInsights = feedback.coachingInsights || [];
    const focusForNextSession = feedback.focusForNextSession || DEFAULT_NEXT_FOCUS;

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

                {/* 1. Focus for Next Session (Hero - Locked for Free) */}
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

                {/* 2. What Went Well (always visible, with empty state) */}
                <WhatWentWellSection items={whatWentWell} />

                {/* 3. Growth Opportunities (Locked for Free) */}
                {tier === UserTier.Free ? (
                    <section className="mb-6">
                        <LockedSection onUpgrade={onUpgrade} lockMessage="Unlock with Premium">
                            <GrowthOpportunitiesSection items={growthOpportunities} />
                        </LockedSection>
                    </section>
                ) : (
                    <GrowthOpportunitiesSection items={growthOpportunities} />
                )}

                {/* 4. Moments to Revisit (Locked for Free, collapsible if >2) */}
                {tier === UserTier.Free ? (
                    missedOpportunities.length > 0 && (
                        <section className="mb-6">
                            <LockedSection onUpgrade={onUpgrade} lockMessage="Unlock with Premium">
                                <MissedOpportunitiesSection items={missedOpportunities} isExpanded={isMissedExpanded} onToggle={() => setIsMissedExpanded(!isMissedExpanded)} />
                            </LockedSection>
                        </section>
                    )
                ) : (
                    <MissedOpportunitiesSection items={missedOpportunities} isExpanded={isMissedExpanded} onToggle={() => setIsMissedExpanded(!isMissedExpanded)} />
                )}

                {/* 5. Tips for Next Time (Locked for Free, with empty state) */}
                {tier === UserTier.Free ? (
                    <section className="mb-6">
                        <LockedSection onUpgrade={onUpgrade} lockMessage="Unlock with Premium">
                            <CoachingInsightsSection items={coachingInsights} />
                        </LockedSection>
                    </section>
                ) : (
                    <CoachingInsightsSection items={coachingInsights} />
                )}

                {/* 6. Session Stats (collapsible, collapsed by default) */}
                <BehavioralMetricsSection metrics={metrics} isExpanded={isMetricsExpanded} onToggle={() => setIsMetricsExpanded(!isMetricsExpanded)} />

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
