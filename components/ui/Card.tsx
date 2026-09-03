'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive' | 'highlight';
  glowColor?: 'indigo' | 'cyan' | 'emerald' | 'amber';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glowColor = 'indigo',
  className = '',
  ...props
}) => {
  const baseStyles = 'relative rounded-2xl transition-all duration-200';

  const variantStyles = {
    default: 'bg-[#141826]/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.35)]',
    elevated: 'bg-[#1A1F32]/95 border border-white/[0.1] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.5)]',
    glass: 'bg-[#141826]/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    interactive:
      'bg-[#141826]/90 border border-white/[0.07] hover:border-indigo-500/35 hover:bg-[#181D2F] cursor-pointer hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)]',
    highlight:
      'bg-gradient-to-br from-[#181C2E] to-[#101422] border border-indigo-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.45)]',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
