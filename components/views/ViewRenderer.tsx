import React, { Suspense, lazy } from 'react';
import { View, UserTier, Session, PatientProfile, CoachingSummary, PatientProfileFilters } from '../../types';
import { User } from '@supabase/supabase-js';
import { PageLoader } from '../ui/LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';
import { ScenarioSelectionView } from './ScenarioSelectionView';

// Lazy-loaded view components for code splitting
const Dashboard = lazy(() => import('./Dashboard'));
const PracticeView = lazy(() => import('./PracticeView'));
const FeedbackView = lazy(() => import('./FeedbackView'));
const HistoryView = lazy(() => import('./HistoryView'));
const ResourceLibrary = lazy(() => import('./ResourceLibrary'));
const PaywallView = lazy(() => import('./PaywallView'));
const SettingsView = lazy(() => import('./SettingsView'));
const CancelSubscriptionView = lazy(() => import('./CancelSubscriptionView'));
const CalendarView = lazy(() => import('./CalendarView'));
const LoginView = lazy(() => import('./LoginView'));
const ForgotPasswordView = lazy(() => import('./ForgotPasswordView'));
const ResetPasswordView = lazy(() => import('./ResetPasswordView'));
const EmailConfirmationView = lazy(() => import('./EmailConfirmationView'));
const CoachingSummaryView = lazy(() => import('./CoachingSummaryView'));
const SupportView = lazy(() => import('./SupportView'));
const ReportsView = lazy(() => import('./ReportsView'));

// Lazy-loaded legal pages
const PrivacyPolicy = lazy(() => import('../legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../legal/TermsOfService'));
const SubscriptionTerms = lazy(() => import('../legal/SubscriptionTerms'));
const CookiePolicy = lazy(() => import('../legal/CookiePolicy'));
const Disclaimer = lazy(() => import('../legal/Disclaimer'));

interface ViewRendererProps {
  view: View;
  userTier: UserTier;
  user: User | null;
  sessions: Session[];
  remainingFreeSessions: number | null;
  currentPatient: PatientProfile | null;
  currentSession: Session | null;
  coachingSummary: CoachingSummary | null;
  coachingSummaryError: string | null;
  isGeneratingSummary: boolean;
  confirmationEmail: string;
  isPremiumVerified: boolean; // Server-verified premium status
  onNavigate: (view: View) => void;
  onStartPractice: () => void;
  onStartFilteredPractice: (filters: PatientProfileFilters) => void;
  onFinishPractice: (transcript: any[], feedback: any) => void;
  onDoneFromFeedback: () => void;
  onUpgrade: () => void;
  onLogout: () => Promise<void>;
  onGenerateCoachingSummary: () => void;
  onEmailConfirmation: (email: string) => void;
  onTierUpdated: () => Promise<void>;
}

