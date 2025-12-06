import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-6 py-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<i className="fa fa-arrow-left" />}
                    className="mb-6"
                >
                    Back
                </Button>

                <Card variant="elevated" padding="lg">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Privacy Policy</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">Last Updated: November 2024</p>

                    <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">1. Introduction</h2>
                        <p>
                            MI Practice Coach ("we," "us," "our," or "Company") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile and web application (the "Service").
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">2. Information We Collect</h2>
                        <p className="mb-3">We collect information in the following ways:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Account Information:</strong> Email, password, age confirmation.</li>
                            <li><strong>Profile Data:</strong> Subscription tier, tier acceptance timestamps, created and updated dates.</li>
                            <li><strong>Session Data:</strong> Practice sessions, feedback, transcripts, and timestamps. This is training data only and not medical records.</li>
                            <li><strong>Billing Information:</strong> Name, address, billing email, processed by Stripe (our payment processor).</li>
                            <li><strong>Usage Data:</strong> App interactions, features accessed, timestamps.</li>
                            <li><strong>Device & Technical Data:</strong> IP address, browser type, device type, operating system.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3. How We Use Your Information</h2>
                        <p className="mb-3">We use your information for:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Providing and improving the Service.</li>
                            <li>Processing subscriptions and payments.</li>
                            <li>Sending service updates and customer support responses.</li>
                            <li>Compliance with legal obligations.</li>
                            <li>Fraud prevention and abuse detection.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">4. Data Sharing</h2>
                        <p className="mb-3">We share your data only as necessary:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Stripe:</strong> Payment processor; they handle billing and subscription management.</li>
                            <li><strong>Supabase:</strong> Backend provider; manages authentication and data storage.</li>
                            <li><strong>Google Gemini AI:</strong> Processes practice session text to generate AI patient responses and feedback (no personal identifiers sent).</li>
                            <li><strong>Legal Requirement:</strong> We may disclose data if required by law or to protect rights/safety.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">5. Data Retention</h2>
                        <p>
                            We retain your personal data and session data for the duration of your account. Upon account deletion (see Account Rights below), we delete or anonymize your data within 30 days, except where retention is required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6. Security</h2>
                        <p>
                            We implement industry-standard security measures (encryption in transit via HTTPS, secure password handling via Supabase Auth). However, no transmission over the internet is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">7. Your Privacy Rights</h2>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>GDPR (EU/UK):</strong> Right to access, rectify, erase, restrict, port, and object to processing. See Account Rights below.</li>
                            <li><strong>CCPA (California):</strong> Right to know, delete, opt-out of sale. Contact us for requests.</li>
                            <li><strong>Worldwide:</strong> You may request a copy of your data or account deletion anytime.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">8. Cookies</h2>
                        <p className="mb-3">
                            We use cookies and similar technologies for authentication, preferences, and analytics. You can manage cookie preferences via our Cookie Consent banner. Essential cookies cannot be disabled as they are required for the Service to function.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">9. Third-Party Links</h2>
                        <p>
                            The Service may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies before sharing information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">10. Children</h2>
                        <p>
                            The Service is intended for users 18 years of age or older. We do not knowingly collect information from children under 18. If we become aware of such collection, we will delete it immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">11. Policy Changes</h2>
                        <p>
                            We may update this policy periodically. Continued use of the Service after changes constitutes acceptance. Significant changes will prompt notification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">12. Contact Us</h2>
                        <p>
                            For privacy questions or data requests, contact us at: <strong>support@mipracticecoach.com</strong>
                        </p>
                    </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

