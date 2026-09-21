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
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple' | 'gradient';
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
  variant = 'indigo',
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

  const fillStyles = {
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
    cyan: 'bg-gradient-to-r from-sky-500 to-cyan-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
    purple: 'bg-gradient-to-r from-purple-500 to-indigo-400',
    gradient: 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500',
  };

  // Segmented Bar Mode (for Class Header & Multi-stage flows)
  if (segments && segments > 0) {
    const activeIdx = currentSegment !== undefined ? currentSegment : Math.round((value / max) * segments);
    return (
      <div className={`w-full space-y-1.5 ${className}`}>
        {(label || sublabel) && (
          <div className="flex justify-between items-center text-xs">
            {label && <span className="font-sans font-semibold text-slate-200">{label}</span>}
            {sublabel && <span className="font-mono text-slate-400 text-[11px]">{sublabel}</span>}
          </div>
        )}
        <div className="flex items-center gap-1.5 w-full">
          {Array.from({ length: segments }).map((_, i) => {
            const isCompleted = i < activeIdx;
            const isCurrent = i === activeIdx;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-300 ${sizeStyles[size]} ${
                  isCompleted
                    ? fillStyles[variant]
                    : isCurrent
                    ? `${fillStyles[variant]} ring-2 ring-indigo-400/40 animate-pulse`
                    : 'bg-white/[0.08]'
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
          {label && <span className="font-sans font-medium text-slate-300">{label}</span>}
          <div className="flex items-center gap-2">
            {sublabel && <span className="font-sans text-slate-400 text-[11px]">{sublabel}</span>}
            {showPercent && (
              <span className="font-mono text-slate-300 font-bold">{percentage}%</span>
            )}
          </div>
        </div>
      )}
      <div
        className={`w-full bg-white/[0.06] border border-white/[0.04] rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillStyles[variant]} ${
            glowing ? 'shadow-[0_0_12px_rgba(99,102,241,0.5)]' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

