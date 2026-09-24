'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'indigo'
    | 'cyan'
    | 'teal'
    | 'cream'
    | 'success'
    | 'warning'
    | 'danger'
    | 'level'
    | 'streak'
    | '3d'
    | 'stage'
    | 'mastered'
    | 'review'
    | 'skipped';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  stageColor?: string; // Optional custom hex/color for stage variant
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  stageColor,
  className = '',
  style,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-sans font-semibold uppercase tracking-wider rounded-md transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-tight',
    lg: 'text-xs sm:text-sm px-3 py-1.5 leading-tight',
  };

  const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-white/[0.05] text-[#8E9693] border border-[#263130]',
    indigo: 'bg-[#004741]/40 text-[#E5E0D5] border border-[#17655E]',
    cyan: 'bg-[#075C55]/30 text-[#E5E0D5] border border-[#17655E]',
    teal: 'bg-[#004741]/40 text-[#E5E0D5] border border-[#17655E]',
    cream: 'bg-[#F0EDE4] text-[#080B0D] font-bold border border-[#E5E0D5]',
    success: 'bg-[#075C55]/30 text-[#E5E0D5] border border-[#17655E]',
    warning: 'bg-[#C29B38]/20 text-[#E5E0D5] border border-[#C29B38]/40',
    danger: 'bg-[#A83232]/20 text-rose-300 border border-[#A83232]/40',
    level: 'bg-[#1B2221] text-[#E5E0D5] border border-[#263130] font-mono',
    streak: 'bg-[#1B2221] text-[#E5E0D5] border border-[#263130] font-mono',
    '3d': 'bg-[#004741]/50 text-white border border-[#17655E] font-mono font-bold',
    stage: 'bg-[#151B1B] text-white border border-[#263130]',
    mastered: 'bg-[#075C55]/40 text-white border border-[#17655E]',
    review: 'bg-[#1B2221] text-[#E5E0D5] border border-[#263130]',
    skipped: 'bg-[#151B1B] text-[#8E9693] border border-[#263130]',
  };

  const dynamicStyle = stageColor
    ? {
        backgroundColor: `${stageColor}20`,
        color: stageColor,
        borderColor: `${stageColor}40`,
        ...style,
      }
    : style;

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={dynamicStyle}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
