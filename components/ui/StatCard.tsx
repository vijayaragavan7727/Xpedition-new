'use client';

import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  compact?: boolean;
  variant?: 'default' | 'streak' | 'xp' | 'achievement' | 'elevated';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  trendPositive = true,
  compact = false,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-[#0E152E]/90 border border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]',
    streak: 'bg-[#0E152E]/90 border border-amber-500/25 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)]',
    xp: 'bg-[#0E152E]/90 border border-indigo-500/25 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)]',
    achievement: 'bg-[#0E152E]/90 border border-sky-500/25 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15)]',
    elevated: 'bg-[#141D3D]/95 border border-white/[0.12] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)]',
  };

  if (compact) {
    return (
      <div
        className={`p-3 sm:p-3.5 rounded-2xl ${variantStyles[variant]} flex flex-col items-center justify-center text-center space-y-1 transition-all select-none ${className}`}
      >
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-base shrink-0">{icon}</span>}
          <span className="font-mono font-bold text-lg sm:text-xl text-white tracking-tight">
            {value}
          </span>
        </div>
        <span className="font-sans text-[11px] font-medium text-slate-400 leading-tight">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl ${variantStyles[variant]} space-y-1.5 transition-all select-none ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
        <span>{label}</span>
        {icon && <span className="text-indigo-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono font-bold text-2xl text-white tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-mono font-bold ${
              trendPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="font-sans text-xs text-slate-400">{subtext}</p>}
    </div>
  );
};

export default StatCard;

