
import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
// Fix: Import ChatMessage type to resolve type error in handleFinishPractice.
import { UserTier, View, PatientProfile, Session, Feedback, ChatMessage, StageOfChange, PatientProfileFilters, DifficultyLevel, CoachingSummary } from './types';
import { generatePatientProfile } from './services/patientService';
import { generateCoachingSummary } from './services/geminiService';
import { saveSession, getUserSessions, getUserProfile, createUserProfile } from './services/databaseService';
import { canStartSession, getRemainingFreeSessions, getRemainingFreeSessionsAnonymous } from './services/subscriptionService';
import { PATIENT_PROFILE_TEMPLATES, STAGE_DESCRIPTIONS } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { diagnoseEnvironmentSetup } from './services/geminiService';
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase';

// Core components (always loaded)
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import { PageLoader } from './components/LoadingSpinner';
import BottomNavBar from './components/BottomNavBar';
import ReviewPrompt from './components/ReviewPrompt';
import CookieConsent from './components/CookieConsent';

// Lazy-loaded view components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const PracticeView = lazy(() => import('./components/PracticeView'));
const FeedbackView = lazy(() => import('./components/FeedbackView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const ResourceLibrary = lazy(() => import('./components/ResourceLibrary'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const PaywallView = lazy(() => import('./components/PaywallView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CancelSubscriptionView = lazy(() => import('./components/CancelSubscriptionView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const LoginView = lazy(() => import('./components/LoginView'));
const ForgotPasswordView = lazy(() => import('./components/ForgotPasswordView'));
const ResetPasswordView = lazy(() => import('./components/ResetPasswordView'));
const EmailConfirmationView = lazy(() => import('./components/EmailConfirmationView'));
const CoachingSummaryView = lazy(() => import('./components/CoachingSummaryView'));
const SupportView = lazy(() => import('./components/SupportView'));

// Lazy-loaded legal pages
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));
const SubscriptionTerms = lazy(() => import('./components/legal/SubscriptionTerms'));
const CookiePolicy = lazy(() => import('./components/legal/CookiePolicy'));
const Disclaimer = lazy(() => import('./components/legal/Disclaimer'));

// New component for premium users to select a practice scenario.
interface ScenarioSelectionViewProps {
    onBack: () => void;
    onStartPractice: (filters: PatientProfileFilters) => void;
}

const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
    [DifficultyLevel.Beginner]: "Patient is generally collaborative and open to the idea of change (e.g., Preparation, Action stages).",
    [DifficultyLevel.Intermediate]: "Patient is ambivalent, weighing the pros and cons of changing their behavior (Contemplation stage).",
    [DifficultyLevel.Advanced]: "Patient does not yet see their behavior as a problem and may be resistant to discussing change (Precontemplation stage).",
};

const ScenarioSelectionView: React.FC<ScenarioSelectionViewProps> = ({ onBack, onStartPractice }) => {
    const [selectedTopic, setSelectedTopic] = useState('any');
    const [selectedStage, setSelectedStage] = useState('any');
    const [selectedDifficulty, setSelectedDifficulty] = useState('any');

    // Memoize the list of unique topics from the constants file
    const uniqueTopics = useMemo(() => {
        const topics = new Set(PATIENT_PROFILE_TEMPLATES.map(t => t.topic));
        return Array.from(topics).sort();
    }, []);
    
    const allStages = Object.values(StageOfChange);
    const allDifficulties = Object.values(DifficultyLevel);

    const handleStart = () => {
        const filters: PatientProfileFilters = {};
        if (selectedTopic !== 'any') {
            filters.topic = selectedTopic;
        }
        if (selectedStage !== 'any') {
            filters.stageOfChange = selectedStage as StageOfChange;
        } else if (selectedDifficulty !== 'any') {
            // Only apply difficulty if a specific stage isn't chosen
            filters.difficulty = selectedDifficulty as DifficultyLevel;
        }
        onStartPractice(filters);
    };
    
    const handleRandomStart = () => {
        onStartPractice({});
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
            <header className="flex items-center mb-6 pt-2 max-w-2xl mx-auto">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 mr-2 rounded-full hover:bg-slate-200 transition-colors"
                    aria-label="Go back"
                >
                    <i className="fa fa-arrow-left text-xl text-gray-600" aria-hidden="true"></i>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Choose a Scenario</h1>
            </header>

            <main className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
                    <div>
                        <label htmlFor="topic-select" className="block text-lg font-semibold text-gray-800 mb-2">
                            <i className="fa-solid fa-list-check mr-2 text-sky-600"></i>
                            Topic of Conversation
                        </label>
                        <select
                            id="topic-select"
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full p-4 text-base md:text-lg border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                            style={{ fontSize: '16px' }}
                        >
                            <option value="any" style={{ fontSize: '16px' }}>Any Topic</option>
                            {uniqueTopics.map(topic => (
                                <option key={topic} value={topic} style={{ fontSize: '16px' }}>{topic}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="difficulty-select" className="block text-lg font-semibold text-gray-800 mb-2">
                             <i className="fa-solid fa-gauge-high mr-2 text-sky-600"></i>
                            Difficulty Level
                        </label>
                        <select
                            id="difficulty-select"
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="w-full p-4 text-base md:text-lg border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                            style={{ fontSize: '16px' }}
                        >
                            <option value="any" style={{ fontSize: '16px' }}>Any Difficulty</option>
                            {allDifficulties.map(level => (
                                <option key={level} value={level} style={{ fontSize: '16px' }}>{level}</option>
                            ))}
                        </select>
                         {selectedDifficulty !== 'any' && (
                             <p className="text-sm text-gray-600 mt-2 pl-1">{DIFFICULTY_DESCRIPTIONS[selectedDifficulty as DifficultyLevel]}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="stage-select" className="block text-lg font-semibold text-gray-800 mb-2">
                             <i className="fa-solid fa-stairs mr-2 text-sky-600"></i>
                            Stage of Change (Optional)
                        </label>
                        <select
                            id="stage-select"
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="w-full p-4 text-base md:text-lg border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                            style={{ fontSize: '16px' }}
                        >
                            <option value="any" style={{ fontSize: '16px' }}>Any Stage</option>
                            {allStages.map(stage => (
                                <option key={stage} value={stage} style={{ fontSize: '16px' }}>{stage}</option>
                            ))}
                        </select>
                        {selectedStage !== 'any' && (
                             <p className="text-sm text-gray-600 mt-2 pl-1">{STAGE_DESCRIPTIONS[selectedStage as StageOfChange]}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2 pl-1">Selecting a specific stage will override the difficulty setting.</p>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                     <button
                        onClick={handleStart}
                        className="w-full bg-sky-500 text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105"
                    >
                        Start Selected Scenario
                    </button>
                     <button
                        onClick={handleRandomStart}
                        className="w-full bg-slate-600 text-white font-bold py-3 px-6 rounded-full text-md hover:bg-slate-700 transition"
                    >
                        <i className="fa-solid fa-shuffle mr-2"></i>
                        Start a Random Scenario
                    </button>
                </div>
            </main>
        </div>
    );
};

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [userTier, setUserTier] = useState<UserTier>(UserTier.Free);
  // Start with Dashboard for anonymous access (will redirect to Login if user logs in and was on login screen)
  const [view, setView] = useState<View>(View.Dashboard);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [remainingFreeSessions, setRemainingFreeSessions] = useState<number | null>(null);
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [coachingSummary, setCoachingSummary] = useState<CoachingSummary | null>(null);
  const [coachingSummaryError, setCoachingSummaryError] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Diagnostic: Check environment setup on app start
  useEffect(() => {
    diagnoseEnvironmentSetup();
  }, []);

  // Handle password reset and email confirmation URL detection and Supabase auth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if URL contains auth token (Supabase sends it in hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          
          // Handle password reset
          if (window.location.pathname === '/reset-password' || (type === 'recovery' && accessToken)) {
            // If we have a recovery token in the URL, Supabase will handle it via auth state change
            // But we need to show the reset password view
            if (type === 'recovery' && accessToken) {
              setView(View.ResetPassword);
              // Clear the hash after detecting it (the component will handle the session)
              // Don't clear immediately - let Supabase process it first
            } else {
              // Check if we already have a session (user clicked link and Supabase created session)
              const { data } = await supabase.auth.getSession();
              if (data?.session) {
                setView(View.ResetPassword);
              }
            }
          }
          // Handle email confirmation
          else if (type === 'signup' && accessToken) {
            console.log('[App] Email confirmation callback detected');
            // Supabase will automatically process the token and create a session
            // The auth state change listener will detect the user and navigate to dashboard
            // Clear the hash from URL
            window.history.replaceState({}, '', window.location.pathname);
            // The user will be automatically logged in via onAuthStateChange
          }
        } catch (error) {
          console.error('[App] Error handling auth callback:', error);
        }
      } else {
        // In mock mode, just show the reset password view if needed
        if (window.location.pathname === '/reset-password' || (type === 'recovery' && accessToken)) {
          setView(View.ResetPassword);
        }
      }
    };

    handleAuthCallback();
  }, []);

  // Navigate to dashboard when user logs in, allow anonymous access to dashboard
  useEffect(() => {
    if (authLoading) {
      return; // Don't change view while loading
    }

    if (user) {
      // User is logged in, navigate to dashboard if on login-related screens
      // But don't navigate away from reset password if they're in the middle of resetting
      if ((view === View.Login || view === View.ForgotPassword || view === View.EmailConfirmation) && view !== View.ResetPassword) {
        setView(View.Dashboard);
      }
    } else {
      // User is not logged in - allow anonymous access to free tier features
      // Only show login if on login/auth screens, otherwise allow Dashboard and other views
      if (view === View.Login || view === View.ForgotPassword || view === View.EmailConfirmation || view === View.ResetPassword) {
        // Already on auth screens, stay there
        return;
      }
      // Anonymous users can access Dashboard, Paywall (shows login prompt), Settings (shows sign up), and other free tier views
      // Only redirect premium-only views that require authentication
      if (view === View.Calendar || view === View.CoachingSummary || view === View.CancelSubscription) {
        // These views require login - redirect to dashboard
        setView(View.Dashboard);
      }
      // Note: PaywallView and SettingsView handle anonymous users by showing login/signup prompts
    }
  }, [user, authLoading, view]);

  // Load user tier from localStorage when the app starts.
  useEffect(() => {
    // Check if onboarding has been completed.
    const onboardingComplete = localStorage.getItem('mi-coach-onboarding-complete');
    setShowOnboarding(onboardingComplete !== 'true');

    // For anonymous users, always use Free tier
    // For authenticated users, load from localStorage as fallback (will be overridden by Supabase)
    if (!user) {
      setUserTier(UserTier.Free);
    } else {
      // Authenticated user - load saved tier from localStorage (fallback, will be overridden by Supabase)
      const savedTier = localStorage.getItem('mi-coach-tier') as UserTier;
      if (savedTier && Object.values(UserTier).includes(savedTier)) {
        setUserTier(savedTier);
      }
    }
  }, [user]); // Re-run when user changes

  // Load user tier from Supabase after authentication
  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    const loadTierFromSupabase = async () => {
      try {
        console.log('[App] Loading tier from Supabase for user:', user.id);
        const profile = await getUserProfile(user.id);
        
        if (profile && profile.tier) {
          console.log('[App] Loaded tier from Supabase:', profile.tier);
          setUserTier(profile.tier as UserTier);
          localStorage.setItem('mi-coach-tier', profile.tier);
        } else {
          console.log('[App] No profile found. Creating new profile with Free tier.');
          // Create a new profile for the user
          const newProfile = await createUserProfile(user.id, UserTier.Free);
          if (newProfile && newProfile.tier) {
            setUserTier(newProfile.tier as UserTier);
            localStorage.setItem('mi-coach-tier', newProfile.tier);
          } else {
            // Fallback to Free tier if creation fails
            setUserTier(UserTier.Free);
            localStorage.setItem('mi-coach-tier', UserTier.Free);
          }
        }
      } catch (error) {
        console.error('[App] Failed to load tier from Supabase:', error);
        // Fallback to localStorage or Free
        const savedTier = localStorage.getItem('mi-coach-tier') as UserTier;
        if (savedTier && Object.values(UserTier).includes(savedTier)) {
          setUserTier(savedTier);
        } else {
          setUserTier(UserTier.Free);
          localStorage.setItem('mi-coach-tier', UserTier.Free);
        }
      }
    };

    loadTierFromSupabase();
  }, [user, authLoading]);

  // Handle Stripe checkout success redirect
  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const plan = urlParams.get('plan');

    if (sessionId && plan) {
      console.log('[App] ✅ Stripe checkout success detected. Session:', sessionId, 'Plan:', plan);
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      
      // First, try to update tier directly via API (works even without webhooks)
      const updateTierDirectly = async () => {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          console.log('[App] 🔄 Attempting to update tier directly from checkout session...');
          
          const response = await fetch(`${backendUrl}/api/update-tier-from-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to update tier' }));
            throw new Error(error.message || 'Failed to update tier');
          }

          const result = await response.json();
          console.log('[App] ✅ Tier updated successfully via direct API call:', result);
          
          // Update local state immediately
          setUserTier(UserTier.Premium);
          localStorage.setItem('mi-coach-tier', UserTier.Premium);
          setRemainingFreeSessions(null);
          
          // Show success and navigate to dashboard
          alert(`🎉 Payment successful! Your ${plan} subscription is now active. Enjoy unlimited practice sessions!`);
          setView(View.Dashboard);
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn('[App] ⚠️ Direct tier update failed, falling back to polling:', errorMessage);
          console.warn('[App] Error details:', error);
          return false;
        }
      };

      // Refresh user tier from Supabase with enhanced retry logic (fallback)
      const refreshTierWithRetry = async () => {
        const maxRetries = 5;
        const initialDelay = 2000; // 2 seconds initial delay for webhook processing
        let retryCount = 0;
        let tierUpdated = false;

        console.log('[App] Starting tier refresh with retry logic (max', maxRetries, 'attempts)');

        while (retryCount < maxRetries && !tierUpdated) {
          try {
            if (retryCount === 0) {
              // Initial wait for webhook to process
              console.log('[App] ⏳ Waiting for webhook to process...');
              await new Promise(resolve => setTimeout(resolve, initialDelay));
            } else {
              // Exponential backoff: 2s, 4s, 8s, 16s
              const delayMs = initialDelay * Math.pow(2, retryCount - 1);
              console.log(`[App] 🔄 Retry attempt ${retryCount}/${maxRetries - 1}, waiting ${delayMs}ms...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }

            console.log('[App] 📡 Fetching user profile for tier check...');
            const profile = await getUserProfile(user.id);
            
            if (profile && profile.tier === 'premium') {
              console.log('[App] ✅ Tier successfully updated to premium!');
              setUserTier(profile.tier as UserTier);
              localStorage.setItem('mi-coach-tier', profile.tier);
              setRemainingFreeSessions(null); // Clear free sessions limit immediately for premium users
              tierUpdated = true;
              
              // Show success and navigate to dashboard
              alert(`🎉 Payment successful! Your ${plan} subscription is now active. Enjoy unlimited practice sessions!`);
              setView(View.Dashboard);
            } else if (profile && profile.tier) {
              console.warn(`[App] ⏳ Tier still ${profile.tier} (expected premium). Retrying...`);
              retryCount++;
            } else {
              console.warn('[App] ⏳ No profile found or tier is empty. Retrying...');
              retryCount++;
            }
          } catch (error) {
            console.error('[App] ❌ Error refreshing tier:', error);
            retryCount++;
          }
        }

        // If tier wasn't updated after retries
        if (!tierUpdated) {
          console.warn(`[App] ⚠️  Tier was not updated after ${maxRetries} attempts`);
          console.warn('[App] Possible causes:');
          console.warn('  1. Backend server is not running (npm run dev:server)');
          console.warn('  2. Stripe CLI is not forwarding webhooks');
          console.warn('  3. Supabase credentials are missing or incorrect');
          console.warn('  4. Database connection failed');
          console.warn('[App] Action: Check server logs and run: curl http://localhost:3001/api/setup-check');
          
          alert('✅ Payment received! Your subscription is being activated.\n\n' +
                'If premium features don\'t appear after 30 seconds:\n' +
                '1. Refresh the page\n' +
                '2. Check that the backend server is running (npm run dev:server)\n' +
                '3. Verify Supabase credentials in .env.local');
          setView(View.Dashboard);
          
          // Still try to refresh tier from localStorage as fallback
          const savedTier = localStorage.getItem('mi-coach-tier') as UserTier;
          if (savedTier && Object.values(UserTier).includes(savedTier)) {
            setUserTier(savedTier);
          }
        }
      };

      // Try direct update first, then fall back to polling if needed
      (async () => {
        const directUpdateSuccess = await updateTierDirectly();
        if (!directUpdateSuccess) {
          refreshTierWithRetry();
        }
      })();
    }
  }, [user, authLoading]);

  // Load sessions from Supabase when user is authenticated, or from localStorage for anonymous users
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        if (user) {
          // Authenticated user - load from Supabase
          const supabaseSessions = await getUserSessions(user.id);
          setSessions(supabaseSessions);
          
          // Update remaining free sessions if user is on free tier
          if (userTier === UserTier.Free) {
            const remaining = await getRemainingFreeSessions(user.id);
            setRemainingFreeSessions(remaining);
          } else {
            setRemainingFreeSessions(null); // Premium users don't have limits
          }
          
          // If no sessions in Supabase, try to migrate from localStorage (old logged-in sessions)
          if (supabaseSessions.length === 0) {
            const savedSessions = localStorage.getItem('mi-coach-sessions');
            if (savedSessions) {
              try {
                const localSessions = JSON.parse(savedSessions) as Session[];
                // Optionally migrate old sessions to Supabase (could be done in background)
                console.log('[App] Found', localSessions.length, 'sessions in localStorage (migration may be needed)');
              } catch (error) {
                console.error("[App] Failed to parse sessions from localStorage:", error);
                localStorage.removeItem('mi-coach-sessions');
              }
            }
          }
        } else {
          // Anonymous user - load from localStorage
          const anonymousSessionsJson = localStorage.getItem('mi-coach-anonymous-sessions');
          if (anonymousSessionsJson) {
            try {
              const anonymousSessions = JSON.parse(anonymousSessionsJson) as Session[];
              setSessions(anonymousSessions);
              
              // Calculate remaining free sessions for anonymous user
              if (userTier === UserTier.Free) {
                const remaining = getRemainingFreeSessionsAnonymous();
                setRemainingFreeSessions(remaining);
              } else {
                setRemainingFreeSessions(null);
              }
            } catch (error) {
              console.error("[App] Failed to parse anonymous sessions from localStorage:", error);
              localStorage.removeItem('mi-coach-anonymous-sessions');
              setSessions([]);
              setRemainingFreeSessions(3); // Default to 3 remaining if we can't load
            }
          } else {
            // No anonymous sessions yet
            setSessions([]);
            setRemainingFreeSessions(3); // Start with 3 free sessions
          }
        }
      } catch (error) {
        console.error("[App] Failed to load sessions:", error);
        // Fallback: try localStorage for anonymous users
        if (!user) {
          try {
            const anonymousSessionsJson = localStorage.getItem('mi-coach-anonymous-sessions');
            if (anonymousSessionsJson) {
              const anonymousSessions = JSON.parse(anonymousSessionsJson) as Session[];
              setSessions(anonymousSessions);
              setRemainingFreeSessions(getRemainingFreeSessionsAnonymous());
            } else {
              setSessions([]);
              setRemainingFreeSessions(3);
            }
          } catch (parseError) {
            console.error("[App] Failed to parse anonymous sessions from localStorage:", parseError);
            setSessions([]);
            setRemainingFreeSessions(3);
          }
        } else {
          // For authenticated users, fallback to empty sessions
          setSessions([]);
          setRemainingFreeSessions(userTier === UserTier.Free ? 3 : null);
        }
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [user, authLoading, userTier]);

  const handleOnboardingFinish = () => {
    localStorage.setItem('mi-coach-onboarding-complete', 'true');
    setShowOnboarding(false);
    // After onboarding, go to Dashboard (anonymous users can access it)
    setView(View.Dashboard);
  };

  // A function to update sessions in state (localStorage writes removed - using Supabase)
  const saveSessions = useCallback((updatedSessions: Session[]) => {
    setSessions(updatedSessions);
    // Note: localStorage writes removed - sessions are now saved to Supabase
  }, []);

  const handleStartPractice = async () => {
    // Guard: wait until userTier is loaded (avoid using stale tier from state)
    if (!userTier || userTier === '') {
      console.warn('[App] User tier not yet loaded, waiting...');
      return;
    }

    // Check if user can start a new session (works for both authenticated and anonymous)
    const canStart = await canStartSession(user?.id || null, userTier);
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
  };
  
  const handleStartFilteredPractice = (filters: PatientProfileFilters) => {
    const patient = generatePatientProfile(filters);
    setCurrentPatient(patient);
    setView(View.Practice);
  };

  // Save the new session to Supabase (authenticated) or localStorage (anonymous) when practice is finished.
  const handleFinishPractice = async (transcript: ChatMessage[], feedback: Feedback) => {
    if (!currentPatient) {
      console.error("[App] Cannot save session: missing patient");
      return;
    }

    const newSession: Session = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      patient: currentPatient,
      transcript,
      feedback,
      tier: userTier,
    };

    // Optimistically update local state for immediate UI feedback
    const updatedSessions = [...sessions, newSession];
    saveSessions(updatedSessions);
    localStorage.setItem('mi-coach-session-count', updatedSessions.length.toString());

    setCurrentSession(newSession);
    setCoachingSummary(null); // Invalidate old summary
    setCoachingSummaryError(null);
    setView(View.Feedback);

    // Save based on whether user is authenticated or anonymous
    if (user) {
      // Authenticated user - save to Supabase
      try {
        await saveSession(newSession, user.id);
        console.log('[App] Session saved to Supabase successfully');
        
        // Refresh remaining free sessions if user is on free tier
        if (userTier === UserTier.Free) {
          const remaining = await getRemainingFreeSessions(user.id);
          setRemainingFreeSessions(remaining);
        }
      } catch (error) {
        console.error('[App] Failed to save session to Supabase:', error);
        // Session is already in local state, so UI remains functional
      }
    } else {
      // Anonymous user - save to localStorage
      try {
        localStorage.setItem('mi-coach-anonymous-sessions', JSON.stringify(updatedSessions));
        console.log('[App] Session saved to localStorage for anonymous user');
        
        // Update remaining free sessions
        if (userTier === UserTier.Free) {
          const remaining = getRemainingFreeSessionsAnonymous();
          setRemainingFreeSessions(remaining);
        }
      } catch (error) {
        console.error('[App] Failed to save anonymous session to localStorage:', error);
        // Session is already in local state, so UI remains functional
      }
    }
  };
  
  const handleDoneFromFeedback = () => {
    const sessionCount = parseInt(localStorage.getItem('mi-coach-session-count') || '0', 10);
    const reviewDismissed = localStorage.getItem('mi-coach-review-dismissed') === 'true';
    const remindAfterCount = parseInt(localStorage.getItem('mi-coach-review-remind-after') || '0', 10);

    if (!reviewDismissed && sessionCount >= 3 && sessionCount >= remindAfterCount) {
        setShowReviewPrompt(true);
    } else {
        setView(View.Dashboard);
    }
  };
  
  const handleReviewPromptClose = (choice: 'rate' | 'later' | 'no') => {
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
  };

  const handleGenerateCoachingSummary = async () => {
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
            const premiumSessions = sessions.filter(s => s.tier === UserTier.Premium && s.feedback.constructiveFeedback);
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
    };

  const handleNavigate = (targetView: View) => setView(targetView);
  
  const handleEmailConfirmation = (email: string) => {
    setConfirmationEmail(email);
    setView(View.EmailConfirmation);
  };

  const resetAppStateAfterLogout = () => {
    setUserTier(UserTier.Free);
    localStorage.removeItem('mi-coach-tier');
    setSessions([]);
    setRemainingFreeSessions(null);
    setView(View.Login);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    resetAppStateAfterLogout();

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
  };

  // Save the new user tier to localStorage and Supabase upon upgrade.
  const handleUpgrade = async () => {
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
      localStorage.setItem('mi-coach-tier', newTier);
      
      // Reload tier from Supabase to confirm
      const profile = await getUserProfile(user.id);
      if (profile && profile.tier) {
        setUserTier(profile.tier as UserTier);
        localStorage.setItem('mi-coach-tier', profile.tier);
      }
      
      setView(View.Dashboard); // Go back to dashboard after upgrading
    } catch (error) {
      console.error('[App] Failed to upgrade tier:', error);
      // Still navigate to dashboard even if refresh fails
      setView(View.Dashboard);
    }
  };
  
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
  if (!user && !authLoading && (view === View.Login || view === View.ForgotPassword || view === View.EmailConfirmation || view === View.ResetPassword)) {
    return (
      <Suspense fallback={<PageLoader message="Loading..." />}>
        {view === View.Login && <LoginView 
          onLogin={() => {}} 
          onNavigate={handleNavigate} 
          onEmailConfirmation={handleEmailConfirmation}
          onContinueAsGuest={() => setView(View.Dashboard)}
        />}
        {view === View.ForgotPassword && <ForgotPasswordView onBack={() => setView(View.Login)} />}
        {view === View.EmailConfirmation && (
          <EmailConfirmationView 
            email={confirmationEmail}
            onBack={() => setView(View.Login)} 
            onNavigate={handleNavigate}
          />
        )}
        {view === View.ResetPassword && (
          <ResetPasswordView 
            onBack={() => {
              window.history.replaceState({}, '', window.location.pathname);
              setView(View.Login);
            }} 
            onSuccess={() => {
              alert('Password reset successful! Please log in with your new password.');
              window.history.replaceState({}, '', window.location.pathname);
              setView(View.Login);
            }}
          />
        )}
      </Suspense>
    );
  }

  const renderView = () => {
    switch (view) {
      case View.Login:
        return <LoginView 
          onLogin={() => {}} 
          onNavigate={handleNavigate} 
          onEmailConfirmation={handleEmailConfirmation}
          onContinueAsGuest={() => setView(View.Dashboard)}
        />;
      case View.ForgotPassword:
        return <ForgotPasswordView onBack={() => setView(View.Login)} />;
      case View.EmailConfirmation:
        return (
          <EmailConfirmationView 
            email={confirmationEmail}
            onBack={() => setView(View.Login)} 
            onNavigate={handleNavigate}
          />
        );
      case View.ResetPassword:
        return (
          <ResetPasswordView 
            onBack={() => {
              window.history.replaceState({}, '', window.location.pathname);
              setView(View.Login);
            }} 
            onSuccess={() => {
              alert('Password reset successful! Please log in with your new password.');
              window.history.replaceState({}, '', window.location.pathname);
              setView(View.Login);
            }}
          />
        );
      case View.ScenarioSelection:
        return <ScenarioSelectionView onBack={() => setView(View.Dashboard)} onStartPractice={handleStartFilteredPractice} />;
      case View.Practice:
        return currentPatient && <PracticeView patient={currentPatient} userTier={userTier} onFinish={handleFinishPractice} />;
      case View.Feedback:
        return currentSession && <FeedbackView session={currentSession} onDone={handleDoneFromFeedback} onUpgrade={() => setView(View.Paywall)} onStartPractice={handleStartPractice} />;
      case View.History:
        return <HistoryView sessions={sessions} onBack={() => setView(View.Dashboard)} onNavigateToPaywall={() => setView(View.Paywall)} userTier={userTier} />;
      case View.ResourceLibrary:
        return <ResourceLibrary 
                  onBack={() => setView(View.Dashboard)}
                  onUpgrade={() => setView(View.Paywall)} 
                  userTier={userTier}
                />;
      case View.Paywall:
        // For simplicity, 'onBack' from paywall always returns to dashboard.
        // A more complex implementation could use a 'previousView' state.
        return <PaywallView 
          onBack={() => setView(View.Dashboard)} 
          onUpgrade={handleUpgrade} 
          user={user}
          onNavigateToLogin={() => setView(View.Login)}
        />;
      case View.Calendar:
        return <CalendarView 
                  sessions={sessions} 
                  onBack={() => setView(View.Dashboard)}
                  userTier={userTier}
                  onGenerateCoachingSummary={handleGenerateCoachingSummary}
                  isGeneratingSummary={isGeneratingSummary}
                  hasCoachingSummary={!!coachingSummary}
                />;
      case View.Settings:
        return <SettingsView 
                  userTier={userTier} 
                  onNavigateToPaywall={() => setView(View.Paywall)}
                  onLogout={handleLogout}
                  onNavigate={setView}
                  user={user}
                />;
      case View.CancelSubscription:
        if (!user) {
          // Redirect to login if not authenticated
          setView(View.Login);
          return null;
        }
        return <CancelSubscriptionView 
                  user={user}
                  userTier={userTier}
                  onBack={() => setView(View.Settings)}
                  onTierUpdated={async () => {
                    // Reload tier from Supabase after subscription change
                    if (user) {
                      const profile = await getUserProfile(user.id);
                      if (profile && profile.tier) {
                        setUserTier(profile.tier as UserTier);
                        localStorage.setItem('mi-coach-tier', profile.tier);
                      }
                    }
                  }}
                />;
      case View.CoachingSummary:
        return <CoachingSummaryView
                  isLoading={isGeneratingSummary}
                  summary={coachingSummary}
                  error={coachingSummaryError}
                  onBack={() => setView(View.Calendar)}
                />;
      case View.PrivacyPolicy:
        return <PrivacyPolicy onBack={() => setView(View.Settings)} />;
      case View.TermsOfService:
        return <TermsOfService onBack={() => setView(View.Settings)} />;
      case View.SubscriptionTerms:
        return <SubscriptionTerms onBack={() => setView(View.Settings)} />;
      case View.CookiePolicy:
        return <CookiePolicy onBack={() => setView(View.Settings)} />;
      case View.Disclaimer:
        return <Disclaimer onBack={() => setView(View.Settings)} />;
      case View.Support:
        return <SupportView onBack={() => setView(View.Settings)} />;
      case View.Dashboard:
      default:
        return (
          <Dashboard 
            onStartPractice={handleStartPractice} 
            userTier={userTier} 
            sessions={sessions}
            remainingFreeSessions={remainingFreeSessions}
            onNavigateToPaywall={() => setView(View.Paywall)}
          />
        );
    }
  };

  const viewsWithNavBar = [View.Dashboard, View.ResourceLibrary, View.Settings, View.Calendar];
  const isPremiumFeedback = view === View.Feedback && userTier === UserTier.Premium;
  const shouldShowNavBar = viewsWithNavBar.includes(view) || isPremiumFeedback;


  return (
    <div className="min-h-screen bg-slate-50 text-gray-800" id="main-content">
      {/* Offline status indicator */}
      <OfflineIndicator />
      
      {shouldShowNavBar ? (
          <div className="flex flex-col" style={{ height: '100vh' }}>
              <main className="flex-1 overflow-y-auto pb-20" role="main" aria-label="Main content">
                  <Suspense fallback={<PageLoader message="Loading..." />}>
                      {renderView()}
                  </Suspense>
              </main>
              <BottomNavBar currentView={view} onNavigate={handleNavigate} userTier={userTier} />
          </div>
      ) : (
          // Views without the main nav bar (e.g., practice, feedback, paywall)
          // These components manage their own full-screen layout.
          <Suspense fallback={<PageLoader message="Loading..." />}>
              {renderView()}
          </Suspense>
      )}
      {showReviewPrompt && (
          <ReviewPrompt onClose={handleReviewPromptClose} />
      )}
      <CookieConsent />
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
