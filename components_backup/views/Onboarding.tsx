import React, { useState } from 'react';
import { PillButton } from '../ui/PillButton';
import { GrowthLogo, SeedlingIcon, GrowingPlant, FlourishingPlant, ProgressPlants } from '../illustrations/GrowthIllustrations';
import './Onboarding.css';

interface OnboardingProps {
  onFinish: () => void;
}

const slides = [
  {
    id: 'welcome',
    title: 'Welcome to MI Practice Coach',
    subtitle: 'Grow your Motivational Interviewing skills with guided practice and personalized feedback',
    illustration: 'logo',
  },
  {
    id: 'practice',
    title: 'Practice with AI Patients',
    subtitle: 'Engage in realistic conversations with diverse patient scenarios, from substance use to chronic disease management',
    illustration: 'seedling',
  },
  {
    id: 'feedback',
    title: 'Get Expert Feedback',
    subtitle: 'Receive detailed analysis of your MI techniques, including OARS skills, empathy, and areas for growth',
    illustration: 'growing',
  },
  {
    id: 'progress',
    title: 'Track Your Growth',
    subtitle: 'Watch your skills flourish over time with progress tracking and personalized coaching summaries',
    illustration: 'flourishing',
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const renderIllustration = (type: string) => {
    switch (type) {
      case 'logo':
        return <GrowthLogo size={120} className="onboarding__logo" />;
      case 'seedling':
        return <SeedlingIcon size={100} className="onboarding__illustration" />;
      case 'growing':
        return <GrowingPlant size={120} className="onboarding__illustration" />;
      case 'flourishing':
        return <FlourishingPlant size={140} className="onboarding__illustration" />;
      default:
        return <GrowthLogo size={120} />;
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="onboarding">
      {/* Background decoration */}
      <div className="onboarding__bg-top" />
      <div className="onboarding__bg-bottom" />
      
      {/* Skip button */}
      {currentSlide < slides.length - 1 && (
        <button className="onboarding__skip" onClick={handleSkip}>
          Skip
        </button>
      )}

      {/* Content */}
      <div className="onboarding__content">
        <div className="onboarding__illustration-container">
          {renderIllustration(slide.illustration)}
        </div>

        <h1 className="onboarding__title">{slide.title}</h1>
        <p className="onboarding__subtitle">{slide.subtitle}</p>
      </div>

      {/* Progress dots */}
      <div className="onboarding__dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`onboarding__dot ${index === currentSlide ? 'onboarding__dot--active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Action button */}
      <div className="onboarding__actions">
        <PillButton onClick={handleNext} size="lg" fullWidth>
          {currentSlide === slides.length - 1 ? 'Get Started 🌱' : 'Continue'}
        </PillButton>
      </div>
    </div>
  );
};

export default Onboarding;
