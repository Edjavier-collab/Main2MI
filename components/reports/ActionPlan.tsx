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

/**
 * Get priority color based on rank (1, 2, 3)
 */
const getPriorityColor = (priority: number): string => {
  if (priority === 1) return 'var(--color-error)';
  if (priority === 2) return 'var(--color-warning)';
  return 'var(--color-primary-400)';
};

/**
 * Get priority background color
 */
const getPriorityBgColor = (priority: number): string => {
  if (priority === 1) return 'rgba(239, 68, 68, 0.1)';
  if (priority === 2) return 'rgba(234, 179, 8, 0.1)';
  return 'rgba(135, 168, 120, 0.1)';
};

/**
 * Calculate recommended session frequency based on usage patterns
 */
const getRecommendedFrequency = (
  sessionCount: number,
  periodStart: Date | null,
  periodEnd: Date | null
): { frequency: string; rationale: string } => {
  if (!periodStart || !periodEnd || sessionCount === 0) {
    return {
      frequency: '3 sessions per week',
      rationale: 'Start with regular practice to build MI fundamentals.',
    };
  }

  const daysDiff = Math.max(
    1,
    Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
  );
  const sessionsPerWeek = (sessionCount / daysDiff) * 7;

  if (sessionsPerWeek < 1) {
    return {
      frequency: '3 sessions per week',
      rationale: 'Increasing practice frequency will accelerate your skill development.',
    };
  } else if (sessionsPerWeek < 3) {
    return {
      frequency: '4-5 sessions per week',
      rationale: 'You\'re building momentum—a bit more consistency will solidify gains.',
    };
  } else if (sessionsPerWeek < 5) {
    return {
      frequency: '5 sessions per week',
      rationale: 'Great rhythm! Maintain this pace for optimal skill retention.',
    };
  } else {
    return {
      frequency: 'Daily practice',
      rationale: 'Excellent dedication! Consider varying scenarios for broader skill application.',
    };
  }
};

/**
 * Generate exercise recommendations for each skill
 */
const getExerciseForSkill = (skillName: string): string => {
  const exercises: Record<string, string> = {
    'Reflective Listening':
      'Practice the 2:1 rule—aim for 2 reflections before asking any question. Focus on reflecting feelings, not just content.',
    'Open Questions':
      'Convert 3 closed questions to open ones. Start with "What" or "How" instead of "Do" or "Are".',
    'Affirmations':
      'Identify one genuine strength in each practice session. Use the "I noticed..." format for specificity.',
    'Summarizing':
      'Practice a collecting summary mid-conversation and a linking summary at the end.',
    'Evoking Change Talk':
      'Use the importance ruler: "On a scale of 0-10, how important is this change?" Then explore.',
    'Rolling with Resistance':
      'When you feel the urge to correct, pause and reflect instead. Try "coming alongside" the resistance.',
  };

  return exercises[skillName] || 'Practice this skill in your next session with focused intention.';
};

/**
 * Generate measurable goal for skill improvement
 */
const getGoalForSkill = (skill: SkillScore): string => {
  const targetScore = Math.min(100, skill.score + 15);

  if (skill.score >= 80) {
    return `Maintain ${skill.name} excellence (${skill.score}%+) while helping others learn`;
  } else if (skill.score >= 60) {
    return `Increase ${skill.name} from ${skill.score}% to ${targetScore}%`;
  } else if (skill.score >= 40) {
    return `Build ${skill.name} competency from ${skill.score}% to ${targetScore}%`;
  } else {
    return `Develop ${skill.name} foundation from ${skill.score}% to ${targetScore}%`;
  }
};

/**
 * ActionPlan Component
 *
 * Personalized next steps for MI skill development:
 * - Top 3 focus areas
 * - Specific exercises
 * - Session frequency recommendation
 * - Measurable goals
 *
 * Premium only.
 */
const ActionPlan: React.FC<ActionPlanProps> = ({
  skillScores,
  sessionCount,
  periodStart,
  periodEnd,
  onStartPractice,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 rounded-xl bg-[var(--color-neutral-100)]" />
        <div className="animate-pulse h-32 rounded-xl bg-[var(--color-neutral-100)]" />
        <div className="animate-pulse h-20 rounded-xl bg-[var(--color-neutral-100)]" />
      </div>
    );
  }

  if (!skillScores || skillScores.length === 0) {
    return (
      <div
        className="text-sm text-center py-6"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Complete sessions to receive your personalized action plan.
      </div>
    );
  }

  // Get top 3 focus areas (lowest scores)
  const focusAreas = [...skillScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const { frequency, rationale } = getRecommendedFrequency(
    sessionCount,
    periodStart,
    periodEnd
  );

  return (
    <div className="space-y-4">
      {/* Focus Areas */}
      <div className="space-y-3">
        {focusAreas.map((skill, index) => (
          <div
            key={skill.name}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-bg-card, #ffffff)',
              border: '1px solid var(--color-neutral-200)',
            }}
          >
            {/* Priority header */}
            <div className="flex items-start gap-3">
              {/* Priority number */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{
                  backgroundColor: getPriorityBgColor(index + 1),
                  color: getPriorityColor(index + 1),
                }}
              >
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Skill name and score */}
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className="font-semibold text-sm"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {skill.name}
                  </h4>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: getPriorityBgColor(index + 1),
                      color: getPriorityColor(index + 1),
                    }}
                  >
                    {skill.score}%
                  </span>
                </div>

                {/* Goal */}
                <p
                  className="text-xs mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <i
                    className="fa-solid fa-bullseye mr-1"
                    aria-hidden="true"
                  />
                  Goal: {getGoalForSkill(skill)}
                </p>

                {/* Exercise */}
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-neutral-50)' }}
                >
                  <h5
                    className="text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1"
                    style={{ color: 'var(--color-primary-600)' }}
                  >
                    <i className="fa-solid fa-dumbbell" aria-hidden="true" />
                    This Week's Exercise
                  </h5>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {getExerciseForSkill(skill.name)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Frequency */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary-100)' }}
          >
            <i
              className="fa-solid fa-calendar-check"
              style={{ color: 'var(--color-primary-600)' }}
              aria-hidden="true"
            />
          </div>
          <div>
            <h4
              className="font-semibold text-sm mb-1"
              style={{ color: 'var(--color-primary-700)' }}
            >
              Recommended: {frequency}
            </h4>
            <p
              className="text-sm"
              style={{ color: 'var(--color-primary-600)' }}
            >
              {rationale}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div
        className="rounded-xl p-4 text-center"
        style={{
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-neutral-200)',
        }}
      >
        <p
          className="text-sm mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <i
            className="fa-solid fa-seedling mr-2"
            style={{ color: 'var(--color-primary-400)' }}
            aria-hidden="true"
          />
          Ready to grow your MI skills?
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={onStartPractice}
          className="w-full justify-center"
        >
          <i className="fa-solid fa-play mr-2" aria-hidden="true" />
          Start Practice Session
        </Button>
      </div>
    </div>
  );
};

export default ActionPlan;
