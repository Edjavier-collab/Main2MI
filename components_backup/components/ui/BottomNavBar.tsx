import React from 'react';
import { View, UserTier } from '../../types';
import './BottomNavBar.css';

interface BottomNavBarProps {
    currentView: View;
    onNavigate: (view: View) => void;
    userTier: UserTier;
}

interface NavItemProps {
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
    isLocked?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick, isLocked = false }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`bottom-nav-bar__item ${isActive ? 'bottom-nav-bar__item--active' : ''}`}
            aria-label={label}
        >
            <div className="bottom-nav-bar__icon-wrapper">
                <i className={`fa ${icon} bottom-nav-bar__icon`}></i>
                {isLocked && (
                    <div className="bottom-nav-bar__lock-badge" title="Premium Feature">
                        <i className="fa-solid fa-lock"></i>
                    </div>
                )}
                {isActive && <span className="bottom-nav-bar__indicator" />}
            </div>
            <span className="bottom-nav-bar__label">{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, onNavigate, userTier }) => {
    const isPremium = userTier === UserTier.Premium;

    const handleCalendarClick = () => {
        if (isPremium) {
            onNavigate(View.Calendar);
        } else {
            onNavigate(View.Paywall);
        }
    };
    
    return (
        <footer className="bottom-nav-bar">
            <nav className="bottom-nav-bar__nav">
                <NavItem
                    label="Home"
                    icon="fa-home"
                    isActive={currentView === View.Dashboard}
                    onClick={() => onNavigate(View.Dashboard)}
                />
                <NavItem
                    label="Library"
                    icon="fa-solid fa-book"
                    isActive={currentView === View.ResourceLibrary}
                    onClick={() => onNavigate(View.ResourceLibrary)}
                />
                <NavItem
                    label="Calendar"
                    icon="fa-calendar-days"
                    isActive={currentView === View.Calendar}
                    onClick={handleCalendarClick}
                    isLocked={!isPremium}
                />
                <NavItem
                    label="Settings"
                    icon="fa-cog"
                    isActive={currentView === View.Settings}
                    onClick={() => onNavigate(View.Settings)}
                />
            </nav>
        </footer>
    );
};

export default BottomNavBar;
