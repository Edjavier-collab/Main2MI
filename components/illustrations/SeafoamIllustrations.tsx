import React from 'react';

/**
 * Wave Pattern SVG Component
 * Creates a decorative wave pattern for backgrounds
 */
export const WavePattern: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 100"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ background: 'transparent' }}
    >
      <path
        d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z"
        fill="url(#waveGradient)"
        opacity="0.3"
      />
      <path
        d="M0,60 Q200,30 400,60 T800,60 T1200,60 L1200,100 L0,100 Z"
        fill="url(#waveGradient2)"
        opacity="0.2"
      />
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary-light)" />
        </linearGradient>
        <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary-light)" />
          <stop offset="100%" stopColor="var(--color-primary-lighter)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * Simple Fish SVG Component
 * Playful fish illustration in pastel colors
 */
export const FishIcon: React.FC<{ 
  size?: number; 
  color?: 'orange' | 'yellow' | 'grey' | 'blue';
  className?: string;
}> = ({ size = 40, color = 'orange', className = '' }) => {
  const colors = {
    orange: '#F59E0B', // Amber-500 (was pastel pink)
    yellow: '#FCD34D', // Amber-300 (was pastel yellow)
    grey: '#A8A29E', // Stone-400 (was light grey)
    blue: '#0EA5E9', // Sky-500 (was pastel blue)
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Fish body */}
      <ellipse cx="20" cy="20" rx="12" ry="8" fill={colors[color]} />
      {/* Fish tail */}
      <path
        d="M8 20 Q4 16 4 20 Q4 24 8 20"
        fill={colors[color]}
      />
      {/* Fish eye */}
      <circle cx="24" cy="18" r="2" fill="var(--color-text-primary)" />
      {/* Fish fin */}
      <path
        d="M16 12 Q14 10 16 10 Q18 10 16 12"
        fill={colors[color]}
        opacity="0.7"
      />
    </svg>
  );
};

/**
 * Seaweed/Plant SVG Component
 * Decorative seaweed illustration
 */
export const SeaweedIcon: React.FC<{ 
  size?: number; 
  className?: string;
}> = ({ size = 60, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M30 60 L30 50 Q25 45 30 40 Q35 35 30 30 Q25 25 30 20 Q35 15 30 10 Q25 5 30 0"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M20 50 Q18 45 20 40 Q22 35 20 30 Q18 25 20 20 Q22 15 20 10"
        stroke="var(--color-primary-light)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M40 50 Q42 45 40 40 Q38 35 40 30 Q42 25 40 20 Q38 15 40 10"
        stroke="var(--color-primary-light)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
};

/**
 * Water Droplet Icon
 */
export const WaterDroplet: React.FC<{ 
  size?: number; 
  className?: string;
}> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 4 Q20 8 22 12 Q24 16 24 20 Q24 24 20 26 Q16 28 12 26 Q8 24 8 20 Q8 16 10 12 Q12 8 16 4 Z"
        fill="var(--color-primary)"
        opacity="0.8"
      />
      <path
        d="M16 4 Q20 8 22 12 Q24 16 24 20 Q24 24 20 26 Q16 28 12 26 Q8 24 8 20 Q8 16 10 12 Q12 8 16 4 Z"
        stroke="var(--color-primary-dark)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
};

/**
 * Header Wave Decoration
 * Full-width wave for headers
 */
export const HeaderWave: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height: '80px', background: 'transparent' }}>
      <WavePattern className="w-full h-full" />
    </div>
  );
};

/**
 * Underwater Scene Background
 * Composite illustration with fish and seaweed
 */
export const UnderwaterScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '200px' }}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-light)] to-[var(--color-primary-lighter)] opacity-40" />
      
      {/* Wave pattern overlay */}
      <div className="absolute bottom-0 left-0 right-0">
        <WavePattern className="w-full" />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-10 left-10">
        <SeaweedIcon size={50} />
      </div>
      <div className="absolute bottom-20 right-16">
        <SeaweedIcon size={40} />
      </div>
      <div className="absolute top-1/4 left-1/4">
        <FishIcon size={35} color="orange" />
      </div>
      <div className="absolute top-1/3 right-1/3">
        <FishIcon size={30} color="yellow" />
      </div>
      <div className="absolute bottom-1/4 left-1/3">
        <FishIcon size={28} color="grey" />
      </div>
    </div>
  );
};

