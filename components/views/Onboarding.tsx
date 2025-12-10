import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface OnboardingProps {
    onFinish: () => void;
}

const onboardingSteps = [
    {
        // Step 1: Welcome
        content: (
            <>
                <div className={'bg-[var(--color-primary-lighter)] rounded-full h-40 w-40 flex items-center justify-center mb-8'}>
                    <i className="fa-solid fa-user-doctor text-5xl text-[var(--color-primary)]" aria-hidden="true"></i>
                </div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Welcome to MI Practice Coach!</h1>
                <p className="text-[var(--color-text-secondary)] max-w-sm">The safe way to build confidence and master Motivational Interviewing with realistic AI-powered patients.</p>
            </>
        ),
    },
    {
        // Step 2: How It Works (New descriptive list)
        content: (
            <>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">How It Works</h1>
                <p className="text-[var(--color-text-secondary)] max-w-sm mb-8">Each session is a simple, powerful loop designed to accelerate your learning.</p>
                <div className="text-left max-w-sm w-full space-y-3">
                    <Card variant="elevated" padding="sm" className="flex items-start">
                        <i className="fa-solid fa-file-lines text-[var(--color-primary)] w-6 text-xl text-center mt-1" aria-hidden="true"></i>
                        <div className="ml-4">
                            <h3 className="font-semibold text-[var(--color-text-primary)]">Review the Patient Case</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">Start with a detailed profile of a simulated patient, including their background and chief complaint.</p>
                        </div>
                    </Card>
                    <Card variant="elevated" padding="sm" className="flex items-start">
                        <i className="fa-solid fa-microphone text-[var(--color-primary)] w-6 text-xl text-center mt-1" aria-hidden="true"></i>
                        <div className="ml-4">
                            <h3 className="font-semibold text-[var(--color-text-primary)]">Practice the Conversation</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">Use your voice to engage with the patient in a timed, realistic scenario.</p>
                        </div>
                    </Card>
                    <Card variant="elevated" padding="sm" className="flex items-start">
                        <i className="fa-solid fa-comment-dots text-[var(--color-primary)] w-6 text-xl text-center mt-1" aria-hidden="true"></i>
                        <div className="ml-4">
                            <h3 className="font-semibold text-[var(--color-text-primary)]">Get Instant Feedback</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">Receive an AI-powered analysis of your MI skills right after the session ends.</p>
                        </div>
                    </Card>
                    <Card variant="elevated" padding="sm" className="flex items-start">
                        <i className="fa-solid fa-chart-line text-[var(--color-primary)] w-6 text-xl text-center mt-1" aria-hidden="true"></i>
                        <div className="ml-4">
                            <h3 className="font-semibold text-[var(--color-text-primary)]">Track Your Growth</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">Review past sessions in your calendar and watch your skills improve over time.</p>
                        </div>
                    </Card>
                </div>
            </>
        ),
    },
    {
        // NEW Step 3: Learn the fundamentals
        content: (
            <>
                <div className={'bg-[var(--color-primary-lighter)] rounded-full h-40 w-40 flex items-center justify-center mb-8'}>
                    <i className="fa-solid fa-book-open-reader text-5xl text-[var(--color-primary)]" aria-hidden="true"></i>
                </div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Learn the Fundamentals</h1>
                <p className="text-[var(--color-text-secondary)] max-w-sm mb-6">Before you dive in, we recommend reading the introductory articles in our Resource Library. It's the perfect way to refresh your knowledge on:</p>
                <ul className="text-[var(--color-text-primary)] space-y-2 max-w-sm text-left mx-auto w-fit font-medium">
                    <li className="flex items-center"><i className="fa-solid fa-star text-[var(--color-warning)] mr-3" aria-hidden="true"></i>The Spirit of MI</li>
                    <li className="flex items-center"><i className="fa-solid fa-star text-[var(--color-warning)] mr-3" aria-hidden="true"></i>The Core Skills (OARS)</li>
                    <li className="flex items-center"><i className="fa-solid fa-star text-[var(--color-warning)] mr-3" aria-hidden="true"></i>The Stages of Change</li>
                </ul>
            </>
        )
    },
    {
        // Step 4: Feedback (Formerly Step 3)
        content: (
            <>
                <div className={'bg-[var(--color-primary-lighter)] rounded-full h-40 w-40 flex items-center justify-center mb-8'}>
                    <i className="fa-solid fa-chart-line text-5xl text-[var(--color-primary)]" aria-hidden="true"></i>
                </div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Go Beyond the Transcript</h1>
                <p className="text-[var(--color-text-secondary)] max-w-sm">Receive instant, actionable feedback. Our AI analyzes your conversation to provide key insights on:</p>
                <ul className="text-[var(--color-text-secondary)] mt-4 space-y-2 max-w-sm text-left mx-auto w-fit">
                    <li className="flex items-center"><i className="fa-solid fa-check-circle text-[var(--color-success)] mr-3" aria-hidden="true"></i>What Went Right</li>
                    <li className="flex items-center"><i className="fa-solid fa-check-circle text-[var(--color-success)] mr-3" aria-hidden="true"></i>Key Areas for Growth</li>
                    <li className="flex items-center"><i className="fa-solid fa-check-circle text-[var(--color-success)] mr-3" aria-hidden="true"></i>Empathy Score & Talk/Listen Ratio</li>
                    <li className="flex items-center"><i className="fa-solid fa-check-circle text-[var(--color-success)] mr-3" aria-hidden="true"></i>Specific MI Principles Used</li>
                </ul>
            </>
        )
    },
    {
        // Step 5: Terms & Privacy Acceptance (Placeholder - rendered dynamically)
        content: null
    }
];

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const isLastStep = currentStep === onboardingSteps.length - 1;
    const isAcceptanceStep = isLastStep;

    const handleNext = () => {
        if (isAcceptanceStep) {
            // On final step, check acceptance requirements
            if (ageConfirmed && termsAccepted && privacyAccepted) {
                // Store acceptance timestamps in localStorage for now
                // They will be persisted to Supabase on profile creation
                localStorage.setItem('mi-coach-age-confirmed', new Date().toISOString());
                localStorage.setItem('mi-coach-terms-accepted', new Date().toISOString());
                localStorage.setItem('mi-coach-privacy-accepted', new Date().toISOString());
                onFinish();
            } else {
                alert('Please confirm all requirements to continue.');
            }
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-between p-8 text-center">
            <header className="w-full flex justify-end absolute top-4 right-4">
                <Button
                    onClick={onFinish}
                    variant="ghost"
                    size="sm"
                >
                    Skip
                </Button>
            </header>

            <main className="flex flex-col items-center justify-center flex-grow w-full overflow-hidden">
                <div key={currentStep} className="animate-slide-fade-in flex flex-col items-center text-center w-full">
                    {isAcceptanceStep ? (
                        <>
                            <div className={'bg-[var(--color-primary-lighter)] rounded-full h-40 w-40 flex items-center justify-center mb-8'}>
                                <i className="fa-solid fa-shield-check text-5xl text-[var(--color-primary)]" aria-hidden="true"></i>
                            </div>
                            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Before You Start</h1>
                            <p className="text-[var(--color-text-secondary)] max-w-sm mb-6">Please confirm you meet our requirements:</p>
                            
                            <div className="max-w-sm w-full space-y-4 text-left">
                                <Card
                                    variant={ageConfirmed ? "accent" : "elevated"}
                                    padding="md"
                                    hoverable
                                    onClick={() => setAgeConfirmed(!ageConfirmed)}
                                    className={`cursor-pointer border-2 ${ageConfirmed ? 'border-[var(--color-primary)]' : 'border-[var(--color-neutral-200)]'}`}
                                >
                                    <label className="flex items-start cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={ageConfirmed}
                                            onChange={(e) => setAgeConfirmed(e.target.checked)}
                                            className="w-5 h-5 text-[var(--color-primary)] rounded mt-1 mr-4 flex-shrink-0 cursor-pointer"
                                        />
                                        <span className="text-[var(--color-text-primary)] text-sm">
                                            I confirm I am <strong>18 years of age or older</strong>
                                        </span>
                                    </label>
                                </Card>
                                
                                <Card
                                    variant={termsAccepted ? "accent" : "elevated"}
                                    padding="md"
                                    hoverable
                                    onClick={() => setTermsAccepted(!termsAccepted)}
                                    className={`cursor-pointer border-2 ${termsAccepted ? 'border-[var(--color-primary)]' : 'border-[var(--color-neutral-200)]'}`}
                                >
                                    <label className="flex items-start cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="w-5 h-5 text-[var(--color-primary)] rounded mt-1 mr-4 flex-shrink-0 cursor-pointer"
                                        />
                                        <span className="text-[var(--color-text-primary)] text-sm">
                                            I agree to the <strong>Terms of Service</strong> and <strong>Medical & Education Disclaimer</strong>
                                        </span>
                                    </label>
                                </Card>
                                
                                <Card
                                    variant={privacyAccepted ? "accent" : "elevated"}
                                    padding="md"
                                    hoverable
                                    onClick={() => setPrivacyAccepted(!privacyAccepted)}
                                    className={`cursor-pointer border-2 ${privacyAccepted ? 'border-[var(--color-primary)]' : 'border-[var(--color-neutral-200)]'}`}
                                >
                                    <label className="flex items-start cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={privacyAccepted}
                                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                            className="w-5 h-5 text-[var(--color-primary)] rounded mt-1 mr-4 flex-shrink-0 cursor-pointer"
                                        />
                                        <span className="text-[var(--color-text-primary)] text-sm">
                                            I agree to the <strong>Privacy Policy</strong>
                                        </span>
                                    </label>
                                </Card>
                            </div>
                        </>
                    ) : (
                        onboardingSteps[currentStep].content
                    )}
                </div>
            </main>

            <footer className="w-full max-w-sm">
                <div className="flex justify-center space-x-2 mb-8">
                    {onboardingSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${index === currentStep ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-neutral-300)]'}`}
                            aria-label={`Step ${index + 1}`}
                        ></div>
                    ))}
                </div>
                <div className="space-y-3">
                    <Button
                        onClick={handleNext}
                        variant="primary"
                        size="lg"
                        fullWidth
                    >
                        {isLastStep ? 'Get Started' : 'Next'}
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default Onboarding;
