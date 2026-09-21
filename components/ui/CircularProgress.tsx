'use client';

import React from 'react';

export interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number; // width/height in px (default: 80)
  strokeWidth?: number; // stroke width (default: 8)
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple';
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 80,
  strokeWidth = 7,
  variant = 'indigo',
  label,
  sublabel,
  showPercent = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const gradientId = `circular-grad-${variant}-${size}`;

  const colors = {
    indigo: { start: '#6366F1', end: '#818CF8' },
    cyan: { start: '#0EA5E9', end: '#38BDF8' },
    emerald: { start: '#10B981', end: '#34D399' },
    amber: { start: '#F59E0B', end: '#FBBF24' },
    purple: { start: '#8B5CF6', end: '#C084FC' },
  };

  const activeColor = colors[variant];

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activeColor.start} />
              <stop offset="100%" stopColor={activeColor.end} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Animated progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          {showPercent && (
            <span className="font-mono font-bold text-white tracking-tight leading-none" style={{ fontSize: size * 0.22 }}>
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="mt-2 text-xs font-sans font-semibold text-slate-200 text-center">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] font-mono text-slate-400 text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default CircularProgress;
