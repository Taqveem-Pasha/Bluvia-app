import React from 'react';

interface BluviaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customSizeClass?: string;
  variant?: 'badge' | 'plain' | 'inverted-card';
  logoUrl?: string;
  alt?: string;
}

export const BluviaLogo: React.FC<BluviaLogoProps> = ({
  className = '',
  size = 'md',
  customSizeClass = '',
  variant = 'badge',
  logoUrl = '/bluvia-logo.png',
  alt = 'BLUVIA Premium Drinking Water Fresh Logo',
}) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
    '2xl': 'w-32 h-32 sm:w-36 sm:h-36',
    custom: customSizeClass,
  };

  const containerClasses = {
    badge: 'bg-white rounded-xl shadow-md p-1 border border-cyan-500/20 flex items-center justify-center overflow-hidden flex-shrink-0',
    plain: 'flex items-center justify-center overflow-hidden flex-shrink-0',
    'inverted-card': 'bg-white rounded-2xl shadow-xl p-2.5 border-2 border-cyan-400/30 flex items-center justify-center overflow-hidden flex-shrink-0',
  };

  const effectiveSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`${containerClasses[variant]} ${effectiveSize} ${className}`}
      style={{ aspectRatio: '1 / 1' }}
    >
      <img
        src={logoUrl || '/bluvia-logo.png'}
        alt={alt}
        className="w-full h-full object-contain select-none"
        loading="eager"
        decoding="async"
        onError={(e) => {
          // Fallback to relative assets if needed
          const target = e.currentTarget;
          if (target.src.indexOf('WhatsApp_Image') === -1) {
            target.src = '/assets/aistudio/WhatsApp_Image_2026-10-19_at_12.54.44_PM_5f395f59.jpeg';
          }
        }}
      />
    </div>
  );
};
