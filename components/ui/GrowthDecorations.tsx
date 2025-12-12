import React from 'react';

// Decorative leaf for corners and accents
export const LeafDecoration: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 60 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 60 60" 
    fill="none" 
    className={className}
  >
    <path 
      d="M30 55C30 55 10 40 10 25C10 15 18 8 30 5C42 8 50 15 50 25C50 40 30 55 30 55Z" 
      fill="var(--color-primary-light)"
    />
    <path 
      d="M30 55C30 55 30 25 30 5" 
      stroke="var(--color-primary)" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path d="M30 20C25 22 20 20 18 18" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 30C35 32 40 30 42 28" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 40C25 42 22 40 20 38" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Seedling for beginners/new sessions
export const SeedlingIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 48 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 60 60" 
    fill="none" 
    className={className}
  >
    <ellipse cx="30" cy="52" rx="18" ry="4" fill="var(--color-earth-light)" opacity="0.5"/>
    <path d="M30 52V32" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
    <path 
      d="M30 38C30 38 22 36 20 28C18 20 24 16 30 20C36 16 42 20 40 28C38 36 30 38 30 38Z" 
      fill="var(--color-primary-light)"
    />
    <path d="M30 32C30 32 26 30 25 25" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 32C30 32 34 30 35 25" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Growing plant for progress
export const GrowingPlant: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 60 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 60 60" 
    fill="none" 
    className={className}
  >
    <ellipse cx="30" cy="55" rx="20" ry="4" fill="var(--color-earth-light)" opacity="0.4"/>
    <path d="M30 55V25" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Main leaves */}
    <ellipse cx="22" cy="35" rx="8" ry="5" fill="var(--color-primary-light)" transform="rotate(-30 22 35)"/>
    <ellipse cx="38" cy="30" rx="9" ry="5" fill="var(--color-primary-light)" transform="rotate(25 38 30)"/>
    <ellipse cx="20" cy="22" rx="7" ry="4" fill="var(--color-primary-lighter)" transform="rotate(-45 20 22)"/>
    <ellipse cx="40" cy="18" rx="8" ry="4" fill="var(--color-primary-lighter)" transform="rotate(40 40 18)"/>
    {/* Top bud */}
    <circle cx="30" cy="15" r="6" fill="var(--color-primary)"/>
    <circle cx="26" cy="12" r="3" fill="var(--color-primary-light)"/>
  </svg>
);

// Flourishing plant for mastery
export const FlourishingPlant: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 80 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 80 80" 
    fill="none" 
    className={className}
  >
    <ellipse cx="40" cy="75" rx="25" ry="4" fill="var(--color-earth-light)" opacity="0.4"/>
    <path d="M40 75V30" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"/>
    {/* Many leaves */}
    <ellipse cx="28" cy="55" rx="10" ry="5" fill="var(--color-primary-light)" transform="rotate(-35 28 55)"/>
    <ellipse cx="52" cy="50" rx="11" ry="5" fill="var(--color-primary-light)" transform="rotate(30 52 50)"/>
    <ellipse cx="25" cy="40" rx="9" ry="4" fill="var(--color-primary-lighter)" transform="rotate(-45 25 40)"/>
    <ellipse cx="55" cy="35" rx="10" ry="4" fill="var(--color-primary-lighter)" transform="rotate(40 55 35)"/>
    <ellipse cx="30" cy="28" rx="8" ry="4" fill="var(--color-primary-light)" transform="rotate(-30 30 28)"/>
    <ellipse cx="50" cy="24" rx="9" ry="4" fill="var(--color-primary-light)" transform="rotate(35 50 24)"/>
    {/* Flower */}
    <circle cx="40" cy="18" r="10" fill="var(--color-accent-warm)"/>
    <circle cx="40" cy="18" r="5" fill="var(--color-earth-light)"/>
    <circle cx="35" cy="12" r="4" fill="var(--color-accent-warm)" opacity="0.7"/>
    <circle cx="46" cy="13" r="3" fill="var(--color-accent-warm)" opacity="0.7"/>
  </svg>
);

