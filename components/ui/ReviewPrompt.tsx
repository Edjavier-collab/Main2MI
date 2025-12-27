'use client';

import React from 'react';

interface ReviewPromptProps {
    onClose: (choice: 'rate' | 'later' | 'no') => void;
}

const ReviewPrompt: React.FC<ReviewPromptProps> = ({ onClose }) => {
    // Prevent background scrolling when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl p-8 max-w-sm w-full text-center animate-slide-fade-in"
            >
                <div className="mx-auto mb-6 bg-[var(--color-accent-warning)] h-20 w-20 rounded-full flex items-center justify-center ring-8 ring-[var(--color-accent-warning)]/50">
                    <i className="fa-solid fa-star text-4xl" style={{ color: 'var(--color-text-primary)' }}></i>
                </div>
                
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Enjoying MI Mastery?</h2>
                <p className="text-[var(--color-text-secondary)] mb-8">
                    Your feedback helps us improve. If you have a moment, please consider leaving a review.
                </p>

                <div className="flex flex-col gap-3">
                    <a 
                        href="mailto:support@mimastery.com?subject=MI Mastery Feedback"
                        onClick={() => onClose('rate')}
                        className="w-full bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg hover:bg-[var(--color-primary-dark)] transition-transform transform hover:scale-105 text-center inline-block"
                    >
                        Leave a Review
                    </a>
                    <button 
                        onClick={() => onClose('later')}
                        className="w-full text-[var(--color-text-secondary)] font-semibold py-3 px-6 rounded-full hover:bg-[var(--color-neutral-100)] transition"
                    >
                        Remind Me Later
                    </button>
                    <button 
                        onClick={() => onClose('no')}
                        className="w-full text-sm text-[var(--color-text-muted)] font-medium py-2 px-6 rounded-full hover:text-[var(--color-text-secondary)] transition"
                    >
                        No, Thanks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPrompt;
