'use client';

import React from 'react';
import { LearningZone } from '@/lib/engine/gameWorldAdapter';
import Link from 'next/link';
import { X, ArrowRight, Sparkles, CheckCircle2, Lock, Zap } from 'lucide-react';

interface BuildingActionPopupProps {
  building: LearningZone | null;
  onClose: () => void;
}

export default function BuildingActionPopup({ building, onClose }: BuildingActionPopupProps) {
  if (!building) return null;

  const isLocked = building.status === 'locked';
  const isMastered = building.status === 'mastered' || building.masteryPercent >= 80;

  return (
    <div className="fixed inset-x-3 bottom-18 sm:bottom-6 sm:inset-x-auto sm:right-6 z-50 max-w-sm w-full mx-auto select-none animate-slide-up">
      <div className="relative p-4 rounded-2xl bg-[#0F172A]/95 border-2 border-amber-400/80 backdrop-blur-xl shadow-[0_12px_35px_rgba(0,0,0,0.85)] space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center text-xl shadow-inner">
              {building.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-sans font-black text-sm text-white tracking-wide uppercase">
                  {building.name}
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[9px] font-black border border-amber-500/40">
                  Lv.{building.level}
                </span>
              </div>
              <p className="font-mono text-[10px] text-slate-400">
                {building.tagline}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress & Stats Bar */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-slate-400 font-bold uppercase">Mastery Progress</span>
            <span className="font-black text-amber-300">{building.masteryPercent}%</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${building.masteryPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>{building.completedQuests || building.questsCompleted || 0} Quests Completed</span>
            {isMastered ? (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Mastered
              </span>
            ) : (
              <span className="text-amber-400 font-bold">Active</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isLocked ? (
          <div className="w-full h-10 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center gap-2 text-red-300 font-mono text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>{building.unlockRequirement || 'Locked'}</span>
          </div>
        ) : (
          <Link
            href={building.actionUrl || '/quest'}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(245,158,11,0.6)] active:scale-98 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>ENTER / STUDY</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
