import React, { useState, useEffect } from 'react';
import { UserTier, View } from '../../types';
import { User } from '@supabase/supabase-js';
import { restoreSubscription, getUserSubscription, createBillingPortalSession } from '../../services/stripeService';
import { submitFeedback } from '../../services/feedbackService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { FeedbackModal } from '../ui/FeedbackModal';

interface SettingsViewProps {
    userTier: UserTier;
    onNavigateToPaywall: () => void;
    onLogout: () => Promise<void>;
    onNavigate: (view: View) => void;
    user: User | null;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; prominent?: boolean }> = ({ title, children, prominent = false }) => (
    <div className="mb-6">
        <h2 className={`font-bold uppercase px-4 mb-3 ${
            prominent 
                ? 'text-base text-[var(--color-text-primary)]' 
                : 'text-sm text-[var(--color-text-muted)]'
        }`}>{title}</h2>
        <Card variant="elevated" padding="none" className="overflow-hidden">
            {children}
        </Card>
    </div>
);

const SettingsRow: React.FC<{ onClick?: () => void; isLast?: boolean; children: React.ReactNode }> = ({ onClick, isLast = false, children }) => {
    const baseClasses = `flex justify-between items-center p-4 min-h-[var(--touch-target-min)] transition-colors ${!isLast ? 'border-b border-[var(--color-neutral-200)]' : ''}`;
    const interactiveClasses = onClick ? 'cursor-pointer hover:bg-[var(--color-bg-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]' : '';

    if (onClick) {
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
                className={`${baseClasses} ${interactiveClasses}`}
            >
                {children}
            </div>
        );
    }

    return (
        <div className={baseClasses}>
            {children}
        </div>
    );
};


