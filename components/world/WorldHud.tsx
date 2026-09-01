'use client';

import React from 'react';
import { PlayableGameWorldData } from '@/lib/engine/gameWorldAdapter';
import { Flame, Shield, Award, Sparkles, Trophy } from 'lucide-react';

interface WorldHudProps {
  worldData: PlayableGameWorldData;
  onOpenTerritoryInfo?: () => void;
}

export default function WorldHud({ worldData, onOpenTerritoryInfo }: WorldHudProps) {
  const { learnerName, learnerLevel, totalXp, streakDays, worldLevelName, worldProgressPercent } = worldData;

  return (
    <header className="fixed top-2 inset-x-2 sm:inset-x-4 z-30 max-w-lg mx-auto select-none pointer-events-none">
      <div className="p-2.5 rounded-2xl bg-[#0F172A]/90 border border-emerald-500/30 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-between pointer-events-auto">
        {/* Left: Player Badge & Level */}
        <button
          type="button"
          onClick={onOpenTerritoryInfo}
          className="flex items-center gap-2.5 hover:opacity-90 active:scale-95 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex flex-col items-center justify-center">
              <span className="text-[9px] font-mono text-emerald-400 font-black leading-none">LVL</span>
              <span className="text-xs font-mono font-black text-white leading-none">{learnerLevel}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-xs text-white truncate max-w-[110px] sm:max-w-[160px]">
                {learnerName}&apos;s Territory
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                T{worldData.worldLevel}
              </span>
            </div>
            {/* XP Progress Bar */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-20 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${worldProgressPercent}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-slate-300 font-medium">{totalXp} XP</span>
            </div>
          </div>
        </button>

        {/* Right Stats: Streak & Mastery Crystals */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Daily Streak */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="font-mono text-xs font-bold text-amber-300">{streakDays}d</span>
          </div>

          {/* Gold / Currency */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-yellow-500/15 border border-yellow-500/30">
            <span className="text-xs">🪙</span>
            <span className="font-mono text-xs font-bold text-yellow-300">{worldData.resources.gold}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
