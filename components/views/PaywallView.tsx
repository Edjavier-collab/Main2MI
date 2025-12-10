import React, { useState } from 'react';
import { redirectToCheckout } from '../../services/stripeService';
import { User } from '@supabase/supabase-js';
import { View } from '../../types';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface PaywallViewProps {
    onBack: () => void;
    onUpgrade: () => void;
    user: User | null;
    onNavigateToLogin?: () => void;
}

const FeatureItem: React.FC<{ icon: string; text: React.ReactNode }> = ({ icon, text }) => (
    <li className="flex items-center text-[var(--color-text-primary)]">
        <i className={`fa-solid ${icon} text-[var(--color-primary)] w-6 text-center`} aria-hidden="true"></i>
        <span className="ml-3">{text}</span>
    </li>
);

const PaywallView: React.FC<PaywallViewProps> = ({ onBack, onUpgrade, user, onNavigateToLogin }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    // If no user (anonymous), show login prompt instead of checkout
    if (!user) {
        return (
            <div className="min-h-screen bg-transparent pb-24">
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                
            {/* Header */}
            <div className="relative h-20 overflow-hidden">
                <div className="relative z-10 flex items-center justify-start h-full px-6 pt-4">
                    <button 
                        onClick={onBack}
                        aria-label="Go back"
                        className="inline-flex items-center justify-center w-10 h-10 bg-white border border-[var(--color-neutral-300)] rounded-full shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                    >
                        <i className="fa-solid fa-arrow-left text-[var(--color-text-primary)]" aria-hidden="true"></i>
                    </button>
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
                        <BackButton
                            onClick={onBack}
                            label="Continue as Guest (3 free sessions/month)"
                            className="w-full justify-center"
                        />
                    </div>
                </div>
            </div>
        );
    }

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
            <div className="relative h-20 overflow-hidden">
                <div className="relative z-10 flex items-center justify-start h-full px-6 pt-4">
                    <button 
                        onClick={onBack}
                        aria-label="Go back"
                        className="inline-flex items-center justify-center w-10 h-10 bg-white border border-[var(--color-neutral-300)] rounded-full shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                    >
                        <i className="fa-solid fa-arrow-left text-[var(--color-text-primary)]" aria-hidden="true"></i>
                    </button>
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

                <div className="space-y-5">
                    {/* Annual Plan - Fully Clickable Tile */}
                    <div
                        role="button"
                        tabIndex={loading !== null ? -1 : 0}
                        onClick={() => loading === null && handleSubscribe('annual')}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && loading === null) {
                                e.preventDefault();
                                handleSubscribe('annual');
                            }
                        }}
                        className={`relative rounded-[var(--radius-lg)] border-[3px] border-[var(--color-primary)] bg-gradient-to-br from-[var(--color-bg-accent)] to-white p-7 text-left transition-all duration-300 ease-out shadow-lg ${
                            loading !== null
                                ? 'opacity-70 cursor-not-allowed'
                                : 'cursor-pointer tile-hover active:scale-[0.98] hover:shadow-2xl hover:border-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2'
                        }`}
                        aria-label="Subscribe to Annual Plan for $99.99 per year"
                        aria-disabled={loading !== null}
                    >
                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-white text-[var(--color-text-primary)] text-base font-extrabold px-6 py-2 rounded-full uppercase shadow-xl flex items-center gap-2 whitespace-nowrap z-10">
                            <i className="fa-solid fa-star text-sm"></i>
                            Best Value
                        </div>
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-extrabold text-xl text-[var(--color-text-primary)]">Annual Plan</h3>
                                <p className="font-bold text-[var(--color-primary-dark)] text-base mt-1">Get 2 months free!</p>
                            </div>
                            <div className="text-right">
                                <p className="font-extrabold text-3xl text-[var(--color-text-primary)]">$99.99</p>
                                <p className="text-[var(--color-text-muted)] text-sm font-semibold">/year</p>
                            </div>
                        </div>
                        <button className={`w-full py-4 rounded-xl font-extrabold text-lg text-center transition-all duration-300 shadow-md ${
                            loading === 'annual'
                                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'
                                : 'bg-[var(--color-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-dark)] hover:shadow-lg hover:scale-[1.02]'
                        }`} disabled={loading !== null} type="button">
                            {loading === 'annual' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                                    Processing...
                                </span>
                            ) : (
                                'Subscribe Annually'
                            )}
                        </button>
                    </div>

                    {/* Monthly Plan - Fully Clickable Tile */}
                    <div
                        role="button"
                        tabIndex={loading !== null ? -1 : 0}
                        onClick={() => loading === null && handleSubscribe('monthly')}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && loading === null) {
                                e.preventDefault();
                                handleSubscribe('monthly');
                            }
                        }}
                        className={`relative rounded-[var(--radius-lg)] border-[3px] border-[var(--color-primary-light)] bg-gradient-to-br from-[var(--color-bg-accent)] to-white p-7 text-left shadow-lg transition-all duration-300 ease-out ${
                            loading !== null
                                ? 'opacity-70 cursor-not-allowed'
                                : 'cursor-pointer tile-hover active:scale-[0.98] hover:shadow-2xl hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2'
                        }`}
                        aria-label="Subscribe to Monthly Plan for $9.99 per month"
                        aria-disabled={loading !== null}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-extrabold text-xl text-[var(--color-text-primary)]">Monthly Plan</h3>
                                <p className="text-[var(--color-text-secondary)] text-base font-semibold mt-1">Billed monthly</p>
                            </div>
                            <div className="text-right">
                                <p className="font-extrabold text-3xl text-[var(--color-text-primary)]">$9.99</p>
                                <p className="text-[var(--color-text-muted)] text-sm font-semibold">/month</p>
                            </div>
                        </div>
                        <button className={`w-full py-4 rounded-xl font-extrabold text-lg text-center transition-all duration-300 shadow-md ${
                            loading === 'monthly'
                                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'
                                : 'bg-[var(--color-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-dark)] hover:shadow-lg hover:scale-[1.02]'
                        }`} disabled={loading !== null} type="button">
                            {loading === 'monthly' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                                    Processing...
                                </span>
                            ) : (
                                'Subscribe Monthly'
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-xs text-[var(--color-text-muted)]">
                    <div className="flex justify-center space-x-4">
                        <a href="#" className="hover:text-[var(--color-text-primary)] hover:underline transition-colors">Restore Purchase</a>
                        <a href="#" className="hover:text-[var(--color-text-primary)] hover:underline transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-[var(--color-text-primary)] hover:underline transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaywallView;