import React from 'react';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';

interface SupportViewProps {
    onBack: () => void;
}

const SupportView: React.FC<SupportViewProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-6 py-4">
                <BackButton onClick={onBack} className="mb-6" />

                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Contact & Support</h1>

                <div className="space-y-6">
                    <Card variant="elevated" padding="md">
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Get in Touch</h2>
                        <p className="text-[var(--color-text-secondary)]">
                            Have questions, feedback, or encountered an issue? We'd love to hear from you. Please reach out using the methods below.
                        </p>
                    </Card>

                    <Card variant="accent" padding="md" className="border-l-4 border-[var(--color-primary)]">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                            <i className="fa fa-envelope text-[var(--color-primary)]" aria-hidden="true"></i>
                            Email Support
                        </h3>
                        <p className="text-[var(--color-text-primary)]">
                            <strong>support@mimastery.com</strong>
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                            Expected response time: 24-48 hours during business days.
                        </p>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                            <i className="fa fa-comment-dots" aria-hidden="true"></i>
                            FAQ & Help Center
                        </h3>
                        <p className="text-[var(--color-text-secondary)] mb-3">
                            Visit our Help Center for answers to common questions about:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--color-text-secondary)]">
                            <li>Getting started with MI Mastery</li>
                            <li>Account and subscription management</li>
                            <li>Technical troubleshooting</li>
                            <li>Billing and payments</li>
                            <li>Privacy and data access</li>
                        </ul>
                        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                            <em>Help Center coming soon</em>
                        </p>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                            <i className="fa fa-lightbulb" aria-hidden="true"></i>
                            Feedback & Feature Requests
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                            We value your feedback and use it to improve MI Mastery. Share your ideas, suggestions, or report bugs by emailing us at <strong className="text-[var(--color-text-primary)]">support@mimastery.com</strong>.
                        </p>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                            <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                            Report a Security Issue
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                            If you discover a security vulnerability, please do NOT report it publicly. Instead, email <strong className="text-[var(--color-text-primary)]">security@mimastery.com</strong> with details. We will investigate and address it promptly.
                        </p>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                            <i className="fa fa-gavel" aria-hidden="true"></i>
                            Legal & Compliance
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                            For legal questions, privacy concerns, or formal requests (GDPR, CCPA, etc.), contact us at <strong className="text-[var(--color-text-primary)]">legal@mimastery.com</strong>.
                        </p>
                    </Card>

                    <Card variant="accent" padding="md" className="mt-8">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Our Office</h3>
                        <p className="text-[var(--color-text-secondary)]">
                            <strong>MI Mastery</strong><br />
                            Email: support@mimastery.com<br />
                            <br />
                            We're here to support you! Your experience matters to us.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SupportView;

