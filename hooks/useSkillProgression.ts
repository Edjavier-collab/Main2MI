import { useMemo } from 'react';
import { Session } from '../types';

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

export interface EmpathyTrendPoint {
  date: string;
  score: number;
  label: string;
}

export interface UseSkillProgressionReturn {
  skillTotals: Record<string, number>;
  skillTrend: SkillTrendPoint[];
  mostUsedSkill: string | null;
  leastUsedSkill: string | null;
  avgEmpathyScore: number;
  empathyTrend: EmpathyTrendPoint[];
}

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

    // Average empathy score
    const withScore = sessions.filter(
      s => s.feedback?.empathyScore !== undefined && s.feedback.empathyScore > 0
    );
    const avgEmpathyScore =
      withScore.length > 0
        ? withScore.reduce((sum, s) => sum + s.feedback.empathyScore, 0) / withScore.length
        : 0;

    // Empathy trend: last 10 sessions with scores, chronological
    const withScoreChronological = [...withScore].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last10 = withScoreChronological.slice(-10);
    const empathyTrend: EmpathyTrendPoint[] = last10.map(session => ({
      date: session.date,
      score: session.feedback.empathyScore,
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
      avgEmpathyScore,
      empathyTrend,
    };
  }, [sessions]);
};
