import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

export interface SessionDataPoint {
  date: string; // ISO date string
  score: number; // 0-100
  sessionCount: number; // sessions on this day
}

interface TrendAnalysisProps {
  sessionData: SessionDataPoint[];
  isLoading?: boolean;
}

/**
 * Format date for X-axis tick (e.g., "Dec 5")
 */
const formatDateTick = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format date for tooltip (e.g., "December 5, 2024")
 */
const formatDateFull = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Custom tooltip for the line chart
 */
const renderTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as SessionDataPoint | undefined;
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
      <div className="text-sm font-semibold mb-2">{formatDateFull(point.date)}</div>
      <div className="text-xs flex items-center justify-between gap-4">
        <span style={{ color: 'var(--color-primary-400)' }}>Score</span>
        <span className="font-semibold">{point.score} / 100</span>
      </div>
      <div className="text-xs flex items-center justify-between gap-4 mt-1">
        <span style={{ color: 'var(--color-text-muted)' }}>Sessions</span>
        <span className="font-semibold">{point.sessionCount}</span>
      </div>
    </div>
  );
};

/**
 * Custom dot renderer - only show dots where user practiced
 */
const renderDot = (props: {
  cx?: number;
  cy?: number;
  payload?: SessionDataPoint;
  index?: number;
}) => {
  const { cx, cy, payload, index } = props;
  if (!payload || payload.sessionCount === 0 || cx === undefined || cy === undefined) {
    return <g key={`empty-${index}`} />;
  }

  return (
    <circle
      key={`dot-${payload.date}`}
      cx={cx}
      cy={cy}
      r={6}
      fill="var(--color-primary-400)"
      stroke="var(--color-bg-card, #ffffff)"
      strokeWidth={2}
    />
  );
};

/**
 * TrendAnalysis Component
 *
 * Line chart showing overall MI competency score over the last 30 days.
 * Session dots appear where the user practiced.
 * Premium only.
 */
const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  sessionData,
  isLoading = false,
}) => {
  // Ensure data is sorted by date and limit to last 30 days
  const chartData = useMemo(() => {
    if (!sessionData || sessionData.length === 0) return [];

    const sorted = [...sessionData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return sorted.filter((point) => new Date(point.date) >= thirtyDaysAgo);
  }, [sessionData]);

  const hasData = chartData.length > 0;

  // Calculate average score for reference line
  const averageScore = useMemo(() => {
    if (!hasData) return 0;
    const sum = chartData.reduce((acc, point) => acc + point.score, 0);
    return Math.round(sum / chartData.length);
  }, [chartData, hasData]);

  if (isLoading) {
    return (
      <div className="animate-pulse h-64 rounded-xl bg-[var(--color-neutral-100)]" />
    );
  }

  if (!hasData) {
    return (
      <div
        className="text-sm text-center py-6"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Complete sessions to see your progress over time.
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="MI Score Trend Chart">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-neutral-200)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--color-neutral-300)' }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--color-neutral-300)' }}
            tickLine={false}
            width={35}
          />
          <Tooltip content={renderTooltip} />
          <ReferenceLine
            y={averageScore}
            stroke="var(--color-primary-200)"
            strokeDasharray="5 5"
            label={{
              value: `Avg: ${averageScore}`,
              position: 'right',
              fill: 'var(--color-text-muted)',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-primary-400)"
            strokeWidth={3}
            dot={renderDot}
            activeDot={{
              r: 8,
              fill: 'var(--color-primary-400)',
              stroke: 'var(--color-bg-card, #ffffff)',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--color-primary-400)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Score
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0 border-t-2 border-dashed"
            style={{ borderColor: 'var(--color-primary-200)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Average
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
