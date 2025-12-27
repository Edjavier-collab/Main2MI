/**
 * Mastery Goal Service - BMAD-Powered AI Guidance
 * 
 * Generates personalized "Mastery Goal" text based on:
 * - User's Mastery Tier (from North Star Logic)
 * - Current Level and XP
 * - Session History
 * - Skill Gaps
 * 
 * Uses BMAD principles: Direct, comprehensive, systematic guidance
 */

import { MasteryTier, getMasteryTier } from '../utils/northStarLogic';
import { Session } from '../types';

export interface MasteryGoalData {
  goal: string; // AI-generated mastery goal text
  masteryTier: MasteryTier;
  currentLevel: number;
  focusArea?: string; // Specific skill to focus on
  generatedAt: string; // ISO timestamp
}

/**
 * Generate mastery goal text based on BMAD principles
 * BMAD Master Agent style: Direct, comprehensive, systematic
 */
export const generateMasteryGoal = (
  currentLevel: number,
  sessions: Session[],
  skillGaps?: string[]
): MasteryGoalData => {
  const masteryTier = getMasteryTier(currentLevel);
  
  // Analyze session history for insights
  const recentSessions = sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const avgEmpathyScore = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.feedback?.empathyScore || 0), 0) / recentSessions.length
    : 0;

  // Determine focus area from skill gaps or default
  const focusArea = skillGaps && skillGaps.length > 0 
    ? skillGaps[0] 
    : getDefaultFocusArea(masteryTier);

  // Generate goal text based on tier and context
  const goal = buildGoalText(masteryTier, currentLevel, avgEmpathyScore, focusArea, recentSessions.length);

  return {
    goal,
    masteryTier,
    currentLevel,
    focusArea,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Build goal text using BMAD Master Agent communication style:
 * - Direct and comprehensive
 * - Systematic presentation
 * - Expert-level guidance
 */
const buildGoalText = (
  tier: MasteryTier,
  level: number,
  avgScore: number,
  focusArea: string,
  sessionCount: number
): string => {
  const scoreContext = avgScore > 0 
    ? avgScore >= 80 
      ? 'excellent performance'
      : avgScore >= 60
      ? 'solid progress'
      : 'building foundational skills'
    : 'starting your journey';

  switch (tier) {
    case 'novice':
      return `🌱 **Curious Beginner** (Level ${level}): Focus on mastering ${focusArea}. Your ${scoreContext} shows promise. Complete ${Math.max(1, 3 - sessionCount)} more practice sessions this week to unlock deeper insights.`;

    case 'intermediate':
      return `🌿 **Engaged Learner** (Level ${level}): Elevate your ${focusArea} technique. With ${scoreContext}, you're ready for advanced scenarios. Practice ${focusArea} in 2-3 sessions this week to reach Master tier.`;

    case 'master':
      return `🏆 **MI Champion** (Level ${level}): Refine ${focusArea} to mentor-level precision. Your ${scoreContext} demonstrates expertise. Guide others by documenting your ${focusArea} strategies in your next session.`;

    default:
      return `Continue practicing ${focusArea} to advance your MI skills.`;
  }
};

/**
 * Get default focus area based on mastery tier
 */
const getDefaultFocusArea = (tier: MasteryTier): string => {
  switch (tier) {
    case 'novice':
      return 'Reflective Listening';
    case 'intermediate':
      return 'Evoking Change Talk';
    case 'master':
      return 'Rolling with Resistance';
    default:
      return 'MI Fundamentals';
  }
};

/**
 * Generate goal with AI analysis (future: integrate with Gemini)
 * For now, uses rule-based BMAD logic
 */
export const generateAIMasteryGoal = async (
  currentLevel: number,
  sessions: Session[],
  skillScores?: Array<{ name: string; score: number }>
): Promise<MasteryGoalData> => {
  // Identify skill gaps from scores
  const skillGaps = skillScores
    ?.filter(s => s.score < 70)
    .sort((a, b) => a.score - b.score)
    .map(s => s.name)
    .slice(0, 2);

  return generateMasteryGoal(currentLevel, sessions, skillGaps);
};
