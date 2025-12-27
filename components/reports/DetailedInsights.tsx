import React, { useState } from 'react';
import { SkillScore } from '../../hooks/useReportData';

interface DetailedInsightsProps {
  skillScores: SkillScore[];
  isLoading?: boolean;
}

/**
 * Get score color based on value (0-100)
 * Uses Growth Garden theme semantic colors
 */
const getScoreColor = (score: number): string => {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-error)';
};

/**
 * Get score background color (lighter variant)
 */
const getScoreBgColor = (score: number): string => {
  if (score >= 70) return 'var(--color-success-light)';
  if (score >= 40) return 'var(--color-warning-light)';
  return 'var(--color-error-light)';
};

/**
 * Get score label
 */
const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Developing';
  if (score >= 30) return 'Emerging';
  return 'Focus Area';
};

/**
 * Generate insights for each competency based on score and usage
 */
const getCompetencyInsights = (
  skill: SkillScore
): {
  strengths: string[];
  improvements: string[];
  recommendation: string;
} => {
  const { name, score, count, trend } = skill;

  // Base insights by competency
  const insightsBySkill: Record<
    string,
    {
      highStrengths: string[];
      lowStrengths: string[];
      highImprovements: string[];
      lowImprovements: string[];
      recommendations: { high: string; medium: string; low: string };
    }
  > = {
    'Reflective Listening': {
      highStrengths: [
        'Effectively mirroring client emotions and meaning',
        'Demonstrating deep understanding through reflections',
      ],
      lowStrengths: [
        'Beginning to incorporate reflections into conversations',
        'Showing awareness of the importance of listening',
      ],
      highImprovements: [
        'Try varying reflection depth (simple vs complex)',
        'Experiment with double-sided reflections',
      ],
      lowImprovements: [
        'Focus on reflecting feelings, not just content',
        'Aim for 2 reflections for every question asked',
      ],
      recommendations: {
        high: 'Practice complex reflections that add meaning beyond what the client said.',
        medium: 'Try the "reflection stem" technique: "It sounds like..." or "You\'re feeling..."',
        low: 'Start each response by paraphrasing what you heard before asking questions.',
      },
    },
    'Open Questions': {
      highStrengths: [
        'Using questions that invite exploration and elaboration',
        'Avoiding closed yes/no questions effectively',
      ],
      lowStrengths: [
        'Asking questions to understand the client better',
        'Showing curiosity about the client\'s perspective',
      ],
      highImprovements: [
        'Balance questions with reflections (avoid interrogation)',
        'Use more evocative questions about change',
      ],
      lowImprovements: [
        'Replace "Do you..." with "What..." or "How..."',
        'Ask about importance and confidence regarding change',
      ],
      recommendations: {
        high: 'Focus on strategic questions that evoke change talk.',
        medium: 'Practice starting questions with "What" and "How" instead of "Do" or "Are".',
        low: 'Try the "Tell me more about..." approach to invite deeper sharing.',
      },
    },
    'Affirmations': {
      highStrengths: [
        'Recognizing client strengths and efforts genuinely',
        'Building client confidence and self-efficacy',
      ],
      lowStrengths: [
        'Acknowledging client participation in the conversation',
        'Showing positive regard for the client',
      ],
      highImprovements: [
        'Make affirmations more specific to behaviors and values',
        'Connect affirmations to the client\'s stated goals',
      ],
      lowImprovements: [
        'Notice and comment on client strengths more often',
        'Affirm effort and intention, not just outcomes',
      ],
      recommendations: {
        high: 'Link affirmations to client values: "Your dedication to your family shows..."',
        medium: 'Practice the "I noticed..." affirmation format to be more specific.',
        low: 'Look for one thing to genuinely affirm in each conversation.',
      },
    },
    'Summarizing': {
      highStrengths: [
        'Pulling together key themes and client statements',
        'Using summaries to transition and check understanding',
      ],
      lowStrengths: [
        'Attempting to consolidate discussion points',
        'Showing effort to track the conversation',
      ],
      highImprovements: [
        'Include change talk in summaries to amplify it',
        'Use summaries strategically before transitions',
      ],
      lowImprovements: [
        'Practice collecting summaries during longer conversations',
        'Summarize before moving to a new topic',
      ],
      recommendations: {
        high: 'Create "bouquet" summaries that emphasize change talk and client strengths.',
        medium: 'Try summarizing every 5-10 minutes of conversation.',
        low: 'Start with simple summaries: "So far you\'ve mentioned X, Y, and Z..."',
      },
    },
    'Evoking Change Talk': {
      highStrengths: [
        'Successfully eliciting client reasons for change',
        'Recognizing and reinforcing change talk when it occurs',
      ],
      lowStrengths: [
        'Creating space for clients to explore change',
        'Listening for hints of motivation',
      ],
      highImprovements: [
        'Evoke commitment language, not just desire',
        'Use scaling questions to deepen change talk',
      ],
      lowImprovements: [
        'Ask about the importance of change to the client',
        'Explore what change would mean for their life',
      ],
      recommendations: {
        high: 'Focus on evoking "CAT" - Commitment, Activation, Taking steps.',
        medium: 'Use the importance ruler: "On a scale of 0-10, how important is this change?"',
        low: 'Ask "What would be good about making this change?"',
      },
    },
    'Rolling with Resistance': {
      highStrengths: [
        'Responding to resistance without confrontation',
        'Using resistance as a signal to adjust approach',
      ],
      lowStrengths: [
        'Avoiding direct argumentation with clients',
        'Recognizing when clients push back',
      ],
      highImprovements: [
        'Reframe resistance as ambivalence to explore',
        'Use amplified reflection strategically',
      ],
      lowImprovements: [
        'Pause and reflect when you feel resistance',
        'Emphasize client autonomy: "It\'s up to you..."',
      ],
      recommendations: {
        high: 'Practice "coming alongside" - agree with the resistant part before exploring.',
        medium: 'When you feel the urge to argue, reflect instead.',
        low: 'Remember: resistance is information, not opposition. Ask "What concerns you?"',
      },
    },
  };

  const skillInsights = insightsBySkill[name] || {
    highStrengths: ['Demonstrating competency in this area'],
    lowStrengths: ['Beginning to develop this skill'],
    highImprovements: ['Continue refining this skill'],
    lowImprovements: ['Focus on building fundamentals'],
    recommendations: {
      high: 'Keep practicing to maintain proficiency.',
      medium: 'Regular practice will strengthen this skill.',
      low: 'Start with basic exercises and build gradually.',
    },
  };

  // Select appropriate insights based on score
  const isHigh = score >= 60;
  const strengths = isHigh ? skillInsights.highStrengths : skillInsights.lowStrengths;
  const improvements = isHigh ? skillInsights.highImprovements : skillInsights.lowImprovements;

  // Select recommendation based on score tier
  let recommendation: string;
  if (score >= 70) {
    recommendation = skillInsights.recommendations.high;
  } else if (score >= 40) {
    recommendation = skillInsights.recommendations.medium;
  } else {
    recommendation = skillInsights.recommendations.low;
  }

  // Add trend-specific note if applicable
  if (trend === 'improving' && count > 2) {
    recommendation += ' Your improvement trend shows this practice is working!';
  } else if (trend === 'declining' && count > 2) {
    recommendation += ' Consider revisiting fundamentals to regain momentum.';
  }

  return { strengths, improvements, recommendation };
};

