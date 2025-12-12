import React from 'react';
import { Session, UserTier, View } from '../../types';
import { useReportData } from '../../hooks/useReportData';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import ExecutiveSummary from '../reports/ExecutiveSummary';
import SkillRadarChart from '../reports/SkillRadarChart';
import TrendAnalysis from '../reports/TrendAnalysis';
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
  // SECURITY: Use server-verified premium status for gating premium features
  // Client-side userTier is only used for optimistic UI hints
  const reportData = useReportData(sessions, isPremiumVerified);
  
  // Premium status must be server-verified to access premium data
  // Don't trust userTier alone - it can be spoofed via localStorage
  const isPremium = isPremiumVerified;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-24">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              icon={<i className="fa fa-arrow-left" />}
              aria-label="Go back"
              className="mr-3"
            />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              MI Reports
            </h1>
          </div>
        </header>

        {/* Executive Summary Card - Always visible (FREE) */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <ExecutiveSummary 
            data={reportData} 
            isLoading={reportData.isLoading} 
          />
        </Card>

        {/* Premium Skill Radar - current vs previous period */}
        {isPremium && (
          <Card variant="default" padding="lg" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Skill Radar
              </h3>
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-700)',
                }}
              >
                Current vs Previous
              </span>
            </div>
            <SkillRadarChart
              currentSkills={reportData.currentSkillScores}
              previousSkills={reportData.previousSkillScores}
              isLoading={reportData.isLoading}
            />
          </Card>
        )}

        {/* Premium Trend Analysis - score over last 30 days */}
        {isPremium && (
          <Card variant="default" padding="lg" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Progress Trend
              </h3>
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-700)',
                }}
              >
                Last 30 Days
              </span>
            </div>
            <TrendAnalysis
              sessionData={reportData.dailyScores}
              isLoading={reportData.isLoading}
            />
          </Card>
        )}

        {/* Premium Detailed Insights - per-skill breakdown with recommendations */}
        {isPremium && reportData.skillScores.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Detailed Insights
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

        {/* Premium Skill Breakdown */}
        {isPremium && reportData.skillScores.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6">
            <h3 
              className="text-sm font-bold uppercase tracking-wide mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Skill Breakdown
            </h3>
            <div className="space-y-4">
              {reportData.skillScores.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {skill.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs"
                        style={{ 
                          color: skill.trend === 'improving' 
                            ? 'var(--color-success)' 
                            : skill.trend === 'declining'
                              ? 'var(--color-error)'
                              : 'var(--color-text-muted)',
                        }}
                      >
                        {skill.trend === 'improving' ? '↑' : skill.trend === 'declining' ? '↓' : '→'}
                      </span>
                      <span 
                        className="text-sm font-bold w-8 text-right"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {skill.score}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--color-neutral-200)' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${skill.score}%`,
                        backgroundColor: skill.score >= 60 
                          ? 'var(--color-success)' 
                          : skill.score >= 30 
                            ? 'var(--color-warning)' 
                            : 'var(--color-error)',
                      }}
                    />
                  </div>
                  <p 
                    className="text-xs mt-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Used {skill.count} time{skill.count !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
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

        {/* Quick Actions */}
        {reportData.sessionCount > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate(View.Calendar)}
              className="justify-center"
            >
              <i className="fa-solid fa-calendar mr-2" aria-hidden="true" />
              View Sessions
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate(View.ScenarioSelection)}
              className="justify-center"
            >
              <i className="fa-solid fa-play mr-2" aria-hidden="true" />
              Practice Now
            </Button>
          </div>
        )}

        {/* Empty state CTA */}
        {reportData.sessionCount === 0 && (
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate(View.ScenarioSelection)}
            >
              <i className="fa-solid fa-play mr-2" aria-hidden="true" />
              Start Your First Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
