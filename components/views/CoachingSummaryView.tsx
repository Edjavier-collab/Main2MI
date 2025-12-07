import React, { useState } from 'react';
import { CoachingSummary } from '../../types';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';

interface CoachingSummaryViewProps {
    isLoading: boolean;
    summary: CoachingSummary | null;
    error: string | null;
    onBack: () => void;
}

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const renderLine = (line: string, index: number) => {
        if (line.startsWith('* ')) {
            return (
                <li key={index} className="text-[var(--color-text-secondary)] leading-relaxed">
                    {line.substring(2)}
                </li>
            );
        }
        return <p key={index} className="text-[var(--color-text-secondary)] leading-relaxed">{line}</p>;
    };

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const elements: React.JSX.Element[] = [];
    let listChildren: React.JSX.Element[] = [];

    const endList = () => {
        if (listChildren.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc space-y-2 mt-2 pl-5">{listChildren}</ul>);
            listChildren = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('* ')) {
            listChildren.push(renderLine(line, index));
        } else {
            endList();
            elements.push(renderLine(line, index));
        }
    });

    endList();
    return <>{elements}</>;
};

const SectionCard: React.FC<{ 
    title: string; 
    icon: string; 
    children: React.ReactNode;
    variant?: 'default' | 'accent';
}> = ({ title, icon, children, variant = 'default' }) => (
    <Card 
        variant={variant === 'accent' ? 'accent' : 'elevated'} 
        padding="md" 
        className={variant === 'accent' ? 'border-2 border-black' : ''}
    >
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]">
                <i className={icon} aria-hidden="true"></i>
            </span>
            {title}
        </h2>
        <div className="space-y-3">
            {children}
        </div>
    </Card>
);

