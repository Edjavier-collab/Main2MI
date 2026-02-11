'use client';

import React, { useState } from 'react';
import { View } from '../../types';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useLoginViewModel } from '../../hooks/useLoginViewModel';
import './LoginView.css';

interface LoginViewProps {
  onLogin: () => void;
  onNavigate: (view: View) => void;
  onEmailConfirmation?: (email: string) => void;
  onContinueAsGuest?: () => void;
}

/**
 * Email confirmation screen shown after successful signup
 */
const EmailConfirmationScreen: React.FC<{
  vm: ReturnType<typeof useLoginViewModel>;
}> = ({ vm }) => (
  <div className="login-view">
    <div className="login-view__bg-circle-top" aria-hidden="true" />
    <div className="login-view__bg-circle-bottom" aria-hidden="true" />
    <vm.toast.ToastContainer toasts={vm.toast.toasts} onRemove={vm.toast.removeToast} />

    <div className="login-view__form-container">
      <div className="login-view__header">
        <div className="login-view__icon">
          <i className="fa-solid fa-envelope-circle-check text-5xl" aria-hidden="true" />
        </div>
        <h1 className="login-view__title">Check Your Email</h1>
      </div>

      <Card variant="accent" padding="lg" className="mb-6 border-l-4 border-[var(--color-success)]">
        <div className="flex items-start space-x-3">
          <i className="fa-solid fa-check-circle text-[var(--color-success)] text-xl mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold mb-2 text-[var(--color-text-primary)]">Account created successfully!</p>
            <p className="text-sm mb-3 text-[var(--color-text-secondary)]">
              We've sent a confirmation email to <span className="font-medium text-[var(--color-text-primary)]">{vm.status.confirmationEmail}</span>
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

      {vm.status.error && (
        <div className="login-view__error">
          {vm.status.error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          onClick={vm.handlers.handleResendConfirmation}
          disabled={vm.status.resendCooldown > 0 || vm.status.resendLoading || vm.status.loading}
          variant="secondary"
          fullWidth
          loading={vm.status.resendLoading}
        >
          {vm.status.resendCooldown > 0 ? `Resend Email (${vm.status.resendCooldown}s)` : 'Resend Email'}
        </Button>

        <Button
          type="button"
          onClick={vm.handlers.handleCheckStatus}
          disabled={vm.status.checkingStatus || vm.status.loading}
          variant="primary"
          fullWidth
          loading={vm.status.checkingStatus}
        >
          I've Verified My Email
        </Button>

        <Button
          type="button"
          onClick={vm.handlers.handleBackToLogin}
          disabled={vm.status.loading || vm.status.resendLoading || vm.status.checkingStatus}
          variant="ghost"
          fullWidth
        >
          Back to Login
        </Button>
      </div>
    </div>
  </div>
);

/**
 * Google Sign-In button with proper branding
 */
const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
}> = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="login-view__google-btn"
    aria-label="Continue with Google"
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
    <span>Continue with Google</span>
  </button>
);

/**
 * Divider component
 */
const Divider: React.FC<{ text: string }> = ({ text }) => (
  <div className="login-view__divider">
    <div className="login-view__divider-line" />
    <span className="login-view__divider-text">{text}</span>
    <div className="login-view__divider-line" />
  </div>
);

/**
 * Main LoginView component
 */
const LoginView: React.FC<LoginViewProps> = (props) => {
  const vm = useLoginViewModel(props);

  // Track animation direction for mode transitions
  const [animationClass, setAnimationClass] = useState('');

  // Handle mode toggle with animation
  const handleModeToggle = () => {
    setAnimationClass(vm.formState.isSignUp
      ? 'login-view__form--entering-login'
      : 'login-view__form--entering-signup'
    );
    vm.handlers.toggleMode();
    // Clear animation class after animation completes
    setTimeout(() => setAnimationClass(''), 250);
  };

  // Show email confirmation screen if needed
  if (vm.status.emailConfirmationSent) {
    return <EmailConfirmationScreen vm={vm} />;
  }

  return (
    <div className="login-view">
      {/* Background decorations */}
      <div className="login-view__bg-circle-top" aria-hidden="true" />
      <div className="login-view__bg-circle-bottom" aria-hidden="true" />

      <vm.toast.ToastContainer toasts={vm.toast.toasts} onRemove={vm.toast.removeToast} />

      <div className="login-view__form-container">
        {/* Header */}
        <div className="login-view__header">
          <div className="login-view__icon">
            <i className="fa-solid fa-house-medical text-4xl" aria-hidden="true" />
          </div>
          <h1 className="login-view__title">
            {vm.formState.isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="login-view__subtitle">
            {vm.formState.isSignUp
              ? 'Sign up to start your training journey.'
              : 'Sign in to continue your training.'}
          </p>
        </div>

        {/* Main form card */}
        <Card variant="glass" padding="lg" className={`login-view__card ${animationClass}`}>
          {/* Google Sign-In Button */}
          <GoogleSignInButton
            onClick={vm.handlers.handleGoogleSignIn}
            disabled={vm.status.loading}
          />

          <Divider text="Or continue with email" />

          {/* Login/Signup Form */}
          <form onSubmit={vm.handlers.handleSubmit} className="space-y-4">
            {vm.status.error && (
              <div className="login-view__error">
                {vm.status.error}
              </div>
            )}

            {vm.formState.isSignUp && (
              <Input
                id="fullName"
                type="text"
                label="Full Name"
                value={vm.formState.fullName}
                onChange={(e) => vm.handlers.setFullName(e.target.value)}
                onBlur={vm.handlers.setNameTouched}
                placeholder="Full Name"
                required
                disabled={vm.status.loading}
                autoComplete="name"
                error={vm.validation.showNameError ? 'Name must be at least 2 characters' : undefined}
                leftIcon={<i className="fa-solid fa-user" aria-hidden="true" />}
              />
            )}

            <Input
              id="email"
              type="email"
              label="Email Address"
              value={vm.formState.email}
              onChange={(e) => vm.handlers.setEmail(e.target.value)}
              onBlur={vm.handlers.setEmailTouched}
              placeholder="Email"
              required
              disabled={vm.status.loading}
              autoComplete="email"
              error={vm.validation.showEmailError ? 'Please enter a valid email address' : undefined}
              leftIcon={<i className="fa-solid fa-envelope" aria-hidden="true" />}
            />

            <div>
              <Input
                id="password"
                type={vm.formState.showPassword ? 'text' : 'password'}
                label="Password"
                value={vm.formState.password}
                onChange={(e) => vm.handlers.setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={vm.status.loading}
                autoComplete={vm.formState.isSignUp ? 'new-password' : 'current-password'}
                leftIcon={<i className="fa-solid fa-lock" aria-hidden="true" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={vm.handlers.togglePassword}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
                    aria-label={vm.formState.showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${vm.formState.showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                  </button>
                }
              />
              {/* Password strength indicator for sign up */}
              {vm.formState.isSignUp && (
                <div id="password-strength" className="mt-2">
                  <PasswordStrengthIndicator password={vm.formState.password} showFeedback={true} />
                </div>
              )}
            </div>

            {!vm.formState.isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={vm.handlers.handleForgotPassword}
                  disabled={vm.status.loading}
                  className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={vm.status.loading}
              variant="primary"
              fullWidth
              loading={vm.status.loading}
              icon={!vm.status.loading ? (vm.formState.isSignUp ? <i className="fa-solid fa-user-plus" /> : <i className="fa-solid fa-right-to-bracket" />) : undefined}
            >
              {vm.formState.isSignUp ? 'Sign Up' : 'Log In'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleModeToggle}
                disabled={vm.status.loading}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
              >
                {vm.formState.isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </Card>

        {/* Continue as Guest Button (outside card, de-emphasized) */}
        {props.onContinueAsGuest && (
          <div className="login-view__guest-section">
            <Divider text="Or" />
            <Button
              type="button"
              onClick={vm.handlers.handleContinueAsGuest}
              disabled={vm.status.loading}
              variant="ghost"
              fullWidth
              className="login-view__guest-btn"
              icon={<i className="fa-solid fa-user-secret" aria-hidden="true" />}
            >
              Continue as Guest
            </Button>
            <p className="login-view__guest-hint">
              <i className="fa-solid fa-circle-info mr-1" aria-hidden="true" />
              3 free practice sessions per month
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;
