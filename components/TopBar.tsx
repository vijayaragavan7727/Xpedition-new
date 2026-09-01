'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoreData, UserStoreData, calculateStreak, switchActiveGraph } from '@/lib/store';
import { Flame, Bell, Plus, ChevronDown, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [showGoalSwitcher, setShowGoalSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setStoreData(getStoreData());
  }, [pathname]);

  const streak = storeData ? calculateStreak(storeData.attempts) : 0;
  const fadingConcepts = storeData
    ? storeData.concepts.filter((c) => c.retentionRisk > 0.35)
    : [];
  const hasUnreadDecay = fadingConcepts.length > 0;

  const handleSwitchGoal = (graphId: string) => {
    const updated = switchActiveGraph(graphId);
    setStoreData(updated);
    setShowGoalSwitcher(false);
    window.location.reload();
  };

  return (
    <header className="w-full h-14 px-4 sm:px-6 flex items-center justify-between select-none relative z-50 bg-[#090A0F]/80 backdrop-blur-xl border-b border-white/[0.08]">
      {/* Left: Brand Wordmark + Goal Switcher */}
      <div className="flex items-center gap-3">
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 shadow-[0_2px_10px_rgba(99,102,241,0.4)]">
            <div className="w-full h-full bg-[#090A0F] rounded-[6px] flex items-center justify-center font-black text-xs text-white">
              X
            </div>
          </div>
          <span className="font-sans font-black text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            XPEDITION
          </span>
        </Link>

        {/* Goal Switcher Dropdown */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setShowGoalSwitcher(!showGoalSwitcher)}
            className="h-7 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs flex items-center gap-1.5 transition-all max-w-[180px] truncate"
          >
            <span className="truncate font-medium">{storeData?.goalText || 'Active Course'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {showGoalSwitcher && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#121524] border border-white/[0.12] p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2 font-mono text-[10px] text-slate-400 font-bold uppercase">
                <span>SWITCH LEARNING PATH</span>
                <span>{storeData?.graphs?.length || 1} ACTIVE</span>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {storeData?.graphs?.map((graph) => {
                  const isActive = graph.id === storeData.activeGraphId;
                  return (
                    <button
                      key={graph.id}
                      type="button"
                      onClick={() => handleSwitchGoal(graph.id)}
                      className={`w-full p-2 rounded-xl border text-left font-sans text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-cyan-300 font-semibold'
                          : 'bg-white/[0.03] border-transparent text-slate-300 hover:bg-white/[0.07]'
                      }`}
                    >
                      <span className="truncate pr-2">{graph.goalText}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/onboarding"
                onClick={() => setShowGoalSwitcher(false)}
                className="w-full h-8 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-sans font-bold text-xs flex items-center justify-center gap-1 hover:brightness-110 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Goal</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right: Metrics & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Streak Pill */}
        <div
          className={`h-8 px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 transition-all select-none ${
            streak > 0
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-xs'
              : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
          }`}
          title={`${streak} day streak`}
        >
          <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
          <span className="font-mono text-xs font-bold">{streak}</span>
          <span className="font-sans text-[10px] text-slate-400 hidden sm:inline">days</span>
        </div>

        {/* Retention Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-300 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadDecay && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#121524] border border-white/[0.12] p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-3 font-mono text-[10px] text-slate-400 font-bold uppercase">
                <span>RETENTION ALERTS</span>
                <span className="text-cyan-400">{fadingConcepts.length} FADING</span>
              </div>

              {fadingConcepts.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {fadingConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="p-2.5 bg-[#181C2E] border-l-2 border-l-amber-400 rounded-r-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-white">
                        <span className="truncate max-w-[160px]">{concept.name}</span>
                        <span className="font-mono text-[10px] text-amber-400">
                          {Math.round(concept.retentionRisk * 100)}% risk
                        </span>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/tutor/${concept.id}`}
                          onClick={() => setShowNotifications(false)}
                          className="font-mono text-[10px] text-cyan-400 hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center space-y-1.5">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-white">All memories locked in</p>
                  <p className="text-[11px] text-slate-400">No concept decay detected.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Profile"
        >
          <div className="w-full h-full rounded-full bg-[#090A0F] flex items-center justify-center font-mono text-[11px] font-bold text-white uppercase">
            {storeData?.handle ? storeData.handle.slice(0, 2).toUpperCase() : 'ME'}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
