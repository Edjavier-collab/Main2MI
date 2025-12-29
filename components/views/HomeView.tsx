import React from 'react';
import { CheckCircle } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import './HomeView.css';

interface HomeViewProps {
  onStartPractice: () => void;
  onLogin?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartPractice,
  onLogin,
}) => {
  return (
    <div className="home-container">
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
        <div className="hero-mesh">
          {/* Animated Mesh Gradient Overlay */}
          <div className="hero-mesh__gradient-overlay" />

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
      <div className="bottom-actions">
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
