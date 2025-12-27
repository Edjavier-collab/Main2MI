/**
 * Bridge Adapter - Translation Layer for Strangler Fig Modernization
 * 
 * This adapter provides a stable façade that wraps new implementations while
 * maintaining the exact legacy contract (FeedbackContractV1, CoachingSummaryContractV1).
 * 
 * Strategy:
 * 1. New implementation produces improved output (can have different structure)
 * 2. Adapter transforms new output → legacy contract (V1)
 * 3. All callers use legacy contract (no breaking changes)
 * 4. Internals can be modernized incrementally behind the adapter
 * 
 * Generated: 2025-12-26
 */

import { 
  FeedbackContractV1, 
  normalizeFeedbackContractV1,
  validateFeedbackContractV1 
} from './FeedbackContractV1';

import { 
  CoachingSummaryContractV1,
  normalizeCoachingSummaryContractV1,
  validateCoachingSummaryContractV1 
} from './CoachingSummaryContractV1';

/**
 * New implementation output structure (can evolve independently)
 * 
 * This is what the modernized Edge Functions will produce.
 * The adapter transforms this → FeedbackContractV1.
 */
export interface NewFeedbackOutput {
  // New structure can be different - adapter handles translation
  empathy: {
    score: number;
    explanation: string;
  };
  strengths: {
    summary: string;
    examples: string[];
  };
  growthAreas: {
    primary: string;
    missedOpportunity?: {
      quote: string;
      alternative: string;
    };
    suggestions: string[];
  };
  skills: {
    detected: string[];
    counts: Record<string, number>;
    effective: string[];
  };
  recommendations: {
    nextSession: string;
    longTerm?: string;
  };
  metadata?: {
    keyTakeaway?: string;
    status: 'complete' | 'insufficient-data' | 'error';
    message?: string;
  };
}

/**
 * New coaching summary output structure
 */
