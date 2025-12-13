import React from 'react';
import { Card } from '../ui/Card';
import { BackButton } from '../ui/BackButton';

interface CookiePolicyProps {
    onBack: () => void;
}

const CookiePolicy: React.FC<CookiePolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-6 py-4">
                <BackButton onClick={onBack} className="mb-6" />

                <Card variant="elevated" padding="lg">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Cookie Policy</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">Last Updated: November 2024</p>

                    <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">1. What Are Cookies?</h2>
                        <p>
                            Cookies are small text files stored on your device (computer, tablet, or mobile) that help websites recognize you, remember preferences, and track usage patterns. We use cookies to enhance your experience with MI Mastery.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">2. Types of Cookies We Use</h2>
                        <p className="mb-3">
                            We use the following categories of cookies:
                        </p>
                        <ul className="list-disc list-inside space-y-3 ml-4">
                            <li>
                                <strong>Essential Cookies:</strong> Required for the Service to function. These include authentication tokens and session identifiers. You cannot disable these without losing core functionality.
                            </li>
                            <li>
                                <strong>Functional Cookies:</strong> Remember your preferences, language settings, and login state across sessions. Improve usability.
                            </li>
                            <li>
                                <strong>Analytics Cookies:</strong> Help us understand how you use the Service (page views, user flows, performance metrics). We may use services like Google Analytics (where compliant).
                            </li>
                            <li>
                                <strong>Marketing Cookies:</strong> Used to track your interests and show you relevant ads (if enabled). We respect your opt-out preferences.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3. Third-Party Cookies</h2>
                        <p className="mb-3">
                            We may include cookies from trusted third parties:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Stripe (Payment):</strong> Cookies for secure payment processing.</li>
                            <li><strong>Google Gemini (AI):</strong> May set cookies for API interactions (no user tracking).</li>
                            <li><strong>Supabase (Auth):</strong> Cookies for authentication and session management.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">4. Cookie Preferences & Consent</h2>
                        <p className="mb-3">
                            When you first visit MI Mastery, we display a Cookie Consent banner. You can:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Accept all cookies (including analytics and marketing).</li>
                            <li>Accept only essential cookies.</li>
                            <li>Customize your preferences by category.</li>
                        </ul>
                        <p className="mt-3">
                            Your choice is saved in localStorage and honored for 12 months. You can change your preferences anytime via Settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">5. How to Manage Cookies</h2>
                        <p className="mb-3">
                            <strong>Via Our App:</strong> Use the Cookie Consent banner or Settings to manage preferences.
                        </p>
                        <p className="mb-3">
                            <strong>Via Your Browser:</strong> Most browsers allow you to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>View stored cookies.</li>
                            <li>Block cookies by default.</li>
                            <li>Delete cookies when you close your browser.</li>
                        </ul>
                        <p className="mt-3">
                            Note: Disabling essential cookies may impair or prevent the Service from functioning.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6. Tracking & Do Not Track (DNT)</h2>
                        <p>
                            If your browser sends a "Do Not Track" signal, we will respect non-essential tracking and refrain from setting non-essential cookies. Essential cookies will still be set.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">7. Cookie Duration</h2>
                        <p className="mb-3">
                            Cookies expire based on their type:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Session Cookies:</strong> Deleted when you close your browser.</li>
                            <li><strong>Persistent Cookies:</strong> May remain for up to 2 years.</li>
                            <li><strong>Consent Cookies:</strong> Valid for 12 months.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">8. International Compliance</h2>
                        <p className="mb-3">
                            <strong>GDPR (EU/UK):</strong> We obtain explicit consent for non-essential cookies before setting them.
                        </p>
                        <p>
                            <strong>CCPA (California):</strong> Non-essential cookies are considered "sales" under CCPA; you have the right to opt-out via your browser or our Cookie Consent tool.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">9. Changes to This Policy</h2>
                        <p>
                            We may update this Cookie Policy as our practices evolve. Continued use of the Service after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">10. Contact</h2>
                        <p>
                            For questions about our use of cookies, contact: <strong>support@mimastery.com</strong>
                        </p>
                    </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CookiePolicy;

