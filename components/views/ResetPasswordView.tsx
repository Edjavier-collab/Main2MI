'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';

interface ResetPasswordViewProps {
    onBack?: () => void;
    onSuccess?: () => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = () => {
    const router = useRouter();
    const { updatePassword, signOut } = useAuth();
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);

            showToast('Password reset successful! You can now log in with your new password.', 'success');
            setSuccess(true);

            // Redirect after delay, sign out just before redirecting
            setTimeout(async () => {
                // Sign out the user
                try {
                    await signOut();
                } catch (signOutError) {
                    console.error("Error signing out:", signOutError);
                }
                router.push('/login');
            }, 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update password. Please try again.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col p-4 pb-24">
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                <div className="flex-grow flex flex-col justify-center items-center w-full max-w-sm mx-auto">
                    <div className="text-center animate-slide-fade-in w-full">
                        <div className="mx-auto mb-6 bg-[var(--color-success-light)] h-20 w-20 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-check text-4xl text-[var(--color-success)]" aria-hidden="true"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Password Reset!</h2>
                        <p className="text-[var(--color-text-secondary)] mt-2 mb-8">
                            Redirecting to login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col p-4 pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <header className="flex items-center w-full max-w-sm mx-auto pt-4 mb-8">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Reset Password
                </h1>
            </header>

            <div className="flex-grow flex flex-col items-center w-full max-w-sm mx-auto">
                <Card variant="elevated" padding="lg" className="w-full">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-[var(--color-error-light)] border border-[var(--color-error)] rounded-md text-[var(--color-error)] text-sm">
                                {error}
                            </div>
                        )}

                        <p className="text-[var(--color-text-secondary)] mb-4">
                            Please enter your new password below.
                        </p>

                        <div>
                            <Input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                label="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New Password"
                                required
                                disabled={loading}
                                autoComplete="new-password"
                                leftIcon={<i className="fa-solid fa-lock" aria-hidden="true" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                                    </button>
                                }
                            />
                            <div className="mt-2">
                                <PasswordStrengthIndicator password={password} showFeedback={true} />
                            </div>
                        </div>

                        <Input
                            id="confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                            disabled={loading}
                            autoComplete="new-password"
                            leftIcon={<i className="fa-solid fa-lock" aria-hidden="true" />}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            size="lg"
                            disabled={loading}
                            loading={loading}
                        >
                            Update Password
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ResetPasswordView;