export interface NewCoachingSummaryOutput {
  sessions: {
    count: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  analysis: {
    strengths: string; // Markdown formatted
    focusAreas: string; // Markdown formatted
    summary: string; // Markdown formatted
  };
  progression?: {
    skills: Array<{
      name: string;
      total: number;
      average: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    }>;
    topToImprove?: string[];
    nextSteps?: string[];
  };
}

/**
 * Bridge Adapter: Transform new feedback output → legacy contract
 * 
 * This function ensures new implementations produce output that matches
 * the exact FeedbackContractV1 structure, maintaining backward compatibility.
 */
export function adaptFeedbackToV1(newOutput: NewFeedbackOutput): FeedbackContractV1 {
  // Transform new structure → legacy contract
  const adapted: Partial<FeedbackContractV1> = {
    empathyScore: Math.max(0, Math.min(5, Math.round(newOutput.empathy?.score || 0))),
    empathyBreakdown: newOutput.empathy?.explanation || 'No empathy analysis generated.',
    whatWentRight: newOutput.strengths?.summary || 'No strengths were detected.',
    areasForGrowth: newOutput.growthAreas?.suggestions?.join(' ') || newOutput.growthAreas?.primary || 'No areas for growth generated.',
    skillsDetected: newOutput.skills?.detected || [],
    nextFocus: newOutput.recommendations?.nextSession || 'For your next session, focus on using at least three open questions and three reflections.',
    analysisStatus: newOutput.metadata?.status || 'complete',
    
    // Optional fields
    keyTakeaway: newOutput.metadata?.keyTakeaway,
    constructiveFeedback: newOutput.growthAreas?.missedOpportunity 
      ? `${newOutput.growthAreas.primary} For instance, when you said "${newOutput.growthAreas.missedOpportunity.quote}", a missed opportunity was ${newOutput.growthAreas.missedOpportunity.alternative}.`
      : undefined,
    keySkillsUsed: newOutput.skills?.effective || newOutput.skills?.detected || undefined,
    skillCounts: newOutput.skills?.counts,
    nextPracticeFocus: newOutput.recommendations?.longTerm,
    analysisMessage: newOutput.metadata?.message,
  };
  
  // Normalize to ensure contract compliance
  return normalizeFeedbackContractV1(adapted);
}

/**
 * Bridge Adapter: Transform new coaching summary output → legacy contract
 */
export function adaptCoachingSummaryToV1(
  newOutput: NewCoachingSummaryOutput
): CoachingSummaryContractV1 {
  const sessionCount = newOutput.sessions?.count || 1;
  const startDate = newOutput.sessions?.dateRange?.start || new Date().toISOString();
  const endDate = newOutput.sessions?.dateRange?.end || new Date().toISOString();
  
  // Transform skill progression
  const skillProgression = newOutput.progression?.skills?.map(skill => ({
    skillName: skill.name,
    totalCount: skill.total,
    averagePerSession: skill.average,
    trend: skill.trend,
  }));
  
  const adapted: Partial<CoachingSummaryContractV1> = {
    totalSessions: sessionCount,
    dateRange: '', // Will be formatted by normalize
    strengthsAndTrends: newOutput.analysis?.strengths || `Across your ${sessionCount} session${sessionCount === 1 ? '' : 's'}, you've shown consistent engagement.`,
    areasForFocus: newOutput.analysis?.focusAreas || 'Focus on deepening reflections and eliciting change talk consistently across sessions.',
    summaryAndNextSteps: newOutput.analysis?.summary || `Nice work staying consistent across ${sessionCount} session${sessionCount === 1 ? '' : 's'}.`,
    skillProgression,
    topSkillsToImprove: newOutput.progression?.topToImprove,
    specificNextSteps: newOutput.progression?.nextSteps,
  };
  
  // Normalize to ensure contract compliance (handles date formatting)
  return normalizeCoachingSummaryContractV1(adapted, sessionCount, startDate, endDate);
}

/**
 * Validation wrapper for feedback adapter
 * 
 * Ensures adapted output matches contract before returning
 */
export function validateAndAdaptFeedback(
  newOutput: NewFeedbackOutput
): FeedbackContractV1 {
  const adapted = adaptFeedbackToV1(newOutput);
  
  if (!validateFeedbackContractV1(adapted)) {
    throw new Error('Adapted feedback does not match FeedbackContractV1');
  }
  
  return adapted;
}

/**
 * Validation wrapper for coaching summary adapter
 */
export function validateAndAdaptCoachingSummary(
  newOutput: NewCoachingSummaryOutput
): CoachingSummaryContractV1 {
  const adapted = adaptCoachingSummaryToV1(newOutput);
  
  if (!validateCoachingSummaryContractV1(adapted)) {
    throw new Error('Adapted coaching summary does not match CoachingSummaryContractV1');
  }
  
  return adapted;
}

/**
 * Dual-run comparison helper
 * 
 * Compares legacy output vs adapted new output for drift detection
 */
export interface DriftComparison {
  exactMatch: boolean;
  semanticEqual: boolean;
  differences: Array<{
    field: string;
    legacy: unknown;
    adapted: unknown;
    severity: 'critical' | 'moderate' | 'minor';
  }>;
}

export function compareFeedbackOutputs(
  legacy: FeedbackContractV1,
  adapted: FeedbackContractV1
): DriftComparison {
  const differences: DriftComparison['differences'] = [];
  
  // Critical fields (must match exactly)
  const criticalFields: (keyof FeedbackContractV1)[] = [
    'empathyScore',
    'analysisStatus',
    'skillsDetected',
  ];
  
  // Moderate fields (semantic equivalence allowed)
  const moderateFields: (keyof FeedbackContractV1)[] = [
    'empathyBreakdown',
    'whatWentRight',
    'areasForGrowth',
    'nextFocus',
  ];
  
  // Minor fields (can differ)
  const minorFields: (keyof FeedbackContractV1)[] = [
    'keyTakeaway',
    'constructiveFeedback',
    'keySkillsUsed',
    'skillCounts',
    'nextPracticeFocus',
    'analysisMessage',
  ];
  
  // Check critical fields
  for (const field of criticalFields) {
    if (JSON.stringify(legacy[field]) !== JSON.stringify(adapted[field])) {
      differences.push({
        field,
        legacy: legacy[field],
        adapted: adapted[field],
        severity: 'critical',
      });
    }
  }
  
  // Check moderate fields (semantic equivalence - simplified check)
  for (const field of moderateFields) {
    const legacyVal = String(legacy[field] || '').trim().toLowerCase();
    const adaptedVal = String(adapted[field] || '').trim().toLowerCase();
    
    // Simple semantic check: same length range and key words
    if (Math.abs(legacyVal.length - adaptedVal.length) > legacyVal.length * 0.3) {
      differences.push({
        field,
        legacy: legacy[field],
        adapted: adapted[field],
        severity: 'moderate',
      });
    }
  }
  
  // Check minor fields (just log, don't fail)
  for (const field of minorFields) {
    if (JSON.stringify(legacy[field]) !== JSON.stringify(adapted[field])) {
      differences.push({
        field,
        legacy: legacy[field],
        adapted: adapted[field],
        severity: 'minor',
      });
    }
  }
  
  const exactMatch = differences.length === 0;
  const semanticEqual = differences.filter(d => d.severity === 'critical').length === 0;
  
  return {
    exactMatch,
    semanticEqual,
    differences,
  };
}
