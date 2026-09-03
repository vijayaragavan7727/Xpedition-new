'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'indigo' | 'cyan' | 'success' | 'warning' | 'danger' | 'level' | 'streak';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1 font-sans font-semibold uppercase tracking-wider rounded-lg transition-colors';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-tight',
  };

  const variantStyles = {
    default:
      'bg-white/[0.06] text-slate-300 border border-white/[0.08]',
    indigo:
      'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    cyan:
      'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    success:
      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning:
      'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger:
      'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    level:
      'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono',
    streak:
      'bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
