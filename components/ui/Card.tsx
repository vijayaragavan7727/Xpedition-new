'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'elevated'
    | 'glass'
    | 'interactive'
    | 'highlight'
    | 'learning'
    | 'mission'
    | 'xira'
    | 'buddy'
    | 'reward'
    | 'resource'
    | 'subject';
  glowColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glowColor = 'indigo',
  className = '',
  ...props
}) => {
  const baseStyles = 'relative rounded-2xl transition-all duration-200 overflow-hidden';

  const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
    default:
      'bg-[#0E152E]/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]',
    elevated:
      'bg-[#141D3D]/95 border border-white/[0.11] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)]',
    glass:
      'bg-[#0E152E]/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]',
    interactive:
      'bg-[#0E152E]/90 border border-white/[0.07] hover:border-indigo-500/35 hover:bg-[#141D3D] cursor-pointer hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] active:scale-[0.99]',
    highlight:
      'bg-gradient-to-br from-[#141D3D] to-[#0A1024] border border-indigo-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
    learning:
      'bg-gradient-to-b from-[#141D3D]/95 via-[#0E152E]/90 to-[#0A1024]/95 border border-indigo-500/30 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.55)]',
    mission:
      'bg-[#0E152E]/90 border border-amber-500/30 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.15)]',
    xira:
      'bg-[#0E152E]/95 border border-indigo-500/35 shadow-[0_8px_28px_rgba(99,102,241,0.2)]',
    buddy:
      'bg-[#0E152E]/95 border border-sky-500/30 shadow-[0_8px_28px_rgba(14,165,233,0.15)]',
    reward:
      'bg-gradient-to-b from-[#1E192B] to-[#0E152E] border border-amber-400/40 shadow-[0_12px_36px_rgba(245,158,11,0.25)]',
    resource:
      'bg-[#0E152E]/80 border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#141D3D]/70 transition-all',
    subject:
      'bg-[#0E152E]/85 border border-white/[0.08] hover:border-indigo-400/40 hover:bg-[#141D3D]/90 transition-all cursor-pointer active:scale-[0.98]',
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

