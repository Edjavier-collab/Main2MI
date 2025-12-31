'use client';

import React from 'react';
import { Card } from './Card';

interface FeedbackCardProps {
    title: string;
    icon: string;
    color: 'green' | 'yellow' | 'blue';
    children: React.ReactNode;
    hoverable?: boolean;
    onClick?: () => void;
}

const colorClasses = {
    green: {
        bg: 'bg-[var(--color-success-light)]',
        iconBg: 'bg-[var(--color-success)]/20',
        iconText: 'text-[var(--color-success-dark)]',
    },
    yellow: {
        bg: 'bg-[var(--color-warning-light)]',
        iconBg: 'bg-[var(--color-warning)]/20',
        iconText: 'text-[var(--color-warning-dark)]',
    },
    blue: {
        bg: 'bg-[var(--color-info-light)]',
        iconBg: 'bg-[var(--color-info)]/20',
        iconText: 'text-[var(--color-info-dark)]',
    },
};

const FeedbackCard: React.FC<FeedbackCardProps> = ({
    title,
    icon,
    color,
    children,
    hoverable = true,
    onClick,
}) => {
    const classes = colorClasses[color];

    return (
        <Card
            variant="outlined"
            padding="md"
            hoverable={hoverable}
            onClick={onClick}
            className={classes.bg}
        >
            <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${classes.iconBg}`}>
                    <i className={`fa ${icon} text-xl ${classes.iconText}`} aria-hidden="true"></i>
                </div>
                <div>
                    <h4 className="text-lg font-bold text-[var(--color-neutral-800)] mb-2">{title}</h4>
                    <div className="text-[var(--color-neutral-700)] leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default FeedbackCard;