// Progress stages (3 plants showing growth)
export const ProgressPlants: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    width="120" 
    height="60" 
    viewBox="0 0 120 60" 
    fill="none" 
    className={className}
  >
    {/* Stage 1: Seed */}
    <ellipse cx="20" cy="55" rx="12" ry="3" fill="var(--color-earth-light)" opacity="0.4"/>
    <path d="M20 55V48" stroke="var(--color-primary-light)" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="44" r="4" fill="var(--color-primary-lighter)"/>
    
    {/* Stage 2: Seedling */}
    <ellipse cx="60" cy="55" rx="12" ry="3" fill="var(--color-earth-light)" opacity="0.4"/>
    <path d="M60 55V38" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="54" cy="35" rx="6" ry="3" fill="var(--color-primary-light)" transform="rotate(-30 54 35)"/>
    <ellipse cx="66" cy="32" rx="6" ry="3" fill="var(--color-primary-light)" transform="rotate(30 66 32)"/>
    <circle cx="60" cy="28" r="4" fill="var(--color-primary)"/>
    
    {/* Stage 3: Flourishing */}
    <ellipse cx="100" cy="55" rx="14" ry="3" fill="var(--color-earth-light)" opacity="0.4"/>
    <path d="M100 55V25" stroke="var(--color-primary-dark)" strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="92" cy="42" rx="7" ry="3" fill="var(--color-primary-light)" transform="rotate(-35 92 42)"/>
    <ellipse cx="108" cy="38" rx="8" ry="3" fill="var(--color-primary-light)" transform="rotate(30 108 38)"/>
    <ellipse cx="90" cy="30" rx="6" ry="3" fill="var(--color-primary-lighter)" transform="rotate(-40 90 30)"/>
    <ellipse cx="110" cy="26" rx="7" ry="3" fill="var(--color-primary-lighter)" transform="rotate(35 110 26)"/>
    <circle cx="100" cy="18" r="7" fill="var(--color-accent-warm)"/>
    <circle cx="100" cy="18" r="3" fill="var(--color-earth-light)"/>
  </svg>
);

// Curved header background with organic shape
export const HeaderWave: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    viewBox="0 0 400 120" 
    fill="none" 
    preserveAspectRatio="none"
    className={className}
    style={{ width: '100%', height: '120px' }}
  >
    <defs>
      <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="var(--color-primary-light)" />
        <stop offset="100%" stopColor="var(--color-primary-lighter)" />
      </linearGradient>
    </defs>
    <path 
      d="M0 0 L400 0 L400 80 Q300 120 200 90 Q100 60 0 100 Z" 
      fill="url(#headerGradient)"
    />
    {/* Decorative circles */}
    <circle cx="350" cy="30" r="25" fill="var(--color-primary)" opacity="0.15"/>
    <circle cx="370" cy="55" r="15" fill="var(--color-primary)" opacity="0.1"/>
    <circle cx="30" cy="70" r="20" fill="white" opacity="0.1"/>
  </svg>
);

// Decorative branch for corners
export const BranchDecoration: React.FC<{ className?: string; flip?: boolean }> = ({ 
  className = '',
  flip = false 
}) => (
  <svg 
    width="100" 
    height="80" 
    viewBox="0 0 100 80" 
    fill="none" 
    className={className}
    style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
  >
    <path 
      d="M0 70 Q30 60 50 40 Q70 20 90 15" 
      stroke="var(--color-primary-light)" 
      strokeWidth="2" 
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="60" cy="30" r="10" fill="var(--color-primary-lighter)" opacity="0.6"/>
    <circle cx="75" cy="20" r="8" fill="var(--color-primary-light)" opacity="0.5"/>
    <circle cx="90" cy="15" r="6" fill="var(--color-primary)" opacity="0.4"/>
    <circle cx="40" cy="45" r="7" fill="var(--color-primary-lighter)" opacity="0.5"/>
  </svg>
);

// App Logo with Growth Theme
export const GrowthLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 80 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 80 80" 
    fill="none" 
    className={className}
  >
    {/* Outer ring */}
    <circle cx="40" cy="40" r="36" stroke="var(--color-primary-light)" strokeWidth="3" fill="none"/>
    
    {/* Inner circle */}
    <circle cx="40" cy="40" r="28" fill="var(--color-primary-lighter)"/>
    
    {/* Stylized plant/growth symbol - Plant stem */}
    <path 
      d="M40 58V35" 
      stroke="var(--color-primary-dark)" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    {/* Left leaf */}
    <path 
      d="M40 45C40 45 30 43 28 35C26 27 32 23 40 28" 
      fill="var(--color-primary-light)"
    />
    {/* Right leaf */}
    <path 
      d="M40 40C40 40 50 38 52 30C54 22 48 18 40 23" 
      fill="var(--color-primary-dark)"
    />
    {/* Top bud/flower */}
    <circle cx="40" cy="28" r="5" fill="var(--color-accent-warm)"/>
    
    {/* Small accent dot */}
    <circle cx="40" cy="28" r="2" fill="white" opacity="0.6"/>
  </svg>
);

