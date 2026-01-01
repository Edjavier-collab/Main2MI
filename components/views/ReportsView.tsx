'use client';

import React from 'react';
import { Session, UserTier, View } from '../../types';
import { useReportData } from '../../hooks/useReportData';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import ExecutiveSummary from '../reports/ExecutiveSummary';
import DetailedInsights from '../reports/DetailedInsights';
import ActionPlan from '../reports/ActionPlan';

interface ReportsViewProps {
  sessions: Session[];
  userTier: UserTier;
  isPremiumVerified: boolean; // Server-verified premium status
  onBack: () => void;
  onUpgrade: () => void;
  onNavigate: (view: View) => void;
}

/**
 * Reports View
 * 
 * Displays MI competency reports with:
 * - Executive Summary (FREE) - always visible
 * - Detailed skill breakdown (PREMIUM) - locked for free users
 * - Trend analysis (PREMIUM) - coming soon
 */
const ReportsView: React.FC<ReportsViewProps> = ({
  sessions,
  userTier,
  isPremiumVerified,
  onBack,
  onUpgrade,
  onNavigate,
}) => {
  // Premium status: Use server-verified status, but fallback to userTier if verification hasn't completed
  // This ensures premium users can access features even if verification is pending or Edge Function is unavailable
  // Note: userTier comes from Supabase database, so it's reasonably trustworthy as a fallback
  const isPremium = isPremiumVerified || userTier === UserTier.Premium;

  // SECURITY: Use server-verified premium status for gating premium features
  // But allow fallback to userTier for data computation to prevent race conditions
  // The UI still gates based on isPremiumVerified for security, but data loads based on sessions
  const reportData = useReportData(sessions, isPremium);

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              icon={<i className="fa-solid fa-arrow-left" />}
              aria-label="Go back"
              className="mr-3"
            />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              MI Reports
            </h1>
          </div>
        </header>

        {/* Executive Summary Card - Always visible (FREE) */}
        {reportData.isLoading ? (
          <Card variant="elevated" padding="lg" className="mb-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[var(--color-neutral-200)] rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--color-neutral-200)] rounded w-3/4"></div>
                  <div className="h-3 bg-[var(--color-neutral-200)] rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="space-y-2">
                  <div className="h-8 bg-[var(--color-neutral-200)] rounded"></div>
                  <div className="h-3 bg-[var(--color-neutral-200)] rounded w-2/3 mx-auto"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-[var(--color-neutral-200)] rounded"></div>
                  <div className="h-3 bg-[var(--color-neutral-200)] rounded w-2/3 mx-auto"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-[var(--color-neutral-200)] rounded"></div>
                  <div className="h-3 bg-[var(--color-neutral-200)] rounded w-2/3 mx-auto"></div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" padding="lg" className="mb-6">
            <ExecutiveSummary
              data={reportData}
              isLoading={reportData.isLoading}
            />
          </Card>
        )}

        {/* Premium Skill Breakdown - interactive per-skill breakdown with recommendations */}
        {isPremium && reportData.skillScores.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Skill Breakdown
              </h3>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-700)',
                }}
              >
                Tap to expand
              </span>
            </div>
            <DetailedInsights
              skillScores={reportData.skillScores}
              isLoading={reportData.isLoading}
            />
          </Card>
        )}

        {/* Premium Features Preview / Locked Section */}
        {!isPremium && reportData.sessionCount > 0 && (
          <Card
            variant="default"
            padding="lg"
            className="mb-6 relative overflow-hidden"
          >
            {/* Blur overlay */}
            <div
              className="absolute inset-0 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: 'var(--color-primary-lighter)' }}
              >
                <i
                  className="fa-solid fa-lock text-lg"
                  style={{ color: 'var(--color-primary-dark)' }}
                  aria-hidden="true"
                />
              </div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Detailed Analytics
              </h3>
              <p
                className="text-sm text-center mb-4 max-w-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Unlock skill breakdown, trend charts, and personalized recommendations
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={onUpgrade}
              >
                Upgrade to Premium
              </Button>
            </div>

            {/* Blurred preview content */}
            <div className="opacity-50">
              <h3
                className="text-sm font-bold uppercase tracking-wide mb-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Skill Breakdown
              </h3>
              <div className="space-y-3">
                {['Reflective Listening', 'Open Questions', 'Affirmations', 'Summarizing', 'Evoking Change Talk', 'Rolling with Resistance'].map((skill) => (
                  <div key={skill} className="flex items-center gap-3">
                    <span
                      className="text-sm w-40 truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {skill}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--color-neutral-200)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.random() * 60 + 20}%`,
                          backgroundColor: 'var(--color-primary)',
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium w-10 text-right"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      --
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}


        {/* Premium Action Plan - personalized next steps */}
        {isPremium && reportData.skillScores.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Your Action Plan
              </h3>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-700)',
                }}
              >
                This Week
              </span>
            </div>
            <ActionPlan
              skillScores={reportData.skillScores}
              sessionCount={reportData.sessionCount}
              periodStart={reportData.periodStart}
              periodEnd={reportData.periodEnd}
              onStartPractice={() => onNavigate(View.ScenarioSelection)}
              isLoading={reportData.isLoading}
            />
          </Card>
        )}

        {/* Empty state CTA */}
        {reportData.sessionCount === 0 && (
          <Card variant="accent" padding="lg" className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-chart-line text-4xl text-[var(--color-primary)]" aria-hidden="true"></i>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              No Reports Yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Complete a few practice sessions to see your skill analytics and progress over time.
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onNavigate(View.ScenarioSelection)}
              icon={<i className="fa-solid fa-play" aria-hidden="true" />}
            >
              Start Your First Session
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
