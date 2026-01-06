'use client';

import React from 'react';
import { Button } from './Button';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  loading?: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  loading = false,
}) => {
  if (!isOpen) {
    return null;
  }

  const monthlyYearlyCost = 119.88; // $9.99 x 12
  const regularAnnualPrice = 99.99;
  const discountedPrice = 69.99;
  const savingsVsMonthly = monthlyYearlyCost - discountedPrice;
  const savingsVsRegularAnnual = regularAnnualPrice - discountedPrice;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-md p-6 bg-[var(--color-bg-card)] rounded-[var(--radius-xl)] shadow-xl border border-neutral-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* Header */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Special Offer</h2>
          <p className="mt-2 text-text-secondary">
            Upgrade to Annual and save 30%
          </p>

          {/* Pricing Comparison */}
          <div className="my-6 space-y-3">
            {/* Current Plan */}
            <div className="p-4 bg-bg-secondary rounded-lg border border-neutral-200/50">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Current Plan</p>
              <p className="text-lg font-semibold text-text-primary">Monthly Pro</p>
              <p className="text-sm text-text-secondary">$9.99/month (${monthlyYearlyCost.toFixed(2)}/year)</p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-primary rotate-90" />
            </div>

            {/* Upgrade Plan */}
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full">30% OFF</span>
              </div>
              <p className="text-lg font-bold text-primary">Annual Pro</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-sm text-text-muted line-through">${regularAnnualPrice.toFixed(2)}</span>
                <span className="text-2xl font-bold text-text-primary">${discountedPrice.toFixed(2)}</span>
                <span className="text-sm text-text-secondary">/year</span>
              </div>
              <p className="text-sm text-success font-medium mt-2">
                Save ${savingsVsRegularAnnual.toFixed(2)} vs regular price
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="text-left mb-6 p-4 bg-bg-accent rounded-lg">
            <p className="text-sm font-semibold text-text-primary mb-2">What you get:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Unlimited practice sessions</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Save ${savingsVsMonthly.toFixed(2)}/year vs monthly billing</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Lock in your discounted rate forever</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={onUpgrade}
              loading={loading}
              disabled={loading}
              fullWidth
            >
              Upgrade Now - ${discountedPrice.toFixed(2)}/year
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="text-text-muted"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
