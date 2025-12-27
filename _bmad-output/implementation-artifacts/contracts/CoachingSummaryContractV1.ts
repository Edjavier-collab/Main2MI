/**
 * CoachingSummaryContractV1 - Source of Truth Contract
 * 
 * This contract defines the exact JSON structure that coaching-summary Edge Function
 * MUST return. It is frozen as the "Source of Truth" before Strangler Fig modernization.
 * 
 * Generated: 2025-12-26
 * Based on: Golden fixtures in ../coaching-summary-fixture-*.json
 * 
 * IMPORTANT: This contract must NOT change during modernization. New implementations
 * must produce output that matches this exact structure.
 */

/**
 * Skill progression trend values
 */
export type SkillTrend = 'increasing' | 'stable' | 'decreasing';

/**
 * Skill progression data structure
 */
export interface SkillProgressionItem {
  skillName: string; // MI skill name
  totalCount: number; // Total uses across all sessions
  averagePerSession: number; // Average uses per session
  trend: SkillTrend; // Usage trend across sessions
}

/**
 * CoachingSummaryContractV1 - Exact contract matching legacy coaching-summary output
 * 
 * REQUIRED fields must always be present and non-empty.
 * OPTIONAL fields may be omitted but if present must match structure.
 */
export interface CoachingSummaryContractV1 {
  // REQUIRED FIELDS (must always be present)
  totalSessions: number; // Count of sessions analyzed
  dateRange: string; // "MM/DD/YYYY to MM/DD/YYYY" format
  strengthsAndTrends: string; // Markdown-formatted analysis of strengths
  areasForFocus: string; // 1-2 core themes for continued focus
  summaryAndNextSteps: string; // Encouraging summary + concrete next step
  
  // OPTIONAL FIELDS (may be omitted)
  skillProgression?: SkillProgressionItem[]; // Skill usage trends across sessions
  topSkillsToImprove?: string[]; // 1-2 skill names needing focus
  specificNextSteps?: string[]; // 2-3 actionable, measurable steps
}

/**
 * Validation function to ensure contract compliance
 */
export function validateCoachingSummaryContractV1(data: unknown): data is CoachingSummaryContractV1 {
  if (!data || typeof data !== 'object') return false;
  
  const summary = data as Partial<CoachingSummaryContractV1>;
  
  // Check required fields
  if (typeof summary.totalSessions !== 'number' || summary.totalSessions < 1) return false;
  if (typeof summary.dateRange !== 'string' || !summary.dateRange.trim()) return false;
  if (typeof summary.strengthsAndTrends !== 'string' || !summary.strengthsAndTrends.trim()) return false;
  if (typeof summary.areasForFocus !== 'string' || !summary.areasForFocus.trim()) return false;
  if (typeof summary.summaryAndNextSteps !== 'string' || !summary.summaryAndNextSteps.trim()) return false;
  
  // Validate date range format (MM/DD/YYYY to MM/DD/YYYY)
  const dateRangePattern = /^\d{2}\/\d{2}\/\d{4} to \d{2}\/\d{2}\/\d{4}$/;
  if (!dateRangePattern.test(summary.dateRange)) return false;
  
  // Validate optional skillProgression if present
  if (summary.skillProgression !== undefined) {
    if (!Array.isArray(summary.skillProgression)) return false;
    for (const item of summary.skillProgression) {
      if (!item || typeof item !== 'object') return false;
      if (typeof item.skillName !== 'string' || !item.skillName.trim()) return false;
      if (typeof item.totalCount !== 'number' || item.totalCount < 0) return false;
      if (typeof item.averagePerSession !== 'number' || item.averagePerSession < 0) return false;
      if (!['increasing', 'stable', 'decreasing'].includes(item.trend)) return false;
    }
  }
  
  // Validate optional arrays if present
  if (summary.topSkillsToImprove !== undefined && !Array.isArray(summary.topSkillsToImprove)) return false;
  if (summary.specificNextSteps !== undefined && !Array.isArray(summary.specificNextSteps)) return false;
  
  return true;
}

/**
 * Normalize function to ensure contract compliance (fills defaults, sanitizes)
 */
export function normalizeCoachingSummaryContractV1(
  data: Partial<CoachingSummaryContractV1>,
  totalSessions: number,
  firstSessionDate: string,
  lastSessionDate: string
): CoachingSummaryContractV1 {
  // Sanitize string with fallback
  const safeString = (val: unknown, fallback: string): string =>
    typeof val === 'string' && val.trim().length ? val.trim() : fallback;
  
  // Sanitize array
  const safeArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string' && v.trim().length) : [];
  
  // Sanitize skill progression
  const safeProgression = (val: unknown): SkillProgressionItem[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map(item => {
        if (!item || typeof item !== 'object') return null;
        const skillName = safeString((item as any).skillName, '');
        const totalCount = Number((item as any).totalCount);
        const averagePerSession = Number((item as any).averagePerSession);
        const trend = (item as any).trend;
        
        if (!skillName) return null;
        
        return {
          skillName,
          totalCount: Number.isFinite(totalCount) && totalCount >= 0 ? Math.round(totalCount) : 0,
          averagePerSession: Number.isFinite(averagePerSession) && averagePerSession >= 0 
            ? Math.round(averagePerSession * 10) / 10 
            : 0,
          trend: trend === 'increasing' || trend === 'decreasing' ? trend : 'stable'
        };
      })
      .filter((item): item is SkillProgressionItem => item !== null);
  };
  
  // Format date as MM/DD/YYYY
  const formatDate = (dateInput: string | number | Date): string => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return String(dateInput ?? 'Invalid date');
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  const firstDate = formatDate(firstSessionDate);
  const lastDate = formatDate(lastSessionDate);
  const dateRange = `${firstDate} to ${lastDate}`;
  
  return {
    totalSessions: Number.isFinite(totalSessions) && totalSessions >= 1 ? Math.round(totalSessions) : 1,
    dateRange: safeString(data.dateRange, dateRange),
    strengthsAndTrends: safeString(
      data.strengthsAndTrends,
      `Across your ${totalSessions} session${totalSessions === 1 ? '' : 's'}, you've shown consistent engagement and rapport-building.`
    ),
    areasForFocus: safeString(
      data.areasForFocus,
      'Focus on deepening reflections and eliciting change talk consistently across sessions.'
    ),
    summaryAndNextSteps: safeString(
      data.summaryAndNextSteps,
      `Nice work staying consistent across ${totalSessions} session${totalSessions === 1 ? '' : 's'}. For your next session, pick one MI skill to emphasize and measure it.`
    ),
    skillProgression: data.skillProgression !== undefined ? safeProgression(data.skillProgression) : undefined,
    topSkillsToImprove: data.topSkillsToImprove !== undefined ? safeArray(data.topSkillsToImprove) : undefined,
    specificNextSteps: data.specificNextSteps !== undefined ? safeArray(data.specificNextSteps) : undefined,
  };
}