// Empty state illustration
export const EmptyGarden: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    width="200" 
    height="150" 
    viewBox="0 0 200 150" 
    fill="none" 
    className={className}
  >
    {/* Ground */}
    <ellipse cx="100" cy="130" rx="80" ry="12" fill="var(--color-earth-light)" opacity="0.4"/>
    
    {/* Empty pot */}
    <path 
      d="M70 130 L75 90 L125 90 L130 130" 
      fill="var(--color-earth-medium)"
    />
    <ellipse cx="100" cy="90" rx="25" ry="6" fill="var(--color-earth-dark)"/>
    <ellipse cx="100" cy="130" rx="30" ry="6" fill="var(--color-earth-medium)"/>
    
    {/* Tiny sprout */}
    <path d="M100 90V80" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="100" cy="75" r="5" fill="var(--color-primary-light)"/>
    
    {/* Decorative elements */}
    <circle cx="45" cy="60" r="15" fill="var(--color-primary-lighter)" opacity="0.3"/>
    <circle cx="160" cy="50" r="12" fill="var(--color-primary-lighter)" opacity="0.3"/>
    <circle cx="150" cy="70" r="8" fill="var(--color-primary-light)" opacity="0.2"/>
  </svg>
);

// Success/Achievement illustration
export const SuccessGarden: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    width="200" 
    height="150" 
    viewBox="0 0 200 150" 
    fill="none" 
    className={className}
  >
    {/* Ground */}
    <ellipse cx="100" cy="140" rx="90" ry="10" fill="var(--color-earth-light)" opacity="0.4"/>
    
    {/* Multiple flourishing plants */}
    {/* Left plant */}
    <path d="M50 140V100" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="42" cy="110" rx="8" ry="4" fill="var(--color-primary-light)" transform="rotate(-30 42 110)"/>
    <ellipse cx="58" cy="105" rx="8" ry="4" fill="var(--color-primary-light)" transform="rotate(30 58 105)"/>
    <circle cx="50" cy="95" r="6" fill="var(--color-accent-warm)"/>
    
    {/* Center plant (largest) */}
    <path d="M100 140V70" stroke="var(--color-primary-dark)" strokeWidth="3" strokeLinecap="round"/>
    <ellipse cx="85" cy="110" rx="12" ry="5" fill="var(--color-primary-light)" transform="rotate(-35 85 110)"/>
    <ellipse cx="115" cy="105" rx="13" ry="5" fill="var(--color-primary-light)" transform="rotate(30 115 105)"/>
    <ellipse cx="82" cy="90" rx="10" ry="4" fill="var(--color-primary-lighter)" transform="rotate(-40 82 90)"/>
    <ellipse cx="118" cy="85" rx="11" ry="4" fill="var(--color-primary-lighter)" transform="rotate(35 118 85)"/>
    <circle cx="100" cy="60" r="12" fill="var(--color-accent-warm)"/>
    <circle cx="100" cy="60" r="5" fill="var(--color-earth-light)"/>
    
    {/* Right plant */}
    <path d="M150 140V95" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="142" cy="108" rx="9" ry="4" fill="var(--color-primary-light)" transform="rotate(-30 142 108)"/>
    <ellipse cx="158" cy="100" rx="9" ry="4" fill="var(--color-primary-light)" transform="rotate(30 158 100)"/>
    <circle cx="150" cy="88" r="7" fill="var(--color-accent-warm)"/>
    
    {/* Sparkles/celebration */}
    <circle cx="70" cy="50" r="3" fill="var(--color-accent-warm)" opacity="0.6"/>
    <circle cx="130" cy="45" r="2" fill="var(--color-accent-warm)" opacity="0.5"/>
    <circle cx="160" cy="60" r="2" fill="var(--color-accent-warm)" opacity="0.4"/>
    <circle cx="40" cy="70" r="2" fill="var(--color-accent-warm)" opacity="0.5"/>
  </svg>
);

