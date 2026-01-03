'use client';

import React, { useState, useEffect } from 'react';
import { UserTier, View } from '../../types';
import { User } from '@supabase/supabase-js';
import { 
    getUserSubscription, 
    createBillingPortalSession,
    cancelSubscription,
    applyRetentionDiscount 
} from '../../services/stripeService';
import { submitFeedback } from '../../services/feedbackService';
import { Button } from '../ui/Button';
import { InsetGroup, GroupedListItem } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { FeedbackModal } from '../ui/FeedbackModal';
import { RetentionPromoModal } from '../ui/RetentionPromoModal';
import { Brain, BarChart, Clock, Bell, ChevronRight, Star, Receipt, AlertTriangle, ExternalLink, Shield, FileText, BookOpen } from 'lucide-react';

// Helper component for styled icon boxes
const IconBox = ({ icon, className }: { icon: React.ReactNode; className?: string }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${className}`}>
        {icon}
    </div>
);

const SettingsHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="px-4 pt-6 pb-2 text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {title}
    </h2>
);

interface SettingsViewProps {
    userTier: UserTier;
    onNavigateToPaywall: () => void;
    onLogout: () => Promise<void>;
    onNavigate: (view: View) => void;
    user: User | null;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userTier, onNavigateToPaywall, onLogout, onNavigate, user }) => {
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'annual' | 'unknown' | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [billingPortalLoading, setBillingPortalLoading] = useState(false);
    const [showRetentionModal, setShowRetentionModal] = useState(false);
    const [retentionLoading, setRetentionLoading] = useState(false);

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

    const isPremium = userTier === UserTier.Premium;
    const isAnonymous = !user;

    return (
        <div className="min-h-screen bg-transparent pb-24">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <div className="flex items-center px-6 py-4">
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            </div>

            <main className="max-w-2xl mx-auto px-4">

                <SettingsHeader title="Subscription" />
                <InsetGroup>
                    <GroupedListItem 
                        label="Current Plan" 
                        icon={<IconBox icon={<Star size={20} />} className={isPremium ? "text-yellow-500 bg-yellow-500/[.15]" : "text-primary bg-primary/[.10]"} />}
                    >
                        <span className={`font-semibold ${isPremium ? 'text-yellow-600' : 'text-text-primary'}`}>
                            {subscriptionLoading ? 'Loading...' : isPremium ? `${subscriptionPlan ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1) : ''} Pro` : 'Free'}
                        </span>
                    </GroupedListItem>
                    
                    {isPremium && !cancelAtPeriodEnd && (
                        <GroupedListItem label="Manage Billing" icon={<IconBox icon={<Receipt size={20} />} className="bg-success/[.10] text-success" />} onClick={handleManageBilling}>
                            <ExternalLink className="h-5 w-5 text-text-muted" />
                        </GroupedListItem>
                    )}

                    {isPremium && !cancelAtPeriodEnd && (
                         <GroupedListItem label="Cancel Subscription" icon={<IconBox icon={<AlertTriangle size={20} />} className="bg-error/[.10] text-error" />} onClick={() => setShowRetentionModal(true)}>
                            <ChevronRight className="h-5 w-5 text-text-muted" />
                        </GroupedListItem>
                    )}

                    {!isPremium && (
                        <GroupedListItem label="Upgrade to Pro" icon={<IconBox icon={<Star size={20} />} className="text-primary bg-primary/[.10]" />} onClick={onNavigateToPaywall}>
                            <Button variant="primary" size="sm">Upgrade</Button>
                        </GroupedListItem>
                    )}
                </InsetGroup>

                <SettingsHeader title="Preferences" />
                <InsetGroup>
                    <GroupedListItem label="AI Persona" icon={<IconBox icon={<Brain size={20} />} className="bg-info/[.10] text-info" />} onClick={() => handlePlaceholderClick('AI Persona')}>
                        <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
                    <GroupedListItem label="Feedback Detail" icon={<IconBox icon={<BarChart size={20} />} className="bg-success/[.10] text-success" />} onClick={() => handlePlaceholderClick('Feedback Detail')}>
                         <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
                </InsetGroup>

                <SettingsHeader title="Account" />
                <InsetGroup>
                    {isAnonymous ? (
                        <GroupedListItem label="Sign In or Create Account" onClick={() => onNavigate(View.Login)}>
                            <ChevronRight className="h-5 w-5 text-text-muted" />
                        </GroupedListItem>
                    ) : (
                         <GroupedListItem label="Log Out" onClick={handleLogoutClick} hoverable={false}>
                            <Button
                                type="button"
                                onClick={handleLogoutClick}
                                disabled={logoutLoading}
                                variant="destructive"
                                size="sm"
                                loading={logoutLoading}
                            >
                                {logoutLoading ? 'Logging Out...' : 'Log Out'}
                            </Button>
                        </GroupedListItem>
                    )}
                </InsetGroup>

                <SettingsHeader title="Support" />
                <InsetGroup>
                    <GroupedListItem label="Contact Us / Help Center" onClick={() => onNavigate(View.Support)}>
                        <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
                    <GroupedListItem label="Give Feedback" onClick={() => setFeedbackModalOpen(true)}>
                        <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
                </InsetGroup>

                <SettingsHeader title="Legal" />
                <InsetGroup>
                    <GroupedListItem label="Privacy Policy" icon={<IconBox icon={<Shield size={20} />} className="bg-info/[.10] text-info" />} onClick={() => onNavigate(View.PrivacyPolicy)}>
                        <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
                    <GroupedListItem label="Terms of Service" icon={<IconBox icon={<FileText size={20} />} className="bg-info/[.10] text-info" />} onClick={() => onNavigate(View.TermsOfService)}>
                         <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
                    <GroupedListItem label="Documentation" icon={<IconBox icon={<BookOpen size={20} />} className="bg-info/[.10] text-info" />} onClick={() => handlePlaceholderClick('Documentation')}>
                         <ChevronRight className="h-5 w-5 text-text-muted" />
                    </GroupedListItem>
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
        </div>
    );
};

export default SettingsView;
