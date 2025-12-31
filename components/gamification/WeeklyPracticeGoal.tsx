'use client';

import React, { useMemo } from 'react';
import { Session } from '../../types';

interface WeeklyPracticeGoalProps {
  /** User's practice sessions */
  sessions: Session[];
  /** Weekly goal (sessions per week) */
  weeklyGoal?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays weekly practice goal progress
 * Shows days practiced this week with visual indicators
 */
const WeeklyPracticeGoal: React.FC<WeeklyPracticeGoalProps> = ({
  sessions,
  weeklyGoal = 3,
  className = '',
}) => {
  // Get the start of the current week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Calculate weekly practice data
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Create array of 7 days with practice status
    const days = dayLabels.map((label, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);

      // Check if there's a session on this day
      const hasPractice = sessions.some(session => {
        const sessionDate = new Date(session.date);
        return (
          sessionDate.getFullYear() === dayDate.getFullYear() &&
          sessionDate.getMonth() === dayDate.getMonth() &&
          sessionDate.getDate() === dayDate.getDate()
        );
      });

      // Check if this day is today
      const isToday =
        dayDate.getFullYear() === today.getFullYear() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getDate() === today.getDate();

      // Check if this day is in the future
      const isFuture = dayDate > today;

      return {
        label,
        hasPractice,
        isToday,
        isFuture,
        date: dayDate,
      };
    });

    const daysPracticed = days.filter(d => d.hasPractice).length;
    const goalProgress = Math.min((daysPracticed / weeklyGoal) * 100, 100);
    const goalMet = daysPracticed >= weeklyGoal;

    return { days, daysPracticed, goalProgress, goalMet };
  }, [sessions, weeklyGoal]);

  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-neutral-200)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i
            className="fa-solid fa-bullseye"
            style={{ color: 'var(--color-primary)' }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Weekly Goal
          </span>
        </div>
        <span
          className="text-sm font-bold"
          style={{
            color: weeklyData.goalMet
              ? 'var(--color-success)'
              : 'var(--color-text-secondary)',
          }}
        >
          {weeklyData.daysPracticed}/{weeklyGoal} days
        </span>
      </div>

      {/* Day indicators */}
      <div className="flex justify-between gap-1 mb-3">
        {weeklyData.days.map((day, index) => (
          <div
            key={index}
            className="flex flex-col items-center flex-1"
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center mb-1
                transition-all duration-200
                ${day.isToday ? 'ring-2 ring-offset-1 ring-[var(--color-primary)]' : ''}
              `}
              style={{
                backgroundColor: day.hasPractice
                  ? 'var(--color-primary)'
                  : day.isFuture
                    ? 'var(--color-neutral-100)'
                    : 'var(--color-neutral-200)',
              }}
            >
              {day.hasPractice ? (
                <i
                  className="fa-solid fa-check text-xs text-white"
                  aria-hidden="true"
                />
              ) : day.isFuture ? (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-neutral-300)' }}
                />
              ) : (
                <i
                  className="fa-solid fa-minus text-xs"
                  style={{ color: 'var(--color-neutral-400)' }}
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{
                color: day.isToday
                  ? 'var(--color-primary)'
                  : day.hasPractice
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
              }}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-neutral-200)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${weeklyData.goalProgress}%`,
            backgroundColor: weeklyData.goalMet
              ? 'var(--color-success)'
              : 'var(--color-primary)',
          }}
          role="progressbar"
          aria-valuenow={weeklyData.goalProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Weekly goal progress: ${weeklyData.daysPracticed} of ${weeklyGoal} days`}
        />
      </div>

      {/* Motivational message */}
      <p
        className="text-xs mt-2 text-center"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {weeklyData.goalMet ? (
          <>
            <i className="fa-solid fa-star mr-1" style={{ color: 'var(--color-warning)' }} aria-hidden="true" />
            Weekly goal achieved! Keep building momentum.
          </>
        ) : weeklyData.daysPracticed === 0 ? (
          'Start your week strong - practice today!'
        ) : weeklyData.daysPracticed >= weeklyGoal - 1 ? (
          'Almost there! One more session to hit your goal.'
        ) : (
          `${weeklyGoal - weeklyData.daysPracticed} more days to reach your goal.`
        )}
      </p>
    </div>
  );
};

export default WeeklyPracticeGoal;