export const ViewRenderer: React.FC<ViewRendererProps> = ({
  view,
  userTier,
  user,
  sessions,
  remainingFreeSessions,
  currentPatient,
  currentSession,
  coachingSummary,
  coachingSummaryError,
  isGeneratingSummary,
  confirmationEmail,
  isPremiumVerified,
  onNavigate,
  onStartPractice,
  onStartFilteredPractice,
  onFinishPractice,
  onDoneFromFeedback,
  onUpgrade,
  onLogout,
  onGenerateCoachingSummary,
  onEmailConfirmation,
  onTierUpdated,
}) => {
  const renderView = () => {
    switch (view) {
      case View.Login:
        return (
          <LoginView 
            onLogin={() => {}} 
            onNavigate={onNavigate} 
            onEmailConfirmation={onEmailConfirmation}
            onContinueAsGuest={() => onNavigate(View.Dashboard)}
          />
        );
      case View.ForgotPassword:
        return <ForgotPasswordView onBack={() => onNavigate(View.Login)} />;
      case View.EmailConfirmation:
        return (
          <EmailConfirmationView 
            email={confirmationEmail}
            onBack={() => onNavigate(View.Login)} 
            onNavigate={onNavigate}
          />
        );
      case View.ResetPassword:
        return (
          <ResetPasswordView 
            onBack={() => {
              window.history.replaceState({}, '', window.location.pathname);
              onNavigate(View.Login);
            }} 
            onSuccess={() => {
              alert('Password reset successful! Please log in with your new password.');
              window.history.replaceState({}, '', window.location.pathname);
              onNavigate(View.Login);
            }}
          />
        );
      case View.ScenarioSelection:
        // Scenario selection requires authentication (Premium feature)
        if (!user) {
          // Redirect handled by useAppRouter, but add safety check here too
          return null;
        }
        return <ScenarioSelectionView onBack={() => onNavigate(View.Dashboard)} onStartPractice={onStartFilteredPractice} />;
      case View.Practice:
        // Practice view requires authentication
        if (!user) {
          // Redirect handled by useAppRouter, but add safety check here too
          return null;
        }
        return currentPatient && (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-error-light rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-exclamation-triangle text-2xl text-error" aria-hidden="true"></i>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    Practice Session Error
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Something went wrong during your practice session. Your progress has been saved.
                  </p>
                  <button
                    onClick={() => onNavigate(View.Dashboard)}
                    className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            }
          >
            <PracticeView patient={currentPatient} userTier={userTier} onFinish={onFinishPractice} onUpgrade={() => onNavigate(View.Paywall)} />
          </ErrorBoundary>
        );
      case View.Feedback:
        return currentSession && (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-error-light rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-exclamation-triangle text-2xl text-error" aria-hidden="true"></i>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    Feedback Error
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Unable to display feedback. Your session has been saved.
                  </p>
                  <button
                    onClick={onDoneFromFeedback}
                    className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            }
          >
            <FeedbackView 
              session={currentSession} 
              onDone={onDoneFromFeedback} 
              onUpgrade={() => onNavigate(View.Paywall)} 
              onStartPractice={onStartPractice} 
            />
          </ErrorBoundary>
        );
      case View.History:
        return (
          <HistoryView 
            sessions={sessions} 
            onBack={() => onNavigate(View.Dashboard)} 
            onNavigateToPaywall={() => onNavigate(View.Paywall)} 
            userTier={userTier} 
          />
        );
      case View.ResourceLibrary:
        return (
          <ResourceLibrary 
            onBack={() => onNavigate(View.Dashboard)}
            onUpgrade={() => onNavigate(View.Paywall)} 
            userTier={userTier}
          />
        );
      case View.Paywall:
        return (
          <PaywallView 
            onBack={() => onNavigate(View.Dashboard)} 
            onUpgrade={onUpgrade} 
            user={user}
            onNavigateToLogin={() => onNavigate(View.Login)}
          />
        );
      case View.Calendar:
        return (
          <CalendarView 
            sessions={sessions} 
            onBack={() => onNavigate(View.Dashboard)}
            userTier={userTier}
            onGenerateCoachingSummary={onGenerateCoachingSummary}
            isGeneratingSummary={isGeneratingSummary}
            hasCoachingSummary={!!coachingSummary}
          />
        );
      case View.Settings:
        return (
          <SettingsView 
            userTier={userTier} 
            onNavigateToPaywall={() => onNavigate(View.Paywall)}
            onLogout={onLogout}
            onNavigate={onNavigate}
            user={user}
          />
        );
      case View.CancelSubscription:
        if (!user) {
          // Redirect to login if not authenticated
          onNavigate(View.Login);
          return null;
        }
        return (
          <CancelSubscriptionView 
            user={user}
            userTier={userTier}
            onBack={() => onNavigate(View.Settings)}
            onTierUpdated={onTierUpdated}
          />
        );
      case View.CoachingSummary:
        return (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-error-light rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-exclamation-triangle text-2xl text-error" aria-hidden="true"></i>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    Summary Error
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Unable to generate coaching summary. Please try again later.
                  </p>
                  <button
                    onClick={() => onNavigate(View.Calendar)}
                    className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    Back to Calendar
                  </button>
                </div>
              </div>
            }
          >
            <CoachingSummaryView
              isLoading={isGeneratingSummary}
              summary={coachingSummary}
              error={coachingSummaryError}
              onBack={() => onNavigate(View.Calendar)}
            />
          </ErrorBoundary>
        );
      case View.PrivacyPolicy:
        return <PrivacyPolicy onBack={() => onNavigate(View.Settings)} />;
      case View.TermsOfService:
        return <TermsOfService onBack={() => onNavigate(View.Settings)} />;
      case View.SubscriptionTerms:
        return <SubscriptionTerms onBack={() => onNavigate(View.Settings)} />;
      case View.CookiePolicy:
        return <CookiePolicy onBack={() => onNavigate(View.Settings)} />;
      case View.Disclaimer:
        return <Disclaimer onBack={() => onNavigate(View.Settings)} />;
      case View.Support:
        return <SupportView onBack={() => onNavigate(View.Settings)} />;
      case View.Reports:
        return (
          <ErrorBoundary
            fallback={
              <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-error-light rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-exclamation-triangle text-2xl text-error" aria-hidden="true"></i>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    Reports Error
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Unable to load reports. Please try again later.
                  </p>
                  <button
                    onClick={() => onNavigate(View.Dashboard)}
                    className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            }
          >
            <ReportsView
              sessions={sessions}
              userTier={userTier}
              isPremiumVerified={isPremiumVerified}
              onBack={() => onNavigate(View.Dashboard)}
              onUpgrade={() => onNavigate(View.Paywall)}
              onNavigate={onNavigate}
            />
          </ErrorBoundary>
        );
      case View.Dashboard:
      default:
        return (
          <Dashboard 
            onStartPractice={onStartPractice} 
            userTier={userTier} 
            sessions={sessions}
            remainingFreeSessions={remainingFreeSessions}
            onNavigateToPaywall={() => onNavigate(View.Paywall)}
            onNavigate={onNavigate}
          />
        );
    }
  };

  return (
    <Suspense fallback={<PageLoader message="Loading..." />}>
      <div className="animate-slide-fade-in w-full h-full">
        {renderView()}
      </div>
    </Suspense>
  );
};

