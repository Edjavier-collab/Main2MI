'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { SkillScore } from '../../hooks/useReportData';
import { useXP } from '../../hooks/useXP';
import { getMasteryTier } from '../../utils/northStarLogic';

interface GlowColors {
  stroke: string;
  fill: string;
  shadow: string;
}

const COMPETENCY_ORDER: SkillScore['name'][] = [
  'Reflective Listening',
  'Open Questions',
  'Affirmations',
  'Summarizing',
  'Evoking Change Talk',
  'Rolling with Resistance',
];

// Mastery Tier Glow Colors
const PASTEL_GLOW: GlowColors = {
  stroke: 'rgba(245, 158, 11, 0.8)', // Amber (was soft pink)
  fill: 'rgba(245, 158, 11, 0.2)',
  shadow: '0 0 20px rgba(245, 158, 11, 0.4)',
};

const SEAFOAM_GLOW: GlowColors = {
  stroke: 'var(--color-primary)', // Amber primary color
  fill: 'rgba(245, 158, 11, 0.25)', // Amber with 25% opacity
  shadow: '0 0 24px rgba(245, 158, 11, 0.5)', // Amber shadow
};

const MULTI_CHROME_GLOW: GlowColors = {
  stroke: 'url(#multiChromeGradient)', // Gradient: amber → orange → red
  fill: 'rgba(245, 158, 11, 0.15)', // Amber with 15% opacity
  shadow: '0 0 28px rgba(245, 158, 11, 0.6), 0 0 16px rgba(249, 115, 22, 0.4)', // Amber + orange shadow
};

const CHAMPION_GLOW: GlowColors = {
  stroke: 'url(#championGradient)', // Enhanced gradient with more colors
  fill: 'rgba(245, 158, 11, 0.2)', // Amber with 20% opacity
  shadow: '0 0 32px rgba(245, 158, 11, 0.7), 0 0 20px rgba(249, 115, 22, 0.5), 0 0 12px rgba(239, 68, 68, 0.4)', // Amber + orange + red shadow
};

/**
 * Get mastery tier glow colors based on user level
 * Uses North Star Logic to map level to Mastery Tier
 */
const getMasteryTierColors = (currentLevel: number): GlowColors => {
  const masteryTier = getMasteryTier(currentLevel);
  
  switch (masteryTier) {
    case 'novice':
      return PASTEL_GLOW; // Levels 1-5: Curious Beginner
    case 'intermediate':
      return SEAFOAM_GLOW; // Levels 6-15: Engaged Learner
    case 'master':
      return MULTI_CHROME_GLOW; // Levels 16+: Skilled Practitioner
    default:
      return PASTEL_GLOW; // Fallback to pastel
  }
};

type ChartPoint = {
  name: SkillScore['name'];
  current: number;
  previous: number;
  recommended?: number; // For glow-path overlay
};

interface SkillRadarChartProps {
  currentSkills: SkillScore[];
  previousSkills?: SkillScore[];
  isLoading?: boolean;
}

const buildChartData = (
  currentSkills: SkillScore[],
  previousSkills?: SkillScore[]
): ChartPoint[] => {
  return COMPETENCY_ORDER.map((name) => {
    const current = currentSkills.find((skill) => skill.name === name);
    const previous = previousSkills?.find((skill) => skill.name === name);

    return {
      name,
      current: current?.score ?? 0,
      previous: previous?.score ?? current?.score ?? 0,
    };
  });
};

/**
 * Build recommended path by sorting skills from weakest to strongest
 */
const buildRecommendedPath = (currentSkills: SkillScore[]): SkillScore['name'][] => {
  if (currentSkills.length === 0) return [];
  
  // Sort by score ascending (weakest first)
  const sorted = [...currentSkills].sort((a, b) => a.score - b.score);
  
  // Return array of skill names in recommended order
  return sorted.map((skill) => skill.name);
};

/**
 * Build path data where only recommended skills have values, others are 0
 * Adds 'recommended' field to chart data for overlay visualization
 */
const buildPathData = (
  data: ChartPoint[],
  recommendedPath: SkillScore['name'][]
): ChartPoint[] => {
  return data.map((point) => ({
    ...point,
    recommended: recommendedPath.includes(point.name) ? point.current : 0,
  }));
};

const renderTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  return (
    <div
      className="rounded-lg p-3 shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-card, #ffffff)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-neutral-200)',
      }}
    >
      <div className="text-sm font-semibold mb-2">{label}</div>
      <div className="text-xs flex items-center justify-between gap-4">
        <span style={{ color: 'var(--color-primary-400)' }}>Current</span>
        <span className="font-semibold">{point.current} / 100</span>
      </div>
      <div className="text-xs flex items-center justify-between gap-4 mt-1">
        <span style={{ color: 'var(--color-primary-200)' }}>Previous</span>
        <span className="font-semibold">{point.previous} / 100</span>
      </div>
    </div>
  );
};

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  currentSkills,
  previousSkills,
  isLoading = false,
}) => {
  const { currentLevel, isLoading: xpLoading } = useXP();
  
  const data = useMemo(
    () => buildChartData(currentSkills, previousSkills),
    [currentSkills, previousSkills]
  );

  // Get glow colors based on mastery tier (from North Star Logic), default to Pastel during loading
  const glowColors = useMemo(() => {
    if (xpLoading) return PASTEL_GLOW;
    try {
      return getMasteryTierColors(currentLevel);
    } catch (error) {
      console.error('[SkillRadarChart] Error getting mastery tier colors:', error);
      return PASTEL_GLOW;
    }
  }, [currentLevel, xpLoading]);

  // Calculate recommended path
  const recommendedPath = useMemo(() => {
    if (currentSkills.length === 0) return [];
    return buildRecommendedPath(currentSkills);
  }, [currentSkills]);

  // Build path data for overlay (adds 'recommended' field to data)
  const chartDataWithPath = useMemo(() => {
    if (recommendedPath.length === 0 || currentSkills.length === 0) {
      return data;
    }
    return buildPathData(data, recommendedPath);
  }, [data, recommendedPath, currentSkills]);

  const hasScores = data.some((point) => point.current > 0 || point.previous > 0);

  if (isLoading) {
    return (
      <div className="animate-pulse h-64 rounded-xl bg-[var(--color-neutral-100)]" />
    );
  }

  if (!hasScores) {
    return (
      <div
        className="text-sm text-center py-6"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Complete a few sessions to see your skill radar.
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="MI Skill Radar Chart">
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={chartDataWithPath}>
          <defs>
            <linearGradient id="multiChromeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 1)" /> {/* Amber */}
              <stop offset="50%" stopColor="rgba(249, 115, 22, 1)" /> {/* Orange */}
              <stop offset="100%" stopColor="rgba(239, 68, 68, 1)" /> {/* Red */}
            </linearGradient>
            <linearGradient id="championGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 1)" /> {/* Amber */}
              <stop offset="33%" stopColor="rgba(249, 115, 22, 1)" /> {/* Orange */}
              <stop offset="66%" stopColor="rgba(239, 68, 68, 1)" /> {/* Red */}
              <stop offset="100%" stopColor="rgba(220, 38, 38, 1)" /> {/* Dark red accent */}
            </linearGradient>
          </defs>
          <PolarGrid stroke="var(--color-neutral-200)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            stroke="var(--color-neutral-300)"
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="var(--color-primary-400)"
            fill="var(--color-primary-400)"
            fillOpacity={0.35}
          />
          <Radar
            name="Previous"
            dataKey="previous"
            stroke="var(--color-primary-200)"
            fill="var(--color-primary-200)"
            fillOpacity={0.25}
          />
          {/* Recommended Path Overlay - only show if we have recommended skills */}
          {recommendedPath.length > 0 && currentSkills.length > 0 && (
            <Radar
              name="Recommended Path"
              dataKey="recommended"
              stroke={glowColors.stroke}
              fill={glowColors.fill}
              fillOpacity={0.3}
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
              animationDuration={300}
              style={{
                filter: `drop-shadow(${glowColors.shadow})`,
              }}
              hide={true}
              aria-label="Recommended practice path overlay"
            />
          )}
          <Tooltip content={renderTooltip} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{
              color: 'var(--color-text-secondary)',
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadarChart;
