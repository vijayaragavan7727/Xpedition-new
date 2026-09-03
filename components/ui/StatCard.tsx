'use client';

import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  trendPositive = true,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#141826]/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.35)] space-y-1.5 transition-all ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
        <span>{label}</span>
        {icon && <span className="text-indigo-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-sans font-bold text-2xl text-white tracking-tight">{value}</span>
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
