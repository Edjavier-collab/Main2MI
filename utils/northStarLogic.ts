/**
 * North Star Logic - Mastery Tier Mapping and Next Step Recommendations
 * 
 * Maps user levels from useXP to Mastery Tiers (Novice, Intermediate, Master)
 * and provides data structures for AI-generated "Next Step" recommendations.
 * 
 * Story 2.1: The North Star Logic
 */

/**
 * Mastery Tier enum - represents user's progression stage
 */
export type MasteryTier = 'novice' | 'intermediate' | 'master';

/**
 * AI-generated Next Step recommendation structure
 */
export interface NextStepRecommendation {
  nextStep: string; // AI-generated recommendation text
  masteryTier: MasteryTier; // Current tier based on level
  currentLevel: number; // User's current level from useXP
  reasoning?: string; // Optional: Why this step was recommended
  generatedAt: string; // ISO timestamp when recommendation was generated
}

/**
 * Options for generating next step recommendations
 */
export interface NextStepOptions {
  currentLevel: number;
  masteryTier?: MasteryTier; // Optional - will be calculated if not provided
  sessionHistory?: any[]; // Optional - for future AI analysis
  skillGaps?: string[]; // Optional - for future AI analysis
}

/**
 * Maps current_level from useXP to Mastery Tier
 * 
 * Level Ranges:
 * - Novice: Levels 1-5 (inclusive)
 * - Intermediate: Levels 6-15 (inclusive)
 * - Master: Levels 16+ (inclusive)
 * 
 * @param currentLevel - User's current level (1-4 currently, future: 1-16+)
 * @returns MasteryTier enum value
 */
export const getMasteryTier = (currentLevel: number): MasteryTier => {
  // Validate input
  if (!currentLevel || currentLevel < 1) {
    console.warn('[northStarLogic] Invalid level, defaulting to novice:', currentLevel);
    return 'novice';
  }

  // Map to tiers
  if (currentLevel <= 5) {
    return 'novice';
  } else if (currentLevel <= 15) {
    return 'intermediate';
  } else {
    return 'master';
  }
};

/**
 * Gets mastery tier from useXP hook
 * Handles loading and error states
 * 
 * @param currentLevel - From useXP().currentLevel
 * @param isLoading - From useXP().isLoading
 * @returns MasteryTier or null if loading
 */
export const getMasteryTierFromXP = (
  currentLevel: number,
  isLoading: boolean
): MasteryTier | null => {
  if (isLoading) {
    return null; // Don't return a tier while loading
  }

  try {
    return getMasteryTier(currentLevel);
  } catch (error) {
    console.error('[northStarLogic] Error getting mastery tier:', error);
    return 'novice'; // Safe fallback
  }
};

/**
 * Creates a NextStepRecommendation object with proper structure
 * This is the data structure that will be consumed by frontend components
 * 
 * @param nextStepText - AI-generated recommendation string
 * @param options - Options including currentLevel and optional fields
 * @returns NextStepRecommendation object
 */
export const createNextStepRecommendation = (
  nextStepText: string,
  options: NextStepOptions
): NextStepRecommendation => {
  // Validate nextStepText
  if (!nextStepText || typeof nextStepText !== 'string' || nextStepText.trim().length === 0) {
    throw new Error('[northStarLogic] nextStepText must be a non-empty string');
  }

  // Calculate mastery tier if not provided
  const masteryTier = options.masteryTier || getMasteryTier(options.currentLevel);

  // Build reasoning from skillGaps if provided
  const reasoning = options.skillGaps && options.skillGaps.length > 0
    ? `Based on skill gaps: ${options.skillGaps.join(', ')}`
    : undefined;

  return {
    nextStep: nextStepText.trim(),
    masteryTier,
    currentLevel: options.currentLevel,
    reasoning,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Validates that a NextStepRecommendation object has required fields
 * 
 * @param recommendation - Object to validate
 * @returns boolean - true if valid
 */
export const validateNextStepRecommendation = (
  recommendation: unknown
): recommendation is NextStepRecommendation => {
  if (!recommendation || typeof recommendation !== 'object') {
    return false;
  }

  const rec = recommendation as Partial<NextStepRecommendation>;

  return (
    typeof rec.nextStep === 'string' &&
    rec.nextStep.length > 0 &&
    typeof rec.masteryTier === 'string' &&
    ['novice', 'intermediate', 'master'].includes(rec.masteryTier) &&
    typeof rec.currentLevel === 'number' &&
    rec.currentLevel >= 1 &&
    typeof rec.generatedAt === 'string'
  );
};
