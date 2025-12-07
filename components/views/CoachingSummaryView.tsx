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

// Radial progress component (SVG-based, no deps)
const RadialProgress: React.FC<{ value: number; max: number; size?: number; strokeWidth?: number; color?: string; label?: string }> = ({
    value,
    max,
    size = 120,
    strokeWidth = 10,
    color = 'var(--color-primary)',
    label
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const offset = circumference - progress * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-neutral-200)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</span>
                {label && <span className="text-xs text-[var(--color-text-muted)]">{label}</span>}
            </div>
        </div>
    );
};

// Horizontal bar chart component
const SkillBar: React.FC<{ skillName: string; score: number; maxScore: number; trend?: string }> = ({
    skillName,
    score,
    maxScore,
    trend = 'stable'
}) => {
    const percentage = (score / maxScore) * 100;
    const getBarColor = () => {
        if (score >= 4) return 'bg-gradient-to-r from-emerald-400 to-green-500';
        if (score >= 3) return 'bg-gradient-to-r from-amber-400 to-orange-400';
        return 'bg-gradient-to-r from-rose-400 to-red-500';
    };
    const getTrendIcon = () => {
        if (trend === 'increasing') return { icon: 'fa-arrow-trend-up', color: 'text-green-600' };
        if (trend === 'decreasing') return { icon: 'fa-arrow-trend-down', color: 'text-red-500' };
        return { icon: 'fa-minus', color: 'text-gray-400' };
    };
    const trendInfo = getTrendIcon();

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{skillName}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">{score}/{maxScore}</span>
                    <i className={`fa-solid ${trendInfo.icon} text-xs ${trendInfo.color}`} aria-hidden="true"></i>
                </div>
            </div>
            <div className="h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                <div
                    className={`h-full ${getBarColor()} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// Achievement seal/badge component
const AchievementSeal: React.FC<{ sessions: number; dateRange: string }> = ({ sessions, dateRange }) => (
    <div className="relative flex flex-col items-center print:mb-8">
        {/* Outer decorative ring */}
        <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-double border-[var(--color-primary)] flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-lighter)] via-white to-[var(--color-primary-lighter)] shadow-lg">
                <div className="w-24 h-24 rounded-full border-2 border-[var(--color-primary-light)] flex flex-col items-center justify-center bg-white">
                    <i className="fa-solid fa-award text-3xl text-[var(--color-primary)] mb-1" aria-hidden="true"></i>
                    <span className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-wide">Certified</span>
                </div>
            </div>
            {/* Ribbon tails */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                <div className="w-4 h-8 bg-[var(--color-primary)] transform -skew-x-12 rounded-b"></div>
                <div className="w-4 h-8 bg-[var(--color-primary-dark)] transform skew-x-12 rounded-b"></div>
            </div>
        </div>
        <p className="mt-6 text-sm font-semibold text-[var(--color-text-primary)]">{sessions} Sessions Completed</p>
        <p className="text-xs text-[var(--color-text-muted)]">{dateRange}</p>
    </div>
);

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
        className={`print:shadow-none print:border print:border-gray-200 ${variant === 'accent' ? 'border-2 border-[var(--color-primary)]' : ''}`}
    >
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] rounded-lg">
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

    // Calculate overall score (average of all practiced skills)
    const practicedSkills = skillsWithScores.filter(s => s.hasData);
    const overallScore = practicedSkills.length > 0
        ? Math.round(practicedSkills.reduce((sum, s) => sum + s.score, 0) / practicedSkills.length * 10) / 10
        : 0;

    // State for collapsible sections
    const [showNotPracticed, setShowNotPracticed] = useState(false);

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .print-break { page-break-before: always; }
                    .printable-certificate {
                        background: white !important;
                        padding: 40px !important;
                        border: 3px double var(--color-primary) !important;
                        margin: 20px !important;
                    }
                    .print-header {
                        text-align: center;
                        border-bottom: 2px solid var(--color-primary);
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-b from-[var(--color-bg-main)] to-white pb-24 print:bg-white">
                {/* Header Bar - Hidden on print */}
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
                        icon={<i className="fa-solid fa-print" />}
                    >
                        Print
                    </Button>
                </header>

                <main className="px-6 max-w-4xl mx-auto printable-certificate">
                    {/* Certificate Header - Visible on print */}
                    <div className="hidden print:block print-header mb-8">
                        <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">MI Practice Coach</h1>
                        <p className="text-lg text-[var(--color-text-secondary)]">Certificate of Achievement</p>
                    </div>

                    {/* Hero Section with Seal and Stats */}
                    <div className="mb-8">
                        <Card variant="elevated" padding="lg" className="border-2 border-[var(--color-primary)] print:border-none print:shadow-none">
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                {/* Achievement Seal */}
                                <AchievementSeal sessions={summary.totalSessions} dateRange={summary.dateRange} />

                                {/* Stats Grid */}
                                <div className="flex-1 w-full">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {/* Overall Score */}
                                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                                            <RadialProgress
                                                value={overallScore}
                                                max={5}
                                                size={100}
                                                strokeWidth={8}
                                                color={overallScore >= 4 ? '#10b981' : overallScore >= 3 ? '#f59e0b' : '#ef4444'}
                                                label="Overall"
                                            />
                                        </div>

                                        {/* Sessions Count */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100">
                                            <i className="fa-solid fa-clipboard-check text-2xl text-blue-600 mb-2" aria-hidden="true"></i>
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.totalSessions}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Sessions</p>
                                        </div>

                                        {/* Skills Practiced */}
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-100">
                                            <i className="fa-solid fa-brain text-2xl text-purple-600 mb-2" aria-hidden="true"></i>
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{practicedSkills.length}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Skills Used</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Skills Chart Section */}
                    {summary.skillProgression && summary.skillProgression.length > 0 && (
                        <div className="mb-8">
                            <Card variant="elevated" padding="lg" className="print:shadow-none print:border print:border-gray-200">
                                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center bg-gradient-to-br from-[var(--color-primary-lighter)] to-[var(--color-primary-light)] text-[var(--color-primary-dark)] rounded-lg">
                                        <i className="fa-solid fa-chart-simple" aria-hidden="true"></i>
                                    </span>
                                    MI Skills Performance
                                </h2>

                                {/* Strengths */}
                                {strengths.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                            <i className="fa-solid fa-star text-green-500" aria-hidden="true"></i>
                                            Strengths
                                        </h3>
                                        {strengths.map((skill, index) => (
                                            <SkillBar
                                                key={index}
                                                skillName={skill.skillName}
                                                score={skill.score}
                                                maxScore={5}
                                                trend={skill.trend}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Needs Focus */}
                                {needsFocus.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                                            <i className="fa-solid fa-bullseye text-amber-500" aria-hidden="true"></i>
                                            Areas for Growth
                                        </h3>
                                        {needsFocus.map((skill, index) => (
                                            <SkillBar
                                                key={index}
                                                skillName={skill.skillName}
                                                score={skill.score}
                                                maxScore={5}
                                                trend={skill.trend}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Not Yet Practiced (Collapsible) */}
                                {notPracticed.length > 0 && (
                                    <div className="no-print">
                                        <button
                                            onClick={() => setShowNotPracticed(!showNotPracticed)}
                                            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                        >
                                            <i className={`fa-solid fa-chevron-${showNotPracticed ? 'down' : 'right'} text-xs`} aria-hidden="true"></i>
                                            Not Yet Practiced ({notPracticed.length})
                                        </button>
                                        {showNotPracticed && (
                                            <div className="mt-3 space-y-2">
                                                {notPracticed.map((skill, index) => (
                                                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-[var(--color-text-muted)]">{skill.skillName}</span>
                                                        <span className="text-xs text-gray-400 italic">No data</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Content Sections */}
                    <div className="space-y-6 print-break">
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
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg">
                                        <div className="flex items-start gap-3">
                                            <i className="fa-solid fa-lightbulb text-amber-600 text-lg mt-0.5" aria-hidden="true"></i>
                                            <div>
                                                <p className="font-semibold text-[var(--color-text-primary)] mb-2">Priority Skills to Focus On</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {summary.topSkillsToImprove.map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1 bg-white border-2 border-amber-400 text-amber-800 px-3 py-1 text-sm font-medium rounded-full"
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
                                                    <span className="flex-shrink-0 w-7 h-7 bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm rounded-full">
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

                    {/* Certificate Footer - Print only */}
                    <div className="hidden print:block mt-12 pt-8 border-t-2 border-[var(--color-primary)]">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Generated on</p>
                                <p className="text-base font-semibold text-[var(--color-text-primary)]">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[var(--color-text-muted)]">MI Practice Coach</p>
                                <p className="text-xs text-[var(--color-text-muted)]">AI-Powered Training Platform</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default CoachingSummaryView;
