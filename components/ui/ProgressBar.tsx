'use client';

import React from 'react';

export interface ProgressBarProps {
  value?: number; // 0 to 100
  max?: number;
  segments?: number; // If set, renders segmented stage bar (e.g. 7 segments)
  currentSegment?: number; // Active stage index (1-based or 0-based)
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple' | 'gradient' | 'teal' | 'cream';
  glowing?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  segments,
  currentSegment,
  label,
  sublabel,
  showPercent = true,
  size = 'md',
  variant = 'teal',
  glowing = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const fillStyles: Record<string, string> = {
    teal: 'bg-[#0B7066]',
    cream: 'bg-[#F0EDE4]',
    indigo: 'bg-[#0B7066]',
    cyan: 'bg-[#075C55]',
    emerald: 'bg-[#0B7066]',
    amber: 'bg-[#E5E0D5]',
    purple: 'bg-[#0B7066]',
    gradient: 'bg-[#0B7066]',
  };

  const activeFill = fillStyles[variant] || fillStyles.teal;

  // Segmented Bar Mode (for Class Header & Multi-stage flows)
  if (segments && segments > 0) {
    const activeIdx = currentSegment !== undefined ? currentSegment : Math.round((value / max) * segments);
    return (
      <div className={`w-full space-y-1.5 ${className}`}>
        {(label || sublabel) && (
          <div className="flex justify-between items-center text-xs">
            {label && <span className="font-sans font-semibold text-white">{label}</span>}
            {sublabel && <span className="font-mono text-[#8E9693] text-[11px]">{sublabel}</span>}
          </div>
        )}
        <div className="flex items-center gap-1.5 w-full">
          {Array.from({ length: segments }).map((_, i) => {
            const isCompleted = i < activeIdx;
            const isCurrent = i === activeIdx;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-200 ${sizeStyles[size]} ${
                  isCompleted
                    ? activeFill
                    : isCurrent
                    ? `${activeFill} ring-2 ring-[#0B7066]/50`
                    : 'bg-[#263130]'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Continuous Progress Bar Mode
  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent || sublabel) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-sans font-medium text-[#8E9693]">{label}</span>}
          <div className="flex items-center gap-2">
            {sublabel && <span className="font-sans text-[#8E9693] text-[11px]">{sublabel}</span>}
            {showPercent && (
              <span className="font-mono text-white font-bold">{percentage}%</span>
            )}
          </div>
        </div>
      )}
      <div
        className={`w-full bg-[#151B1B] border border-[#263130] rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${activeFill}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
