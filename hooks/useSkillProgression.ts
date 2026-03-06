import { useMemo } from 'react';
import { Session, BehavioralMetrics } from '../types';

export const MI_SKILLS = [
  'Open Questions',
  'Affirmations',
  'Reflections',
  'Summaries',
  'Developing Discrepancy',
  'Eliciting Change Talk',
  'Rolling with Resistance',
  'Supporting Self-Efficacy',
] as const;

export type MISkill = (typeof MI_SKILLS)[number];

export interface SkillTrendPoint {
  sessionIndex: number;
  date: string;
  counts: Record<string, number>;
}

export interface ScoreTrendPoint {
  date: string;
  score: number;
  label: string;
}

export interface UseSkillProgressionReturn {
  skillTotals: Record<string, number>;
  skillTrend: SkillTrendPoint[];
  mostUsedSkill: string | null;
  leastUsedSkill: string | null;
  avgCompositeScore: number;
  scoreTrend: ScoreTrendPoint[];
}

// Compute composite MI score (0-100) from behavioral metrics
const computeCompositeScore = (m: BehavioralMetrics): number => {
  const ratioScore = Math.min(m.reflectionToQuestionRatio / 2.0, 1.0) * 100;
  const totalR = m.simpleReflections + m.complexReflections;
  const complexScore = totalR > 0 ? Math.min((m.complexReflections / totalR) / 0.5, 1.0) * 100 : 0;
  const totalMI = m.miAdherentStatements + m.miInconsistentStatements;
  const adherentScore = totalMI > 0 ? (m.miAdherentStatements / totalMI) * 100 : 100;
  const totalQ = m.openQuestions + m.closedQuestions;
  const openScore = totalQ > 0 ? Math.min((m.openQuestions / totalQ) / 0.7, 1.0) * 100 : 0;
  return Math.round(ratioScore * 0.4 + complexScore * 0.25 + adherentScore * 0.25 + openScore * 0.1);
};

// Get session score, preferring behavioral metrics, falling back to empathyScore
const getSessionScore = (session: Session): number | null => {
  if (session.feedback?.behavioralMetrics) {
    return computeCompositeScore(session.feedback.behavioralMetrics);
  }
  if (session.feedback?.empathyScore && session.feedback.empathyScore > 0) {
    return Math.round(session.feedback.empathyScore * 20);
  }
  return null;
};

export const useSkillProgression = (sessions: Session[]): UseSkillProgressionReturn => {
  return useMemo(() => {
    // Initialize all 8 skills to 0
    const skillTotals: Record<string, number> = Object.fromEntries(
      MI_SKILLS.map(s => [s, 0])
    );

    // Accumulate skillCounts across all sessions
    sessions.forEach(session => {
      const counts = session.feedback?.skillCounts;
      if (!counts) return;
      Object.entries(counts).forEach(([skill, count]) => {
        const canonical = MI_SKILLS.find(
          ms => ms.toLowerCase() === skill.toLowerCase()
        );
        if (canonical) {
          skillTotals[canonical] += count as number;
        }
      });
    });

    // Most/least used skill
    const sorted = [...MI_SKILLS].sort((a, b) => skillTotals[b] - skillTotals[a]);
    const mostUsedSkill = skillTotals[sorted[0]] > 0 ? sorted[0] : null;
    const leastUsedSkill = sessions.length > 0 ? sorted[sorted.length - 1] : null;

    // Skill trend: last 5 sessions chronologically
    const chronological = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last5 = chronological.slice(-5);
    const skillTrend: SkillTrendPoint[] = last5.map((session, index) => ({
      sessionIndex: index,
      date: session.date,
      counts: Object.fromEntries(
        MI_SKILLS.map(skill => [skill, session.feedback?.skillCounts?.[skill] ?? 0])
      ),
    }));

    // Average composite score from behavioral metrics (with legacy fallback)
    const withScore = sessions.filter(s => getSessionScore(s) !== null);
    const avgCompositeScore =
      withScore.length > 0
        ? withScore.reduce((sum, s) => sum + (getSessionScore(s) ?? 0), 0) / withScore.length
        : 0;

    // Score trend: last 10 sessions with scores, chronological
    const withScoreChronological = [...withScore].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last10 = withScoreChronological.slice(-10);
    const scoreTrend: ScoreTrendPoint[] = last10.map(session => ({
      date: session.date,
      score: getSessionScore(session) ?? 0,
      label: new Date(session.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    }));

    return {
      skillTotals,
      skillTrend,
      mostUsedSkill,
      leastUsedSkill,
      avgCompositeScore,
      scoreTrend,
    };
  }, [sessions]);
};
