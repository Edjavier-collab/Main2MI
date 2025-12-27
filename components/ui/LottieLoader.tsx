'use client';

import React, { useState } from 'react';
import Lottie from 'lottie-react';

// Import the default loading animation
// If the file doesn't exist or is invalid, this will fail at build time
// At runtime, we'll fallback to CSS spinner if Lottie fails to render
import loadingAnimationData from '../../assets/animations/loading.json';

interface LottieLoaderProps {
    /** Size of the animation */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Custom animation data (JSON) - defaults to loading.json */
    animationData?: object;
    /** Whether to loop the animation */
    loop?: boolean;
    /** Whether to autoplay the animation */
    autoplay?: boolean;
    /** Optional className for additional styling */
    className?: string;
}

/**
 * LottieLoader Component
 * 
 * A wrapper around lottie-react that provides consistent sizing and error handling.
 * Falls back gracefully if the animation fails to load.
 */
const LottieLoader: React.FC<LottieLoaderProps> = ({
    size = 'md',
    animationData,
    loop = true,
    autoplay = true,
    className = ''
}) => {
    const [hasError, setHasError] = useState(false);

    // Size mapping for Lottie animation
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-20 h-20'
    };

    // Determine which animation to use
    const animation = animationData || loadingAnimationData;

    // Fallback CSS spinner component
    const FallbackSpinner = () => (
        <div 
            className={`${sizeClasses[size]} ${className}`}
            role="status"
            aria-label="Loading..."
        >
            <div className="relative w-full h-full">
                {/* Fallback CSS spinner */}
                <div 
                    className={`w-full h-full rounded-full border-4 border-sky-100`}
                    aria-hidden="true"
                />
                <div 
                    className={`absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-sky-500 animate-spin`}
                    aria-hidden="true"
                />
            </div>
        </div>
    );

    // If no animation data available or error occurred, show fallback
    if (hasError || !animation) {
        return <FallbackSpinner />;
    }

    return (
        <div 
            className={`${sizeClasses[size]} ${className}`}
            role="status"
            aria-label="Loading..."
        >
            <Lottie
                animationData={animation}
                loop={loop}
                autoplay={autoplay}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default LottieLoader;

