import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TermsOfServiceProps {
    onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-6 py-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<i className="fa-solid fa-arrow-left" />}
                    aria-label="Go back"
                    className="mb-6 pl-0"
                >
                    Back
                </Button>

                <Card variant="elevated" padding="lg">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Terms of Service</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">Last Updated: November 2024</p>

                    <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">1. Agreement to Terms</h2>
                            <p>
                                By accessing and using MI Mastery ("Service"), you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">2. Eligibility</h2>
                            <p>
                                You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you meet this requirement and that all information provided is accurate and complete.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3. Account Registration</h2>
                            <p className="mb-3">
                                You are responsible for maintaining the confidentiality of your login credentials and are fully responsible for all activities under your account. You agree to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Provide accurate and complete information during registration.</li>
                                <li>Keep your password secure and not share it with others.</li>
                                <li>Notify us immediately of unauthorized access.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3.5. Educational Purpose Only</h2>
                            <p className="mb-3">
                                MI Mastery is an educational and practice tool designed to help healthcare professionals improve their Motivational Interviewing skills. The Service is:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>NOT a substitute</strong> for professional MI training, certification, or clinical supervision.</li>
                                <li><strong>NOT a clinical tool</strong> and must not be used for actual patient care or clinical decision-making.</li>
                                <li><strong>NOT accredited</strong> for continuing education credits or professional certification.</li>
                            </ul>
                            <p className="mt-3">
                                Users are strongly encouraged to seek supervision from qualified MI trainers and to complete formal MI training programs for professional development.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3.6. Not Medical or Clinical Advice</h2>
                            <p className="mb-3">
                                MI Mastery does not provide medical, clinical, or therapeutic advice. The Service:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Is for educational and practice purposes only.</li>
                                <li>Does not diagnose, treat, or provide recommendations for actual patients.</li>
                                <li>Should not be used as a substitute for professional clinical judgment or supervision.</li>
                                <li>Does not establish a patient-provider relationship.</li>
                            </ul>
                            <p className="mt-3">
                                If you are a healthcare provider, you are solely responsible for ensuring compliance with all applicable professional standards, regulations, and laws in your jurisdiction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3.7. AI Feedback Limitations</h2>
                            <p className="mb-3">
                                The AI-generated feedback and patient responses are provided for practice purposes only and may contain errors, inaccuracies, or limitations. The AI:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Is not a substitute for feedback from qualified MI trainers or supervisors.</li>
                                <li>May not accurately reflect real-world patient interactions.</li>
                                <li>Should be used as a learning tool, not as definitive guidance.</li>
                                <li>May produce responses that require professional judgment to evaluate.</li>
                            </ul>
                            <p className="mt-3">
                                We make no warranties regarding the accuracy, completeness, or usefulness of AI-generated content.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">4. Acceptable Use</h2>
                            <p className="mb-3">You agree not to use the Service for:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Entering real or sensitive medical, mental health, or personal health information ("PHI"). The Service is for training only and does not provide medical care.</li>
                                <li><strong>IMPORTANT - HIPAA Non-Compliance:</strong> This Service is NOT designed for Protected Health Information (PHI) and is NOT HIPAA-compliant. By using this Service, you acknowledge that you will NOT enter any real patient data, PHI, or identifiable health information. Any such data entered is at your own risk and violates these Terms.</li>
                                <li>Any illegal or unauthorized purpose.</li>
                                <li>Harassment, abuse, or threats toward others.</li>
                                <li>Spam, malware, or unauthorized access attempts.</li>
                                <li>Violating any applicable laws or regulations.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">5. Intellectual Property</h2>
                            <p>
                                The Service, including all content, features, and functionality, is owned by MI Mastery and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or transmit any content without our prior written permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6. User-Generated Content</h2>
                            <p className="mb-3">
                                You retain ownership of content you create (e.g., session transcripts), but grant us a worldwide, royalty-free license to use, reproduce, and display it for:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Providing and improving the Service.</li>
                                <li>Training our AI models (anonymized).</li>
                                <li>Analytics and research (with anonymization).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6.5. Subscriptions and Billing</h2>
                            <p className="mb-3">
                                MI Mastery offers both free and premium subscription tiers:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Free Tier:</strong> Limited to 3 practice sessions per month. Access to basic features and feedback.</li>
                                <li><strong>Premium Tier:</strong> Unlimited practice sessions, advanced AI feedback, detailed analytics, and coaching summaries. Available as monthly ($9.99/month) or annual ($99.99/year) subscriptions.</li>
                            </ul>
                            <p className="mt-3 mb-3">
                                <strong>Billing:</strong> Premium subscriptions are billed automatically on a recurring basis (monthly or annually) until cancelled. All billing is processed securely through Stripe, our third-party payment processor. You will be charged at the beginning of each billing cycle.
                            </p>
                            <p className="mb-3">
                                <strong>Price Changes:</strong> We reserve the right to modify subscription prices. Existing subscribers will be notified at least 30 days in advance of any price increase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6.6. Cancellation</h2>
                            <p className="mb-3">
                                You may cancel your premium subscription at any time through your account settings (Settings → Manage Subscription) or by contacting support. Upon cancellation:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Your subscription will remain active until the end of your current billing period.</li>
                                <li>You will retain access to premium features until the period ends.</li>
                                <li>No further charges will be made after the current period ends.</li>
                                <li>Your account will automatically revert to the free tier after cancellation.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6.7. Refund Policy</h2>
                            <p className="mb-3">
                                We do not offer refunds for subscription fees already paid, except as required by law or at our sole discretion. If you cancel mid-cycle, you will retain access until the end of your paid period. No partial refunds will be provided for unused time remaining in your billing period.
                            </p>
                            <p>
                                If you believe you are entitled to a refund due to an error or exceptional circumstances, please contact us at <strong>support@mimastery.com</strong> with details of your request.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">7. Disclaimer of Warranties</h2>
                            <p className="mb-3">
                                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. WE MAKE NO GUARANTEES REGARDING:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Accuracy, completeness, or usefulness of content.</li>
                                <li>Uninterrupted or error-free operation.</li>
                                <li>Fitness for any particular purpose.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">8. Limitation of Liability</h2>
                            <p>
                                TO THE EXTENT PERMITTED BY LAW, MI MASTERY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">9. Indemnification</h2>
                            <p>
                                You agree to indemnify and hold harmless MI Mastery from any claims, losses, or expenses (including attorneys' fees) arising from your breach of these Terms, your use of the Service, or violation of any law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">10. Modification of Service</h2>
                            <p>
                                We reserve the right to modify or discontinue the Service (or any portion) at any time, with or without notice. We are not liable for any modification or discontinuation.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">11. Termination</h2>
                            <p>
                                We may terminate your account at any time for violation of these Terms or any reason. Upon termination, your right to use the Service ceases immediately.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">14. Governing Law</h2>
                            <p>
                                These Terms are governed by and construed in accordance with the laws of the jurisdiction where the Company is registered, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts in that jurisdiction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">15. Contact</h2>
                            <p>
                                For questions or concerns about these Terms, please contact us at: <strong>support@mimastery.com</strong>
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TermsOfService;

