'use client';

import React from 'react';
import Image from 'next/image';

export interface ConceptVisualProps {
  conceptId: string;
  title: string;
  subject: string;
  topic?: string;
  visualAsset?: string;
  duration?: number;
  className?: string;
  size?: 'medium' | 'small' | 'large';
}

export const ConceptVisual: React.FC<ConceptVisualProps> = ({
  conceptId,
  title,
  subject,
  visualAsset,
  className = '',
  size = 'medium',
}) => {
  // Use supplied visualAsset or determine appropriate concept fallback
  const resolvedAsset = visualAsset || (
    conceptId.includes('magnet') || conceptId.includes('field')
      ? '/images/home/home-magnetic-fields.png'
      : '/images/home/home-dc-motor.png'
  );

  const sizeClasses =
    size === 'small'
      ? 'w-[105px] h-[80px] sm:w-[140px] sm:h-[110px]'
      : size === 'large'
      ? 'w-[180px] h-[140px] sm:w-[260px] sm:h-[200px]'
      : 'w-[135px] h-[100px] sm:w-[220px] sm:h-[160px]';

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none pointer-events-none transition-transform duration-300 hover:scale-[1.02] ${sizeClasses} ${className}`}
    >
      <Image
        src={resolvedAsset}
        alt={`${title} visual representation (${subject})`}
        fill
        sizes="(max-width: 640px) 140px, 220px"
        priority={size === 'large' || size === 'medium'}
        className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
      />
    </div>
  );
};
