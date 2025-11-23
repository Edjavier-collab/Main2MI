import React, { useState } from 'react';
import { UserTier, View } from '../types';
import { User } from '@supabase/supabase-js';
import { restoreSubscription } from '../services/stripeService';

interface SettingsViewProps {
    userTier: UserTier;
    onNavigateToPaywall: () => void;
    onLogout: () => void;
    onNavigate: (view: View) => void;
    user: User | null;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-500 uppercase px-4 mb-2">{title}</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {children}
        </div>
    </div>
);

const SettingsRow: React.FC<{ onClick?: () => void; isLast?: boolean; children: React.ReactNode }> = ({ onClick, isLast = false, children }) => (
    <div
        onClick={onClick}
        className={`flex justify-between items-center p-4 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors ${!isLast ? 'border-b border-gray-200' : ''}`}
    >
        {children}
    </div>
);


const SettingsView: React.FC<SettingsViewProps> = ({ userTier, onNavigateToPaywall, onLogout, onNavigate, user }) => {
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

    const handlePlaceholderClick = (feature: string) => {
        alert(`${feature} feature coming soon!`);
    };

    const handleRestorePurchase = async () => {
        if (!user) {
            alert('Please log in to restore your purchase');
            return;
        }

        setRestoreLoading(true);
        setRestoreError(null);
        setRestoreSuccess(null);

        try {
            await restoreSubscription(user.id);
            setRestoreSuccess('Your subscription has been restored successfully!');
            // Reload the page or refresh tier after a delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            console.error('[SettingsView] Error restoring purchase:', err);
            setRestoreError(err instanceof Error ? err.message : 'Failed to restore purchase. Please try again.');
        } finally {
            setRestoreLoading(false);
        }
    };

    const isPremium = userTier === UserTier.Premium;
    const isAnonymous = !user;

    return (
        <div className="flex-grow p-4 sm:p-6 bg-slate-50 min-h-full">
            <header className="text-center mb-8 pt-4">
                <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            </header>

            <main className="max-w-2xl mx-auto">
                <SettingsSection title="Account">
                    {isAnonymous ? (
                        <>
                            <SettingsRow onClick={() => onNavigate(View.Login)} isLast>
                                <div>
                                    <span className="text-sky-600 font-medium">Sign In or Create Account</span>
                                    <p className="text-xs text-gray-500 mt-1">Access unlimited sessions and sync across devices</p>
                                </div>
                                <i className="fa fa-chevron-right text-gray-400"></i>
                            </SettingsRow>
                        </>
                    ) : (
                        <div onClick={onLogout} className="flex justify-center items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl">
                            <span className="text-red-500 font-medium">Log Out</span>
                        </div>
                    )}
                </SettingsSection>

                <SettingsSection title="Subscription">
                    {isPremium ? (
                        <>
                            <SettingsRow>
                                <span className="text-gray-800">Current Plan</span>
                                <span className="font-semibold text-gray-800">Premium</span>
                            </SettingsRow>
                            <SettingsRow onClick={() => onNavigate(View.CancelSubscription)}>
                                <span className="text-sky-600">Manage Subscription</span>
                                <i className="fa fa-chevron-right text-gray-400"></i>
                            </SettingsRow>
                            <SettingsRow onClick={handleRestorePurchase} isLast>
                                <div className="flex-1">
                                    <span className="text-sky-600">Restore Purchase</span>
                                    {restoreLoading && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            <i className="fa fa-spinner fa-spin"></i> Restoring...
                                        </span>
                                    )}
                                    {restoreSuccess && (
                                        <span className="ml-2 text-xs text-green-600">
                                            <i className="fa fa-check"></i> Restored!
                                        </span>
                                    )}
                                    {restoreError && (
                                        <span className="ml-2 text-xs text-red-600">
                                            <i className="fa fa-exclamation-triangle"></i> {restoreError}
                                        </span>
                                    )}
                                </div>
                                {!restoreLoading && <i className="fa fa-chevron-right text-gray-400"></i>}
                            </SettingsRow>
                        </>
                    ) : (
                        <>
                            <SettingsRow onClick={onNavigateToPaywall}>
                                <div>
                                    <p className="text-gray-800">Current Plan</p>
                                    <p className="text-sky-600 text-sm font-semibold">Free Tier</p>
                                </div>
                                <i className="fa fa-chevron-right text-gray-400"></i>
                            </SettingsRow>
                             <SettingsRow onClick={handleRestorePurchase} isLast>
                                <div className="flex-1">
                                    <span className="text-gray-800">Restore Purchase</span>
                                    {restoreLoading && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            <i className="fa fa-spinner fa-spin"></i> Restoring...
                                        </span>
                                    )}
                                    {restoreSuccess && (
                                        <span className="ml-2 text-xs text-green-600">
                                            <i className="fa fa-check"></i> Restored!
                                        </span>
                                    )}
                                    {restoreError && (
                                        <span className="ml-2 text-xs text-red-600">
                                            <i className="fa fa-exclamation-triangle"></i> {restoreError}
                                        </span>
                                    )}
                                </div>
                                {!restoreLoading && <i className="fa fa-chevron-right text-gray-400"></i>}
                            </SettingsRow>
                        </>
                    )}
                </SettingsSection>

                <SettingsSection title="Legal">
                    <SettingsRow onClick={() => onNavigate(View.PrivacyPolicy)}>
                        <span className="text-gray-800">Privacy Policy</span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.TermsOfService)}>
                        <span className="text-gray-800">Terms of Service</span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.SubscriptionTerms)}>
                        <span className="text-gray-800">Subscription & Billing</span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.CookiePolicy)}>
                        <span className="text-gray-800">Cookie Policy</span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </SettingsRow>
                    <SettingsRow onClick={() => onNavigate(View.Disclaimer)} isLast>
                        <span className="text-gray-800">Medical & Education Disclaimer</span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Support">
                    <SettingsRow onClick={() => onNavigate(View.Support)} isLast>
                        <span className="text-gray-800">Contact Us / Help Center</span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </SettingsRow>
                </SettingsSection>
            </main>
        </div>
    );
};

export default SettingsView;