import React from 'react';

import { HeaderWave, GrowthLogo } from '../illustrations/GrowthIllustrations';
import { SoftCard } from '../ui/SoftCard';
import { PillButton } from '../ui/PillButton';
import './SettingsView.css';

interface SettingsViewProps {
  user: {
    name: string;
    email: string;
    plan: string;
    memberSince: string;
  };
  onLogout: () => void;
  onManageSubscription: () => void;
  onNavigate: (page: string) => void;
}

const settingsGroups = [
  {
    title: 'Subscription',
    items: [
      { id: 'manage-subscription', label: 'Manage Subscription', icon: '💳' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { id: 'privacy-policy', label: 'Privacy Policy', icon: '🔒' },
      { id: 'terms-of-service', label: 'Terms of Service', icon: '📜' },
      { id: 'subscription-terms', label: 'Subscription & Billing', icon: '📋' },
      { id: 'cookie-policy', label: 'Cookie Policy', icon: '🍪' },
      { id: 'disclaimer', label: 'Medical & Education Disclaimer', icon: '⚕️' },
    ],
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onLogout,
  onManageSubscription,
  onNavigate,
}) => {
  const handleItemClick = (id: string) => {
    if (id === 'manage-subscription') {
      onManageSubscription();
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="settings-view">
      {/* Header */}
      <div className="settings-view__header">
        <HeaderWave className="settings-view__wave" />
        <div className="settings-view__header-content">
          <h1>Settings</h1>
        </div>
      </div>

      <div className="settings-view__content">
        {/* Profile Card */}
        <SoftCard variant="elevated" className="settings-view__profile">
          <div className="settings-view__avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="settings-view__profile-info">
            <h2>{user.name}</h2>
            <span className="settings-view__plan-badge">{user.plan}</span>
            <span className="settings-view__member-since">
              Member since {user.memberSince}
            </span>
          </div>
        </SoftCard>

        {/* Logout Button */}
        <PillButton variant="secondary" fullWidth onClick={onLogout}>
          Log Out
        </PillButton>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title} className="settings-view__group">
            <h3 className="settings-view__group-title">{group.title}</h3>
            <SoftCard className="settings-view__group-card">
              {group.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`settings-view__item ${index < group.items.length - 1 ? 'settings-view__item--border' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span className="settings-view__item-icon">{item.icon}</span>
                  <span className="settings-view__item-label">{item.label}</span>
                  <span className="settings-view__item-arrow">›</span>
                </div>
              ))}
            </SoftCard>
          </div>
        ))}
      </div>
    </div>
  );
};
