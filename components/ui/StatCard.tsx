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
    default: 'bg-[#151B1B] border border-[#263130] shadow-sm',
    streak: 'bg-[#151B1B] border border-[#263130] shadow-sm',
    xp: 'bg-[#151B1B] border border-[#17655E] shadow-sm',
    achievement: 'bg-[#151B1B] border border-[#17655E] shadow-sm',
    elevated: 'bg-[#1B2221] border border-[#263130] shadow-sm',
  };

  if (compact) {
    return (
      <div
        className={`p-3 sm:p-3.5 rounded-xl ${variantStyles[variant]} flex flex-col items-center justify-center text-center space-y-1 select-none ${className}`}
      >
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-base shrink-0 text-[#0B7066]">{icon}</span>}
          <span className="font-mono font-bold text-lg sm:text-xl text-white tracking-tight">
            {value}
          </span>
        </div>
        <span className="font-sans text-[11px] font-medium text-[#8E9693] leading-tight">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl ${variantStyles[variant]} space-y-1.5 select-none ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#8E9693] font-bold">
        <span>{label}</span>
        {icon && <span className="text-[#0B7066]">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono font-bold text-2xl text-white tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-mono font-bold ${
              trendPositive ? 'text-[#0B7066]' : 'text-rose-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="font-sans text-xs text-[#8E9693]">{subtext}</p>}
    </div>
  );
};

export default StatCard;
