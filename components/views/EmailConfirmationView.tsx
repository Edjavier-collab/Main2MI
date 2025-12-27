'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { View } from '../../types';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface EmailConfirmationViewProps {
    email: string;
    onBack: () => void;
    onNavigate: (view: View) => void;
}

const EmailConfirmationView: React.FC<EmailConfirmationViewProps> = ({ email, onBack, onNavigate }) => {
    const { resendSignUpConfirmation } = useAuth();
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    // If email is not provided, redirect back to login
    useEffect(() => {
        if (!email || email.trim() === '') {
            console.warn('[EmailConfirmationView] No email provided, redirecting to login');
            onBack();
        }
    }, [email, onBack]);

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

    // Handle resend confirmation email
    const handleResendConfirmation = async () => {
        if (resendCooldown > 0 || !email || email.trim() === '') {
            if (!email || email.trim() === '') {
                setError('Email address is required to resend confirmation');
            }
            return;
        }

        setResendLoading(true);
        setError(null);
        try {
            await resendSignUpConfirmation(email);
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
            // Reload the page to check auth state
            // The auth state change listener will detect if user is now logged in
            window.location.reload();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unable to check status. Please try again.';
            setError(errorMessage);
        } finally {
            setCheckingStatus(false);
        }
    };

    // Don't render if email is missing
    if (!email || email.trim() === '') {
        return null;
    }

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
                                We've sent a confirmation email to <span className="font-medium text-[var(--color-text-primary)]">{email}</span>
                            </p>
                            <p className="text-sm mb-2 text-[var(--color-text-secondary)]">
                                Please check your email and click the confirmation link to activate your account.
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                <strong>Tip:</strong> Don't see the email? Check your spam folder or try resending below.
                            </p>
                            <Card variant="accent" padding="sm" className="mt-2 bg-[var(--color-warning-light)]">
                                <p className="text-xs text-[var(--color-text-primary)]">
                                    <strong>Note:</strong> If emails aren't being sent, your Supabase project may need SMTP configuration. 
                                    See <code className="text-xs">EMAIL_SETUP.md</code> for setup instructions.
                                </p>
                            </Card>
                        </div>
                    </div>
                </Card>

                <div className="space-y-3">
                    <Button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendCooldown > 0 || resendLoading}
                        variant="secondary"
                        fullWidth
                        loading={resendLoading}
                    >
                        {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : 'Resend Email'}
                    </Button>

                    <Button
                        type="button"
                        onClick={handleCheckStatus}
                        disabled={checkingStatus}
                        variant="primary"
                        fullWidth
                        loading={checkingStatus}
                    >
                        I've Verified My Email
                    </Button>

                    <BackButton
                        onClick={onBack}
                        className="w-full justify-center"
                    />
                </div>
            </div>
        </div>
    );
};

export default EmailConfirmationView;


