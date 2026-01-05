'use client';

import React, { useState, useMemo } from 'react';
import { View } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import { checkPasswordStrength, validatePassword } from '../../utils/validation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface LoginViewProps {
    onLogin: () => void;
    onNavigate: (view: View) => void;
    onEmailConfirmation?: (email: string) => void;
    onContinueAsGuest?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onNavigate, onEmailConfirmation, onContinueAsGuest }) => {
    const { signIn, signUp, resendSignUpConfirmation } = useAuth();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState<string>('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    // Email format validation
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Real-time validation states
    const isEmailValid = !email || validateEmail(email);
    const isNameValid = !fullName || fullName.trim().length >= 2;
    const showEmailError = emailTouched && email && !validateEmail(email);
    const showNameError = nameTouched && isSignUp && fullName && fullName.trim().length < 2;

    // Handle resend cooldown timer
    React.useEffect(() => {
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

    // Handle resend confirmation email
    const handleResendConfirmation = async () => {
        if (resendCooldown > 0 || !confirmationEmail) return;

        setResendLoading(true);
        setError(null);
        try {
            await resendSignUpConfirmation(confirmationEmail);
            setResendCooldown(60); // 60 second cooldown
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to resend confirmation email. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setResendLoading(false);
        }
    };

    // Handle checking if user has verified their email
    const handleCheckStatus = async () => {
        setCheckingStatus(true);
        setError(null);
        try {
            // Try to sign in with the same credentials to check if email is confirmed
            // This will fail if email is not confirmed, or succeed if it is
            // Note: We don't have the password stored, so we'll just refresh the auth state
            // The AuthProvider's onAuthStateChange listener will handle the rest
            window.location.reload();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unable to check status. Please try again.';
            setError(errorMessage);
        } finally {
            setCheckingStatus(false);
        }
    };

    // Google sign-in placeholder (to be implemented later)
    const handleGoogleSignIn = async () => {
        // TODO: Implement Google OAuth sign-in
        console.log('Google sign-in clicked - to be implemented');
    };

    const handleSubmit = async (e: React.FormEvent) => {
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
                // Only show confirmation screen if email confirmation is actually required
                if (result.requiresConfirmation) {
                    // Email confirmation is required - navigate to confirmation page
                    if (onEmailConfirmation) {
                        onEmailConfirmation(result.email);
                    } else {
                        // Fallback: show inline confirmation (for backwards compatibility)
                        setEmailConfirmationSent(true);
                        setConfirmationEmail(result.email);
                    }
                    // Clear password for security
                    setPassword('');
                    // Don't call onLogin() - user needs to confirm email first
                } else {
                    // User is already signed in (email confirmation disabled or auto-confirmed)
                    // Proceed directly to dashboard
                    onLogin();
                }
            } else {
                await signIn(email, password);
                // Navigation is handled automatically by App.tsx useEffect when user state changes
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Show email confirmation message if needed
    if (emailConfirmationSent) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4">
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <div className="mx-auto h-12 w-12 text-[var(--color-primary)]">
                            <i className="fa-solid fa-envelope-circle-check text-5xl" aria-hidden="true"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-4">Check Your Email</h1>
                    </div>

                    <Card variant="accent" padding="lg" className="mb-6 border-l-4 border-[var(--color-success)]">
                        <div className="flex items-start space-x-3">
                            <i className="fa-solid fa-check-circle text-[var(--color-success)] text-xl mt-0.5 flex-shrink-0" aria-hidden="true"></i>
                            <div className="flex-1">
                                <p className="font-semibold mb-2 text-[var(--color-text-primary)]">Account created successfully!</p>
                                <p className="text-sm mb-3 text-[var(--color-text-secondary)]">
                                    We've sent a confirmation email to <span className="font-medium text-[var(--color-text-primary)]">{confirmationEmail}</span>
                                </p>
                                <p className="text-sm mb-2 text-[var(--color-text-secondary)]">
                                    Please check your email and click the confirmation link to activate your account.
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                    <strong>Tip:</strong> Don't see the email? Check your spam folder or try resending below.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {error && (
                        <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error-dark)] px-4 py-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button
                            type="button"
                            onClick={handleResendConfirmation}
                            disabled={resendCooldown > 0 || resendLoading || loading}
                            variant="secondary"
                            fullWidth
                            loading={resendLoading}
                        >
                            {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email'}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleCheckStatus}
                            disabled={checkingStatus || loading}
                            variant="primary"
                            fullWidth
                            loading={checkingStatus}
                        >
                            I've Verified My Email
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                setEmailConfirmationSent(false);
                                setConfirmationEmail('');
                                setIsSignUp(false);
                                setEmail('');
                                setPassword('');
                                setFullName('');
                                setError(null);
                                setResendCooldown(0);
                            }}
                            disabled={loading || resendLoading || checkingStatus}
                            variant="ghost"
                            fullWidth
                        >
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                        <i className="fa-solid fa-brain text-4xl" aria-hidden="true"></i>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mt-6 tracking-tight">MI Mastery</h1>
                    <p className="text-[var(--color-text-secondary)] mt-2">Elevate your practice with clinical AI.</p>
                </div>

                {/* Google Sign-In Button */}
                <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    variant="secondary"
                    fullWidth
                    className="mb-4 bg-white border border-[var(--color-neutral-300)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-accent)]"
                    icon={
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    }
                >
                    <span className="text-inherit">Continue with Google</span>
                </Button>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-[var(--color-neutral-300)]"></div>
                    <span className="px-2 text-sm text-[var(--color-text-muted)]">Or continue with email</span>
                    <div className="flex-grow border-t border-[var(--color-neutral-300)]"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error-dark)] px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {isSignUp && (
                        <Input
                            id="fullName"
                            type="text"
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onBlur={() => setNameTouched(true)}
                            placeholder="Full Name"
                            required
                            disabled={loading}
                            autoComplete="name"
                            error={showNameError ? 'Name must be at least 2 characters' : undefined}
                            leftIcon={<i className="fa-solid fa-user" aria-hidden="true"></i>}
                        />
                    )}
                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="Email"
                        required
                        disabled={loading}
                        autoComplete="email"
                        error={showEmailError ? 'Please enter a valid email address' : undefined}
                        leftIcon={<i className="fa-solid fa-envelope" aria-hidden="true"></i>}
                    />
                    <div>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            disabled={loading}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            leftIcon={<i className="fa-solid fa-lock" aria-hidden="true"></i>}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                </button>
                            }
                        />
                        {/* Password strength indicator for sign up */}
                        {isSignUp && (
                            <div id="password-strength" className="mt-2">
                                <PasswordStrengthIndicator password={password} showFeedback={true} />
                            </div>
                        )}
                    </div>
                    {!isSignUp && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => onNavigate(View.ForgotPassword)}
                                disabled={loading}
                                className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] disabled:opacity-50"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={loading}
                        variant="primary"
                        fullWidth
                        loading={loading}
                        icon={!loading ? (isSignUp ? <i className="fa-solid fa-user-plus" /> : <i className="fa-solid fa-right-to-bracket" />) : undefined}
                    >
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </Button>
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            disabled={loading}
                            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
                        >
                            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>

                {/* Continue as Guest Button */}
                {onContinueAsGuest && (
                    <div className="mt-6">
                        <div className="flex items-center my-6">
                            <div className="flex-grow border-t border-[var(--color-neutral-300)]"></div>
                            <span className="px-2 text-sm text-[var(--color-text-muted)]">Or</span>
                            <div className="flex-grow border-t border-[var(--color-neutral-300)]"></div>
                        </div>
                        <Button
                            type="button"
                            onClick={onContinueAsGuest}
                            disabled={loading}
                            variant="soft"
                            fullWidth
                        >
                            Continue as Guest
                        </Button>
                        <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
                            3 free practice sessions per month
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginView;