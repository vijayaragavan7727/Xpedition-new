'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'canvas' | 'button';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const baseStyles = 'bg-white/[0.06] animate-pulse rounded-xl select-none';

  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    card: 'h-36 w-full rounded-2xl border border-white/[0.04]',
    circle: 'w-10 h-10 rounded-full',
    canvas: 'w-full h-64 sm:h-80 rounded-2xl border border-white/[0.06]',
    button: 'h-11 w-32 rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
