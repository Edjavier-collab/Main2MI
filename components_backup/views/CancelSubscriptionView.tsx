import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SubscriptionDetails, UserTier } from '../../types';
import { getUserSubscription, cancelSubscription, restoreSubscription, createMockSubscription, upgradeToAnnual } from '../../services/stripeService';
import { HeaderWave } from '../illustrations/GrowthIllustrations';
import { SoftCard } from '../ui/SoftCard';
import { PillButton } from '../ui/PillButton';
import './CancelSubscriptionView.css';

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
            setSuccess('Great! Your 30% discount has been applied. You\'ll continue to enjoy premium features at the discounted rate.');
            // Reload subscription to show updated discount
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error accepting offer:', err);
            setError(err instanceof Error ? err.message : 'Failed to apply discount. Please try again.');
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
            setSuccess(`Your subscription has been cancelled. You'll continue to have access until ${new Date(result.currentPeriodEnd).toLocaleDateString()}.`);
            // Reload subscription to show cancellation status
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error cancelling:', err);
            setError(err instanceof Error ? err.message : 'Failed to cancel subscription. Please try again.');
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
            setSuccess('Your subscription has been restored! You\'ll continue to have access to premium features.');
            // Reload subscription to show restored status
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error restoring:', err);
            setError(err instanceof Error ? err.message : 'Failed to restore subscription. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpgradeToAnnual = async () => {
        setUpgradeLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const result = await upgradeToAnnual(user.id);
            const message = result?.message || 'Your subscription will be upgraded to Annual at the end of your current billing period.';
            setSuccess(message);
            // Reload subscription to show updated plan
            await loadSubscription();
            // Refresh tier if callback provided
            if (onTierUpdated) {
                setTimeout(() => onTierUpdated(), 1000);
            }
        } catch (err) {
            console.error('[CancelSubscriptionView] Error upgrading:', err);
            setError(err instanceof Error ? err.message : 'Failed to upgrade subscription. Please try again.');
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
            <div className="cancel-subscription-view__loading">
                <div className="cancel-subscription-view__loading-spinner"></div>
                <p className="cancel-subscription-view__loading-text">Loading subscription details...</p>
            </div>
        );
    }

    if (error && !subscription) {
        return (
            <div className="cancel-subscription-view__error-state">
                <div className="w-full max-w-md mx-auto">
                    <div className="cancel-subscription-view__error-icon">
                        <i className="fa-solid fa-exclamation-triangle"></i>
                    </div>
                    <h1 className="cancel-subscription-view__error-title">Unable to Load Subscription</h1>
                    <p className="cancel-subscription-view__error-message">{error}</p>
                    {error.includes('Edge Functions') && (
                        <div className="cancel-subscription-view__setup-hint">
                            <p>
                                <strong>Setup Required:</strong> Deploy your Supabase Edge Functions:
                            </p>
                            <code>supabase functions deploy</code>
                        </div>
                    )}
                    <PillButton onClick={onBack} fullWidth>
                        Go Back
                    </PillButton>
                </div>
            </div>
        );
    }

    if (!subscription) {
        // Show special message if user is premium but no subscription found
        if (premiumTierMismatch || userTier === UserTier.Premium) {
            return (
                <div className="cancel-subscription-view__error-state">
                    <div className="w-full max-w-md mx-auto">
                        <div className="cancel-subscription-view__error-icon">
                            <i className="fa-solid fa-exclamation-triangle"></i>
                        </div>
                        <h1 className="cancel-subscription-view__error-title">Subscription Not Found</h1>
                        <p className="cancel-subscription-view__error-message">
                            Your account shows as premium, but no active Stripe subscription was found. 
                            This may happen if your subscription was cancelled or there's a mismatch between 
                            your account status and Stripe records.
                        </p>
                        {error && (
                            <p className="cancel-subscription-view__error-message" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-sm)' }}>{error}</p>
                        )}
                        <p className="cancel-subscription-view__error-message">
                            Please contact support if you believe this is an error, or if you'd like to 
                            reactivate your subscription.
                        </p>
                        <button
                            onClick={handleCreateMockSubscription}
                            style={{ 
                                color: 'var(--color-primary)', 
                                fontSize: 'var(--font-size-sm)', 
                                fontWeight: 500, 
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                marginBottom: 'var(--space-md)'
                            }}
                        >
                            Fix Subscription (Dev)
                        </button>
                        <PillButton onClick={onBack} fullWidth>
                            Go Back to Settings
                        </PillButton>
                    </div>
                </div>
            );
        }
        
        // Regular "no subscription" message for free tier users
        return (
            <div className="cancel-subscription-view__empty-state">
                <div className="w-full max-w-md mx-auto">
                    <div className="cancel-subscription-view__empty-icon">
                        <i className="fa-solid fa-info-circle"></i>
                    </div>
                    <h1 className="cancel-subscription-view__empty-title">No Active Subscription</h1>
                    <p className="cancel-subscription-view__empty-message">You don't have an active subscription to cancel.</p>
                    <PillButton onClick={onBack} fullWidth>
                        Go Back
                    </PillButton>
                </div>
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
        <div className="cancel-subscription-view">
            <div className="cancel-subscription-view__header">
                <HeaderWave className="cancel-subscription-view__wave" />
                <div className="cancel-subscription-view__header-content">
                    <button
                        onClick={onBack}
                        className="cancel-subscription-view__back-button"
                        aria-label="Go back"
                    >
                        <i className="fa fa-arrow-left" aria-hidden="true"></i>
                    </button>
                    <h1>
                        {showCancellationFlow ? 'Cancel Subscription' : 'Manage Subscription'}
                    </h1>
                    <p>
                        {showCancellationFlow ? "We're sorry to see you go" : 'View and manage your subscription details'}
                    </p>
                </div>
            </div>

            <div className="cancel-subscription-view__content">

                {/* Current Subscription Details */}
                <SoftCard variant="elevated" className="cancel-subscription-view__subscription-card">
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>Current Subscription</h2>
                    <div className="cancel-subscription-view__subscription-details">
                        <div className="cancel-subscription-view__detail-row">
                            <span className="cancel-subscription-view__detail-label">Plan</span>
                            <span className="cancel-subscription-view__detail-value">{planName} Plan</span>
                        </div>
                        <div className="cancel-subscription-view__detail-row">
                            <span className="cancel-subscription-view__detail-label">Current Price</span>
                            <span className="cancel-subscription-view__detail-value">
                                {formatPrice(subscription.currentPrice)}/{periodLabel}
                                {subscription.hasRetentionDiscount && (
                                    <span style={{ color: 'var(--color-accent-success)', fontSize: 'var(--font-size-sm)', marginLeft: 'var(--space-sm)' }}>(30% off)</span>
                                )}
                            </span>
                        </div>
                        <div className="cancel-subscription-view__detail-row">
                            <span className="cancel-subscription-view__detail-label">Next Billing Date</span>
                            <span className="cancel-subscription-view__detail-value">{formatDate(subscription.currentPeriodEnd)}</span>
                        </div>
                        {subscription.cancelAtPeriodEnd && (
                            <div className="cancel-subscription-view__warning-banner">
                                <p>
                                    <i className="fa-solid fa-exclamation-triangle"></i>
                                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                                </p>
                            </div>
                        )}
                    </div>
                </SoftCard>

                {/* Retention Offer - Only show when user clicks Cancel */}
                {showCancellationFlow && !subscription.hasRetentionDiscount && !subscription.cancelAtPeriodEnd && (
                    <SoftCard variant="accent" className="cancel-subscription-view__retention-offer">
                        <div style={{ textAlign: 'center' }}>
                            <span className="cancel-subscription-view__offer-badge">Special Offer</span>
                            <h3 className="cancel-subscription-view__offer-title">Stay with us for 30% off!</h3>
                            <p className="cancel-subscription-view__offer-description">
                                We'd love to keep you as a member. Accept this offer and pay only{' '}
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(discountedPrice!)}</span> per {periodLabel} instead of{' '}
                                <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>{formatPrice(subscription.originalPrice)}</span>.
                            </p>
                            <div className="cancel-subscription-view__price-comparison">
                                <div className="cancel-subscription-view__price-row">
                                    <span className="cancel-subscription-view__price-label">Original Price</span>
                                    <span className="cancel-subscription-view__price-value">{formatPrice(subscription.originalPrice)}/{periodLabel}</span>
                                </div>
                                <div className="cancel-subscription-view__price-row cancel-subscription-view__price-row--highlight">
                                    <span className="cancel-subscription-view__price-label">Your New Price</span>
                                    <span className="cancel-subscription-view__price-value cancel-subscription-view__price-value--discounted">{formatPrice(discountedPrice!)}/{periodLabel}</span>
                                </div>
                                <div className="cancel-subscription-view__savings">
                                    Save {formatPrice(subscription.originalPrice - discountedPrice!)} per {periodLabel}
                                </div>
                            </div>
                        </div>
                    </SoftCard>
                )}

                {/* Success Message */}
                {success && (
                    <div className="cancel-subscription-view__message cancel-subscription-view__message--success">
                        <p>{success}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="cancel-subscription-view__message cancel-subscription-view__message--error">
                        <p>{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                {!subscription.hasRetentionDiscount && !subscription.cancelAtPeriodEnd && (
                    <div className="cancel-subscription-view__actions">
                        {!showCancellationFlow ? (
                            // Initial view - Show Upgrade and Cancel buttons
                            <>
                                {/* Upgrade to Annual button - only show for monthly subscribers */}
                                {detectedPlan === 'monthly' && (
                                    <SoftCard variant="accent" className="cancel-subscription-view__upgrade-card">
                                        <h3 className="cancel-subscription-view__upgrade-title">Upgrade to Annual</h3>
                                        <p className="cancel-subscription-view__upgrade-description">
                                            Save money by switching to annual billing. Your upgrade will take effect at the end of your current billing period.
                                        </p>
                                        <div className="cancel-subscription-view__price-comparison">
                                            <div className="cancel-subscription-view__price-row">
                                                <span className="cancel-subscription-view__price-label">Monthly (current)</span>
                                                <span className="cancel-subscription-view__price-value">{formatPrice(subscription.originalPrice)}/month</span>
                                            </div>
                                            <div className="cancel-subscription-view__price-row cancel-subscription-view__price-row--highlight">
                                                <span className="cancel-subscription-view__price-label">Annual (upgrade)</span>
                                                <span className="cancel-subscription-view__price-value" style={{ color: 'var(--color-accent-success)' }}>$99.99/year</span>
                                            </div>
                                            <div className="cancel-subscription-view__savings">
                                                Save ${(subscription.originalPrice * 12 - 99.99).toFixed(2)} per year
                                            </div>
                                        </div>
                                        <PillButton
                                            onClick={handleUpgradeToAnnual}
                                            disabled={upgradeLoading || actionLoading !== null}
                                            fullWidth
                                            size="lg"
                                        >
                                            {upgradeLoading ? (
                                                <>
                                                    <i className="fa fa-spinner fa-spin"></i>
                                                    Upgrading...
                                                </>
                                            ) : (
                                                'Upgrade to Annual Plan'
                                            )}
                                        </PillButton>
                                    </SoftCard>
                                )}
                                <PillButton
                                    onClick={() => setShowCancellationFlow(true)}
                                    variant="danger"
                                    fullWidth
                                    size="lg"
                                >
                                    Cancel Subscription
                                </PillButton>
                                <PillButton
                                    onClick={onBack}
                                    variant="secondary"
                                    fullWidth
                                >
                                    Go Back to Settings
                                </PillButton>
                            </>
                        ) : (
                            // Cancellation flow - Show retention offer buttons
                            <>
                                <PillButton
                                    onClick={handleAcceptOffer}
                                    disabled={actionLoading !== null}
                                    fullWidth
                                    size="lg"
                                >
                                    {actionLoading === 'accept' ? (
                                        <>
                                            <i className="fa fa-spinner fa-spin"></i>
                                            Applying Discount...
                                        </>
                                    ) : (
                                        'Keep My Subscription (30% Off)'
                                    )}
                                </PillButton>
                                <PillButton
                                    onClick={handleCancel}
                                    disabled={actionLoading !== null}
                                    variant="secondary"
                                    fullWidth
                                >
                                    {actionLoading === 'cancel' ? (
                                        <>
                                            <i className="fa fa-spinner fa-spin"></i>
                                            Cancelling...
                                        </>
                                    ) : (
                                        'Cancel Anyway'
                                    )}
                                </PillButton>
                            </>
                        )}
                    </div>
                )}

                {subscription.cancelAtPeriodEnd && (
                    <div className="cancel-subscription-view__actions">
                        <p className="cancel-subscription-view__info-text">
                            Your subscription is scheduled to cancel on {formatDate(subscription.currentPeriodEnd)}.
                        </p>
                        <PillButton
                            onClick={handleRestore}
                            disabled={actionLoading !== null}
                            fullWidth
                            size="lg"
                        >
                            {actionLoading === 'restore' ? (
                                <>
                                    <i className="fa fa-spinner fa-spin"></i>
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-rotate-left"></i>
                                    Restore Purchase
                                </>
                            )}
                        </PillButton>
                        <PillButton
                            onClick={onBack}
                            variant="secondary"
                            fullWidth
                        >
                            Go Back to Settings
                        </PillButton>
                    </div>
                )}

                {subscription.hasRetentionDiscount && !subscription.cancelAtPeriodEnd && (
                    <div className="cancel-subscription-view__actions">
                        <p className="cancel-subscription-view__info-text">
                            You're already enjoying the 30% discount! Your subscription will continue at the discounted rate.
                        </p>
                        <PillButton
                            onClick={handleCancel}
                            disabled={actionLoading !== null}
                            variant="danger"
                            fullWidth
                        >
                            {actionLoading === 'cancel' ? (
                                <>
                                    <i className="fa fa-spinner fa-spin"></i>
                                    Cancelling...
                                </>
                            ) : (
                                'Cancel Subscription'
                            )}
                        </PillButton>
                        <PillButton
                            onClick={onBack}
                            fullWidth
                        >
                            Go Back to Settings
                        </PillButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CancelSubscriptionView;

