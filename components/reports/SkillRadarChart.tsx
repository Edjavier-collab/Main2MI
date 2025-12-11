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

const COMPETENCY_ORDER: SkillScore['name'][] = [
  'Reflective Listening',
  'Open Questions',
  'Affirmations',
  'Summarizing',
  'Evoking Change Talk',
  'Rolling with Resistance',
];

type ChartPoint = {
  name: SkillScore['name'];
  current: number;
  previous: number;
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
  const data = useMemo(
    () => buildChartData(currentSkills, previousSkills),
    [currentSkills, previousSkills]
  );

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
        <RadarChart data={data}>
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
