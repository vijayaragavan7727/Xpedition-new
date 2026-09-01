'use client';

import React from 'react';
import { LearningZone } from '@/lib/engine/gameWorldAdapter';
import Link from 'next/link';
import { X, ArrowRight, Lock, CheckCircle2, Sparkles, Trophy, BookOpen, Hammer, Compass } from 'lucide-react';

interface ZoneDetailDrawerProps {
  zone: LearningZone | null;
  onClose: () => void;
}

export default function ZoneDetailDrawer({ zone, onClose }: ZoneDetailDrawerProps) {
  if (!zone) return null;

  const isLocked = zone.status === 'locked';
  const isMastered = zone.status === 'mastered' || zone.masteryPercent >= 80;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-md bg-[#0F172A] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-10 space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Top Handle / Close Bar */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-1 bg-slate-700 rounded-full sm:hidden mx-auto -mt-2 mb-2" />
          <div className="flex items-center gap-2">
            <span className="text-2xl">{zone.icon}</span>
            <div>
              <h3 className="font-sans font-black text-lg text-white leading-tight">
                {zone.name}
              </h3>
              <p className="font-mono text-[11px] text-slate-400 font-medium">
                {zone.tagline} &middot; <span style={{ color: zone.accentColor }}>{zone.tierName} (Lv.{zone.level})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge & Mastery Progress */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Zone Mastery</span>
            <span className="font-bold text-white" style={{ color: zone.accentColor }}>
              {zone.masteryPercent}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${zone.masteryPercent}%`,
                backgroundColor: zone.accentColor,
                boxShadow: `0 0 10px ${zone.accentColor}80`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
            <span>{zone.statsLabel}</span>
            {isMastered ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
              </span>
            ) : (
              <span className="text-amber-400 font-bold">In Progress</span>
            )}
          </div>
        </div>

        {/* Environment Features */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Territory Landmarks
          </span>
          <div className="grid grid-cols-2 gap-2">
            {zone.environmentFeatures.map((feat, i) => (
              <div
                key={i}
                className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2"
              >
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-sans text-xs text-slate-300 truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unlock Requirement or Action Button */}
        {isLocked ? (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center gap-3">
            <Lock className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-sans font-bold text-xs text-red-300">Zone Locked</span>
              <p className="font-mono text-[10px] text-red-400">{zone.unlockRequirement}</p>
            </div>
          </div>
        ) : (
          <Link
            href={zone.actionUrl}
            className="w-full h-12 rounded-2xl font-mono font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            style={{
              backgroundColor: zone.accentColor,
              boxShadow: `0 8px 20px -4px ${zone.accentColor}90`,
            }}
          >
            <span>{zone.actionTitle}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
