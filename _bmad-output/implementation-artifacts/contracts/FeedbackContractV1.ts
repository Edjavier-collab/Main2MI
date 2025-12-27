/**
 * FeedbackContractV1 - Source of Truth Contract
 * 
 * This contract defines the exact JSON structure that analyze-session Edge Function
 * MUST return. It is frozen as the "Source of Truth" before Strangler Fig modernization.
 * 
 * Generated: 2025-12-26
 * Based on: Golden fixtures in ../analyze-session-fixture-*.json
 * 
 * IMPORTANT: This contract must NOT change during modernization. New implementations
 * must produce output that matches this exact structure.
 */

/**
 * Valid MI skill names (enum from golden fixtures)
 */
export const VALID_MI_SKILLS = [
  'Open Questions',
  'Affirmations',
  'Reflections',
  'Summaries',
  'Developing Discrepancy',
  'Eliciting Change Talk',
  'Rolling with Resistance',
  'Supporting Self-Efficacy'
] as const;

export type MISkill = typeof VALID_MI_SKILLS[number];

/**
 * Analysis status values
 */
export type AnalysisStatus = 'complete' | 'insufficient-data' | 'error';

/**
 * FeedbackContractV1 - Exact contract matching legacy analyze-session output
 * 
 * REQUIRED fields must always be present and non-empty.
 * OPTIONAL fields may be omitted but if present must match structure.
 */
export interface FeedbackContractV1 {
  // REQUIRED FIELDS (must always be present)
  empathyScore: number; // Integer 1-5 (or 0 for insufficient-data)
  empathyBreakdown: string; // Explanation of empathy score, 2-3 sentences
  whatWentRight: string; // What clinician did well, 2-3 sentences with quotes
  areasForGrowth: string; // Specific suggestions for growth, 2-3 sentences
  skillsDetected: MISkill[]; // Array of ALL MI skills detected (may be empty)
  nextFocus: string; // Concise recommendation, 1-2 sentences
  analysisStatus: AnalysisStatus; // Status of analysis
  
  // OPTIONAL FIELDS (may be omitted)
  keyTakeaway?: string; // Single sentence takeaway (max 20 words)
  constructiveFeedback?: string; // Key area + missed opportunity (backward compat)
  keySkillsUsed?: MISkill[]; // Skills used effectively (backward compat)
  skillCounts?: Record<string, number>; // Count per skill, e.g., {"Reflections": 4}
  nextPracticeFocus?: string; // Actionable goal for next session (backward compat)
  analysisMessage?: string; // Status message (usually empty for 'complete')
}

/**
 * Validation function to ensure contract compliance
 */
export function validateFeedbackContractV1(data: unknown): data is FeedbackContractV1 {
  if (!data || typeof data !== 'object') return false;
  
  const feedback = data as Partial<FeedbackContractV1>;
  
  // Check required fields
  if (typeof feedback.empathyScore !== 'number') return false;
  if (feedback.empathyScore < 0 || feedback.empathyScore > 5) return false;
  if (typeof feedback.empathyBreakdown !== 'string' || !feedback.empathyBreakdown.trim()) return false;
  if (typeof feedback.whatWentRight !== 'string' || !feedback.whatWentRight.trim()) return false;
  if (typeof feedback.areasForGrowth !== 'string' || !feedback.areasForGrowth.trim()) return false;
  if (!Array.isArray(feedback.skillsDetected)) return false;
  if (typeof feedback.nextFocus !== 'string' || !feedback.nextFocus.trim()) return false;
  if (!feedback.analysisStatus || !['complete', 'insufficient-data', 'error'].includes(feedback.analysisStatus)) return false;
  
  // Validate skillsDetected contains only valid MI skills
  if (feedback.skillsDetected.some(skill => !VALID_MI_SKILLS.includes(skill as MISkill))) return false;
  
  // Validate optional fields if present
  if (feedback.keySkillsUsed && !Array.isArray(feedback.keySkillsUsed)) return false;
  if (feedback.keySkillsUsed && feedback.keySkillsUsed.some(skill => !VALID_MI_SKILLS.includes(skill as MISkill))) return false;
  if (feedback.skillCounts && typeof feedback.skillCounts !== 'object') return false;
  
  return true;
}

/**
 * Normalize function to ensure contract compliance (fills defaults, sanitizes)
 */
export function normalizeFeedbackContractV1(data: Partial<FeedbackContractV1>): FeedbackContractV1 {
  // Sanitize skills arrays
  const sanitizeSkills = (skills: unknown): MISkill[] => {
    if (!Array.isArray(skills)) return [];
    return skills.filter((s): s is MISkill => 
      typeof s === 'string' && VALID_MI_SKILLS.includes(s as MISkill)
    );
  };
  
  // Sanitize string with fallback
  const sanitizeString = (value: unknown, fallback: string): string => {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  };
  
  // Coerce empathy score to valid range
  const empathyScoreRaw = Number(data.empathyScore);
  const empathyScore = Number.isFinite(empathyScoreRaw)
    ? Math.max(0, Math.min(5, Math.round(empathyScoreRaw)))
    : 0;
  
  // Coerce skill counts
  const skillCounts: Record<string, number> = {};
  if (data.skillCounts && typeof data.skillCounts === 'object') {
    for (const [skill, count] of Object.entries(data.skillCounts)) {
      if (VALID_MI_SKILLS.includes(skill as MISkill)) {
        const numCount = Number(count);
        if (Number.isFinite(numCount) && numCount >= 0) {
          skillCounts[skill] = Math.round(numCount);
        }
      }
    }
  }
  
  const skillsDetected = sanitizeSkills(data.skillsDetected);
  const keySkillsUsed = sanitizeSkills(data.keySkillsUsed);
  
  return {
    empathyScore,
    empathyBreakdown: sanitizeString(data.empathyBreakdown, 'No empathy analysis generated.'),
    whatWentRight: sanitizeString(data.whatWentRight, 'No strengths were detected.'),
    areasForGrowth: sanitizeString(
      data.areasForGrowth || data.constructiveFeedback,
      'No areas for growth generated.'
    ),
    skillsDetected,
    nextFocus: sanitizeString(
      data.nextFocus || data.nextPracticeFocus,
      'For your next session, focus on using at least three open questions and three reflections.'
    ),
    analysisStatus: data.analysisStatus || 'complete',
    
    // Optional fields
    keyTakeaway: data.keyTakeaway ? sanitizeString(data.keyTakeaway, '') : undefined,
    constructiveFeedback: data.constructiveFeedback ? sanitizeString(data.constructiveFeedback, '') : undefined,
    keySkillsUsed: keySkillsUsed.length ? keySkillsUsed : (skillsDetected.length ? skillsDetected : undefined),
    skillCounts: Object.keys(skillCounts).length > 0 ? skillCounts : undefined,
    nextPracticeFocus: data.nextPracticeFocus ? sanitizeString(data.nextPracticeFocus, '') : undefined,
    analysisMessage: data.analysisMessage ? sanitizeString(data.analysisMessage, '') : undefined,
  };
}
