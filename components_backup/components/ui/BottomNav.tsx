import React from 'react';
import './BottomNav.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, activeId, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {items.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav__item ${activeId === item.id ? 'bottom-nav__item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="bottom-nav__icon">
              {activeId === item.id ? item.activeIcon : item.icon}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
            {activeId === item.id && <span className="bottom-nav__indicator" />}
          </button>
        ))}
      </div>
    </nav>
  );
};

