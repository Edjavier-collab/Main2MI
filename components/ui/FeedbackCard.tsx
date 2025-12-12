
import React from 'react';

interface FeedbackCardProps {
    title: string;
    icon: string;
    color: 'green' | 'yellow' | 'blue';
    children: React.ReactNode;
}

const colorClasses = {
    green: {
        bg: 'bg-success-light',
        iconBg: 'bg-success/20',
        iconText: 'text-success-dark',
    },
    yellow: {
        bg: 'bg-warning-light',
        iconBg: 'bg-warning/20',
        iconText: 'text-warning-dark',
    },
    blue: {
        bg: 'bg-info-light',
        iconBg: 'bg-info/20',
        iconText: 'text-info-dark',
    },
};

const FeedbackCard: React.FC<FeedbackCardProps> = ({ title, icon, color, children }) => {
    const classes = colorClasses[color];

    return (
        <div className={`p-6 rounded-2xl ${classes.bg} tile-hover`}>
            <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${classes.iconBg}`}>
                    <i className={`fa ${icon} text-xl ${classes.iconText}`}></i>
                </div>
                <div>
                    <h4 className="text-lg font-bold text-neutral-800 mb-2">{title}</h4>
                    <div className="text-neutral-700 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackCard;
