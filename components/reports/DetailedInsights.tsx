import React, { useState } from 'react';
import { SkillScore } from '../../hooks/useReportData';

interface DetailedInsightsProps {
  skillScores: SkillScore[];
  isLoading?: boolean;
}

/**
 * Get bar color based on value
 */
const getBarColor = (score: number): string => {
  if (score >= 80) return 'var(--color-primary)';
  if (score >= 51) return 'rgba(var(--color-primary-rgb), 0.7)'; // Assuming rgb vars exist, otherwise distinct primary-light
  if (score >= 21) return 'rgba(var(--color-primary-rgb), 0.4)';
  return '#E5E5E5';
};

/**
 * Get status label and color
 */
const getStatusInfo = (score: number) => {
  if (score >= 80) return { label: 'Excellent', color: 'var(--color-success)' };
  if (score >= 51) return { label: 'Developing ↑', color: 'var(--color-primary)' };
  if (score >= 21) return { label: 'Developing', color: 'var(--color-text-muted)' };
  return { label: 'Focus Area', color: 'var(--color-warning)' };
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
  const status = getStatusInfo(skill.score);

  // Custom bar color logic for the request
  let barColorStr = '#E5E5E5';
  if (skill.score >= 81) barColorStr = 'var(--color-primary)';
  else if (skill.score >= 51) barColorStr = 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.7)';
  else if (skill.score >= 21) barColorStr = 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.4)';
  else barColorStr = '#E5E5E5';

  return (
    <div
      className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-200"
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full p-6 text-left hover:bg-[var(--color-neutral-50)] transition-colors group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[15px] font-medium text-[var(--color-text-primary)]">
            {skill.name}
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">
              {skill.score}/100
            </span>
            <i
              className={`fa-solid fa-chevron-down text-xs text-[var(--color-text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                }`}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-[#F0F0F0] rounded-full mb-2 overflow-hidden">
          {/* Benchmark line at 50% */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px border-r border-dashed border-gray-300 z-10" />

          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${skill.score}%`,
              backgroundColor: barColorStr
            }}
          />
        </div>

        {/* Status Label */}
        <div className="flex justify-end">
          <span
            className="text-xs font-medium"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </button>

      {/* Expandable details */}
      <div
        className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        {/* Divider */}
        <div className="h-px bg-[var(--color-neutral-100)] mx-6" />

        <div className="p-6 pt-4 space-y-4">
          {/* What you did well */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-success)] flex items-center gap-2">
              <i className="fa-solid fa-check-circle" aria-hidden="true" />
              Strengths
            </h5>
            <ul className="space-y-1">
              {strengths.map((strength, idx) => (
                <li key={idx} className="text-sm pl-4 relative text-[var(--color-text-secondary)]">
                  <span className="absolute left-0 text-[var(--color-success)]">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* What to improve */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wide mb-2 text-[var(--color-warning)] flex items-center gap-2">
              <i className="fa-solid fa-lightbulb" aria-hidden="true" />
              Focus Areas
            </h5>
            <ul className="space-y-1">
              {improvements.map((improvement, idx) => (
                <li key={idx} className="text-sm pl-4 relative text-[var(--color-text-secondary)]">
                  <span className="absolute left-0 text-[var(--color-warning)]">•</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          {/* Practice recommendation */}
          <div className="bg-[var(--color-primary-50)] p-4 rounded-lg">
            <h5 className="text-xs font-bold uppercase tracking-wide mb-1 text-[var(--color-primary-700)] flex items-center gap-2">
              <i className="fa-solid fa-seedling" aria-hidden="true" />
              Recommendation
            </h5>
            <p className="text-sm text-[var(--color-primary-700)]">
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse h-24 rounded-xl bg-[var(--color-neutral-100)]"
          />
        ))}
      </div>
    );
  }

  if (!skillScores || skillScores.length === 0) {
    return (
      <div className="text-sm text-center py-6 text-[var(--color-text-muted)]">
        Complete sessions to see detailed skill insights.
      </div>
    );
  }

  // Sort by score (DESCENDING: highest first)
  const sortedSkills = [...skillScores].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-5">
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


