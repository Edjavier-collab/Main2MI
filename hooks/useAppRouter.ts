import { useEffect, useRef } from 'react';
import { View } from '../types';

interface UseAppRouterOptions {
  user: { id: string } | null;
  authLoading: boolean;
  view: View;
  setView: (view: View) => void;
}

// Map views to URL paths for history management
const VIEW_TO_PATH: Partial<Record<View, string>> = {
  [View.Dashboard]: '/',
  [View.Login]: '/login',
  [View.ForgotPassword]: '/forgot-password',
  [View.ResetPassword]: '/reset-password',
  [View.EmailConfirmation]: '/confirm-email',
  [View.Practice]: '/practice',
  [View.Feedback]: '/feedback',
  [View.ScenarioSelection]: '/scenarios',
  [View.Settings]: '/settings',
  [View.Paywall]: '/upgrade',
  [View.Reports]: '/reports',
  [View.Calendar]: '/calendar',
  [View.CoachingSummary]: '/coaching-summary',
  [View.ResourceLibrary]: '/resources',
  [View.History]: '/history',
  [View.CancelSubscription]: '/cancel-subscription',
  [View.PrivacyPolicy]: '/privacy',
  [View.TermsOfService]: '/terms',
  [View.SubscriptionTerms]: '/subscription-terms',
  [View.CookiePolicy]: '/cookies',
  [View.Disclaimer]: '/disclaimer',
  [View.Support]: '/support',
};

// Map URL paths back to views
const PATH_TO_VIEW: Record<string, View> = Object.entries(VIEW_TO_PATH).reduce(
  (acc, [view, path]) => {
    if (path) acc[path] = view as View;
    return acc;
  },
  {} as Record<string, View>
);

/**
 * Hook to handle view routing based on authentication state
 * Navigates to dashboard when user logs in, allows anonymous access to free tier features
 * Also manages browser history for back button support
 */
export const useAppRouter = ({ user, authLoading, view, setView }: UseAppRouterOptions) => {
  const previousViewRef = useRef<View | null>(null);
  const isHandlingPopStateRef = useRef(false);

  // Update URL when view changes
  useEffect(() => {
    if (authLoading) return;

    const path = VIEW_TO_PATH[view];
    if (path && window.location.pathname !== path) {
      // Only push to history if this is a new navigation (not from popstate)
      if (!isHandlingPopStateRef.current) {
        window.history.pushState({ view }, '', path);
      }
      isHandlingPopStateRef.current = false;
    }

    previousViewRef.current = view;
  }, [view, authLoading]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isHandlingPopStateRef.current = true;
      
      if (event.state?.view) {
        // Navigate to the view from history state
        setView(event.state.view);
      } else {
        // If no state, try to parse the URL
        const path = window.location.pathname;
        const viewFromPath = PATH_TO_VIEW[path];
        if (viewFromPath) {
          setView(viewFromPath);
        } else {
          // Default to dashboard
          setView(View.Dashboard);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setView]);

  // Set initial view from URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    const viewFromPath = PATH_TO_VIEW[path];
    
    // Don't change view during auth loading or if already on the correct view
    if (authLoading) return;
    
    // Handle auth callback URLs (they have special query params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('access_token') || urlParams.has('type')) {
      // Auth callback - let useAuthCallback handle it
      return;
    }
    
    // Handle Stripe callback
    if (urlParams.has('session_id')) {
      // Stripe callback - let useStripeCallback handle it
      return;
    }

    // Initialize history state on mount
    if (!window.history.state?.view) {
      const initialView = viewFromPath || View.Dashboard;
      window.history.replaceState({ view: initialView }, '', VIEW_TO_PATH[initialView] || '/');
    }
  }, [authLoading]);

  // Auth-based redirects - FIXED: Use ref to prevent infinite loops
  const previousUserRef = useRef<{ id: string } | null>(null);
  const redirectHandledRef = useRef(false);
  
  useEffect(() => {
    if (authLoading) {
      return; // Don't change view while loading
    }

    // Only handle redirects when user state actually changes, not on every view change
    const userChanged = previousUserRef.current !== user;
    previousUserRef.current = user;

    if (user) {
      // User is logged in, navigate to dashboard if on login-related screens
      // But don't navigate away from reset password if they're in the middle of resetting
      if (view === View.Login || view === View.ForgotPassword || view === View.EmailConfirmation) {
        // Only redirect if user just logged in (userChanged) or if we haven't handled this redirect yet
        if (userChanged || !redirectHandledRef.current) {
          setView(View.Dashboard);
          redirectHandledRef.current = true;
        }
      } else {
        redirectHandledRef.current = false;
      }
    } else {
      // User is not logged in - allow anonymous access to free tier features
      // Only show login if on login/auth screens, otherwise allow Dashboard and other views
      if (view === View.Login || view === View.ForgotPassword || view === View.EmailConfirmation || view === View.ResetPassword) {
        // Already on auth screens, stay there
        redirectHandledRef.current = false;
        return;
      }
      // Practice-related views require authentication - redirect to login
      if (view === View.Practice || view === View.Feedback || view === View.ScenarioSelection) {
        // Only redirect if we haven't handled this redirect yet
        if (!redirectHandledRef.current) {
          console.log('[useAppRouter] Practice view requires authentication, redirecting to login');
          setView(View.Login);
          redirectHandledRef.current = true;
        }
        return;
      }
      // Anonymous users can access Dashboard, Paywall (shows login prompt), Settings (shows sign up), and other free tier views
      // Only redirect premium-only views that require authentication
      if (view === View.Calendar || view === View.CoachingSummary || view === View.CancelSubscription) {
        // Only redirect if we haven't handled this redirect yet
        if (!redirectHandledRef.current) {
          // These views require login - redirect to dashboard
          setView(View.Dashboard);
          redirectHandledRef.current = true;
        }
        return;
      }
      // Reset redirect flag for allowed views
      redirectHandledRef.current = false;
      // Note: PaywallView and SettingsView handle anonymous users by showing login/signup prompts
    }
  }, [user, authLoading, view, setView]);
};

