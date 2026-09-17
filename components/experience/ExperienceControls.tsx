'use client';

import React from 'react';
import { Play, RotateCcw, Compass, Zap, HelpCircle } from 'lucide-react';

interface ExperienceControlsProps {
  launchAngleDeg: number;
  velocity: number;
  onAngleChange: (val: number) => void;
  onVelocityChange: (val: number) => void;
  onLaunch: () => void;
  onReset: () => void;
  onRequestHint?: () => void;
  isLaunching: boolean;
  disabled?: boolean;
}

export const ExperienceControls: React.FC<ExperienceControlsProps> = ({
  launchAngleDeg,
  velocity,
  onAngleChange,
  onVelocityChange,
  onLaunch,
  onReset,
  onRequestHint,
  isLaunching,
  disabled = false,
}) => {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#141826]/90 p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-bold text-sm text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>Launch Controls</span>
        </h3>
        {onRequestHint && (
          <button
            onClick={onRequestHint}
            className="flex items-center gap-1 text-xs font-mono text-indigo-300 hover:text-indigo-200 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
            aria-label="Request hint from Xira"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Need a Hint?</span>
          </button>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Launch Angle Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="angle-slider" className="font-sans font-medium text-slate-300">
              Launch Angle (θ)
            </label>
            <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {launchAngleDeg}°
            </span>
          </div>
          <input
            id="angle-slider"
            type="range"
            min="10"
            max="80"
            step="1"
            value={launchAngleDeg}
            onChange={(e) => onAngleChange(Number(e.target.value))}
            disabled={disabled || isLaunching}
            className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            aria-label="Adjust launch angle from 10 to 80 degrees"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>10° (Flat)</span>
            <span>45° (Max Reach)</span>
            <span>80° (Steep)</span>
          </div>
        </div>

        {/* Velocity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="velocity-slider" className="font-sans font-medium text-slate-300">
              Initial Speed (v₀)
            </label>
            <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              {velocity} m/s
            </span>
          </div>
          <input
            id="velocity-slider"
            type="range"
            min="10"
            max="30"
            step="1"
            value={velocity}
            onChange={(e) => onVelocityChange(Number(e.target.value))}
            disabled={disabled || isLaunching}
            className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            aria-label="Adjust initial speed from 10 to 30 meters per second"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>10 m/s (Low)</span>
            <span>20 m/s</span>
            <span>30 m/s (High)</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={onLaunch}
          disabled={disabled || isLaunching}
          className="flex-1 min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-650 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          id="launch-cannon-btn"
          aria-label="Fire Cannon"
        >
          {isLaunching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>In Flight...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>Fire Cannon</span>
            </>
          )}
        </button>

        <button
          onClick={onReset}
          disabled={isLaunching}
          className="min-h-[48px] px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white font-sans text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
          title="Reset variables to baseline"
          aria-label="Reset variables"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
};
