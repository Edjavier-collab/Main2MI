import { useState, useCallback, useEffect, useRef } from 'react';
import { View } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { checkPasswordStrength, validatePassword } from '../utils/validation';
import { useToast } from '../components/ui/Toast';

/**
 * Options for the useLoginViewModel hook
 */
interface UseLoginViewModelOptions {
  onLogin: () => void;
  onNavigate: (view: View) => void;
  onEmailConfirmation?: (email: string) => void;
  onContinueAsGuest?: () => void;
}

/**
 * Form state for login/signup
 */
interface FormState {
  email: string;
  password: string;
  fullName: string;
  isSignUp: boolean;
  showPassword: boolean;
}

/**
 * Validation state
 */
interface ValidationState {
  isEmailValid: boolean;
  isNameValid: boolean;
  showEmailError: boolean;
  showNameError: boolean;
  emailTouched: boolean;
  nameTouched: boolean;
}

/**
 * Status/loading state
 */
interface StatusState {
  loading: boolean;
  error: string | null;
  emailConfirmationSent: boolean;
  confirmationEmail: string;
  resendCooldown: number;
  resendLoading: boolean;
  checkingStatus: boolean;
}

/**
 * Handler functions returned by the hook
 */
interface Handlers {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setFullName: (name: string) => void;
  setEmailTouched: () => void;
  setNameTouched: () => void;
  togglePassword: () => void;
  toggleMode: () => void;
  clearError: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleGoogleSignIn: () => void;
  handleResendConfirmation: () => Promise<void>;
  handleCheckStatus: () => void;
  handleBackToLogin: () => void;
  handleForgotPassword: () => void;
  handleContinueAsGuest: () => void;
}

/**
 * Return type for useLoginViewModel
 */
interface UseLoginViewModelReturn {
  formState: FormState;
  validation: ValidationState;
  status: StatusState;
  toast: ReturnType<typeof useToast>;
  handlers: Handlers;
}

/**
 * Email validation helper
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Hook to manage login/signup view state and logic
 * Extracts all business logic from LoginView for better maintainability
 */
export const useLoginViewModel = ({
  onLogin,
  onNavigate,
  onEmailConfirmation,
  onContinueAsGuest,
}: UseLoginViewModelOptions): UseLoginViewModelReturn => {
  const { signIn, signUp, resendSignUpConfirmation } = useAuth();
  const toast = useToast();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation tracking
  const [emailTouched, setEmailTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Ref for cooldown interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Computed validation state
  const isEmailValid = !email || validateEmail(email);
  const isNameValid = !fullName || fullName.trim().length >= 2;
  const showEmailError = emailTouched && email.length > 0 && !validateEmail(email);
  const showNameError = nameTouched && isSignUp && fullName.length > 0 && fullName.trim().length < 2;

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      intervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [resendCooldown]);

  // Form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Enhanced password validation for sign up
    if (isSignUp) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.error || 'Password does not meet requirements.');
        return;
      }

      // Additional strength check
      const strength = checkPasswordStrength(password);
      if (!strength.isValid) {
        setError('Please create a stronger password with uppercase, lowercase, numbers, and special characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp(email, password, fullName);
        if (result.requiresConfirmation) {
          if (onEmailConfirmation) {
            onEmailConfirmation(result.email);
          } else {
            setEmailConfirmationSent(true);
            setConfirmationEmail(result.email);
          }
          setPassword('');
        } else {
          onLogin();
        }
      } else {
        await signIn(email, password);
        // Navigation handled by App.tsx when user state changes
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      toast.showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [email, password, fullName, isSignUp, signIn, signUp, onLogin, onEmailConfirmation, toast]);

  // Google sign-in placeholder
  const handleGoogleSignIn = useCallback(() => {
    // TODO: Implement Google OAuth sign-in
    console.log('[useLoginViewModel] Google sign-in clicked - to be implemented');
  }, []);

  // Resend confirmation email
  const handleResendConfirmation = useCallback(async () => {
    if (resendCooldown > 0 || !confirmationEmail) return;

    setResendLoading(true);
    setError(null);
    try {
      await resendSignUpConfirmation(confirmationEmail);
      setResendCooldown(60);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend confirmation email. Please try again.';
      toast.showToast(errorMessage, 'error');
    } finally {
      setResendLoading(false);
    }
  }, [resendCooldown, confirmationEmail, resendSignUpConfirmation, toast]);

  // Check if user has verified email
  const handleCheckStatus = useCallback(() => {
    setCheckingStatus(true);
    setError(null);
    // Refresh page to check auth state
    window.location.reload();
  }, []);

  // Toggle between login and signup modes
  const toggleMode = useCallback(() => {
    setIsSignUp((prev) => !prev);
    setError(null);
  }, []);

  // Toggle password visibility
  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Back to login from email confirmation
  const handleBackToLogin = useCallback(() => {
    setEmailConfirmationSent(false);
    setConfirmationEmail('');
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setResendCooldown(0);
  }, []);

  // Navigate to forgot password
  const handleForgotPassword = useCallback(() => {
    onNavigate(View.ForgotPassword);
  }, [onNavigate]);

  // Continue as guest
  const handleContinueAsGuest = useCallback(() => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
  }, [onContinueAsGuest]);

  return {
    formState: {
      email,
      password,
      fullName,
      isSignUp,
      showPassword,
    },
    validation: {
      isEmailValid,
      isNameValid,
      showEmailError,
      showNameError,
      emailTouched,
      nameTouched,
    },
    status: {
      loading,
      error,
      emailConfirmationSent,
      confirmationEmail,
      resendCooldown,
      resendLoading,
      checkingStatus,
    },
    toast,
    handlers: {
      setEmail,
      setPassword,
      setFullName,
      setEmailTouched: () => setEmailTouched(true),
      setNameTouched: () => setNameTouched(true),
      togglePassword,
      toggleMode,
      clearError,
      handleSubmit,
      handleGoogleSignIn,
      handleResendConfirmation,
      handleCheckStatus,
      handleBackToLogin,
      handleForgotPassword,
      handleContinueAsGuest,
    },
  };
};
