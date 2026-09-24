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

  const dimensions =
    size === 'small'
      ? { width: 140, height: 110 }
      : size === 'large'
      ? { width: 260, height: 200 }
      : { width: 220, height: 160 };

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none transition-transform duration-300 hover:scale-[1.02] ${className}`}
      style={{ minWidth: dimensions.width, minHeight: dimensions.height }}
    >
      <Image
        src={resolvedAsset}
        alt={`${title} visual representation (${subject})`}
        width={dimensions.width}
        height={dimensions.height}
        priority={size === 'large' || size === 'medium'}
        className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
      />
    </div>
  );
};
