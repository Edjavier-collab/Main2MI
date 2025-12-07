import React from 'react';
import { BackButton } from '../ui/BackButton';
import { Card } from '../ui/Card';

interface SubscriptionTermsProps {
    onBack: () => void;
}

const SubscriptionTerms: React.FC<SubscriptionTermsProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-6 py-4">
                <BackButton onClick={onBack} className="mb-6" />

                <Card variant="elevated" padding="lg">
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Subscription & Billing Terms</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">Last Updated: November 2024</p>

                    <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">1. Subscription Plans</h2>
                        <p className="mb-3">
                            MI Practice Coach offers two tiers:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Free:</strong> 3 practice sessions per calendar month. No payment required.</li>
                            <li><strong>Premium:</strong> Unlimited sessions, advanced features, and data export. Available on monthly or annual basis.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">2. Pricing & Billing</h2>
                        <p className="mb-3">
                            Current Premium pricing:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Monthly:</strong> Charged monthly to your payment method.</li>
                            <li><strong>Annual:</strong> Charged once per year at a discounted rate.</li>
                        </ul>
                        <p className="mt-3">
                            Prices are displayed in USD and may be adjusted with 30 days' notice. International transactions may incur currency conversion fees at your bank's rates.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">3. Taxes</h2>
                        <p>
                            Subscription prices exclude applicable sales tax, VAT, or similar taxes. These will be calculated and added at checkout based on your billing address and local laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">4. Automatic Renewal</h2>
                        <p className="mb-3">
                            Your subscription will automatically renew at the end of each billing period using your saved payment method, unless cancelled. You will be notified of pending renewals.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">5. Cancellation & Refunds</h2>
                        <p className="mb-3">
                            <strong>Cancellation:</strong> You can cancel your subscription anytime via Stripe Billing Portal in Settings. Cancellation takes effect at the end of your current billing period; you retain access until then.
                        </p>
                        <p>
                            <strong>Refunds:</strong> No refunds are provided for completed subscription periods. However, if required by your local consumer protection laws (e.g., EU 14-day withdrawal right), such refunds will be honored. To request a legally-mandated refund, contact support@mipracticecoach.com within 30 days of purchase with proof of payment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">6. Free Trial</h2>
                        <p>
                            Occasionally, we may offer a free trial period. If you enter a valid payment method to enable a free trial, we will begin billing you automatically when the trial ends unless you cancel before the trial ends. Trial terms will be clearly disclosed at signup.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">7. Payment Methods</h2>
                        <p>
                            Payments are processed through Stripe, a third-party payment processor. We do not store your payment card information directly. Stripe handles all transactions securely under their privacy and security policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">8. Failed Payments</h2>
                        <p className="mb-3">
                            If a payment fails, we will attempt to retry it using your saved payment method. If all retry attempts fail:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Your account will be downgraded to Free tier.</li>
                            <li>You may lose access to premium features.</li>
                            <li>We will notify you via email with instructions to update your payment method.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">9. Billing Information</h2>
                        <p>
                            You agree to provide accurate and complete billing information and to keep it up to date. You are responsible for all charges incurred under your account, even if unauthorized use occurs due to your negligence.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">10. Subscription Changes</h2>
                        <p>
                            You can upgrade or downgrade your plan anytime. Downgrades take effect at the end of your current billing period. Upgrades may result in additional charges or prorated credits depending on your billing cycle.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">11. Suspension for Non-Payment</h2>
                        <p>
                            If your account is past due and we are unable to collect payment after repeated attempts, we may suspend your account or delete it in accordance with our Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">12. Contact & Disputes</h2>
                        <p>
                            For billing questions or disputes, please contact us at <strong>support@mipracticecoach.com</strong> or via Stripe Billing Portal. We will investigate and respond within 30 days.
                        </p>
                    </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SubscriptionTerms;

