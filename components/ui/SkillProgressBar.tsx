import React from 'react';

interface SkillProgressBarProps {
    skillName: string;
    totalCount: number;
    averagePerSession: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    maxCount?: number; // Optional: to normalize progress bars across skills
}

const SkillProgressBar: React.FC<SkillProgressBarProps> = ({
    skillName,
    totalCount,
    averagePerSession,
    trend,
    maxCount,
}) => {
    // Determine color based on usage level and trend
    const getSkillColor = () => {
        const avg = averagePerSession;
        if (avg >= 3) {
            // Strong usage - green
            return 'bg-green-500';
        } else if (avg >= 1.5) {
            // Moderate usage - amber
            return 'bg-amber-500';
        } else {
            // Low usage - red
            return 'bg-red-500';
        }
    };

    // Determine trend indicator
    const getTrendIcon = () => {
        switch (trend) {
            case 'increasing':
                return <i className="fa-solid fa-arrow-up text-green-600" aria-label="Increasing trend" />;
            case 'decreasing':
                return <i className="fa-solid fa-arrow-down text-red-600" aria-label="Decreasing trend" />;
            case 'stable':
                return <i className="fa-solid fa-minus text-gray-500" aria-label="Stable trend" />;
        }
    };

    // Calculate progress percentage (normalize to maxCount if provided, otherwise use a reasonable scale)
    const maxValue = maxCount || Math.max(totalCount, 10);
    const progressPercent = Math.min((totalCount / maxValue) * 100, 100);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {skillName}
                    </span>
                    {getTrendIcon()}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span className="font-medium">{totalCount} total</span>
                    <span className="text-[var(--color-text-muted)]">
                        {averagePerSession.toFixed(1)}/session
                    </span>
                </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className={`${getSkillColor()} h-full rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={totalCount}
                    aria-valuemin={0}
                    aria-valuemax={maxValue}
                    aria-label={`${skillName}: ${totalCount} total uses, ${averagePerSession.toFixed(1)} per session, trend: ${trend}`}
                />
            </div>
        </div>
    );
};

export default SkillProgressBar;

