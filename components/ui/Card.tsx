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

  const glowStyles = {
    indigo: 'hover:border-indigo-500/40 hover:shadow-[0_8px_30px_-6px_rgba(99,102,241,0.2)]',
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_8px_30px_-6px_rgba(14,165,233,0.2)]',
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_8px_30px_-6px_rgba(16,185,129,0.2)]',
    amber: 'hover:border-amber-500/40 hover:shadow-[0_8px_30px_-6px_rgba(245,158,11,0.2)]',
  };

  const variantStyles = {
    default:
      'bg-[#121524]/90 border border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] backdrop-blur-xl',
    elevated:
      'bg-[#181C2E] border border-white/[0.12] shadow-[0_10px_35px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl',
    glass:
      'bg-[#121524]/60 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl',
    interactive:
      `bg-[#121524]/90 border border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] cursor-pointer active:scale-[0.99] ${glowStyles[glowColor]}`,
    highlight:
      'bg-gradient-to-br from-[#1A1E32] to-[#121524] border border-indigo-500/30 shadow-[0_8px_30px_-6px_rgba(99,102,241,0.25)]',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
