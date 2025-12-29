import React from 'react';
import { CheckCircle } from 'lucide-react';
import { PillButton } from '../ui/PillButton';

interface HomeViewProps {
  onStartPractice: () => void;
  onLogin?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartPractice,
  onLogin,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-main)] dark:bg-slate-950 relative overflow-hidden items-center w-full">
      <div className="w-full max-w-[500px] flex flex-col flex-1 pb-[120px]">
        {/* Header with Logo */}
        <header className="px-6 py-4 flex justify-center items-center w-full">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-[var(--color-primary)]">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" />
                <path d="M10 16.5L14 20.5L22 12.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-lg text-[var(--color-text-primary)] dark:text-white tracking-tight">
              MI Practice
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="w-[calc(100%-48px)] h-[300px] mx-auto mb-6 rounded-[24px] bg-[radial-gradient(120%_120%_at_50%_10%,#D1F2FF_0%,#F8F9FA_50%,#FFFFFF_100%)] dark:bg-[radial-gradient(120%_120%_at_50%_10%,#1e293b_0%,#0f172a_50%,#020617_100%)] flex flex-col items-center justify-center text-center p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] relative overflow-hidden">
          {/* Animated Mesh Gradient Overlay */}
          <div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-mesh-drift z-0 pointer-events-none filter blur-[40px] sm:blur-[60px]"
            style={{
              background: `
                 radial-gradient(circle at 50% 50%, rgba(74, 144, 226, 0.15) 0%, rgba(248, 249, 250, 0) 50%),
                 radial-gradient(circle at 80% 20%, rgba(209, 242, 255, 0.6) 0%, rgba(255, 255, 255, 0) 40%)
               `
            }}
          />

          <h1 className="font-semibold text-[32px] leading-[1.2] text-[var(--color-text-primary)] dark:text-white mb-0 tracking-tight relative z-10">
            Empathy in <span className="text-[var(--color-primary)]">Practice</span>
          </h1>
        </div>

        {/* Main Copy Below Hero */}
        <div className="px-6 flex flex-col items-center text-center">
          <p className="text-base leading-1.5 text-[var(--color-text-secondary)] dark:text-slate-400 max-w-[320px]">
            Refine your Motivational Interviewing skills with realistic AI patient simulations.
            Receive instant, structured feedback designed for healthcare professionals.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md z-50 border-t border-black/5 dark:border-white/10 flex flex-col items-center">
        <div className="w-full max-w-[452px] flex flex-col gap-4">
          <PillButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onStartPractice}
          >
            Start Practicing
          </PillButton>
          <PillButton
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onLogin}
            className="border border-[#E1E4E8] dark:border-slate-700"
          >
            I already have an account
          </PillButton>

          {/* Footer in Sticky Area */}
          <footer className="w-full flex items-center justify-center gap-2 mt-2">
            <CheckCircle size={16} className="text-[var(--color-primary)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888] dark:text-slate-500">
              DESIGNED FOR CLINICIANS
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
