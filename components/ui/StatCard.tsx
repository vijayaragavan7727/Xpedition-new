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
      className={`p-4 rounded-2xl bg-[#121524]/90 border border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] backdrop-blur-xl space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-sans font-black text-2xl text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
              trendPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="font-sans text-xs text-slate-400 leading-tight">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
