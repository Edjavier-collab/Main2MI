'use client';

import React, { useState } from 'react';
import { CoachingSummary } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ArrowLeft, Printer, ChevronDown, ChevronRight } from 'lucide-react';

interface CoachingSummaryViewProps {
    isLoading: boolean;
    summary: CoachingSummary | null;
    error: string | null;
    onBack: () => void;
}

// Competency level from overall score
const getCompetencyLevel = (score: number): string => {
    if (score >= 4.5) return 'Expert';
    if (score >= 3.5) return 'Proficient';
    if (score >= 2.5) return 'Developing';
    if (score >= 1.5) return 'Foundational';
    return 'Beginning';
};

// Report ID from current date
const generateReportId = (): string => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `MI-${yyyy}-${mm}${dd}`;
};

// Minimal horizontal bar for skill scores
const SkillBar: React.FC<{ skillName: string; score: number; maxScore: number }> = ({
    skillName,
    score,
    maxScore
}) => {
    const percentage = (score / maxScore) * 100;

    return (
        <div className="flex items-center gap-3 py-2">
            <span className="text-sm font-medium text-[#111] w-40 shrink-0">{skillName}</span>
            <div className="flex-1 h-2 bg-[var(--color-neutral-200)] rounded-full overflow-hidden relative">
                {/* Proficiency benchmark dashed line at 60% (score 3/5) */}
                <div
                    className="absolute top-0 h-full w-px border-l border-dashed border-[var(--color-neutral-400)] z-10"
                    style={{ left: '60%' }}
                />
                <div
                    className="h-full bg-[#111] rounded-full transition-all duration-500 ease-out print-color"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-sm font-semibold text-[#111] w-8 text-right shrink-0">{score}/{maxScore}</span>
        </div>
    );
};

// Safe markdown renderer that parses text and renders with React components (no dangerouslySetInnerHTML)
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parseLine = (line: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        let lastIndex = 0;

        while ((match = boldRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                const beforeText = line.substring(lastIndex, match.index);
                if (beforeText) {
                    parts.push(beforeText);
                }
            }
            parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
            const remainingText = line.substring(lastIndex);
            if (remainingText) {
                parts.push(remainingText);
            }
        }

        if (parts.length === 0) {
            return [line];
        }

        return parts;
    };

    const renderLine = (line: string, index: number) => {
        const parsedContent = parseLine(line);

        if (line.startsWith('* ')) {
            const contentWithoutPrefix = line.substring(2);
            const parsedContentWithoutPrefix = parseLine(contentWithoutPrefix);

            return (
                <li key={index} className="text-[#666] leading-relaxed text-base">
                    {parsedContentWithoutPrefix}
                </li>
            );
        }

        return (
            <p key={index} className="text-[#666] leading-relaxed text-base">
                {parsedContent}
            </p>
        );
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <Card variant="elevated" padding="lg" className="text-center max-w-md w-full">
                    <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="mt-6 text-xl font-bold text-[#111]">Analyzing Your Sessions</h2>
                    <p className="text-[#666] mt-2">Our AI coach is reviewing your practice history...</p>
                    <p className="text-sm text-[#888] mt-4">This may take a moment</p>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-transparent p-6">
                <header className="flex items-center mb-6 max-w-3xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        icon={<ArrowLeft size={18} />}
                        aria-label="Go back"
                        className="mr-3"
                    />
                    <h1 className="text-xl font-bold text-[#111]">Competency Report</h1>
                </header>
                <main className="max-w-3xl mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center border-l-4 border-[var(--color-error)]">
                        <i className="fa-solid fa-circle-exclamation text-5xl text-[var(--color-error)] mb-4" aria-hidden="true"></i>
                        <h2 className="text-xl font-bold text-[#111]">Could Not Generate Report</h2>
                        <p className="text-[#666] mt-2 max-w-sm mx-auto">{error}</p>
                        <Button onClick={onBack} variant="ghost" className="mt-6 mx-auto">Go Back</Button>
                    </Card>
                </main>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="min-h-screen bg-transparent p-6">
                <header className="flex items-center mb-6 max-w-3xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        icon={<ArrowLeft size={18} />}
                        aria-label="Go back"
                        className="mr-3"
                    />
                    <h1 className="text-xl font-bold text-[#111]">Competency Report</h1>
                </header>
                <main className="max-w-3xl mx-auto">
                    <Card variant="accent" padding="lg" className="text-center">
                        <i className="fa-regular fa-file-lines text-5xl text-[#888] mb-4" aria-hidden="true"></i>
                        <h2 className="text-xl font-bold text-[#111]">No Report Available</h2>
                        <p className="text-[#666] mt-2">Go back and generate a competency report from your sessions.</p>
                        <Button onClick={onBack} variant="ghost" className="mt-6 mx-auto">Go Back</Button>
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

    const competencyLevel = getCompetencyLevel(overallScore);

    // State for collapsible sections
    const [showNotPracticed, setShowNotPracticed] = useState(false);

    return (
        <>
            {/* Print-specific styles */}
            <style>{`
                @media print {
                    .printable-area,
                    .printable-area * {
                        visibility: visible !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        max-width: 100% !important;
                    }

                    @page {
                        size: A4;
                        margin: 0.5in;
                    }

                    .print-card {
                        background: white !important;
                        box-shadow: none !important;
                        page-break-inside: avoid;
                    }

                    .print-color {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .print-break-before {
                        page-break-before: always;
                    }

                    .print-hide {
                        display: none !important;
                    }

                    /* Hide global app chrome */
                    header.sticky,
                    nav,
                    .bottom-nav,
                    [data-bottom-nav] {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-[var(--color-bg-main)] pb-24 print:bg-white print:pb-0">
                {/* Screen Header - Hidden on print */}
                <header className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto no-print">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            icon={<ArrowLeft size={18} />}
                            aria-label="Go back"
                            className="mr-3"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-[#111]">Competency Report</h1>
                            <p className="text-xs text-[#888]">{summary.dateRange}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleDownloadPdf}
                        variant="secondary"
                        size="sm"
                        icon={<Printer size={16} />}
                    >
                        Print Report
                    </Button>
                </header>

                {/* Main Report Document */}
                <main className="max-w-3xl mx-auto bg-white rounded-[var(--radius-md)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden printable-area">

                    {/* ─── Report Header ─── */}
                    <div className="border-t-2 border-[var(--color-primary-dark)]">
                        <div className="px-6 py-5 sm:px-8">
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between">
                                {/* Left: Logo */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm print-color">
                                        M
                                    </div>
                                    <span className="font-bold text-base tracking-tight text-[#111]">
                                        MI Mastery
                                    </span>
                                </div>

                                {/* Center: Title */}
                                <div className="text-center flex-1 px-4">
                                    <h1 className="text-lg sm:text-xl font-bold text-[#111] tracking-tight">
                                        Motivational Interviewing Competency Report
                                    </h1>
                                    <p className="text-sm text-[#666] mt-0.5">
                                        Comprehensive Skills Assessment & Progress Analysis
                                    </p>
                                </div>

                                {/* Right: Report metadata */}
                                <div className="text-center sm:text-right shrink-0">
                                    <p className="text-xs text-[#888] uppercase tracking-wide">Report Period</p>
                                    <p className="text-sm font-semibold text-[#111]">{summary.dateRange}</p>
                                    <p className="text-xs text-[#888] mt-1">Report #{generateReportId()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Executive Summary ─── */}
                    <div className="px-6 sm:px-8 py-6 border-b border-[var(--color-neutral-200)]">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Overall Score */}
                            <div className="border border-[var(--color-neutral-200)] rounded-[var(--radius-sm)] p-4 text-center">
                                <div className="flex items-baseline justify-center gap-0.5">
                                    <span className="text-3xl font-bold text-[#111]">{overallScore}</span>
                                    <span className="text-base font-normal text-[#888]">/5</span>
                                </div>
                                <p className="text-sm font-medium text-[#666] mt-2">Overall Rating</p>
                            </div>

                            {/* Sessions Completed */}
                            <div className="border border-[var(--color-neutral-200)] rounded-[var(--radius-sm)] p-4 text-center">
                                <span className="text-3xl font-bold text-[#111]">{summary.totalSessions}</span>
                                <p className="text-sm font-medium text-[#666] mt-2">Sessions Completed</p>
                            </div>

                            {/* Skills Evaluated */}
                            <div className="border border-[var(--color-neutral-200)] rounded-[var(--radius-sm)] p-4 text-center">
                                <span className="text-3xl font-bold text-[#111]">{practicedSkills.length}</span>
                                <p className="text-sm font-medium text-[#666] mt-2">Skills Evaluated</p>
                            </div>

                            {/* Competency Level */}
                            <div className="border border-[var(--color-neutral-200)] rounded-[var(--radius-sm)] p-4 text-center">
                                <span className="text-xl font-bold text-[#111]">{competencyLevel}</span>
                                <p className="text-sm font-medium text-[#666] mt-2">Competency Level</p>
                            </div>
                        </div>
                    </div>

                    {/* ─── MI Skills Performance ─── */}
                    {summary.skillProgression && summary.skillProgression.length > 0 && (
                        <div className="px-6 sm:px-8 py-6 print-card">
                            <h2 className="text-xl font-semibold text-[#111] mb-6 pl-4 border-l-[3px] border-[var(--color-primary)]">
                                MI Skills Performance
                            </h2>

                            {/* Benchmark legend */}
                            <div className="flex items-center gap-2 mb-4 text-xs text-[#888]">
                                <span className="inline-block w-4 border-t border-dashed border-[var(--color-neutral-400)]"></span>
                                <span>Proficiency benchmark (3/5)</span>
                            </div>

                            {/* Demonstrated Strengths */}
                            {strengths.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-[var(--color-success-dark)] uppercase tracking-wide mb-3">
                                        Demonstrated Strengths
                                    </h3>
                                    <div>
                                        {strengths.map((skill, index) => (
                                            <SkillBar
                                                key={index}
                                                skillName={skill.skillName}
                                                score={skill.score}
                                                maxScore={5}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Areas for Development */}
                            {needsFocus.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-[#D97706] uppercase tracking-wide mb-3">
                                        Areas for Development
                                    </h3>
                                    <div>
                                        {needsFocus.map((skill, index) => (
                                            <SkillBar
                                                key={index}
                                                skillName={skill.skillName}
                                                score={skill.score}
                                                maxScore={5}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Not Yet Assessed (collapsible, hidden on print) */}
                            {notPracticed.length > 0 && (
                                <div className="no-print print-hide">
                                    <button
                                        onClick={() => setShowNotPracticed(!showNotPracticed)}
                                        className="flex items-center gap-2 text-sm text-[#888] hover:text-[#111] transition-colors"
                                    >
                                        {showNotPracticed ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        Not Yet Assessed ({notPracticed.length})
                                    </button>
                                    {showNotPracticed && (
                                        <div className="mt-3 space-y-1">
                                            {notPracticed.map((skill, index) => (
                                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-[var(--color-neutral-50)] rounded-[var(--radius-sm)]">
                                                    <span className="text-sm text-[#888]">{skill.skillName}</span>
                                                    <span className="text-xs text-[var(--color-neutral-400)] italic">Not assessed</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Strengths & Positive Trends ─── */}
                    <div className="px-6 sm:px-8 py-6 print-card print-break-before">
                        <h2 className="text-xl font-semibold text-[#111] mb-6 pl-4 border-l-[3px] border-[var(--color-primary)]">
                            Strengths & Positive Trends
                        </h2>
                        <div className="space-y-4">
                            <MarkdownRenderer text={summary.strengthsAndTrends} />
                        </div>
                    </div>

                    {/* ─── Areas for Continued Focus ─── */}
                    <div className="px-6 sm:px-8 py-6 print-card">
                        <h2 className="text-xl font-semibold text-[#111] mb-6 pl-4 border-l-[3px] border-[#D97706]">
                            Areas for Continued Focus
                        </h2>
                        <div className="space-y-4">
                            <MarkdownRenderer text={summary.areasForFocus} />
                        </div>
                    </div>

                    {/* ─── Your Action Plan ─── */}
                    {(summary.topSkillsToImprove?.length || summary.specificNextSteps?.length) ? (
                        <div className="bg-[#FAFAFA] px-6 sm:px-8 py-6 print-card print-break-before">
                            <h2 className="text-xl font-semibold text-[#111] mb-6 pl-4 border-l-[3px] border-[var(--color-primary)]">
                                Your Action Plan
                            </h2>

                            {/* Priority Skills as tag pills */}
                            {summary.topSkillsToImprove && summary.topSkillsToImprove.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-[#666] uppercase tracking-wide mb-3">
                                        Priority Skills to Focus On
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {summary.topSkillsToImprove.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-block border border-[var(--color-primary)] text-[var(--color-primary-dark)] px-3 py-1 text-sm font-medium rounded-[var(--radius-sm)]"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Numbered circular steps */}
                            {summary.specificNextSteps && summary.specificNextSteps.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-[#666] uppercase tracking-wide mb-3">
                                        Next Steps
                                    </p>
                                    <ol className="space-y-4">
                                        {summary.specificNextSteps.map((step, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="shrink-0 w-7 h-7 bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm rounded-full print-color">
                                                    {index + 1}
                                                </span>
                                                <span className="text-base text-[#666] leading-relaxed flex-1 pt-0.5">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Recommendation callout */}
                            <div className="border border-[var(--color-neutral-200)] rounded-[var(--radius-sm)] p-4 bg-white">
                                <p className="text-sm text-[#666]">
                                    <span className="font-semibold text-[#111]">Recommended:</span>{' '}
                                    Complete 3 more sessions focusing on your priority skills to see measurable improvement.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#FAFAFA] px-6 sm:px-8 py-6 print-card">
                            <h2 className="text-xl font-semibold text-[#111] mb-6 pl-4 border-l-[3px] border-[var(--color-primary)]">
                                Summary & Next Steps
                            </h2>
                            <div className="text-base text-[#666] leading-relaxed">
                                <MarkdownRenderer text={summary.summaryAndNextSteps} />
                            </div>
                        </div>
                    )}

                    {/* ─── Report Footer ─── */}
                    <div className="px-6 sm:px-8 py-4 border-t border-[#E5E5E5]">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                            <p className="text-sm text-[#666]">
                                Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-sm text-[#666]">
                                MI Mastery | AI-Powered Training Platform
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default CoachingSummaryView;
