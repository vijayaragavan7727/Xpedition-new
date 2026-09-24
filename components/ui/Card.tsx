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
  glowColor,
  className = '',
  ...props
}) => {
  const baseStyles = 'relative rounded-xl transition-colors duration-150 overflow-hidden';

  const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
    default:
      'bg-[#151B1B] border border-[#263130] shadow-sm',
    elevated:
      'bg-[#1B2221] border border-[#263130] shadow-md',
    glass:
      'bg-[#151B1B]/95 backdrop-blur-xl border border-[#263130] shadow-sm',
    interactive:
      'bg-[#151B1B] border border-[#263130] hover:border-[#17655E] hover:bg-[#1B2221] cursor-pointer shadow-sm active:scale-[0.99]',
    highlight:
      'bg-[#151B1B] border border-[#17655E] shadow-sm',
    learning:
      'bg-[#151B1B] border border-[#17655E] shadow-sm',
    mission:
      'bg-[#151B1B] border border-[#17655E] shadow-sm',
    xira:
      'bg-[#151B1B] border border-[#17655E] shadow-sm',
    buddy:
      'bg-[#151B1B] border border-[#263130] shadow-sm',
    reward:
      'bg-[#1B2221] border border-[#263130] shadow-sm',
    resource:
      'bg-[#151B1B] border border-[#263130] hover:border-[#17655E] hover:bg-[#1B2221] transition-colors',
    subject:
      'bg-[#151B1B] border border-[#263130] hover:border-[#17655E] hover:bg-[#1B2221] transition-colors cursor-pointer active:scale-[0.99]',
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
