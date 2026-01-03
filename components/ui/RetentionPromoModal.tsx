'use client';

import React from 'react';
import { Button } from './Button';

interface RetentionPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptOffer: () => void;
  onProceedToCancel: () => void;
  loading?: boolean;
}

export const RetentionPromoModal: React.FC<RetentionPromoModalProps> = ({
  isOpen,
  onClose,
  onAcceptOffer,
  onProceedToCancel,
  loading = false,
}) => {
  if (!isOpen) {
    return null;
  }

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
          <h2 className="text-xl font-bold text-text-primary">Wait, Don't Go!</h2>
          <p className="mt-2 text-text-secondary">
            We'd be sad to see you leave. As a thank you for being a valued member, we'd like to offer you a special discount.
          </p>
          <div className="my-6 p-4 bg-bg-accent rounded-lg">
            <p className="text-lg font-semibold">
              Get <span className="text-primary font-bold">50% off</span> your next 3 months!
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={onAcceptOffer}
              loading={loading}
              disabled={loading}
            >
              Keep My Subscription & Get 50% Off
            </Button>
            <Button
              variant="secondary"
              onClick={onProceedToCancel}
              disabled={loading}
              className="text-text-muted"
            >
              No thanks, I still want to cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
