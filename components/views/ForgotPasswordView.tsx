'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface ForgotPasswordViewProps {
    onBack: () => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBack }) => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    // Handle countdown timer for resend email
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

    const handleSendResetLink = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        setError(null);

        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email);
            setIsSent(true);
            setResendCooldown(60); // Start 60-second countdown
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.';
            showToast(errorMessage, 'error');
            setIsSent(false);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) {
            return; // Prevent resending during cooldown
        }
        await handleSendResetLink();
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col p-4 pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <header className="flex items-center w-full max-w-sm mx-auto pt-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<i className="fa-solid fa-arrow-left" />}
                    aria-label="Go back"
                    className="mr-3"
                />
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Forgot Password
                </h1>
            </header>

            <div className="flex-grow flex flex-col justify-center items-center w-full max-w-sm mx-auto">
                {isSent ? (
                    <div className="text-center animate-slide-fade-in w-full">
                        <div className="mx-auto mb-6 bg-[var(--color-success-light)] h-20 w-20 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-4xl text-[var(--color-success)]" aria-hidden="true"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Check Your Email</h2>
                        <p className="text-[var(--color-text-secondary)] mt-2 mb-4">
                            We've sent a password reset link to <span className="font-semibold text-[var(--color-text-primary)]">{email}</span>. Please follow the instructions in the email to reset your password.
                        </p>
                        <Card variant="accent" padding="md" className="mb-6 text-left">
                            <p className="text-sm text-[var(--color-text-primary)]">
                                <i className="fa-solid fa-info-circle text-[var(--color-info)] mr-2" aria-hidden="true"></i>
                                <strong>Didn't receive the email?</strong>
                            </p>
                            <ul className="text-sm text-[var(--color-text-secondary)] mt-2 ml-6 list-disc space-y-1">
                                <li>Check your spam or junk folder</li>
                                <li>Make sure you entered the correct email address</li>
                                <li>Wait a few minutes and try again</li>
                            </ul>
                        </Card>
                        {resendCooldown > 0 ? (
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                You can request another email in {resendCooldown} second{resendCooldown !== 1 ? 's' : ''}.
                            </p>
                        ) : (
                            <Button
                                onClick={handleResendEmail}
                                disabled={loading}
                                variant="ghost"
                                size="sm"
                                fullWidth
                                className="mb-4"
                                loading={loading}
                            >
                                Resend Email
                            </Button>
                        )}
                        <Button
                            onClick={onBack}
                            variant="ghost"
                            fullWidth
                        >
                            Back to Login
                        </Button>
                    </div>
                ) : (
                    <Card variant="elevated" padding="lg" className="w-full">
                        <form onSubmit={handleSendResetLink} className="text-center">
                            <p className="text-[var(--color-text-secondary)] mb-8">
                                Enter your email address below, and we'll send you a link to reset your password.
                            </p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border border-[var(--color-neutral-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-8 disabled:opacity-50 bg-white text-[var(--color-text-primary)]"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                disabled={!email || loading}
                                loading={loading}
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordView;
