'use client';

import React from 'react';

export interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number; // width/height in px (default: 80)
  strokeWidth?: number; // stroke width (default: 8)
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple' | 'teal';
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 80,
  strokeWidth = 7,
  variant = 'teal',
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

  const colors: Record<string, { start: string; end: string }> = {
    teal: { start: '#075C55', end: '#0B7066' },
    indigo: { start: '#075C55', end: '#0B7066' },
    cyan: { start: '#004741', end: '#075C55' },
    emerald: { start: '#075C55', end: '#0B7066' },
    amber: { start: '#E5E0D5', end: '#F0EDE4' },
    purple: { start: '#075C55', end: '#0B7066' },
  };

  const activeColor = colors[variant] || colors.teal;

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
            stroke="#263130"
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
            className="transition-all duration-500 ease-out"
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
        <span className="mt-2 text-xs font-sans font-semibold text-white text-center">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] font-mono text-[#8E9693] text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default CircularProgress;
