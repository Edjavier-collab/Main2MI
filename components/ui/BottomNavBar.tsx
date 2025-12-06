
import React from 'react';
import { View, UserTier } from '../../types';

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
            onClick={onClick}
            className="flex flex-1 flex-col items-center transition-all duration-200 pt-2 pb-2 min-h-[56px] touch-manipulation"
            aria-label={label}
        >
            <div className="relative flex flex-col items-center">
                {/* Icon with minimalist styling */}
                <div className="relative">
                    <i className={`${icon} ${isActive ? 'text-zinc-900' : 'text-zinc-400'} text-xl transition-colors`} style={{ fontWeight: isActive ? 600 : 300 }}></i>
                    {isLocked && (
                        <div className="absolute -top-1 -right-2 bg-zinc-800 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white" title="Premium Feature">
                            <i className="fa-solid fa-lock" style={{ fontSize: '7px' }}></i>
                        </div>
                    )}
                </div>
                
                {/* Japanese-inspired accent dot for active state */}
                {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-zinc-900 rounded-full"></div>
                )}
                
                {/* Label with minimalist typography */}
                <span className={`text-[10px] mt-1.5 transition-colors ${isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-400 font-normal'}`} style={{ letterSpacing: '0.025em' }}>
                    {label}
                </span>
            </div>
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
        <footer className="sticky bottom-0 bg-white/98 backdrop-blur-md p-1 border-t border-zinc-200/60 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
            <nav className="flex justify-around items-center max-w-lg mx-auto">
                <NavItem
                    label="Home"
                    icon="fa-solid fa-house"
                    isActive={currentView === View.Dashboard}
                    onClick={() => onNavigate(View.Dashboard)}
                />
                <NavItem
                    label="Library"
                    icon="fa-solid fa-book-open"
                    isActive={currentView === View.ResourceLibrary}
                    onClick={() => onNavigate(View.ResourceLibrary)}
                />
                <NavItem
                    label="Calendar"
                    icon="fa-solid fa-calendar"
                    isActive={currentView === View.Calendar}
                    onClick={handleCalendarClick}
                    isLocked={!isPremium}
                />
                <NavItem
                    label="Settings"
                    icon="fa-solid fa-gear"
                    isActive={currentView === View.Settings}
                    onClick={() => onNavigate(View.Settings)}
                />
            </nav>
        </footer>
    );
};

export default BottomNavBar;
