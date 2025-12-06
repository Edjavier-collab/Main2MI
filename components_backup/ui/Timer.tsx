import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
    initialSeconds: number;
    onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) {
            onTimeUp();
            return;
        }

        const timerId = setInterval(() => {
            setSeconds(prevSeconds => prevSeconds - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [seconds, onTimeUp]);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const isLowTime = seconds <= 30;

    return (
        <div className={`timer ${isLowTime ? 'timer--low' : ''}`}>
            <i className="far fa-clock timer__icon"></i>
            <span className="timer__time">
                {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
            </span>
        </div>
    );
};

export default Timer;
