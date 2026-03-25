'use client';

import React, { useMemo } from 'react';
import { Session, StageOfChange } from '../../types';
import { User } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../ui/Button';
import { MI_SKILLS } from '../../hooks/useSkillProgression';

interface PrintableReportViewProps {
  sessions: Session[];
  user: User | null;
  onBack: () => void;
}

const generateReportId = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `MIM-${yyyy}-${mm}-${dd}-${hex}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const STAGE_LABELS: Record<StageOfChange, string> = {
  [StageOfChange.Precontemplation]: 'Not yet considering change',
  [StageOfChange.Contemplation]: 'Aware of problem, weighing options',
  [StageOfChange.Preparation]: 'Getting ready to take action',
  [StageOfChange.Action]: 'Actively modifying behavior',
  [StageOfChange.Maintenance]: 'Sustaining new behavior',
};

const PrintableReportView: React.FC<PrintableReportViewProps> = ({
  sessions,
  user,
  onBack,
}) => {
  const reportData = useMemo(() => {
    const reportId = generateReportId();
    const totalSessions = sessions.length;
    const totalMinutes = totalSessions * 15;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const practiceTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    // Aggregate skill counts
    const skillTotals: Record<string, number> = {};
    MI_SKILLS.forEach(s => { skillTotals[s] = 0; });
    let totalSkillInstances = 0;

    sessions.forEach(session => {
      const counts = session.feedback?.skillCounts;
      if (!counts) return;
      Object.entries(counts).forEach(([skill, count]) => {
        const canonical = MI_SKILLS.find(
          ms => ms.toLowerCase() === skill.toLowerCase()
        );
        if (canonical) {
          skillTotals[canonical] += count as number;
          totalSkillInstances += count as number;
        }
      });
    });

    // Sort skills by count descending
    const sortedSkills = [...MI_SKILLS].sort((a, b) => skillTotals[b] - skillTotals[a]);

    // Reflection breakdown
    let simpleReflections = 0;
    let complexReflections = 0;
    sessions.forEach(session => {
      const m = session.feedback?.behavioralMetrics;
      if (m) {
        simpleReflections += m.simpleReflections;
        complexReflections += m.complexReflections;
      }
    });

    // Unique scenarios and stages
    const uniqueScenarios = [...new Set(sessions.map(s => s.patient?.topic).filter(Boolean))];
    const uniqueStages = [...new Set(
      sessions.map(s => s.patient?.stageOfChange).filter(Boolean)
    )] as StageOfChange[];

    // Date range
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = sorted.length > 0 ? sorted[0].date : '';
    const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : '';

    return {
      reportId,
      totalSessions,
      practiceTime,
      totalSkillInstances,
      skillTotals,
      sortedSkills,
      simpleReflections,
      complexReflections,
      uniqueScenarios,
      uniqueStages,
      firstDate,
      lastDate,
    };
  }, [sessions]);

  const userName = user?.user_metadata?.full_name || 'Practitioner';
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-print text-3xl text-[#D97706]" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            No Report Data
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Complete practice sessions to generate your MI Mastery Report.
          </p>
          <Button variant="primary" onClick={onBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Ensure CSS variables used in inline styles resolve during print */
          :root {
            --color-primary: #4A90E2;
            --color-primary-dark: #357ABD;
          }
          .no-print { display: none !important; }
          .printable-report { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          @page { size: letter; margin: 0.5in; }
          .print-color { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          header.sticky, nav, .bottom-nav, [data-bottom-nav], footer.sticky { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Screen toolbar - hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            icon={<i className="fa-solid fa-arrow-left" />}
            aria-label="Go back"
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            icon={<i className="fa-solid fa-print" />}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Printable report document */}
      <div className="printable-report bg-white min-h-screen">
        <div className="max-w-3xl mx-auto">

          {/* Header - Amber gradient */}
          <div
            className="print-color rounded-b-2xl print:rounded-none px-8 py-8 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}
          >
            <div className="flex items-start justify-between">
              <div>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg print-color"
                    style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}
                  >
                    M
                  </div>
                  <span className="text-sm font-semibold tracking-wide opacity-90">MI Mastery</span>
                </div>
                <h1 className="text-2xl font-bold mb-1">MI Mastery Report</h1>
                <p className="text-sm opacity-80">Practice Development Summary</p>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-lg p-2 print-color">
                <QRCodeSVG
                  value={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.mimastery.com'}/verify/${reportData.reportId}`}
                  size={72}
                  level="L"
                />
              </div>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="px-8 py-5 border-b border-[#E5E7EB]">
            <div className="flex flex-wrap gap-x-12 gap-y-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Issued To</span>
                <p className="text-base font-bold text-[#111827]">{userName}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Practice Period</span>
                <p className="text-base font-bold text-[#111827]">
                  {formatDate(reportData.firstDate)} &ndash; {formatDate(reportData.lastDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] border-b border-[#E5E7EB]">
            <div className="px-6 py-6 text-center">
              <p className="text-3xl font-bold text-[#111827]">{reportData.totalSessions}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mt-1">Practice Sessions</p>
            </div>
            <div className="px-6 py-6 text-center">
              <p className="text-3xl font-bold text-[#111827]">{reportData.practiceTime}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mt-1">Total Practice Time</p>
            </div>
            <div className="px-6 py-6 text-center">
              <p className="text-3xl font-bold text-[#111827]">{reportData.totalSkillInstances}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mt-1">MI Skills Applied</p>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="px-8 py-6 border-b border-[#E5E7EB]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-5">
              Skills Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {reportData.sortedSkills.map(skill => (
                <div key={skill} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <i
                      className="fa-solid fa-check text-xs print-color"
                      style={{ color: '#059669' }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-[#111827]">{skill}</span>
                  </div>
                  <span className="text-sm font-bold text-[#6B7280]">
                    {reportData.skillTotals[skill]}
                  </span>
                </div>
              ))}
            </div>

            {/* Reflection Breakdown */}
            {(reportData.simpleReflections > 0 || reportData.complexReflections > 0) && (
              <div
                className="mt-5 rounded-lg px-5 py-4 print-color"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#92400E] mb-3">
                  Reflection Breakdown
                </h3>
                <div className="flex gap-8">
                  <div>
                    <span className="text-2xl font-bold text-[#111827]">{reportData.simpleReflections}</span>
                    <p className="text-xs text-[#6B7280] mt-0.5">Simple Reflections</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-[#111827]">{reportData.complexReflections}</span>
                    <p className="text-xs text-[#6B7280] mt-0.5">Complex Reflections</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-[#111827]">
                      {reportData.simpleReflections + reportData.complexReflections > 0
                        ? Math.round(
                          (reportData.complexReflections /
                            (reportData.simpleReflections + reportData.complexReflections)) *
                          100
                        )
                        : 0}%
                    </span>
                    <p className="text-xs text-[#6B7280] mt-0.5">Complex Ratio</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scenarios & Stages */}
          <div className="px-8 py-6 border-b border-[#E5E7EB]">
            <div className="grid grid-cols-2 gap-8">
              {/* Clinical Scenarios */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-4">
                  Clinical Scenarios Practiced
                </h2>
                <ul className="space-y-2">
                  {reportData.uniqueScenarios.map(scenario => (
                    <li key={scenario} className="flex items-start gap-2">
                      <i
                        className="fa-solid fa-circle text-[3px] mt-2 print-color"
                        style={{ color: '#D97706' }}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-[#111827]">{scenario}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stages of Change */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-4">
                  Stages of Change Practiced
                </h2>
                <ul className="space-y-3">
                  {reportData.uniqueStages.map(stage => (
                    <li key={stage}>
                      <p className="text-sm font-semibold text-[#111827]">{stage}</p>
                      <p className="text-xs text-[#6B7280]">{STAGE_LABELS[stage]}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-8 py-5 print-color"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <div className="flex items-center gap-4">
                <span className="font-mono font-semibold">{reportData.reportId}</span>
                <span>{(process.env.NEXT_PUBLIC_SITE_URL || 'app.mimastery.com').replace('https://', '').replace(/\/$/, '')}/verify</span>
              </div>
              <span>Generated on {generatedDate}</span>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div
            className="h-2 print-color"
            style={{ background: 'linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))' }}
          />
        </div>
      </div>
    </>
  );
};

export default PrintableReportView;
