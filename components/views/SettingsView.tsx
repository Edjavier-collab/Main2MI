'use client';

import React, { useState, useEffect } from 'react';
import { UserTier, View } from '../../types';
import { User } from '@supabase/supabase-js';
import {
    getUserSubscription,
    createBillingPortalSession,
    cancelSubscription,
    applyRetentionDiscount,
    upgradeToAnnual,
    restoreSubscription
} from '../../services/stripeService';
import { submitFeedback } from '../../services/feedbackService';
import { Button } from '../ui/Button';
import { Card, InsetGroup, GroupedListItem } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { FeedbackModal } from '../ui/FeedbackModal';
import { RetentionPromoModal } from '../ui/RetentionPromoModal';
import { UpgradeModal } from '../ui/UpgradeModal';
import { Brain, BarChart, ChevronRight, Star, Receipt, AlertTriangle, ExternalLink, Shield, FileText, BookOpen, Sparkles, RotateCw } from 'lucide-react';

// Helper component for styled icon boxes - Native Premium Style
const IconBox = ({ icon, className }: { icon: React.ReactNode; className?: string }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${className}`}>
        {icon}
    </div>
);

const SettingsHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="px-4 pt-6 pb-2 text-[var(--font-size-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
        {title}
    </h2>
);

interface SettingsViewProps {
    userTier: UserTier;
    onNavigateToPaywall: () => void;
    onLogout: () => Promise<void>;
    onNavigate: (view: View) => void;
    user: User | null;
    onRestore: () => Promise<boolean>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userTier, onNavigateToPaywall, onLogout, onNavigate, user, onRestore }) => {
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'annual' | 'unknown' | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [billingPortalLoading, setBillingPortalLoading] = useState(false);
    const [showRetentionModal, setShowRetentionModal] = useState(false);
    const [retentionLoading, setRetentionLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const { toasts, showToast, removeToast, ToastContainer } = useToast();

    const handleFeedbackSubmit = async (rating: number, comment: string) => {
        try {
            await submitFeedback({ rating, comment, userId: user?.id });
            showToast('Thank you for your feedback!', 'success');
        } catch (err) {
            console.error('[SettingsView] Error submitting feedback:', err);
            showToast('Failed to submit feedback. Please try again.', 'error');
            throw err;
        }
    };

    const handlePlaceholderClick = (feature: string) => {
        showToast(`${feature} customization coming soon!`, 'info');
    };

    const fetchSubscription = async () => {
        if (!user) {
            setSubscriptionLoading(false);
            return;
        }
        setSubscriptionLoading(true);
        try {
            const subscription = await getUserSubscription(user.id);
            if (subscription && typeof subscription === 'object' && !('_premiumTierMismatch' in subscription)) {
                setCancelAtPeriodEnd(subscription.cancelAtPeriodEnd ?? false);
                setSubscriptionPlan(subscription.plan || 'unknown');
            }
        } catch (err) {
            console.error('[SettingsView] Error fetching subscription plan:', err);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, [user]);

    const handleLogoutClick = async () => {
        if (logoutLoading) return;
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
            const returnUrl = window.location.href;
            const portalUrl = await createBillingPortalSession(user.id, returnUrl);
            window.location.href = portalUrl;
        } catch (err) {
            console.error('[SettingsView] Error creating billing portal session:', err);
            showToast(err instanceof Error ? err.message : 'Could not open billing portal.', 'error');
            setBillingPortalLoading(false);
        }
    };

    const handleAcceptOffer = async () => {
        if (!user) return;
        setRetentionLoading(true);
        try {
            await applyRetentionDiscount(user.id);
            showToast('Discount applied! Your subscription has been updated.', 'success');
            await fetchSubscription(); // Refresh subscription details
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to apply discount.', 'error');
        } finally {
            setRetentionLoading(false);
            setShowRetentionModal(false);
        }
    };

    const handleProceedToCancel = async () => {
        if (!user) return;
        setRetentionLoading(true);
        try {
            await cancelSubscription(user.id, false);
            showToast('Your subscription has been set to cancel at the end of the period.', 'success');
            await fetchSubscription(); // Refresh subscription details
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to cancel subscription.', 'error');
        } finally {
            setRetentionLoading(false);
            setShowRetentionModal(false);
        }
    };

    const handleUpgradeToAnnual = async () => {
        if (!user) return;
        setUpgradeLoading(true);
        try {
            const result = await upgradeToAnnual(user.id);
            showToast(result.message || 'Successfully upgraded to Annual Pro with 30% off!', 'success');
            setSubscriptionPlan('annual');
            await fetchSubscription(); // Refresh subscription details
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to upgrade subscription.', 'error');
        } finally {
            setUpgradeLoading(false);
            setShowUpgradeModal(false);
        }
    };

    const handleRestoreSubscription = async () => {
        if (!user) return;
        setRestoreLoading(true);
        try {
            await restoreSubscription(user.id);
            showToast('Your subscription has been restored!', 'success');
            await fetchSubscription(); // Refresh subscription details
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to restore subscription.', 'error');
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleRestorePurchase = async () => {
        if (!user) return;
        setRestoreLoading(true);
        try {
            showToast('Checking for active subscriptions...', 'info');
            const isPremium = await onRestore();
            if (isPremium) {
                showToast('Purchase restored! Your Premium access is active.', 'success');
                await fetchSubscription();
            } else {
                showToast('No active premium subscription found.', 'info');
            }
        } catch (error) {
            showToast('Failed to restore purchase. Please try again.', 'error');
        } finally {
            setRestoreLoading(false);
        }
    };

    const isPremium = userTier === UserTier.Premium;
    const isAnonymous = !user;

    // Common styling for row items to enforce height and standard layout
    const rowClassName = "h-[56px] flex items-center";

    return (
        <div className="min-h-screen bg-[var(--color-bg-main)] pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex items-center px-6 py-4">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
            </div>

            <main className="max-w-2xl mx-auto px-4">

                <SettingsHeader title="Subscription" />
                <InsetGroup>
                    <GroupedListItem
                        label="Current Plan"
                        icon={<IconBox icon={<Star size={20} />} className={isPremium ? "text-[var(--color-success)] bg-[var(--color-success)]/[.15]" : "text-[var(--color-primary)] bg-[var(--color-primary)]/[.10]"} />}
                        className={rowClassName}
                        hoverable={false}
                    >
                        <span className={`text-[var(--font-size-base)] font-semibold ${isPremium ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)]'}`}>
                            {subscriptionLoading ? 'Loading...' : isPremium ? `${subscriptionPlan ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1) : ''} Pro` : 'Free'}
                        </span>
                    </GroupedListItem>

                    {isPremium && subscriptionPlan === 'monthly' && !cancelAtPeriodEnd && (
                        <GroupedListItem
                            label="Upgrade to Annual"
                            icon={<IconBox icon={<Sparkles size={20} />} className="bg-[var(--color-accent)]/[.10] text-[var(--color-accent)]" />}
                            onClick={() => setShowUpgradeModal(true)}
                            className={rowClassName}
                        >
                            <span className="bg-[var(--color-success-light)] text-[var(--color-success-dark)] rounded-full px-2 py-0.5 text-xs font-medium mr-2">Save 30%</span>
                            <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </GroupedListItem>
                    )}

                    {isPremium && !cancelAtPeriodEnd && (
                        <GroupedListItem
                            label="Manage Billing"
                            icon={<IconBox icon={<Receipt size={20} />} className="bg-[var(--color-success)]/[.10] text-[var(--color-success)]" />}
                            onClick={handleManageBilling}
                            className={rowClassName}
                        >
                            <ExternalLink className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </GroupedListItem>
                    )}

                    {isPremium && !cancelAtPeriodEnd && (
                        <GroupedListItem
                            label="Cancel Subscription"
                            icon={<IconBox icon={<AlertTriangle size={20} />} className="bg-[var(--color-error)]/[.10] text-[var(--color-error)]" />}
                            onClick={() => setShowRetentionModal(true)}
                            className={rowClassName}
                        >
                            <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </GroupedListItem>
                    )}

                    {isPremium && cancelAtPeriodEnd && (
                        <GroupedListItem
                            label="Keep Subscription"
                            subtitle="Undo your scheduled cancellation"
                            icon={<IconBox icon={<RotateCw size={20} />} className="bg-[var(--color-success)]/[.10] text-[var(--color-success)]" />}
                            onClick={restoreLoading ? undefined : handleRestoreSubscription}
                            hoverable={!restoreLoading}
                            className={rowClassName}
                        >
                            <span className="text-sm text-[var(--color-success)] font-medium mr-2">Restore</span>
                            {restoreLoading ? (
                                <div className="animate-spin h-5 w-5 border-2 border-[var(--color-success)] border-t-transparent rounded-full" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                            )}
                        </GroupedListItem>
                    )}

                    {!isPremium && (
                        <GroupedListItem
                            label="Restore Purchase"
                            subtitle="Already subscribed? Sync your status"
                            icon={<IconBox icon={<RotateCw size={20} />} className="bg-[var(--color-info)]/[.10] text-[var(--color-info)]" />}
                            onClick={restoreLoading ? undefined : handleRestorePurchase}
                            hoverable={!restoreLoading}
                            className={rowClassName}
                        >
                            <span className="text-sm text-[var(--color-info)] font-medium mr-2">Sync</span>
                            {restoreLoading ? (
                                <div className="animate-spin h-5 w-5 border-2 border-[var(--color-info)] border-t-transparent rounded-full" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                            )}
                        </GroupedListItem>
                    )}

                    {!isPremium && (
                        <GroupedListItem
                            label="Upgrade to Pro"
                            icon={<IconBox icon={<Star size={20} />} className="text-[var(--color-primary)] bg-[var(--color-primary)]/[.10]" />}
                            onClick={onNavigateToPaywall}
                            className={rowClassName}
                        >
                            <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </GroupedListItem>
                    )}
                </InsetGroup>

                <SettingsHeader title="Preferences" />
                <InsetGroup>
                    <GroupedListItem
                        label="AI Persona"
                        icon={<IconBox icon={<Brain size={20} />} className="bg-[var(--color-info)]/[.10] text-[var(--color-info)]" />}
                        onClick={() => handlePlaceholderClick('AI Persona')}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                    <GroupedListItem
                        label="Feedback Detail"
                        icon={<IconBox icon={<BarChart size={20} />} className="bg-[var(--color-success)]/[.10] text-[var(--color-success)]" />}
                        onClick={() => handlePlaceholderClick('Feedback Detail')}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                </InsetGroup>

                <SettingsHeader title="Support" />
                <InsetGroup>
                    <GroupedListItem
                        label="Contact Us / Help Center"
                        onClick={() => onNavigate(View.Support)}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                    <GroupedListItem
                        label="Give Feedback"
                        onClick={() => setFeedbackModalOpen(true)}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                </InsetGroup>

                <SettingsHeader title="Legal" />
                <InsetGroup>
                    <GroupedListItem
                        label="Privacy Policy"
                        icon={<IconBox icon={<Shield size={20} />} className="bg-[var(--color-info)]/[.10] text-[var(--color-info)]" />}
                        onClick={() => onNavigate(View.PrivacyPolicy)}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                    <GroupedListItem
                        label="Terms of Service"
                        icon={<IconBox icon={<FileText size={20} />} className="bg-[var(--color-info)]/[.10] text-[var(--color-info)]" />}
                        onClick={() => onNavigate(View.TermsOfService)}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                    <GroupedListItem
                        label="Documentation"
                        icon={<IconBox icon={<BookOpen size={20} />} className="bg-[var(--color-info)]/[.10] text-[var(--color-info)]" />}
                        onClick={() => handlePlaceholderClick('Documentation')}
                        className={rowClassName}
                    >
                        <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                    </GroupedListItem>
                </InsetGroup>

                <SettingsHeader title="Account" />
                <InsetGroup>
                    {isAnonymous ? (
                        <GroupedListItem
                            label="Sign In or Create Account"
                            onClick={() => onNavigate(View.Login)}
                            className={rowClassName}
                        >
                            <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </GroupedListItem>
                    ) : (
                        <Card
                            variant="grouped-row"
                            padding="md"
                            onClick={handleLogoutClick}
                            hoverable={!logoutLoading}
                            className={`${rowClassName} justify-center cursor-pointer`}
                        >
                            <span className="text-[var(--color-error)] font-medium">
                                {logoutLoading ? 'Logging Out...' : 'Log Out'}
                            </span>
                        </Card>
                    )}
                </InsetGroup>
            </main>

            <FeedbackModal
                isOpen={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                onSubmit={handleFeedbackSubmit}
            />
            <RetentionPromoModal
                isOpen={showRetentionModal}
                onClose={() => setShowRetentionModal(false)}
                onAcceptOffer={handleAcceptOffer}
                onProceedToCancel={handleProceedToCancel}
                loading={retentionLoading}
            />
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgrade={handleUpgradeToAnnual}
                loading={upgradeLoading}
            />
        </div >
    );
};

export default SettingsView;
