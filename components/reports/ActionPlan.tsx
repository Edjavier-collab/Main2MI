import React from 'react';
import { SkillScore } from '../../hooks/useReportData';
import { Button } from '../ui/Button';

interface ActionPlanProps {
  skillScores: SkillScore[];
  sessionCount: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  onStartPractice: () => void;
  isLoading?: boolean;
}

const getPriorityColor = (priority: number): string => {
  if (priority === 1) return 'var(--color-primary)';
  if (priority === 2) return 'var(--color-primary)';
  return 'var(--color-primary)';
};

/**
 * ActionPlan Component
 */
const ActionPlan: React.FC<ActionPlanProps> = ({
  skillScores,
  sessionCount,
  onStartPractice,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-100)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-[var(--color-neutral-100)] rounded" />
              <div className="h-2 w-full bg-[var(--color-neutral-100)] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!skillScores || skillScores.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--color-text-muted)]">
        Complete sessions to generate your action plan.
      </div>
    );
  }

  // Get top 3 focus areas (lowest scores)
  const focusAreas = [...skillScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Action Items List */}
      <div className="space-y-6">
        {focusAreas.map((skill, index) => (
          <div key={skill.name} className="flex items-start gap-4">
            {/* Numbered Circle */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
              style={{
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-700)',
                border: '1px solid var(--color-primary-100)'
              }}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {skill.name}
                </h4>
                <span className="text-xs font-bold text-[var(--color-primary-700)]">
                  {skill.score}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-[var(--color-neutral-100)] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${skill.score}%`,
                    backgroundColor: 'var(--color-primary)'
                  }}
                />
              </div>

              {/* Context/Goal */}
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Focus on improving {skill.name.toLowerCase()} in your next session.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Footer & CTA */}
      <div className="border-t border-[var(--color-neutral-100)] pt-6">
        <p className="text-center text-sm font-medium italic mb-6 text-[var(--color-text-secondary)]">
          "Consistent practice is the key to mastery. You've got this!"
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onStartPractice}
          className="w-full justify-center shadow-md hover:shadow-lg transition-all"
        >
          Start Practice Session
        </Button>
      </div>
    </div>
  );
};

export default ActionPlan;
