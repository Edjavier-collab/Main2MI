'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
    initialSeconds: number;
    onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const hasCalledOnTimeUp = useRef(false);
    const onTimeUpRef = useRef(onTimeUp);

    // Keep the ref updated with the latest callback
    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    useEffect(() => {
        // Only call onTimeUp once when timer reaches zero
        if (seconds <= 0 && !hasCalledOnTimeUp.current) {
            hasCalledOnTimeUp.current = true;
            onTimeUpRef.current();
            return;
        }

        if (seconds <= 0) {
            return; // Timer is done, don't set up interval
        }

        const timerId = setInterval(() => {
            setSeconds(prevSeconds => prevSeconds - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [seconds]);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const isUrgent = seconds <= 30;
    const timeColor = isUrgent ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]';
    const urgentAnimation = isUrgent ? 'animate-pulse' : '';

    return (
        <div 
            className={`font-mono text-lg font-bold transition-colors duration-300 ${timeColor} ${urgentAnimation}`}
            role="timer"
            aria-live={isUrgent ? 'polite' : 'off'}
            aria-label={`${minutes} minutes and ${remainingSeconds} seconds remaining${isUrgent ? '. Time is running low!' : ''}`}
        >
            <i className={`far fa-clock mr-2 ${isUrgent ? 'text-[var(--color-error)]' : ''}`} aria-hidden="true"></i>
            {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
        </div>
    );
};

export default Timer;
