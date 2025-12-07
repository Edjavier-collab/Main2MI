import React from 'react';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';

interface TermsOfServiceProps {
    onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-6 py-4">
                <BackButton onClick={onBack} className="mb-6" />

                <Card variant="elevated" padding="lg">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Terms of Service</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">Last Updated: November 2024</p>

                    <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">1. Agreement to Terms</h2>
                        <p>
                            By accessing and using MI Practice Coach ("Service"), you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use the Service.
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
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">4. Acceptable Use</h2>
                        <p className="mb-3">You agree not to use the Service for:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Entering real or sensitive medical, mental health, or personal health information ("PHI"). The Service is for training only and does not provide medical care.</li>
                            <li>Any illegal or unauthorized purpose.</li>
                            <li>Harassment, abuse, or threats toward others.</li>
                            <li>Spam, malware, or unauthorized access attempts.</li>
                            <li>Violating any applicable laws or regulations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">5. Intellectual Property</h2>
                        <p>
                            The Service, including all content, features, and functionality, is owned by MI Practice Coach and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or transmit any content without our prior written permission.
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
                            TO THE EXTENT PERMITTED BY LAW, MI PRACTICE COACH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">9. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless MI Practice Coach from any claims, losses, or expenses (including attorneys' fees) arising from your breach of these Terms, your use of the Service, or violation of any law.
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
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">12. Governing Law</h2>
                        <p>
                            These Terms are governed by and construed in accordance with the laws of the jurisdiction where the Company is registered, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts in that jurisdiction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">13. Contact</h2>
                        <p>
                            For questions or concerns about these Terms, please contact us at: <strong>support@mipracticecoach.com</strong>
                        </p>
                    </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TermsOfService;

