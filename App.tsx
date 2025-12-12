
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { UserTier, View, PatientProfile, Session, Feedback, ChatMessage, PatientProfileFilters, CoachingSummary } from './types';
import { generatePatientProfile } from './services/patientService';
import { generateCoachingSummary } from './services/geminiService';
import { getUserProfile } from './services/databaseService';
import { canStartSession } from './services/subscriptionService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { diagnoseEnvironmentSetup } from './services/geminiService';

// Core components (always loaded)
import ErrorBoundary from './components/ui/ErrorBoundary';
import OfflineIndicator from './components/ui/OfflineIndicator';
import { PageLoader } from './components/ui/LoadingSpinner';
import BottomNavBar from './components/ui/BottomNavBar';
import ReviewPrompt from './components/ui/ReviewPrompt';
import CookieConsent from './components/ui/CookieConsent';
import { ViewRenderer } from './components/views/ViewRenderer';

// Lazy-loaded components
const Onboarding = lazy(() => import('./components/views/Onboarding'));

// Gamification components
import BadgeUnlockToast from './components/gamification/BadgeUnlockToast';

// Custom hooks
import { useAppState } from './hooks/useAppState';
import { useTierManager } from './hooks/useTierManager';
import { useSessionManager } from './hooks/useSessionManager';
import { useStreak } from './hooks/useStreak';
import { useXP } from './hooks/useXP';
import { useBadges } from './hooks/useBadges';
import { useAuthCallback } from './hooks/useAuthCallback';
import { useStripeCallback } from './hooks/useStripeCallback';
import { useAppRouter } from './hooks/useAppRouter';
import { useOnlineSync } from './hooks/useOnlineSync';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Use consolidated app state hook
  const appState = useAppState();
  const {
    view,
    setView,
    sessions,
    setSessions,
    sessionsLoading,
    setSessionsLoading,
    remainingFreeSessions,
    setRemainingFreeSessions,
    currentPatient,
    setCurrentPatient,
    currentSession,
    setCurrentSession,
    showOnboarding,
    setShowOnboarding,
    coachingSummary,
    setCoachingSummary,
    coachingSummaryError,
    setCoachingSummaryError,
    isGeneratingSummary,
    setIsGeneratingSummary,
    showReviewPrompt,
    setShowReviewPrompt,
    confirmationEmail,
    setConfirmationEmail,
    loggingOut,
    setLoggingOut,
  } = appState;

  // Use tier manager hook with server-side premium verification
  const { userTier, setUserTier, refreshTier, isPremiumVerified } = useTierManager();

  // Use streak hook for gamification
  const { currentStreak, updateStreak, processQueue: processStreakQueue } = useStreak();

  // Use XP hook for gamification
  const { addXP, processQueue: processXPQueue } = useXP();

  // Use badges hook for gamification
  const { checkAndUnlockBadges, newlyUnlockedBadges, markBadgeAsSeen } = useBadges();

  // Use online sync hook to process queued operations when connectivity is restored
  useOnlineSync({
    processStreakQueue,
    processXPQueue,
    isAuthenticated: !!user,
  });

  // Track which badge to show in toast (one at a time)
  const [badgeToastQueue, setBadgeToastQueue] = useState<string[]>([]);

  // When new badges are unlocked, add them to the toast queue
  useEffect(() => {
    if (newlyUnlockedBadges.length > 0) {
      const newBadgeIds = newlyUnlockedBadges.map(b => b.id);
      setBadgeToastQueue(prev => {
        // Add only badges not already in queue
        const existingIds = new Set(prev);
        const toAdd = newBadgeIds.filter(id => !existingIds.has(id));
        return [...prev, ...toAdd];
      });
    }
  }, [newlyUnlockedBadges]);

  // Handle dismissing a badge toast
  const handleBadgeToastClose = useCallback(async () => {
    if (badgeToastQueue.length > 0) {
      const dismissedBadgeId = badgeToastQueue[0];
      await markBadgeAsSeen(dismissedBadgeId);
      setBadgeToastQueue(prev => prev.slice(1));
    }
  }, [badgeToastQueue, markBadgeAsSeen]);

  // Get the current badge to show
  const currentBadgeToShow = newlyUnlockedBadges.find(b => b.id === badgeToastQueue[0]);

  // Use session manager hook
  const { saveNewSession } = useSessionManager({
    user,
    authLoading,
    userTier,
    setSessions,
    setSessionsLoading,
    setRemainingFreeSessions,
    updateStreak,
    addXP,
    checkAndUnlockBadges,
    currentStreak,
  });

  // Use auth callback hook
  useAuthCallback({ setView });

  // Use Stripe callback hook
  useStripeCallback({
    user,
    authLoading,
    setUserTier,
    setRemainingFreeSessions,
    setView,
  });

  // Use app router hook
  useAppRouter({ user, authLoading, view, setView });

  // Diagnostic: Check environment setup on app start
  useEffect(() => {
    diagnoseEnvironmentSetup();
  }, []);

  // Load onboarding state
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('mi-coach-onboarding-complete');
    setShowOnboarding(onboardingComplete !== 'true');
  }, [setShowOnboarding]);

  const handleOnboardingFinish = useCallback(() => {
    localStorage.setItem('mi-coach-onboarding-complete', 'true');
    setShowOnboarding(false);
    // After onboarding, go to Dashboard (anonymous users can access it)
    setView(View.Dashboard);
  }, [setShowOnboarding, setView]);

  const handleStartPractice = useCallback(async () => {
    // Require authentication to start practice
    if (!user) {
      console.log('[App] User not authenticated, redirecting to login');
      setView(View.Login);
      return;
    }

    // Guard: wait until userTier is loaded (avoid using stale tier from state)
    if (!userTier || userTier === '') {
      console.warn('[App] User tier not yet loaded, waiting...');
      return;
    }

    // Check if user can start a new session
    const canStart = await canStartSession(user.id, userTier);
    if (!canStart) {
      console.log('[App] User cannot start session (limit reached), showing paywall');
      setView(View.Paywall);
      return;
    }

    if (userTier === UserTier.Premium) {
      setView(View.ScenarioSelection);
    } else {
      const patient = generatePatientProfile();
      setCurrentPatient(patient);
      setView(View.Practice);
    }
  }, [user, userTier, setView, setCurrentPatient]);
  
  const handleStartFilteredPractice = useCallback((filters: PatientProfileFilters) => {
    // Require authentication to start practice
    if (!user) {
      console.log('[App] User not authenticated, redirecting to login');
      setView(View.Login);
      return;
    }

    const patient = generatePatientProfile(filters);
    setCurrentPatient(patient);
    setView(View.Practice);
  }, [user, setCurrentPatient, setView]);

  // Save the new session when practice is finished
  const handleFinishPractice = useCallback(async (transcript: ChatMessage[], feedback: Feedback) => {
    if (!currentPatient) {
      console.error("[App] Cannot save session: missing patient");
      return;
    }

    const newSession = await saveNewSession(transcript, feedback, currentPatient, sessions, userTier);
    
    setCurrentSession(newSession);
    setCoachingSummary(null); // Invalidate old summary
    setCoachingSummaryError(null);
    setView(View.Feedback);
  }, [currentPatient, sessions, userTier, saveNewSession, setCurrentSession, setCoachingSummary, setCoachingSummaryError, setView]);
  
  const handleDoneFromFeedback = useCallback(() => {
    const sessionCount = parseInt(localStorage.getItem('mi-coach-session-count') || '0', 10);
    const reviewDismissed = localStorage.getItem('mi-coach-review-dismissed') === 'true';
    const remindAfterCount = parseInt(localStorage.getItem('mi-coach-review-remind-after') || '0', 10);

    if (!reviewDismissed && sessionCount >= 3 && sessionCount >= remindAfterCount) {
        setShowReviewPrompt(true);
    } else {
        setView(View.Dashboard);
    }
  }, [setShowReviewPrompt, setView]);
  
  const handleReviewPromptClose = useCallback((choice: 'rate' | 'later' | 'no') => {
    setShowReviewPrompt(false);
    
    if (choice === 'rate' || choice === 'no') {
        localStorage.setItem('mi-coach-review-dismissed', 'true');
        if (choice === 'rate') {
             // In a real app, you'd link to the store.
             alert("Thank you for your feedback! You will now be redirected to the app store.");
        }
    } else if (choice === 'later') {
        const sessionCount = parseInt(localStorage.getItem('mi-coach-session-count') || '0', 10);
        // Remind again after 3 more sessions
        localStorage.setItem('mi-coach-review-remind-after', (sessionCount + 3).toString());
    }
    
    setView(View.Dashboard);
  }, [setShowReviewPrompt, setView]);

  const handleGenerateCoachingSummary = useCallback(async () => {
        if (coachingSummary && !isGeneratingSummary) {
            setView(View.CoachingSummary);
            return;
        }

        if (userTier !== UserTier.Premium) {
            setView(View.Paywall);
            return;
        }
        
        setCoachingSummaryError(null);
        setIsGeneratingSummary(true);
        setView(View.CoachingSummary);

        try {
            const premiumSessions = sessions.filter(s => s.tier === UserTier.Premium);
            if (premiumSessions.length === 0) {
                 setCoachingSummaryError("You need to complete at least one Premium session to generate a summary.");
                 setIsGeneratingSummary(false);
                 return;
            }
            const reportObject = await generateCoachingSummary(premiumSessions);
            setCoachingSummary(reportObject);
        } catch (error) {
            console.error("Failed to generate coaching summary:", error);
            const errorMessage = error instanceof Error ? error.message : "Sorry, we couldn't generate your summary at this time. Please try again later.";
            setCoachingSummaryError(errorMessage);
        } finally {
            setIsGeneratingSummary(false);
        }
    }, [coachingSummary, isGeneratingSummary, userTier, sessions, setView, setCoachingSummaryError, setIsGeneratingSummary, setCoachingSummary]);

  const handleNavigate = useCallback((targetView: View) => setView(targetView), [setView]);
  
  const handleEmailConfirmation = useCallback((email: string) => {
    setConfirmationEmail(email);
    setView(View.EmailConfirmation);
  }, [setConfirmationEmail, setView]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    
    // Reset app state
    setUserTier(UserTier.Free);
    localStorage.removeItem('mi-coach-tier');
    setSessions([]);
    setRemainingFreeSessions(null);
    setView(View.Login);

    let logoutError: Error | null = null;
    try {
      await signOut();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Logout failed');
      console.error('[App] Logout failed:', err);
      logoutError = err;
    } finally {
      setLoggingOut(false);
    }

    if (logoutError) {
      throw logoutError;
    }
  }, [loggingOut, setLoggingOut, setUserTier, setSessions, setRemainingFreeSessions, setView, signOut]);

  // Save the new user tier to localStorage and Supabase upon upgrade.
  const handleUpgrade = useCallback(async () => {
    if (!user) {
      console.error('[App] Cannot upgrade: user not authenticated');
      return;
    }

    try {
      const newTier = UserTier.Premium;
      
      // Update in Supabase
      console.log('[App] Upgrading user tier to Premium');
      // Note: updateUserTier is called internally by the payment processor
      // For now, just update locally and in localStorage
      setUserTier(newTier);
      
      // Reload tier from Supabase to confirm
      const updatedTier = await refreshTier();
      if (updatedTier) {
        setUserTier(updatedTier);
      }
      
      setView(View.Dashboard); // Go back to dashboard after upgrading
    } catch (error) {
      console.error('[App] Failed to upgrade tier:', error);
      // Still navigate to dashboard even if refresh fails
      setView(View.Dashboard);
    }
  }, [user, setUserTier, refreshTier, setView]);

  const handleTierUpdated = useCallback(async () => {
    // Reload tier from Supabase after subscription change
    if (user) {
      const updatedTier = await refreshTier();
      if (updatedTier) {
        setUserTier(updatedTier);
      }
    }
  }, [user, refreshTier, setUserTier]);
  
  // Show loading state while auth is initializing
  if (authLoading || showOnboarding === null) {
    return <PageLoader message="Initializing..." />;
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return (
      <Suspense fallback={<PageLoader message="Loading onboarding..." />}>
        <Onboarding onFinish={handleOnboardingFinish} />
      </Suspense>
    );
  }

  // Show login/auth screens when on those views (allow anonymous access to other views)
  const isAuthView = view === View.Login || view === View.ForgotPassword || view === View.EmailConfirmation || view === View.ResetPassword;
  const shouldRenderAuthViews = !user && !authLoading && isAuthView;

  const viewsWithNavBar = [View.Dashboard, View.ResourceLibrary, View.Settings, View.Calendar];
  const isPremiumFeedback = view === View.Feedback && userTier === UserTier.Premium;
  const shouldShowNavBar = viewsWithNavBar.includes(view) || isPremiumFeedback;

  return (
    <div className="min-h-screen bg-transparent text-[var(--color-text-primary)]" id="main-content">
      {/* Offline status indicator */}
      <OfflineIndicator />
      
      {shouldShowNavBar ? (
          <div className="flex flex-col" style={{ height: '100vh' }}>
              <main className="flex-1 overflow-y-auto pb-20" role="main" aria-label="Main content">
                  <ViewRenderer
                    view={view}
                    userTier={userTier}
                    user={user}
                    sessions={sessions}
                    remainingFreeSessions={remainingFreeSessions}
                    currentPatient={currentPatient}
                    currentSession={currentSession}
                    coachingSummary={coachingSummary}
                    coachingSummaryError={coachingSummaryError}
                    isGeneratingSummary={isGeneratingSummary}
                    confirmationEmail={confirmationEmail}
                    isPremiumVerified={isPremiumVerified}
                    onNavigate={handleNavigate}
                    onStartPractice={handleStartPractice}
                    onStartFilteredPractice={handleStartFilteredPractice}
                    onFinishPractice={handleFinishPractice}
                    onDoneFromFeedback={handleDoneFromFeedback}
                    onUpgrade={handleUpgrade}
                    onLogout={handleLogout}
                    onGenerateCoachingSummary={handleGenerateCoachingSummary}
                    onEmailConfirmation={handleEmailConfirmation}
                    onTierUpdated={handleTierUpdated}
                  />
              </main>
              <BottomNavBar currentView={view} onNavigate={handleNavigate} userTier={userTier} />
          </div>
      ) : (
          // Views without the main nav bar (e.g., practice, feedback, paywall)
          // These components manage their own full-screen layout.
          <ViewRenderer
            view={view}
            userTier={userTier}
            user={user}
            sessions={sessions}
            remainingFreeSessions={remainingFreeSessions}
            currentPatient={currentPatient}
            currentSession={currentSession}
            coachingSummary={coachingSummary}
            coachingSummaryError={coachingSummaryError}
            isGeneratingSummary={isGeneratingSummary}
            confirmationEmail={confirmationEmail}
            isPremiumVerified={isPremiumVerified}
            onNavigate={handleNavigate}
            onStartPractice={handleStartPractice}
            onStartFilteredPractice={handleStartFilteredPractice}
            onFinishPractice={handleFinishPractice}
            onDoneFromFeedback={handleDoneFromFeedback}
            onUpgrade={handleUpgrade}
            onLogout={handleLogout}
            onGenerateCoachingSummary={handleGenerateCoachingSummary}
            onEmailConfirmation={handleEmailConfirmation}
            onTierUpdated={handleTierUpdated}
          />
      )}
      {showReviewPrompt && (
          <ReviewPrompt onClose={handleReviewPromptClose} />
      )}
      {/* Badge unlock celebration toast */}
      {currentBadgeToShow && (
          <BadgeUnlockToast
            badge={currentBadgeToShow}
            onClose={handleBadgeToastClose}
          />
      )}
      <CookieConsent />
      {/* Aria live region for async feedback */}
      <div id="aria-live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
    </div>
  );
};

/**
 * Main App Component
 * Wrapped with ErrorBoundary for graceful error handling
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
