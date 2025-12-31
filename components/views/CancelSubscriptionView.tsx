'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SubscriptionDetails, UserTier } from '../../types';
import { getUserSubscription, cancelSubscription, restoreSubscription, createMockSubscription, upgradeToAnnual } from '../../services/stripeService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface CancelSubscriptionViewProps {
    user: User;
    userTier: UserTier;
    onBack: () => void;
    onTierUpdated?: () => void;
}

const CancelSubscriptionView: React.FC<CancelSubscriptionViewProps> = ({ user, userTier, onBack, onTierUpdated }) => {
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [premiumTierMismatch, setPremiumTierMismatch] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [showCancellationFlow, setShowCancellationFlow] = useState(false);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    useEffect(() => {
        loadSubscription();
    }, [user.id]);

    const loadSubscription = async () => {
        setLoading(true);
        setError(null);
        setPremiumTierMismatch(false);
        try {
            const sub = await getUserSubscription(user.id);
            // Check if this is a premium tier mismatch response
            if (sub && typeof sub === 'object' && '_premiumTierMismatch' in sub) {
                setPremiumTierMismatch(true);
                setError(sub.error);
                setSubscription(null);

                // Backend's get-subscription endpoint now automatically recovers subscriptions
                // using the stored plan from the database, so no need to auto-create here
                // The subscription should be recovered on the next page load or refresh
            } else {
                setSubscription(sub);
                // Log subscription details for debugging
                if (sub) {
                    console.log('[CancelSubscriptionView] Subscription loaded:', {
                        plan: sub.plan,
                        originalPrice: sub.originalPrice,
                        currentPrice: sub.currentPrice,
                        periodLabel: sub.plan === 'monthly' ? 'month' : 'year',
                        hasRetentionDiscount: sub.hasRetentionDiscount
                    });
                }
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error loading subscription:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription details';

            // Check if this is a network/server error with more details
            let displayError = errorMessage;
            if (errorMessage.includes('endpoint not found') || errorMessage.includes('Failed to fetch')) {
                displayError = 'Unable to reach the subscription server. Please ensure your Supabase Edge Functions are deployed.';
            } else if (errorMessage.includes('Mock subscription')) {
                displayError = errorMessage; // Use the detailed backend error
            }

            setError(displayError);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOffer = async () => {
        setActionLoading('accept');
        setError(null);
        setSuccess(null);

        try {
            await cancelSubscription(user.id, true);
            showToast('Great! Your 30% discount has been applied. You\'ll continue to enjoy premium features at the discounted rate.', 'success');
            // Reload subscription to show updated discount
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error accepting offer:', err);
            showToast(err instanceof Error ? err.message : 'Failed to apply discount. Please try again.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your billing period.')) {
            return;
        }

        setActionLoading('cancel');
        setError(null);
        setSuccess(null);

        try {
            const result = await cancelSubscription(user.id, false);
            showToast(`Your subscription has been cancelled. You'll continue to have access until ${new Date(result.currentPeriodEnd).toLocaleDateString()}.`, 'info');
            // Reload subscription to show cancellation status
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error cancelling:', err);
            showToast(err instanceof Error ? err.message : 'Failed to cancel subscription. Please try again.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestore = async () => {
        setActionLoading('restore');
        setError(null);
        setSuccess(null);

        try {
            const result = await restoreSubscription(user.id);
            showToast('Your subscription has been restored! You\'ll continue to have access to premium features.', 'success');
            // Reload subscription to show restored status
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error restoring:', err);
            showToast(err instanceof Error ? err.message : 'Failed to restore subscription. Please try again.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpgradeToAnnual = async () => {
        console.log('[CancelSubscriptionView] Upgrade to Annual clicked');
        setUpgradeLoading(true);
        setError(null);
        setSuccess(null);

        try {
            console.log('[CancelSubscriptionView] Calling upgradeToAnnual for user:', user.id);
            const result = await upgradeToAnnual(user.id);
            console.log('[CancelSubscriptionView] Upgrade response:', result);
            const message = result?.message || 'Your subscription will be upgraded to Annual at the end of your current billing period.';
            showToast(message, 'success');
            // Reload subscription to show updated plan
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error upgrading:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade subscription. Please try again.';

            // Provide more helpful error messages
            let displayMessage = errorMessage;
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                displayMessage = 'Unable to reach the subscription server. Please ensure your Supabase Edge Functions are deployed and running.';
            } else if (errorMessage.includes('No customer found') || errorMessage.includes('No active subscription')) {
                displayMessage = 'Subscription not found. Please ensure you have an active subscription.';
            } else if (errorMessage.includes('already on the annual plan')) {
                displayMessage = 'Your subscription is already on the annual plan.';
            }

            showToast(displayMessage, 'error');
            setError(displayMessage);
        } finally {
            setUpgradeLoading(false);
        }
    };

    const formatMockCreationError = (err: unknown) => {
        const baseMessage = err instanceof Error ? err.message : 'Failed to create mock subscription';
        if (/Failed to fetch|NetworkError/i.test(baseMessage)) {
            return 'Unable to reach the subscription server. Please ensure your Supabase Edge Functions are deployed.';
        }
        // Return the backend error message as-is for better debugging
        return baseMessage;
    };

    const handleCreateMockSubscription = async () => {
        setLoading(true);
        setError(null);

        try {
            await createMockSubscription(user.id, 'monthly');
            await loadSubscription();
        } catch (err) {
            console.error('[CancelSubscriptionView] Error creating mock subscription:', err);
            setError(formatMockCreationError(err));
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return `$${price.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateDiscountedPrice = () => {
        if (!subscription) return null;
        const discountAmount = subscription.originalPrice * 0.3;
        return subscription.originalPrice - discountAmount;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
                    <p className="text-[var(--color-text-secondary)]">Loading subscription details...</p>
                </div>
            </div>
        );
    }

    if (error && !subscription) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
                <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="mx-auto mb-4 bg-[var(--color-error-light)] h-20 w-20 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-exclamation-triangle text-4xl text-[var(--color-error)]" aria-hidden="true"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Unable to Load Subscription</h1>
                        <p className="text-[var(--color-text-secondary)] mb-4">{error}</p>
                        {error.includes('Edge Functions') && (
                            <Card variant="accent" padding="md" className="mt-4 text-left">
                                <p className="text-sm text-[var(--color-text-primary)] mb-2">
                                    <strong>Setup Required:</strong> Deploy your Supabase Edge Functions:
                                </p>
                                <code className="block mt-2 text-xs bg-white p-2 rounded font-mono">
                                    supabase functions deploy
                                </code>
                            </Card>
                        )}
                    </div>
                    <Button onClick={onBack} variant="ghost" fullWidth className="justify-center">Go Back</Button>
                </Card>
            </div>
        );
    }

    if (!subscription) {
        // Show special message if user is premium but no subscription found
        if (premiumTierMismatch || userTier === UserTier.Premium) {
            return (
                <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
                    <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
                        <div className="mb-6">
                            <div className="mx-auto mb-4 bg-[var(--color-warning-light)] h-20 w-20 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-exclamation-triangle text-4xl text-[var(--color-warning)]" aria-hidden="true"></i>
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Subscription Not Found</h1>
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                Your account shows as premium, but no active Stripe subscription was found.
                                This may happen if your subscription was cancelled or there's a mismatch between
                                your account status and Stripe records.
                            </p>
                            {error && (
                                <p className="text-sm text-[var(--color-text-muted)] mb-4">{error}</p>
                            )}
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                Please contact support if you believe this is an error, or if you'd like to
                                reactivate your subscription.
                            </p>
                            <Button
                                onClick={handleCreateMockSubscription}
                                variant="ghost"
                                size="sm"
                                className="mb-4"
                            >
                                Fix Subscription (Dev)
                            </Button>
                        </div>
                        <Button onClick={onBack} variant="ghost" fullWidth className="justify-center">Go Back to Settings</Button>
                    </Card>
                </div>
            );
        }

        // Regular "no subscription" message for free tier users
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
                <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="mx-auto mb-4 bg-[var(--color-bg-accent)] h-20 w-20 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-info-circle text-4xl text-[var(--color-text-muted)]" aria-hidden="true"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">No Active Subscription</h1>
                        <p className="text-[var(--color-text-secondary)]">You don't have an active subscription to cancel.</p>
                    </div>
                    <Button onClick={onBack} variant="ghost" fullWidth className="justify-center">Go Back</Button>
                </Card>
            </div>
        );
    }

    const discountedPrice = calculateDiscountedPrice();

    // Determine plan type with fallback for 'unknown' plans
    let detectedPlan = subscription.plan;
    if (detectedPlan === 'unknown') {
        // Infer plan from pricing: annual plans are typically > $50
        // This matches the backend fallback logic
        if (subscription.originalPrice > 50) {
            detectedPlan = 'annual';
            console.warn('[CancelSubscriptionView] Plan was "unknown", inferred as "annual" from price:', subscription.originalPrice);
        } else {
            detectedPlan = 'monthly';
            console.warn('[CancelSubscriptionView] Plan was "unknown", inferred as "monthly" from price:', subscription.originalPrice);
        }
    }

    const planName = detectedPlan === 'monthly' ? 'Monthly' : 'Annual';
    const periodLabel = detectedPlan === 'monthly' ? 'month' : 'year';

    // Validate that pricing matches plan type
    // Annual subscriptions should be significantly higher than monthly
    const isLikelyAnnual = subscription.originalPrice > 50;
    const isLikelyMonthly = subscription.originalPrice <= 50;
    if ((detectedPlan === 'annual' && !isLikelyAnnual) || (detectedPlan === 'monthly' && !isLikelyMonthly)) {
        console.warn('[CancelSubscriptionView] ⚠️ Plan type mismatch detected:', {
            plan: detectedPlan,
            originalPrice: subscription.originalPrice,
            expectedRange: detectedPlan === 'annual' ? '> $50' : '<= $50'
        });
    }

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Header */}
            <div className="px-6 py-4">
                <div className="px-6 py-4">
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

            <div className="w-full max-w-md mx-auto px-6">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 bg-[var(--color-primary-lighter)] h-20 w-20 rounded-full flex items-center justify-center ring-8 ring-[var(--color-primary-lighter)]/50">
                        <i className="fa-solid fa-credit-card text-4xl text-[var(--color-primary-dark)]" aria-hidden="true"></i>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-2">
                        {showCancellationFlow ? 'Cancel Subscription' : 'Manage Subscription'}
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        {showCancellationFlow ? "We're sorry to see you go" : 'View and manage your subscription details'}
                    </p>
                </div>

                {/* Current Subscription Details */}
                <Card variant="elevated" padding="md" className="mb-6">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Current Subscription</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">Plan</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{planName} Plan</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">Current Price</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">
                                {formatPrice(subscription.currentPrice)}/{periodLabel}
                                {subscription.hasRetentionDiscount && (
                                    <span className="text-[var(--color-success)] text-sm ml-2">(30% off)</span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">Next Billing Date</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{formatDate(subscription.currentPeriodEnd)}</span>
                        </div>
                        {subscription.cancelAtPeriodEnd && (
                            <Card variant="accent" padding="sm" className="border-l-4 border-[var(--color-warning)]">
                                <p className="text-[var(--color-text-primary)] text-sm">
                                    <i className="fa-solid fa-exclamation-triangle mr-2" aria-hidden="true"></i>
                                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                                </p>
                            </Card>
                        )}
                    </div>
                </Card>

                {/* Retention Offers - Only show when user clicks Cancel */}
                {showCancellationFlow && !subscription.hasRetentionDiscount && !subscription.cancelAtPeriodEnd && (
                    <>
                        {/* 30% Discount Offer */}
                        <Card variant="accent" padding="lg" className="mb-6 border-2 border-[var(--color-primary-light)]">
                            <div className="text-center mb-4">
                                <div className="inline-block bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
                                    Special Offer
                                </div>
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Stay with us for 30% off!</h3>
                                <p className="text-[var(--color-text-secondary)] mb-4">
                                    We'd love to keep you as a member. Accept this offer and pay only{' '}
                                    <span className="font-bold text-[var(--color-primary-dark)]">{formatPrice(discountedPrice!)}</span> per {periodLabel} instead of{' '}
                                    <span className="line-through text-[var(--color-text-muted)]">{formatPrice(subscription.originalPrice)}</span>.
                                </p>
                                <Card variant="default" padding="md" className="mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-text-secondary)]">Original Price</span>
                                        <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatPrice(subscription.originalPrice)}/{periodLabel}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[var(--color-text-secondary)]">Your New Price</span>
                                        <span className="text-2xl font-extrabold text-[var(--color-primary-dark)]">{formatPrice(discountedPrice!)}/{periodLabel}</span>
                                    </div>
                                    <div className="text-center mt-3 text-sm text-[var(--color-text-muted)]">
                                        Save {formatPrice(subscription.originalPrice - discountedPrice!)} per {periodLabel}
                                    </div>
                                </Card>
                            </div>
                        </Card>

                        {/* Annual Upgrade Offer - Only for monthly subscribers */}
                        {detectedPlan === 'monthly' && (
                            <Card variant="accent" padding="lg" className="mb-6 border-2 border-[var(--color-success-light)]">
                                <div className="text-center mb-4">
                                    <div className="inline-block bg-[var(--color-success)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
                                        Save More
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Switch to Annual Billing</h3>
                                    <p className="text-[var(--color-text-secondary)] text-sm mb-3">
                                        Change to annual billing to save <span className="font-bold text-[var(--color-success)]">${(subscription.originalPrice * 12 - 99.99).toFixed(2)}/year</span>.
                                        <br />
                                        The change takes effect at the end of your current month.
                                    </p>

                                    <Button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('[CancelSubscriptionView] Annual upgrade clicked in cancellation flow');
                                            handleUpgradeToAnnual();
                                        }}
                                        disabled={upgradeLoading || actionLoading !== null}
                                        variant="success"
                                        fullWidth
                                        loading={upgradeLoading}
                                        className="mb-4 !text-black !border-2 !border-black"
                                    >
                                        Switch to Annual & Save
                                    </Button>

                                    <Card variant="default" padding="sm" className="mb-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--color-text-secondary)]">Monthly (current)</span>
                                            <span className="font-semibold text-[var(--color-text-primary)]">{formatPrice(subscription.originalPrice)}/month</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 text-sm">
                                            <span className="text-[var(--color-text-secondary)]">Annual (upgrade)</span>
                                            <span className="font-semibold text-[var(--color-success)]">$99.99/year</span>
                                        </div>
                                    </Card>
                                </div>
                            </Card>
                        )}
                    </>
                )}

                {/* Action Buttons */}
                {!subscription.hasRetentionDiscount && !subscription.cancelAtPeriodEnd && (
                    <div className="space-y-4">
                        {!showCancellationFlow ? (
                            // Initial view - Show Cancel button only
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCancellationFlow(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[var(--color-neutral-300)] rounded-lg shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 text-[var(--color-text-primary)] font-semibold text-sm"
                                >
                                    Cancel Subscription
                                </button>
                                <Button onClick={onBack} variant="ghost" fullWidth className="justify-center">Go Back to Settings</Button>
                            </div>
                        ) : (
                            // Cancellation flow - Show retention offer buttons
                            <div className="space-y-3">
                                <Button
                                    onClick={handleAcceptOffer}
                                    disabled={actionLoading !== null}
                                    variant="primary"
                                    fullWidth
                                    loading={actionLoading === 'accept'}
                                >
                                    Keep My Subscription (30% Off)
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    disabled={actionLoading !== null}
                                    variant="secondary"
                                    fullWidth
                                    loading={actionLoading === 'cancel'}
                                >
                                    Cancel Anyway
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {subscription.cancelAtPeriodEnd && (
                    <div>
                        <div className="text-center mb-5">
                            <p className="text-[var(--color-text-secondary)]">
                                Your subscription is scheduled to cancel on {formatDate(subscription.currentPeriodEnd)}.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleRestore}
                                disabled={actionLoading !== null}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[var(--color-neutral-300)] rounded-lg shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 text-[var(--color-text-primary)] font-semibold text-sm disabled:opacity-50"
                            >
                                {actionLoading === 'restore' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                        <span>Restoring...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
                                        <span>Restore Purchase</span>
                                    </>
                                )}
                            </button>
                            <Button onClick={onBack} variant="ghost" fullWidth className="justify-center">Go Back to Settings</Button>
                        </div>
                    </div>
                )}

                {subscription.hasRetentionDiscount && !subscription.cancelAtPeriodEnd && (
                    <div>
                        <div className="text-center mb-5">
                            <p className="text-[var(--color-text-secondary)]">
                                You're already enjoying the 30% discount! Your subscription will continue at the discounted rate.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={actionLoading !== null}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[var(--color-neutral-300)] rounded-lg shadow-md hover:bg-[var(--color-bg-accent)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 text-[var(--color-text-primary)] font-semibold text-sm disabled:opacity-50"
                            >
                                {actionLoading === 'cancel' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                        <span>Cancelling...</span>
                                    </>
                                ) : (
                                    <span>Cancel Subscription</span>
                                )}
                            </button>
                            <Button onClick={onBack} variant="ghost" fullWidth className="justify-center">Go Back to Settings</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CancelSubscriptionView;