const SettingsView: React.FC<SettingsViewProps> = ({ userTier, onNavigateToPaywall, onLogout, onNavigate, user }) => {
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'annual' | 'unknown' | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);
    const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
    const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
    const [hasPremiumMismatch, setHasPremiumMismatch] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [billingPortalLoading, setBillingPortalLoading] = useState(false);
    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    const handleFeedbackSubmit = async (rating: number, comment: string) => {
        try {
            await submitFeedback({ rating, comment, userId: user?.id });
            showToast('Thank you for your feedback!', 'success');
        } catch (err) {
            console.error('[SettingsView] Error submitting feedback:', err);
            showToast('Failed to submit feedback. Please try again.', 'error');
            throw err; // Re-throw so FeedbackModal knows submission failed
        }
    };

    const handlePlaceholderClick = (feature: string) => {
        alert(`${feature} feature coming soon!`);
    };

    // Fetch subscription plan and cancellation status for all users
    useEffect(() => {
        const fetchSubscriptionPlan = async () => {
            if (!user) {
                setSubscriptionPlan(null);
                setSubscriptionCancelled(false);
                setHasPremiumMismatch(false);
                return;
            }

            setSubscriptionLoading(true);
            try {
                const subscription = await getUserSubscription(user.id);
                console.log('[SettingsView] Subscription data received:', subscription);
                
                // Check for premium tier mismatch
                if (subscription && typeof subscription === 'object' && '_premiumTierMismatch' in subscription) {
                    console.log('[SettingsView] Premium tier mismatch detected');
                    setHasPremiumMismatch(true);
                    setSubscriptionCancelled(false);
                    setSubscriptionPlan(null);
                    return;
                }
                
                if (subscription) {
                    // Check if subscription is cancelled AND period hasn't ended
                    const isCancelled = subscription.cancelAtPeriodEnd === true;
                    const periodEndDate = subscription.currentPeriodEnd;
                    const periodHasEnded = periodEndDate ? new Date(periodEndDate) <= new Date() : false;
                    
                    // Only mark as cancelled if subscription exists, is cancelled, and period hasn't ended
                    const cancelled = isCancelled && !periodHasEnded;
                    
                    console.log('[SettingsView] Cancellation check:', {
                        cancelAtPeriodEnd: isCancelled,
                        currentPeriodEnd: periodEndDate,
                        periodHasEnded,
                        cancelled
                    });
                    
                    setSubscriptionCancelled(cancelled);
                    setCancelAtPeriodEnd(isCancelled);
                    setCurrentPeriodEnd(periodEndDate || null);
                    setHasPremiumMismatch(false);
                    
                    // Extract plan type from subscription
                    let plan = subscription.plan;
                    console.log('[SettingsView] Plan value from subscription:', plan, 'Type:', typeof plan);
                    console.log('[SettingsView] Cancellation status:', cancelled);
                    
                    // Normalize plan value (handle case sensitivity, whitespace, etc.)
                    if (plan && typeof plan === 'string') {
                        plan = plan.trim().toLowerCase();
                    }
                    
                    // Try to infer from price if plan is missing, null, undefined, or unknown
                    const originalPrice = subscription.originalPrice;
                    const currentPrice = subscription.currentPrice;
                    const price = originalPrice || currentPrice;
                    console.log('[SettingsView] Price values - originalPrice:', originalPrice, 'currentPrice:', currentPrice, 'using:', price);
                    
                    if (plan === 'monthly' || plan === 'annual') {
                        console.log('[SettingsView] ✅ Setting plan to:', plan);
                        setSubscriptionPlan(plan);
                    } else if (!plan || plan === 'unknown' || plan === 'null' || plan === 'undefined') {
                        // Try to infer plan from price if available
                        console.log('[SettingsView] Plan is missing/unknown, attempting to infer from price:', price);
                        
                        if (price && typeof price === 'number') {
                            // Annual plans are typically > $50, monthly < $50
                            // Mock annual: 99.99 (or 69.99 with discount), Mock monthly: 9.99 (or 6.99 with discount)
                            // Check for exact mock prices first, then use threshold
                            if (price === 99.99 || price === 69.99 || price >= 50) {
                                console.log('[SettingsView] ✅ Inferred plan as "annual" from price:', price);
                                setSubscriptionPlan('annual');
                            } else if (price === 9.99 || price === 6.99 || (price > 0 && price < 50)) {
                                console.log('[SettingsView] ✅ Inferred plan as "monthly" from price:', price);
                                setSubscriptionPlan('monthly');
                            } else {
                                console.warn('[SettingsView] ⚠️ Could not infer plan from price, setting to unknown');
                                setSubscriptionPlan('unknown');
                            }
                        } else {
                            console.warn('[SettingsView] ⚠️ Plan is unknown and no price available, setting to unknown');
                            setSubscriptionPlan('unknown');
                        }
                    } else {
                        // Plan has an unexpected value - try price inference as fallback
                        console.warn('[SettingsView] ⚠️ Unexpected plan value:', plan);
                        if (price && typeof price === 'number') {
                            // Check for exact mock prices first, then use threshold
                            if (price === 99.99 || price === 69.99 || price >= 50) {
                                console.log('[SettingsView] ✅ Fallback: Inferred plan as "annual" from price:', price);
                                setSubscriptionPlan('annual');
                            } else if (price === 9.99 || price === 6.99 || (price > 0 && price < 50)) {
                                console.log('[SettingsView] ✅ Fallback: Inferred plan as "monthly" from price:', price);
                                setSubscriptionPlan('monthly');
                            } else {
                                setSubscriptionPlan('unknown');
                            }
                        } else {
                            setSubscriptionPlan('unknown');
                        }
                    }
                } else {
                    // Subscription not found (404) - no restore available
                    console.log('[SettingsView] No subscription found');
                    setHasPremiumMismatch(false);
                    setSubscriptionCancelled(false);
                    setCancelAtPeriodEnd(false);
                    setCurrentPeriodEnd(null);
                    setSubscriptionPlan(null);
                }
            } catch (err) {
                console.error('[SettingsView] Error fetching subscription plan:', err);
                // On error, don't set plan (will show just "Premium Member")
                setSubscriptionPlan(null);
                setSubscriptionCancelled(false);
                setCancelAtPeriodEnd(false);
                setCurrentPeriodEnd(null);
                setHasPremiumMismatch(false);
                // Show error toast for subscription fetch failures (except network errors which are expected offline)
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('NetworkError')) {
                    showToast('Unable to load subscription details', 'warning');
                }
            } finally {
                setSubscriptionLoading(false);
            }
        };

        fetchSubscriptionPlan();
    }, [user, userTier]);

    const handleRestorePurchase = async () => {
        if (!user) {
            alert('Please log in to restore your purchase');
            return;
        }

        setRestoreLoading(true);
        setRestoreError(null);
        setRestoreSuccess(null);

        try {
            const result = await restoreSubscription(user.id);
            const message = result?.message || 'Your subscription has been restored successfully!';
            setRestoreSuccess(message);
            
            // Reload the page after a short delay to refresh tier and subscription state
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            console.error('[SettingsView] Error restoring purchase:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to restore purchase. Please try again.';
            
            // Improve error messages
            let displayError = errorMessage;
            if (errorMessage.includes('endpoint not found') || errorMessage.includes('Failed to fetch')) {
                displayError = 'Unable to reach the subscription server. Please ensure your Supabase Edge Functions are deployed.';
            } else if (errorMessage.includes('No subscription found')) {
                displayError = 'No subscription found to restore. If you had a subscription, it may have expired or been cancelled.';
            }
            
            setRestoreError(displayError);
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleLogoutClick = async () => {
        if (logoutLoading) return;
        setLogoutError(null);
        setLogoutLoading(true);
        try {
            await onLogout();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to log out. Please try again.';
            showToast(message, 'error');
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleManageBilling = async () => {
        if (!user || billingPortalLoading) return;
        
        setBillingPortalLoading(true);
        try {
            const returnUrl = `${window.location.origin}/settings`;
            const portalUrl = await createBillingPortalSession(user.id, returnUrl);
            // Redirect to Stripe Customer Portal
            window.location.href = portalUrl;
        } catch (err) {
            console.error('[SettingsView] Error creating billing portal session:', err);
            const message = err instanceof Error ? err.message : 'Unable to open billing portal. Please try again.';
            showToast(message, 'error');
            setBillingPortalLoading(false);
        }
    };

    const isPremium = userTier === UserTier.Premium;
    const isAnonymous = !user;

    // Get creation date from user metadata or fallback to null
    const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString() : null;

    // Get full name from user metadata
    const fullName = user?.user_metadata?.full_name || user?.email;
    const displayName = fullName ? fullName.split(' ')[0] : user?.email?.split('@')[0];

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            
            {/* Header */}
            <div className="flex items-center px-6 py-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
            </div>

            <main className="max-w-2xl mx-auto px-6">
                {user && (
                    <SettingsSection title="Profile">
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-16 h-16 rounded-full bg-[var(--color-primary-lighter)] flex items-center justify-center text-[var(--color-primary-dark)] text-2xl font-bold"
                                    aria-label={`Profile avatar for ${user.email}`}
                                >
                                    {displayName?.charAt(0).toUpperCase() || <i className="fa fa-user" aria-hidden="true"></i>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] truncate" title={user.email}>
                                        {fullName}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)] mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                            isPremium ? 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border border-[var(--color-warning)]' : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] border border-[var(--color-neutral-200)]'
                                        }`}>
                                            {isPremium
                                                ? cancelAtPeriodEnd && currentPeriodEnd
                                                    ? `Premium - cancels ${new Date(currentPeriodEnd).toLocaleDateString()}`
                                                    : subscriptionPlan === 'monthly'
                                                        ? 'Premium Monthly'
                                                        : subscriptionPlan === 'annual'
                                                            ? 'Premium Annual'
                                                            : 'Premium'
                                                : 'Free Plan'
                                            }
                                        </span>
                                        {memberSince && (
                                            <span className="text-xs whitespace-nowrap">Since {memberSince}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SettingsSection>
                )}

                <SettingsSection title="Account" prominent>
                    {isAnonymous ? (
                        <>
                            <SettingsRow onClick={() => onNavigate(View.Login)} isLast>
                                <div>
                                    <span className="text-[var(--color-primary)] font-medium">Sign In or Create Account</span>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Access unlimited sessions and sync across devices</p>
                                </div>
                                <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                            </SettingsRow>
                        </>
                    ) : (
                        <SettingsRow isLast>
                            <div className="flex-1">
                                <Button
                                    type="button"
                                    onClick={handleLogoutClick}
                                    disabled={logoutLoading}
                                    variant="secondary"
                                    fullWidth
                                    loading={logoutLoading}
                                    className="border-2 border-error text-error hover:bg-error-light hover:border-error-dark focus:ring-error"
                                    icon={!logoutLoading ? <i className="fa-solid fa-right-from-bracket" /> : undefined}
                                >
                                    {logoutLoading ? 'Logging Out...' : 'Log Out'}
                                </Button>
                            </div>
                        </SettingsRow>
                    )}
                </SettingsSection>

                <SettingsSection title="Subscription">
                    {isPremium ? (
                        <>
                            {user && (
                                <SettingsRow>
                                    <div>
                                        <span className="text-[var(--color-text-primary)]">Current Plan</span>
                                        {subscriptionLoading ? (
                                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                                <i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Loading...
                                            </p>
                                        ) : (
                                            <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
                                                {cancelAtPeriodEnd && currentPeriodEnd
                                                    ? `Premium - cancels on ${new Date(currentPeriodEnd).toLocaleDateString()}`
                                                    : `Premium${subscriptionPlan === 'monthly' ? ' (Monthly)' : subscriptionPlan === 'annual' ? ' (Annual)' : ''}`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </SettingsRow>
                            )}
                            {!user && (
                                <SettingsRow>
                                    <span className="text-[var(--color-text-primary)]">Current Plan</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">Premium</span>
                                </SettingsRow>
                            )}
                            <SettingsRow onClick={() => onNavigate(View.CancelSubscription)}>
                                <span className="text-[var(--color-primary)]">Manage Subscription</span>
                                <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                            </SettingsRow>
                            {user && (
                                <SettingsRow onClick={handleManageBilling}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--color-primary)]">Manage Billing</span>
                                        {billingPortalLoading && (
                                            <i className="fa fa-spinner fa-spin text-[var(--color-text-muted)]" aria-hidden="true"></i>
                                        )}
                                    </div>
                                    {!billingPortalLoading && (
                                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                                    )}
                                </SettingsRow>
                            )}
                            {/* Only show Restore Purchase if subscription exists, is cancelled, and period hasn't ended */}
                            {subscriptionCancelled && (
                                <SettingsRow onClick={handleRestorePurchase} isLast>
                                    <div className="flex-1">
                                        <span className="text-primary-dark">Restore Purchase</span>
                                        {restoreLoading && (
                                            <span className="ml-2 text-xs text-neutral-500">
                                                <i className="fa fa-spinner fa-spin"></i> Restoring...
                                            </span>
                                        )}
                                        {restoreSuccess && (
                                            <span className="ml-2 text-xs text-success-dark">
                                                <i className="fa fa-check"></i> Restored!
                                            </span>
                                        )}
                                        {restoreError && (
                                            <span className="ml-2 text-xs text-error">
                                                <i className="fa fa-exclamation-triangle"></i> {restoreError}
                                            </span>
                                        )}
                                    </div>
                                    {!restoreLoading && <i className="fa fa-chevron-right text-neutral-400"></i>}
                                </SettingsRow>
                            )}
                        </>
                    ) : (
                        <>
                            <SettingsRow onClick={onNavigateToPaywall} isLast={!subscriptionCancelled}>
                                <div>
                                    <p className="text-[var(--color-text-primary)]">Current Plan</p>
                                    <p className="text-[var(--color-primary)] text-sm font-semibold">Free Tier</p>
                                </div>
                                {user ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={onNavigateToPaywall}
                                    >
                                        Upgrade
                                    </Button>
                                ) : (
                                    <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                                )}
                            </SettingsRow>
                            {/* Free tier users can restore if a cancelled subscription still exists */}
                            {subscriptionCancelled && (
                                <SettingsRow onClick={handleRestorePurchase} isLast>
                                    <div className="flex-1">
                                        <span className="text-primary-dark">Restore Purchase</span>
                                        {restoreLoading && (
                                            <span className="ml-2 text-xs text-neutral-500">
                                                <i className="fa fa-spinner fa-spin"></i> Restoring...
                                            </span>
                                        )}
                                        {restoreSuccess && (
                                            <span className="ml-2 text-xs text-success-dark">
                                                <i className="fa fa-check"></i> Restored!
                                            </span>
                                        )}
                                        {restoreError && (
                                            <span className="ml-2 text-xs text-error">
                                                <i className="fa fa-exclamation-triangle"></i> {restoreError}
                                            </span>
                                        )}
                                    </div>
                                    {!restoreLoading && <i className="fa fa-chevron-right text-neutral-400"></i>}
                                </SettingsRow>
                            )}
                        </>
                    )}
                </SettingsSection>

                <SettingsSection title="Legal">
                    <SettingsRow onClick={() => onNavigate(View.PrivacyPolicy)}>
                        <span className="text-[var(--color-text-primary)]">Privacy Policy</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.TermsOfService)}>
                        <span className="text-[var(--color-text-primary)]">Terms of Service</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.SubscriptionTerms)}>
                        <span className="text-[var(--color-text-primary)]">Subscription & Billing</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.CookiePolicy)}>
                        <span className="text-[var(--color-text-primary)]">Cookie Policy</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.Disclaimer)} isLast>
                        <span className="text-[var(--color-text-primary)]">Medical & Education Disclaimer</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Support">
                    <SettingsRow onClick={() => onNavigate(View.Support)}>
                        <span className="text-[var(--color-text-primary)]">Contact Us / Help Center</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => setFeedbackModalOpen(true)} isLast>
                        <span className="text-[var(--color-text-primary)]">Give Feedback</span>
                        <i className="fa fa-chevron-right text-[var(--color-text-muted)]" aria-hidden="true"></i>
                    </SettingsRow>
                </SettingsSection>
            </main>

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                onSubmit={handleFeedbackSubmit}
            />
        </div>
    );
};

export default SettingsView;