const CoachingSummaryView: React.FC<CoachingSummaryViewProps> = ({ isLoading, summary, error, onBack }) => {

    const handleDownloadPdf = () => {
        window.print();
    };

    // Calculate score (1-5) based on averagePerSession
    const calculateScore = (avg: number): number => {
        if (avg >= 3) return 5;
        if (avg >= 2) return 4;
        if (avg >= 1) return 3;
        if (avg >= 0.5) return 2;
        return 1;
    };

    const getScoreLabel = (score: number): string => {
        if (score === 5) return 'Excellent';
        if (score === 4) return 'Good';
        if (score === 3) return 'Developing';
        if (score === 2) return 'Needs Work';
        return 'Needs Focus';
    };

    const getScoreColor = (score: number): string => {
        if (score >= 4) return 'bg-green-500';
        if (score === 3) return 'bg-amber-400';
        return 'bg-red-400';
    };

    const getScoreBackgroundGradient = (score: number): string => {
        if (score >= 4) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200';
        if (score === 3) return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200';
        return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'increasing') return { icon: 'fa-arrow-up', color: 'text-green-600', bg: 'bg-green-100' };
        if (trend === 'decreasing') return { icon: 'fa-arrow-down', color: 'text-red-600', bg: 'bg-red-100' };
        return { icon: 'fa-minus', color: 'text-gray-500', bg: 'bg-gray-100' };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <Card variant="elevated" padding="lg" className="text-center max-w-md w-full">
                    <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="mt-6 text-xl font-bold text-[var(--color-text-primary)]">Analyzing Your Sessions</h2>
                    <p className="text-[var(--color-text-secondary)] mt-2">Our AI coach is reviewing your practice history...</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-4">This may take a moment</p>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-transparent p-6">
                <header className="flex items-center mb-6 max-w-4xl mx-auto">
                    <BackButton onClick={onBack} className="mr-3" />
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Coaching Summary</h1>
                </header>
                <main className="max-w-2xl mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center border-l-4 border-[var(--color-error)]">
                        <i className="fa-solid fa-circle-exclamation text-5xl text-[var(--color-error)] mb-4" aria-hidden="true"></i>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Could Not Generate Summary</h2>
                        <p className="text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto">{error}</p>
                        <BackButton onClick={onBack} className="mt-6" />
                    </Card>
                </main>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="min-h-screen bg-transparent p-6">
                <header className="flex items-center mb-6 max-w-4xl mx-auto">
                    <BackButton onClick={onBack} className="mr-3" />
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Coaching Summary</h1>
                </header>
                <main className="max-w-2xl mx-auto">
                    <Card variant="accent" padding="lg" className="text-center">
                        <i className="fa-regular fa-file-lines text-5xl text-[var(--color-text-muted)] mb-4" aria-hidden="true"></i>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">No Summary Available</h2>
                        <p className="text-[var(--color-text-secondary)] mt-2">Go back and generate a coaching summary from your sessions.</p>
                        <BackButton onClick={onBack} className="mt-6" />
                    </Card>
                </main>
            </div>
        );
    }

    // Prepare skills data
    const allMISkills = [
        'Open Questions', 'Affirmations', 'Reflections', 'Summaries',
        'Developing Discrepancy', 'Eliciting Change Talk', 'Rolling with Resistance', 'Supporting Self-Efficacy'
    ];
    const skillMap = new Map(summary.skillProgression?.map(s => [s.skillName, s]) || []);
    const skillsWithScores = allMISkills.map(skillName => {
        const skillData = skillMap.get(skillName);
        const avg = skillData?.averagePerSession || 0;
        return {
            skillName,
            score: calculateScore(avg),
            averagePerSession: avg,
            totalCount: skillData?.totalCount || 0,
            trend: skillData?.trend || 'stable',
            hasData: skillData !== undefined
        };
    });

    // Group skills by performance level
    const strengths = skillsWithScores.filter(s => s.hasData && s.score >= 3);
    const needsFocus = skillsWithScores.filter(s => s.hasData && s.score < 3);
    const notPracticed = skillsWithScores.filter(s => !s.hasData);

    // Sort each group by score descending
    strengths.sort((a, b) => b.score - a.score);
    needsFocus.sort((a, b) => b.score - a.score);

    // State for collapsible sections
    const [showLegend, setShowLegend] = useState(false);
    const [showNotPracticed, setShowNotPracticed] = useState(false);

    return (
        <div className="min-h-screen bg-transparent pb-24">
            {/* Header Bar */}
            <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto no-print">
                <div className="flex items-center">
                    <BackButton onClick={onBack} className="mr-3" />
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Coaching Summary</h1>
                        <p className="text-xs text-[var(--color-text-muted)]">{summary.dateRange}</p>
                    </div>
                </div>
                <Button
                    onClick={handleDownloadPdf}
                    variant="primary"
                    size="sm"
                    icon={<i className="fa-solid fa-download" />}
                >
                    Download
                </Button>
            </header>

            <main className="px-6 max-w-4xl mx-auto printable-area">
                {/* Hero Summary Card */}
                <Card variant="elevated" padding="lg" className="mb-6 border-2 border-black">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-shrink-0 text-center">
                            <div className="inline-flex h-20 w-20 items-center justify-center bg-[var(--color-primary)] text-white border-2 border-black">
                                <i className="fa-solid fa-chart-pie text-3xl" aria-hidden="true"></i>
                            </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Performance Overview</p>
                            <div className="flex flex-wrap items-baseline gap-3 mt-1 justify-center sm:justify-start">
                                <span className="text-4xl font-extrabold text-[var(--color-text-primary)]">{summary.totalSessions}</span>
                                <span className="text-lg text-[var(--color-text-secondary)]">sessions analyzed</span>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)] mt-2">
                                Based on your practice sessions from {summary.dateRange}
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-semibold text-sm border border-[var(--color-primary)]">
                                <i className="fa-solid fa-check-circle" aria-hidden="true"></i>
                                Complete
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Skills Progression Grid */}
                {summary.skillProgression && summary.skillProgression.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase">
                                MI Skills Progress
                            </h2>
                            <button
                                onClick={() => setShowLegend(!showLegend)}
                                className="inline-flex items-center justify-center w-8 h-8 sm:w-6 sm:h-6 rounded-full border border-[var(--color-primary-light)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary-lighter)] active:scale-95 transition-all touch-manipulation"
                                aria-label="Show legend"
                            >
                                <i className="fa-solid fa-question text-sm sm:text-xs" aria-hidden="true"></i>
                            </button>
                        </div>

                        {/* Collapsible Legend */}
                        {showLegend && (
                            <Card variant="default" padding="sm" className="mb-4 bg-[var(--color-bg-accent)]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--color-text-secondary)]">
                                    <div>
                                        <p className="font-semibold text-[var(--color-text-primary)] mb-2">Score Levels</p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                                <span>4-5: Strong</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-amber-400 rounded"></div>
                                                <span>3: Developing</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-red-400 rounded"></div>
                                                <span>1-2: Needs Focus</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--color-text-primary)] mb-2">Trend Indicators</p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-arrow-up text-green-600"></i>
                                                <span>Improving</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-minus text-gray-500"></i>
                                                <span>Stable</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-arrow-down text-red-600"></i>
                                                <span>Declining</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Strengths Section */}
                        {strengths.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-trophy text-green-600" aria-hidden="true"></i>
                                    Strengths
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:gap-3">
                                    {strengths.map((skill, index) => {
                                        const trend = getTrendIcon(skill.trend);
                                        return (
                                            <Card 
                                                key={index} 
                                                variant="default" 
                                                padding="md" 
                                                className={`hover:shadow-md transition-all ${getScoreBackgroundGradient(skill.score)} border`}
                                            >
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                                    {/* Larger score badge */}
                                                    <div className={`flex-shrink-0 w-16 h-16 sm:w-16 sm:h-16 ${getScoreColor(skill.score)} text-white font-bold flex items-center justify-center text-2xl rounded-lg shadow-sm`}>
                                                        {skill.score}
                                                    </div>
                                                    
                                                    {/* Skill info */}
                                                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                                                        <div className="flex items-center justify-between mb-1 gap-2">
                                                            <span className="font-semibold text-[var(--color-text-primary)] text-base sm:text-base">
                                                                {skill.skillName}
                                                            </span>
                                                            {/* Trend badge in top-right */}
                                                            <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-7 sm:h-7 ${trend.bg} ${trend.color} rounded-full flex-shrink-0`}>
                                                                <i className={`fa-solid ${trend.icon} text-sm`} aria-hidden="true"></i>
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                                            {skill.averagePerSession.toFixed(1)}/session
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Needs Focus Section */}
                        {needsFocus.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-bullseye text-amber-600" aria-hidden="true"></i>
                                    Needs Focus
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:gap-3">
                                    {needsFocus.map((skill, index) => {
                                        const trend = getTrendIcon(skill.trend);
                                        return (
                                            <Card 
                                                key={index} 
                                                variant="default" 
                                                padding="md" 
                                                className={`hover:shadow-md transition-all ${getScoreBackgroundGradient(skill.score)} border`}
                                            >
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                                    {/* Larger score badge */}
                                                    <div className={`flex-shrink-0 w-16 h-16 sm:w-16 sm:h-16 ${getScoreColor(skill.score)} text-white font-bold flex items-center justify-center text-2xl rounded-lg shadow-sm`}>
                                                        {skill.score}
                                                    </div>
                                                    
                                                    {/* Skill info */}
                                                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                                                        <div className="flex items-center justify-between mb-1 gap-2">
                                                            <span className="font-semibold text-[var(--color-text-primary)] text-base sm:text-base">
                                                                {skill.skillName}
                                                            </span>
                                                            {/* Trend badge in top-right */}
                                                            <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-7 sm:h-7 ${trend.bg} ${trend.color} rounded-full flex-shrink-0`}>
                                                                <i className={`fa-solid ${trend.icon} text-sm`} aria-hidden="true"></i>
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                                            {skill.averagePerSession.toFixed(1)}/session
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Not Yet Practiced Section (Collapsible) */}
                        {notPracticed.length > 0 && (
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowNotPracticed(!showNotPracticed)}
                                    className="flex items-center justify-between w-full mb-3 p-2 -ml-2 -mr-2 rounded-lg text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-accent)] active:scale-95 transition-all touch-manipulation"
                                >
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-chevron-right text-xs transition-transform" style={{ transform: showNotPracticed ? 'rotate(90deg)' : 'rotate(0deg)' }} aria-hidden="true"></i>
                                        <i className="fa-solid fa-circle-dot text-gray-400" aria-hidden="true"></i>
                                        Not Yet Practiced ({notPracticed.length})
                                    </span>
                                </button>
                                {showNotPracticed && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {notPracticed.map((skill, index) => (
                                            <Card key={index} variant="default" padding="sm" className="opacity-60">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-[var(--color-text-muted)] text-sm">{skill.skillName}</span>
                                                    <span className="text-xs text-[var(--color-text-muted)] italic">No data yet</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Sections */}
                <div className="space-y-4">
                    {/* Strengths */}
                    <SectionCard title="Strengths & Positive Trends" icon="fa-solid fa-trophy">
                        <MarkdownRenderer text={summary.strengthsAndTrends} />
                    </SectionCard>

                    {/* Areas for Focus */}
                    <SectionCard title="Areas for Continued Focus" icon="fa-solid fa-bullseye">
                        <MarkdownRenderer text={summary.areasForFocus} />
                    </SectionCard>

                    {/* Next Steps & Focus Areas */}
                    {(summary.topSkillsToImprove?.length || summary.specificNextSteps?.length) ? (
                        <SectionCard title="Your Action Plan" icon="fa-solid fa-rocket" variant="accent">
                            {/* Priority Skills */}
                            {summary.topSkillsToImprove && summary.topSkillsToImprove.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-lightbulb text-amber-600 text-lg mt-0.5" aria-hidden="true"></i>
                                        <div>
                                            <p className="font-semibold text-[var(--color-text-primary)] mb-2">Priority Skills to Focus On</p>
                                            <div className="flex flex-wrap gap-2">
                                                {summary.topSkillsToImprove.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1 bg-white border-2 border-amber-400 text-amber-800 px-3 py-1 text-sm font-medium"
                                                    >
                                                        <i className="fa-solid fa-star text-xs" aria-hidden="true"></i>
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Numbered Action Steps */}
                            {summary.specificNextSteps && summary.specificNextSteps.length > 0 && (
                                <div>
                                    <p className="font-semibold text-[var(--color-text-primary)] mb-3">Next Steps</p>
                                    <ol className="space-y-3">
                                        {summary.specificNextSteps.map((step, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="flex-shrink-0 w-7 h-7 bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm">
                                                    {index + 1}
                                                </span>
                                                <span className="text-[var(--color-text-secondary)] leading-relaxed flex-1">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Fallback */}
                            {!summary.topSkillsToImprove?.length && !summary.specificNextSteps?.length && (
                                <MarkdownRenderer text={summary.summaryAndNextSteps} />
                            )}
                        </SectionCard>
                    ) : (
                        <SectionCard title="Summary & Next Steps" icon="fa-solid fa-rocket">
                            <MarkdownRenderer text={summary.summaryAndNextSteps} />
                        </SectionCard>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CoachingSummaryView;
