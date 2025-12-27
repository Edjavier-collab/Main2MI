'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

/**
 * In-app feedback modal with 1–5 star rating and optional comment.
 * Includes focus trap for accessibility.
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Focus trap implementation
    const getFocusableElements = useCallback(() => {
        if (!modalRef.current) return [];
        return Array.from(
            modalRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        );
    }, []);

    // Handle keyboard navigation for focus trap
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, getFocusableElements]);

    // Focus first element when modal opens, restore focus when it closes
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            // Focus the first focusable element after a short delay to allow render
            const timer = setTimeout(() => {
                const focusableElements = getFocusableElements();
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }, 50);
            return () => clearTimeout(timer);
        } else if (previousActiveElement.current) {
            previousActiveElement.current.focus();
        }
    }, [isOpen, getFocusableElements]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const resetState = () => {
        setRating(0);
        setHoverRating(0);
        setComment('');
        setError(null);
        setSuccess(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating before submitting.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await onSubmit(rating, comment.trim());
            setSuccess(true);
            // Auto-close after showing success
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const displayRating = hoverRating || rating;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            onClick={(e) => {
                // Close when clicking the backdrop
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--color-neutral-200)] flex items-center justify-between">
                    <h2 id="feedback-modal-title" className="text-lg font-bold text-[var(--color-text-primary)]">
                        Give Feedback
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        aria-label="Close feedback modal"
                    >
                        <i className="fa-solid fa-times text-lg" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-success-light)] flex items-center justify-center">
                                <i className="fa-solid fa-check text-3xl text-[var(--color-success)]" aria-hidden="true" />
                            </div>
                            <p className="text-lg font-semibold text-[var(--color-text-primary)]">Thank you!</p>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Your feedback helps us improve.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4 text-center">
                                How would you rate your experience with MI Mastery?
                            </p>

                            {/* Star rating */}
                            <div className="flex justify-center gap-2 mb-6" role="radiogroup" aria-label="Rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded"
                                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                        aria-checked={rating === star}
                                        role="radio"
                                    >
                                        <i
                                            className={`fa-star text-3xl ${
                                                star <= displayRating
                                                    ? 'fa-solid text-warning'
                                                    : 'fa-regular text-[var(--color-neutral-300)]'
                                            }`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Optional comment */}
                            <label htmlFor="feedback-comment" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                Any additional comments? <span className="text-[var(--color-text-muted)]">(optional)</span>
                            </label>
                            <textarea
                                id="feedback-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us what you liked or how we can improve..."
                                rows={3}
                                maxLength={500}
                                className="w-full px-4 py-3 border border-[var(--color-neutral-300)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">{comment.length}/500</p>

                            {/* Error message */}
                            {error && (
                                <div className="mt-3 p-3 rounded-lg bg-[var(--color-error-light)] text-[var(--color-error)] text-sm flex items-center gap-2">
                                    <i className="fa-solid fa-exclamation-circle flex-shrink-0" aria-hidden="true" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="px-6 py-4 border-t border-[var(--color-neutral-200)] flex gap-3">
                        <Button variant="secondary" onClick={handleClose} fullWidth disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} fullWidth loading={loading} disabled={rating === 0}>
                            Submit
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;