/**
 * Single skill accordion card
 */
const SkillCard: React.FC<{
  skill: SkillScore;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ skill, isExpanded, onToggle }) => {
  const { strengths, improvements, recommendation } = getCompetencyInsights(skill);
  const scoreColor = getScoreColor(skill.score);
  const scoreBgColor = getScoreBgColor(skill.score);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-card, #ffffff)',
        border: `1px solid ${isExpanded ? scoreColor : 'var(--color-neutral-200)'}`,
      }}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-neutral-50)] transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`skill-details-${skill.name.replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          {/* Score badge */}
          <div
            className="w-12 h-12 rounded-lg flex flex-col items-center justify-center"
            style={{ backgroundColor: scoreBgColor }}
          >
            <span className="text-lg font-bold" style={{ color: scoreColor }}>
              {skill.score}
            </span>
          </div>

          {/* Skill name and label */}
          <div>
            <h4
              className="font-semibold text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {skill.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: scoreColor }}>
                {getScoreLabel(skill.score)}
              </span>
              {skill.trend !== 'stable' && (
                <span
                  className="text-xs"
                  style={{
                    color:
                      skill.trend === 'improving'
                        ? 'var(--color-success)'
                        : 'var(--color-error)',
                  }}
                >
                  {skill.trend === 'improving' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expand/collapse icon */}
        <i
          className={`fa-solid fa-chevron-down transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          style={{ color: 'var(--color-text-muted)' }}
          aria-hidden="true"
        />
      </button>

      {/* Expandable details */}
      <div
        id={`skill-details-${skill.name.replace(/\s+/g, '-')}`}
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="px-4 pb-4 pt-0 border-t"
          style={{ borderColor: 'var(--color-neutral-100)' }}
        >
          {/* What you did well */}
          <div className="mt-3">
            <h5
              className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2"
              style={{ color: 'var(--color-success)' }}
            >
              <i className="fa-solid fa-check-circle" aria-hidden="true" />
              What You Did Well
            </h5>
            <ul className="space-y-1">
              {strengths.map((strength, idx) => (
                <li
                  key={idx}
                  className="text-sm pl-4 relative"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="absolute left-0"
                    style={{ color: 'var(--color-success)' }}
                  >
                    •
                  </span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* What to improve */}
          <div className="mt-4">
            <h5
              className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2"
              style={{ color: 'var(--color-warning)' }}
            >
              <i className="fa-solid fa-lightbulb" aria-hidden="true" />
              Areas to Develop
            </h5>
            <ul className="space-y-1">
              {improvements.map((improvement, idx) => (
                <li
                  key={idx}
                  className="text-sm pl-4 relative"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="absolute left-0"
                    style={{ color: 'var(--color-warning)' }}
                  >
                    •
                  </span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          {/* Practice recommendation */}
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: 'var(--color-primary-50)' }}
          >
            <h5
              className="text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-2"
              style={{ color: 'var(--color-primary-700)' }}
            >
              <i className="fa-solid fa-seedling" aria-hidden="true" />
              Practice Recommendation
            </h5>
            <p className="text-sm" style={{ color: 'var(--color-primary-700)' }}>
              {recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * DetailedInsights Component
 *
 * Expandable accordion cards for each MI competency showing:
 * - Score with color coding
 * - Strengths
 * - Areas to improve
 * - Practice recommendations
 *
 * Premium only.
 */
const DetailedInsights: React.FC<DetailedInsightsProps> = ({
  skillScores,
  isLoading = false,
}) => {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const handleToggle = (skillName: string) => {
    setExpandedSkill((prev) => (prev === skillName ? null : skillName));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse h-20 rounded-xl bg-[var(--color-neutral-100)]"
          />
        ))}
      </div>
    );
  }

  if (!skillScores || skillScores.length === 0) {
    return (
      <div
        className="text-sm text-center py-6"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Complete sessions to see detailed skill insights.
      </div>
    );
  }

  // Sort by score (lowest first to prioritize areas needing work)
  const sortedSkills = [...skillScores].sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-3">
      {sortedSkills.map((skill) => (
        <SkillCard
          key={skill.name}
          skill={skill}
          isExpanded={expandedSkill === skill.name}
          onToggle={() => handleToggle(skill.name)}
        />
      ))}
    </div>
  );
};

export default DetailedInsights;
