'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'indigo'
    | 'cyan'
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
    'inline-flex items-center gap-1.5 font-sans font-semibold uppercase tracking-wider rounded-lg transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-tight',
    lg: 'text-xs sm:text-sm px-3 py-1.5 leading-tight',
  };

  const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-white/[0.06] text-slate-300 border border-white/[0.08]',
    indigo: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    cyan: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    level: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono',
    streak: 'bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono',
    '3d': 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 font-mono font-bold shadow-[0_0_12px_rgba(99,102,241,0.25)]',
    stage: 'bg-white/[0.08] text-slate-200 border border-white/[0.12]',
    mastered: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    review: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    skipped: 'bg-slate-800/80 text-slate-400 border border-slate-700/50',
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

