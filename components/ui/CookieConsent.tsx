'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface CookiePreferences {
    essential: boolean; // Always true, cannot disable
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

interface CookieConsentProps {
    onConsent?: (preferences: CookiePreferences) => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onConsent }) => {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        // Check if user has already made a choice
        const storedConsent = localStorage.getItem('mi-coach-cookie-consent');
        if (!storedConsent) {
            // No prior consent, show banner
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        const allConsent: CookiePreferences = {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
        };
        saveCookiePreferences(allConsent);
    };

    const handleRejectNonEssential = () => {
        const minimalConsent: CookiePreferences = {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
        };
        saveCookiePreferences(minimalConsent);
    };

    const handleCustomize = () => {
        setPreferences({
            ...preferences,
            essential: true, // Essential always true
        });
        setShowDetails(true);
    };

    const handleSavePreferences = () => {
        saveCookiePreferences(preferences);
    };

    const saveCookiePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem('mi-coach-cookie-consent', JSON.stringify(prefs));
        localStorage.setItem('mi-coach-cookie-consent-date', new Date().toISOString());
        setShowBanner(false);
        setShowDetails(false);
        if (onConsent) {
            onConsent(prefs);
        }
        // In production, integrate with analytics/tracking services here
    };

    const handleTogglePreference = (key: keyof CookiePreferences) => {
        if (key === 'essential') {
            // Essential cannot be disabled
            return;
        }
        setPreferences({
            ...preferences,
            [key]: !preferences[key],
        });
    };

    if (!showBanner && !showDetails) {
        return null;
    }

    if (showDetails) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
                <div className="bg-white w-full sm:max-w-2xl rounded-[var(--radius-lg)] p-6 space-y-6 animate-slide-up shadow-[var(--shadow-xl)] max-h-[90vh] overflow-hidden flex flex-col">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Cookie Preferences</h2>
                        <p className="text-[var(--color-text-secondary)]">Manage your cookie and tracking preferences below.</p>
                    </div>

                    <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                        {/* Essential */}
                        <div className="flex items-start p-4 bg-[var(--color-bg-main)] rounded-[var(--radius-md)] border border-[var(--color-primary-lighter)]">
                            <input
                                type="checkbox"
                                checked={preferences.essential}
                                disabled
                                className="mt-1 mr-4 w-5 h-5 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)] cursor-not-allowed accent-[var(--color-primary)]"
                            />
                            <div className="flex-1">
                                <label className="font-semibold text-[var(--color-text-primary)] block">Essential Cookies</label>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                    Required for login, security, and basic functionality. Cannot be disabled.
                                </p>
                            </div>
                        </div>

                        {/* Functional */}
                        <div className="flex items-start p-4 bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] hover:border-[var(--color-primary)] cursor-pointer transition-colors shadow-sm"
                             onClick={() => handleTogglePreference('functional')}>
                            <input
                                type="checkbox"
                                checked={preferences.functional}
                                onChange={() => handleTogglePreference('functional')}
                                className="mt-1 mr-4 w-5 h-5 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)] cursor-pointer accent-[var(--color-primary)]"
                            />
                            <div className="flex-1">
                                <label className="font-semibold text-[var(--color-text-primary)] block cursor-pointer">Functional Cookies</label>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                    Remember your preferences, language, and settings across sessions.
                                </p>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-start p-4 bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] hover:border-[var(--color-primary)] cursor-pointer transition-colors shadow-sm"
                             onClick={() => handleTogglePreference('analytics')}>
                            <input
                                type="checkbox"
                                checked={preferences.analytics}
                                onChange={() => handleTogglePreference('analytics')}
                                className="mt-1 mr-4 w-5 h-5 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)] cursor-pointer accent-[var(--color-primary)]"
                            />
                            <div className="flex-1">
                                <label className="font-semibold text-[var(--color-text-primary)] block cursor-pointer">Analytics Cookies</label>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                    Help us understand how you use the app to improve features and performance.
                                </p>
                            </div>
                        </div>

                        {/* Marketing */}
                        <div className="flex items-start p-4 bg-white rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] hover:border-[var(--color-primary)] cursor-pointer transition-colors shadow-sm"
                             onClick={() => handleTogglePreference('marketing')}>
                            <input
                                type="checkbox"
                                checked={preferences.marketing}
                                onChange={() => handleTogglePreference('marketing')}
                                className="mt-1 mr-4 w-5 h-5 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)] cursor-pointer accent-[var(--color-primary)]"
                            />
                            <div className="flex-1">
                                <label className="font-semibold text-[var(--color-text-primary)] block cursor-pointer">Marketing Cookies</label>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                    Track your interests to show relevant content and ads. You can opt-out anytime.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-[var(--color-neutral-200)]">
                        <Button
                            onClick={() => setShowDetails(false)}
                            variant="ghost"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSavePreferences}
                            variant="primary"
                        >
                            Save Preferences
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[var(--color-primary-lighter)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 p-6 sm:p-8 bottom-20 sm:bottom-0">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Cookie Preferences</h3>
                        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                            We use cookies to enhance your experience. By continuing, you accept our use of essential cookies. You can customize your preferences anytime.
                        </p>
                    </div>

                    <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                        <Button
                            onClick={handleRejectNonEssential}
                            variant="ghost"
                            className="flex-1 sm:flex-none whitespace-nowrap"
                        >
                            Essential Only
                        </Button>
                        <Button
                            onClick={handleCustomize}
                            variant="secondary"
                            className="flex-1 sm:flex-none whitespace-nowrap"
                        >
                            Customize
                        </Button>
                        <Button
                            onClick={handleAcceptAll}
                            variant="primary"
                            className="flex-1 sm:flex-none whitespace-nowrap"
                        >
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { CookieConsent };
export default CookieConsent;

