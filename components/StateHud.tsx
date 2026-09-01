'use client';

import React, { useState } from 'react';
import { FlowState } from '@/lib/store';
import { Activity, Clock, RotateCcw, HelpCircle, ArrowRightLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';

interface StateHudProps {
  flowState: FlowState;
  hesitationSeconds: number;
  timeOnItemSeconds?: number;
  retryCount: number;
  hintCount: number;
  tabSwitchCount?: number;
  latencyBaselineSeconds?: number;
  abilityTheta?: number;
  nextDifficultyB?: number;
  targetSuccessRate?: number;
  whySignals?: string[];
}

export const StateHud: React.FC<StateHudProps> = ({
  flowState = 'flow',
  hesitationSeconds = 0,
  timeOnItemSeconds = 0,
  retryCount = 0,
  hintCount = 0,
  tabSwitchCount = 0,
  latencyBaselineSeconds = 14.2,
  abilityTheta = 0.45,
  nextDifficultyB = 0.5,
  targetSuccessRate = 75,
  whySignals = ['Steady response latency', 'High accuracy trend', 'No scaffolding needed'],
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(true);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getFlowStateBadge = (state: FlowState) => {
    switch (state) {
      case 'flow':
        return { label: 'FLOW STATE', variant: 'success' as const };
      case 'frustrated':
        return { label: 'FRICTION DETECTED', variant: 'danger' as const };
      case 'bored':
        return { label: 'LOW ENGAGEMENT', variant: 'warning' as const };
      case 'drifting':
        return { label: 'DRIFTING', variant: 'warning' as const };
      default:
        return { label: 'CALIBRATING', variant: 'default' as const };
    }
  };

  const badge = getFlowStateBadge(flowState);

  return (
    <aside className="w-full lg:w-[280px] bg-[#121524]/90 border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg transition-all">
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="w-full p-3.5 flex items-center justify-between bg-[#181C2E]/60 border-b border-white/[0.06] lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-bold">
            ADAPTIVE ENGINE
          </span>
          <Badge variant={badge.variant} size="sm">
            {badge.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-cyan-400">
            {targetSuccessRate}% Target
          </span>
          <span className="lg:hidden text-slate-400">
            {isOpenMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Main Body */}
      <div className={`${isOpenMobile ? 'block' : 'hidden lg:block'} p-4 space-y-3.5`}>
        {/* Row 1: Hesitation & Time-on-Item */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#181C2E] p-2.5 rounded-xl border border-white/[0.06] space-y-0.5">
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] uppercase">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>HESITATION</span>
            </div>
            <span className="block font-mono text-sm font-bold text-cyan-300">
              {formatTime(hesitationSeconds)}
            </span>
          </div>

          <div className="bg-[#181C2E] p-2.5 rounded-xl border border-white/[0.06] space-y-0.5">
            <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] uppercase">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>ITEM TIME</span>
            </div>
            <span className="block font-mono text-sm font-bold text-white">
              {formatTime(timeOnItemSeconds || hesitationSeconds)}
            </span>
          </div>
        </div>

        {/* Row 2: Retries, Hints, Tab Switches */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#181C2E] p-2 rounded-xl border border-white/[0.06] text-center space-y-0.5">
            <span className="block font-mono text-[8px] uppercase text-slate-400">RETRIES</span>
            <span className="block font-mono text-xs font-bold text-white">{retryCount}</span>
          </div>

          <div className="bg-[#181C2E] p-2 rounded-xl border border-white/[0.06] text-center space-y-0.5">
            <span className="block font-mono text-[8px] uppercase text-slate-400">HINTS</span>
            <span className="block font-mono text-xs font-bold text-purple-400">{hintCount}</span>
          </div>

          <div className="bg-[#181C2E] p-2 rounded-xl border border-white/[0.06] text-center space-y-0.5">
            <span className="block font-mono text-[8px] uppercase text-slate-400">SWITCHES</span>
            <span className="block font-mono text-xs font-bold text-slate-400">{tabSwitchCount}</span>
          </div>
        </div>

        {/* Row 3: Ability & Difficulty */}
        <div className="bg-[#181C2E]/80 p-2.5 rounded-xl border border-white/[0.06] space-y-1">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400">LATENCY BASELINE</span>
            <span className="text-white font-bold">{latencyBaselineSeconds}s</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-400">ABILITY / DIFFICULTY</span>
            <span className="text-cyan-400 font-bold">
              θ={abilityTheta >= 0 ? `+${abilityTheta}` : abilityTheta} / b={nextDifficultyB >= 0 ? `+${nextDifficultyB}` : nextDifficultyB}
            </span>
          </div>
        </div>

        {/* Row 4: Target Success Meter */}
        <ProgressBar
          value={targetSuccessRate}
          label="Target Success Rate"
          variant="cyan"
          size="sm"
        />

        {/* Row 5: Telemetry Signals */}
        <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
          <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 font-bold block">
            TELEMETRY SIGNALS
          </span>
          <ul className="space-y-1">
            {whySignals.map((signal, idx) => (
              <li key={idx} className="flex items-center gap-2 font-sans text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span className="leading-snug">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default StateHud;
