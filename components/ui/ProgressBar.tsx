'use client';

import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  size = 'md',
  variant = 'indigo',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const gradientStyles = {
    indigo: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]',
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    amber: 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between font-mono text-[11px]">
          {label && <span className="text-slate-400 font-medium uppercase tracking-wider">{label}</span>}
          {showPercent && <span className="text-slate-200 font-bold ml-auto">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full ${heightStyles[size]} bg-[#090A0F] rounded-full overflow-hidden border border-white/[0.08] p-0.5`}>
        <div
          className={`h-full ${gradientStyles[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
