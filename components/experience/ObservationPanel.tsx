'use client';

import React from 'react';
import { Target, Clock, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { SimulationResult } from '@/lib/experience/simulation/projectilePhysics';

interface ObservationPanelProps {
  simResult?: SimulationResult;
  trialCount: number;
}

export const ObservationPanel: React.FC<ObservationPanelProps> = ({
  simResult,
  trialCount,
}) => {
  if (!simResult) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#141826]/70 p-4 text-center">
        <p className="font-sans text-xs text-slate-400">
          Fire your first launch to observe trajectory telemetry.
        </p>
      </div>
    );
  }

  const {
    landingDistance,
    targetDistance,
    targetError,
    isHit,
    flightTime,
    peakHeight,
  } = simResult;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#141826]/90 p-4 sm:p-5 space-y-3.5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">
            Trial #{trialCount} Result
          </span>
        </div>

        {isHit ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-mono text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>TARGET HIT</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 font-mono text-[11px] font-bold text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{targetError < 0 ? 'LANDED SHORT' : 'OVERSHOT'}</span>
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="font-sans text-[10px] text-slate-400 block">Landing Range</span>
          <span className="font-mono text-sm font-bold text-white">
            {landingDistance.toFixed(1)}m
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="font-sans text-[10px] text-slate-400 block">Target Distance</span>
          <span className="font-mono text-sm font-bold text-emerald-300">
            {targetDistance.toFixed(1)}m
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="font-sans text-[10px] text-slate-400 block">Error Margin</span>
          <span
            className={`font-mono text-sm font-bold ${
              isHit ? 'text-emerald-300' : targetError < 0 ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            {targetError > 0 ? `+${targetError.toFixed(1)}m` : `${targetError.toFixed(1)}m`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="font-sans text-[10px] text-slate-400 block">Flight Time / Peak</span>
          <span className="font-mono text-xs font-bold text-slate-200">
            {flightTime.toFixed(1)}s • {peakHeight.toFixed(1)}m
          </span>
        </div>
      </div>
    </div>
  );
};
