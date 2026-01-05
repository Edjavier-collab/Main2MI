'use client';

import React, { useState } from 'react';
import { redirectToCheckout } from '../../services/stripeService';
import { User } from '@supabase/supabase-js';
import { View } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface PaywallViewProps {
    onBack: () => void;
    onUpgrade: () => void;
    user: User | null;
    onNavigateToLogin?: () => void;
    onNavigate?: (view: View) => void;
    onRestorePurchase?: () => Promise<boolean>;
}

const FeatureItem: React.FC<{ icon: string; text: React.ReactNode }> = ({ icon, text }) => (
    <li className="flex items-center text-[var(--color-text-primary)]">
        <i className={`fa-solid ${icon} text-[var(--color-primary)] w-6 text-center`} aria-hidden="true"></i>
        <span className="ml-3">{text}</span>
    </li>
);

const PaywallView: React.FC<PaywallViewProps> = ({ onBack, onUpgrade, user, onNavigateToLogin, onNavigate, onRestorePurchase }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    // If no user (anonymous), show login prompt instead of checkout
    if (!user) {
        return (
            <div className="min-h-screen bg-transparent pb-24">
                <ToastContainer toasts={toasts} onRemove={removeToast} />

                {/* Header */}
                <div className="px-6 pt-4 pb-2">
                    <div className="px-6 pt-4 pb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            icon={<i className="fa-solid fa-arrow-left" />}
                            aria-label="Go back"
                            className="pl-0"
                        >
                            Back
                        </Button>
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto px-6 text-center">
                    <div className="mb-6">
                        <div className="mx-auto mb-4 bg-[var(--color-primary-lighter)] h-20 w-20 rounded-full flex items-center justify-center ring-8 ring-[var(--color-primary-lighter)]/50 shadow-md">
                            <i className="fa-solid fa-user-lock text-4xl text-[var(--color-primary-dark)]" aria-hidden="true"></i>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-2">Create an Account to Upgrade</h1>
                        <p className="text-[var(--color-text-secondary)]">Sign up or log in to unlock unlimited practice sessions and premium features!</p>
                    </div>

                    <Card variant="elevated" padding="md" className="mb-6 text-left">
                        <p className="text-[var(--color-text-secondary)] mb-4">Creating an account gives you:</p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-[var(--color-text-primary)]">
                                <i className="fa-solid fa-check text-[var(--color-primary)] w-6 text-center" aria-hidden="true"></i>
                                <span className="ml-3">Unlimited practice sessions</span>
                            </li>
                            <li className="flex items-center text-[var(--color-text-primary)]">
                                <i className="fa-solid fa-check text-[var(--color-primary)] w-6 text-center" aria-hidden="true"></i>
                                <span className="ml-3">Access to all premium features</span>
                            </li>
                            <li className="flex items-center text-[var(--color-text-primary)]">
                                <i className="fa-solid fa-check text-[var(--color-primary)] w-6 text-center" aria-hidden="true"></i>
                                <span className="ml-3">Secure session history across devices</span>
                            </li>
                        </ul>
                    </Card>

                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                if (onNavigateToLogin) {
                                    onNavigateToLogin();
                                } else {
                                    onBack();
                                }
                            }}
                            className="w-full py-3 bg-white border border-[var(--color-neutral-300)] rounded-lg shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 text-[var(--color-text-primary)] font-bold text-lg"
                        >
                            Sign Up or Log In
                        </button>
                        <Button
                            onClick={onBack}
                            variant="ghost"
                            fullWidth
                            className="w-full justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                            Continue as Guest (3 free sessions/month)
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const handleRestore = async () => {
        if (!onRestorePurchase) return;

        setLoading('restore');
        try {
            showToast('Checking for active subscriptions...', 'info');
            const success = await onRestorePurchase();
            if (success) {
                showToast('Subscription restored successfully!', 'success');
            } else {
                showToast('No active subscription found.', 'warning');
            }
        } catch (err) {
            showToast('Failed to restore purchase. Please try again.', 'error');
        } finally {
            setLoading(null);
        }
    };

    const handleSubscribe = async (plan: 'monthly' | 'annual') => {
        if (!user) {
            showToast('Please log in to subscribe', 'warning');
            return;
        }

        setLoading(plan);
        setError(null);

        try {
            console.log('[PaywallView] Starting checkout for plan:', plan, 'email:', user.email);
            await redirectToCheckout(user.id, plan, user.email || undefined);
            // Note: redirectToCheckout will redirect the page, so code below won't execute
        } catch (err) {
            console.error('[PaywallView] Checkout error:', err);
            showToast(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.', 'error');
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Header */}
            <div className="px-6 pt-4 pb-2">
                <div className="px-6 pt-4 pb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        icon={<i className="fa-solid fa-arrow-left" />}
                        aria-label="Go back"
                        className="pl-0"
                    >
                        Back
                    </Button>
                </div>
            </div>

            <div className="w-full max-w-md mx-auto px-6 text-center">
                <div className="mb-6">
                    <div className="mx-auto mb-4 bg-[var(--color-primary-lighter)] h-20 w-20 rounded-full flex items-center justify-center ring-8 ring-[var(--color-primary-lighter)]/50 shadow-md">
                        <i className="fa-solid fa-rocket text-4xl text-[var(--color-primary-dark)]" aria-hidden="true"></i>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-2">Unlimited Practice for Real-World Success</h1>
                    <p className="text-[var(--color-text-secondary)]">You've used your 3 free practices for the month. Upgrade now for unlimited access!</p>
                </div>

                <Card variant="elevated" padding="md" className="mb-6 text-left">
                    <ul className="space-y-4">
                        <FeatureItem icon="fa-infinity" text={<span><span className="font-semibold">Unlimited</span> Practice Sessions</span>} />
                        <FeatureItem icon="fa-clock" text={<span><span className="font-semibold">Full 5-Minute</span> Conversations</span>} />
                        <FeatureItem icon="fa-chart-pie" text={<span><span className="font-semibold">In-Depth</span> Performance Analysis</span>} />
                        <FeatureItem icon="fa-book-open" text={<span>Access <span className="font-semibold">All Resources & Scenarios</span></span>} />
                        <FeatureItem icon="fa-calendar-days" text={<span>Full <span className="font-semibold">Session History</span> & Calendar View</span>} />
                    </ul>
                </Card>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                        className="relative w-14 h-8 bg-[var(--color-neutral-200)] rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-6 bg-[var(--color-primary)]' : 'translate-x-0'}`}></div>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>Annual</span>
                        <span className="bg-warning/20 text-warning-dark text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-warning/30">Save 30%</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Dynamic Pricing Card */}
                    <div
                        className={`relative rounded-3xl border-2 transition-all duration-300 overflow-hidden bg-white shadow-xl ${billingCycle === 'annual' ? 'border-[var(--color-primary)]' : 'border-[var(--color-neutral-200)]'
                            }`}
                    >
                        {billingCycle === 'annual' && (
                            <div className="bg-[var(--color-primary)] text-white text-[10px] font-black py-1.5 uppercase tracking-widest text-center shadow-inner">
                                Best Value • Save $36 Yearly
                            </div>
                        )}

                        <div className="p-8 text-center">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                                    {billingCycle === 'annual' ? 'Annual Pro' : 'Monthly Pro'}
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Full access to MI Mastery</p>
                            </div>

                            <div className="flex items-baseline justify-center gap-1 mb-6">
                                <span className="text-4xl font-black text-[var(--color-text-primary)]">
                                    {billingCycle === 'annual' ? '$6.99' : '$9.99'}
                                </span>
                                <span className="text-sm font-bold text-[var(--color-text-muted)]">/month</span>
                            </div>

                            {billingCycle === 'annual' && (
                                <p className="text-xs font-bold text-[var(--color-success)] mb-6 bg-success/5 py-2 px-3 rounded-lg inline-block">
                                    Billed as $83.88 annually
                                </p>
                            )}
                            {billingCycle === 'monthly' && (
                                <p className="text-xs font-bold text-[var(--color-text-muted)] mb-6 py-2 px-3 rounded-lg inline-block">
                                    Billed monthly • Cancel anytime
                                </p>
                            )}

                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={() => handleSubscribe(billingCycle)}
                                loading={loading === billingCycle}
                                disabled={loading !== null}
                                className="shadow-lg shadow-primary/20 h-14 text-lg font-bold"
                            >
                                {loading === billingCycle ? 'Processing...' : `Upgrade to ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-xs text-[var(--color-text-muted)]">
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={handleRestore}
                            disabled={loading !== null}
                            className="hover:text-[var(--color-text-primary)] hover:underline transition-colors font-medium cursor-pointer"
                        >
                            Restore Purchase
                        </button>
                        <button
                            onClick={() => onNavigate?.(View.PrivacyPolicy)}
                            className="hover:text-[var(--color-text-primary)] hover:underline transition-colors"
                        >
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => onNavigate?.(View.TermsOfService)}
                            className="hover:text-[var(--color-text-primary)] hover:underline transition-colors"
                        >
                            Terms of Service
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaywallView;