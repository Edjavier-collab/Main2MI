'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface ResetPasswordViewProps {
    onBack: () => void;
    onSuccess: () => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onBack, onSuccess }) => {
    const { updatePassword, signOut } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    // Check if we have a valid reset token from URL
    useEffect(() => {
        const checkToken = async () => {
            if (!isSupabaseConfigured()) {
                setIsValidToken(false);
                setError('Password reset is not available in offline mode.');
                return;
            }

            try {
                const supabase = getSupabaseClient();
                
                // Check URL hash for recovery token first
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');
                
                // If we have a recovery token in the URL, Supabase will process it
                // and create a session automatically via auth state change
                if (accessToken && type === 'recovery') {
                    // Wait a moment for Supabase to process the token
                    setTimeout(async () => {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            setIsValidToken(true);
                        } else {
                            setIsValidToken(false);
                            setError('Invalid or expired reset link. Please request a new password reset.');
                        }
                    }, 500);
                } else {
                    // Check if we already have a session (token was already processed)
                    const { data: { session } } = await supabase.auth.getSession();
                    
                    if (session) {
                        setIsValidToken(true);
                    } else {
                        setIsValidToken(false);
                        setError('Invalid or expired reset link. Please request a new password reset.');
                    }
                }
            } catch (err) {
                setIsValidToken(false);
                setError('Failed to validate reset link. Please try again.');
            }
        };

        checkToken();
    }, []);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        if (!/(?=.*[a-z])/.test(pwd)) {
            return 'Password must contain at least one lowercase letter.';
        }
        if (!/(?=.*[A-Z])/.test(pwd)) {
            return 'Password must contain at least one uppercase letter.';
        }
        if (!/(?=.*\d)/.test(pwd)) {
            return 'Password must contain at least one number.';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!password || !confirmPassword) {
            setError('Please enter both password fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);
        try {
            await updatePassword(password);
            // Sign out the user after password reset so they can log in with new password
            try {
                await signOut();
            } catch (signOutError) {
                console.warn('[ResetPasswordView] Error signing out after password reset:', signOutError);
                // Continue anyway - we'll still navigate to login
            }
            // Clear URL hash to remove token
            window.history.replaceState({}, '', window.location.pathname);
            onSuccess();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isValidToken === null) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col p-4">
                <div className="flex-grow flex flex-col justify-center items-center w-full max-w-sm mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
                        <p className="text-[var(--color-text-secondary)]">Validating reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col p-4 pb-24">
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                <header className="flex items-center w-full max-w-sm mx-auto pt-4">
                    <BackButton onClick={onBack} className="mr-3" />
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        Reset Password
                    </h1>
                </header>

                <div className="flex-grow flex flex-col justify-center items-center w-full max-w-sm mx-auto">
                    <Card variant="elevated" padding="lg" className="text-center w-full">
                        <div className="mx-auto mb-6 bg-[var(--color-error-light)] h-20 w-20 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-exclamation-triangle text-4xl text-[var(--color-error)]" aria-hidden="true"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Invalid Reset Link</h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <BackButton onClick={onBack} className="w-full justify-center" />
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col p-4 pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <header className="flex items-center w-full max-w-sm mx-auto pt-4">
                <BackButton onClick={onBack} className="mr-3" />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Reset Password
                </h1>
            </header>

            <div className="flex-grow flex flex-col justify-center items-center w-full max-w-sm mx-auto">
                <Card variant="elevated" padding="lg" className="w-full">
                    <form onSubmit={handleSubmit}>
                        <p className="text-[var(--color-text-secondary)] mb-6 text-center">
                            Enter your new password below.
                        </p>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 bg-white text-[var(--color-text-primary)]"
                            />
                            <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                Must be at least 8 characters with uppercase, lowercase, and a number.
                            </p>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 bg-white text-[var(--color-text-primary)]"
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={!password || !confirmPassword || loading}
                            loading={loading}
                        >
                            Reset Password
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ResetPasswordView;

