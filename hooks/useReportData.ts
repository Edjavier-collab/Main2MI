import { useMemo } from 'react';
import { Session } from '../types';

/**
 * The 6 core MI competencies we track
 * Maps from various names in session data to standardized names
 */
const MI_COMPETENCIES = {
  'Reflective Listening': ['Reflections', 'Reflective Listening'],
  'Open Questions': ['Open Questions'],
  'Affirmations': ['Affirmations'],
  'Summarizing': ['Summaries', 'Summarizing'],
  'Evoking Change Talk': ['Eliciting Change Talk', 'Evoking Change Talk', 'Developing Discrepancy'],
  'Rolling with Resistance': ['Rolling with Resistance', 'Supporting Self-Efficacy'],
} as const;

type CompetencyName = keyof typeof MI_COMPETENCIES;

export interface SkillScore {
  name: CompetencyName;
  score: number; // 0-100
  count: number; // Total times used
  trend: 'improving' | 'stable' | 'declining';
}

export interface DailyScorePoint {
  date: string; // ISO date string (YYYY-MM-DD)
  score: number; // 0-100
  sessionCount: number; // number of sessions on this day
}

export interface ReportData {
  overallScore: number; // 0-100
  previousScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  skillScores: SkillScore[];
  currentSkillScores: SkillScore[];
  previousSkillScores: SkillScore[];
  dailyScores: DailyScorePoint[]; // For trend chart
  sessionCount: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  topStrength: SkillScore | null;
  areaToImprove: SkillScore | null;
  performanceSummary: string;
}

export interface UseReportDataReturn extends ReportData {
  isLoading: boolean;
  error: string | null;
}

/**
 * Map skill names from session data to our standardized competency names
 */
const mapToCompetency = (skillName: string): CompetencyName | null => {
  for (const [competency, aliases] of Object.entries(MI_COMPETENCIES)) {
    if (aliases.some(alias => alias.toLowerCase() === skillName.toLowerCase())) {
      return competency as CompetencyName;
    }
  }
  return null;
};

/**
 * Convert empathy score (1-5) to percentage (0-100)
 */
const empathyToPercent = (score: number): number => {
  return Math.round(((score - 1) / 4) * 100);
};

/**
 * Calculate skill scores from sessions
 */
const calculateSkillScores = (
  sessions: Session[],
  recentSessions: Session[],
  olderSessions: Session[]
): SkillScore[] => {
  // Initialize counts for all competencies
  const competencyCounts: Record<CompetencyName, { total: number; recent: number; older: number }> = {
    'Reflective Listening': { total: 0, recent: 0, older: 0 },
    'Open Questions': { total: 0, recent: 0, older: 0 },
    'Affirmations': { total: 0, recent: 0, older: 0 },
    'Summarizing': { total: 0, recent: 0, older: 0 },
    'Evoking Change Talk': { total: 0, recent: 0, older: 0 },
    'Rolling with Resistance': { total: 0, recent: 0, older: 0 },
  };

  // Count skills from all sessions
  const countSkillsFromSessions = (
    sessionsToCount: Session[],
    target: 'total' | 'recent' | 'older'
  ) => {
    for (const session of sessionsToCount) {
      const skillCounts = session.feedback?.skillCounts || {};
      
      for (const [skill, count] of Object.entries(skillCounts)) {
        const competency = mapToCompetency(skill);
        if (competency && typeof count === 'number') {
          competencyCounts[competency][target] += count;
        }
      }
    }
  };

  countSkillsFromSessions(sessions, 'total');
  countSkillsFromSessions(recentSessions, 'recent');
  countSkillsFromSessions(olderSessions, 'older');

  // Calculate scores and trends
  const maxCount = Math.max(
    1,
    ...Object.values(competencyCounts).map(c => c.total)
  );

  return Object.entries(competencyCounts).map(([name, counts]) => {
    // Score based on relative usage (0-100)
    const score = Math.round((counts.total / maxCount) * 100);
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (olderSessions.length > 0 && recentSessions.length > 0) {
      const recentAvg = counts.recent / recentSessions.length;
      const olderAvg = counts.older / olderSessions.length;
      const diff = recentAvg - olderAvg;
      
      if (diff > 0.5) trend = 'improving';
      else if (diff < -0.5) trend = 'declining';
    }

    return {
      name: name as CompetencyName,
      score,
      count: counts.total,
      trend,
    };
  });
};

/**
 * Generate a performance summary sentence based on score and trend
 */
/**
 * Calculate daily score data points for trend chart
 * Groups sessions by date, averages empathy scores per day
 */
const calculateDailyScores = (sessions: Session[]): DailyScorePoint[] => {
  if (!sessions || sessions.length === 0) return [];

  // Group sessions by date (YYYY-MM-DD)
  const byDate: Record<string, { scores: number[]; count: number }> = {};

  for (const session of sessions) {
    const dateKey = new Date(session.date).toISOString().split('T')[0];
    const empathyScore = session.feedback?.empathyScore;

    if (!byDate[dateKey]) {
      byDate[dateKey] = { scores: [], count: 0 };
    }

    byDate[dateKey].count += 1;

    if (typeof empathyScore === 'number' && empathyScore > 0) {
      byDate[dateKey].scores.push(empathyToPercent(empathyScore));
    }
  }

  // Convert to array of data points
  return Object.entries(byDate)
    .map(([date, data]) => ({
      date,
      score:
        data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
      sessionCount: data.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const generatePerformanceSummary = (
  overallScore: number,
  trend: 'improving' | 'stable' | 'declining',
  sessionCount: number,
  topStrength: SkillScore | null
): string => {
  if (sessionCount === 0) {
    return 'Complete your first practice session to see your MI competency report.';
  }

  if (sessionCount === 1) {
    return `You've completed your first session! Keep practicing to build your MI skills.`;
  }

  let scoreDescription: string;
  if (overallScore >= 80) scoreDescription = 'excellent';
  else if (overallScore >= 60) scoreDescription = 'strong';
  else if (overallScore >= 40) scoreDescription = 'developing';
  else scoreDescription = 'emerging';

  let trendPhrase: string;
  if (trend === 'improving') trendPhrase = 'and showing consistent improvement';
  else if (trend === 'declining') trendPhrase = 'with room to regain momentum';
  else trendPhrase = 'with steady consistency';

  const strengthPhrase = topStrength 
    ? `, particularly in ${topStrength.name.toLowerCase()}`
    : '';

  return `Your MI competency is ${scoreDescription}${strengthPhrase}, ${trendPhrase}.`;
};

/**
 * Hook to calculate report data from user sessions
 * Provides overall score, trends, skill breakdown, and insights
 */
export const useReportData = (sessions: Session[]): UseReportDataReturn => {
  const reportData = useMemo<ReportData>(() => {
    // Handle empty sessions
    if (!sessions || sessions.length === 0) {
      return {
        overallScore: 0,
        previousScore: 0,
        trend: 'stable',
        skillScores: [],
        currentSkillScores: [],
        previousSkillScores: [],
        dailyScores: [],
        sessionCount: 0,
        periodStart: null,
        periodEnd: null,
        topStrength: null,
        areaToImprove: null,
        performanceSummary: 'Complete your first practice session to see your MI competency report.',
      };
    }

    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate period dates
    const periodEnd = new Date(sortedSessions[0].date);
    const periodStart = new Date(sortedSessions[sortedSessions.length - 1].date);

    // Split sessions into recent (last 50%) and older (first 50%) for trend calculation
    const midpoint = Math.ceil(sortedSessions.length / 2);
    const recentSessions = sortedSessions.slice(0, midpoint);
    const olderSessions = sortedSessions.slice(midpoint);

    // Calculate overall score from empathy scores
    const validScores = sortedSessions
      .map(s => s.feedback?.empathyScore)
      .filter((score): score is number => typeof score === 'number' && score > 0);

    const overallScore = validScores.length > 0
      ? Math.round(
          validScores.reduce((sum, score) => sum + empathyToPercent(score), 0) / validScores.length
        )
      : 0;

    // Calculate previous score (from older half)
    const olderScores = olderSessions
      .map(s => s.feedback?.empathyScore)
      .filter((score): score is number => typeof score === 'number' && score > 0);

    const previousScore = olderScores.length > 0
      ? Math.round(
          olderScores.reduce((sum, score) => sum + empathyToPercent(score), 0) / olderScores.length
        )
      : overallScore;

    // Determine overall trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    const scoreDiff = overallScore - previousScore;
    if (scoreDiff >= 5) trend = 'improving';
    else if (scoreDiff <= -5) trend = 'declining';

    // Calculate skill scores
    const skillScores = calculateSkillScores(sortedSessions, recentSessions, olderSessions);
    const currentSkillScores = calculateSkillScores(recentSessions, recentSessions, []);
    const previousSkillScores = calculateSkillScores(olderSessions, olderSessions, []);

    // Calculate daily scores for trend chart
    const dailyScores = calculateDailyScores(sortedSessions);

    // Find top strength (highest score) and area to improve (lowest score with usage)
    const sortedSkills = [...skillScores].sort((a, b) => b.score - a.score);
    const topStrength = sortedSkills.length > 0 ? sortedSkills[0] : null;
    
    // Area to improve: lowest score among skills that have been used at least once
    const usedSkills = sortedSkills.filter(s => s.count > 0);
    const areaToImprove = usedSkills.length > 0 
      ? usedSkills[usedSkills.length - 1] 
      : sortedSkills.length > 0 
        ? sortedSkills[sortedSkills.length - 1]
        : null;

    // Generate summary
    const performanceSummary = generatePerformanceSummary(
      overallScore,
      trend,
      sortedSessions.length,
      topStrength
    );

    return {
      overallScore,
      previousScore,
      trend,
      skillScores,
      currentSkillScores,
      previousSkillScores,
      dailyScores,
      sessionCount: sortedSessions.length,
      periodStart,
      periodEnd,
      topStrength,
      areaToImprove,
      performanceSummary,
    };
  }, [sessions]);

  return {
    ...reportData,
    isLoading: false,
    error: null,
  };
};
