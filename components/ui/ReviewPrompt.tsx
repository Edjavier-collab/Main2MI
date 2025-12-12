
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
                className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center animate-slide-fade-in"
            >
                <div className="mx-auto mb-6 bg-warning-light h-20 w-20 rounded-full flex items-center justify-center ring-8 ring-warning-light/50">
                    <i className="fa-solid fa-star text-4xl text-warning"></i>
                </div>
                
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">Enjoying MI Practice Coach?</h2>
                <p className="text-neutral-600 mb-8">
                    Your feedback helps us improve. If you have a moment, please consider leaving a review.
                </p>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => onClose('rate')}
                        className="w-full bg-primary text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg hover:bg-primary-dark transition-transform transform hover:scale-105"
                    >
                        Leave a Review
                    </button>
                    <button 
                        onClick={() => onClose('later')}
                        className="w-full text-neutral-600 font-semibold py-3 px-6 rounded-full hover:bg-neutral-100 transition"
                    >
                        Remind Me Later
                    </button>
                    <button 
                        onClick={() => onClose('no')}
                        className="w-full text-sm text-neutral-400 font-medium py-2 px-6 rounded-full hover:text-neutral-600 transition"
                    >
                        No, Thanks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPrompt;
