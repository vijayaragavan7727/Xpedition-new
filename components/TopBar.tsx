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
    switchActiveGraph(graphId);
    setStoreData(getStoreData());
    setShowGoalSwitcher(false);
  };

  const activeGraph =
    storeData?.graphs?.find((g) => g.id === storeData?.activeGraphId) ||
    storeData?.graphs?.[0];
  const goalTitle = activeGraph?.goalText || storeData?.goalText || 'Xpedition';
  const avatarId =
    storeData?.learnerProfile?.avatar_id ||
    activeGraph?.learnerProfile?.avatar_id ||
    'learner';
  const avatarSrc = `/world/characters/${avatarId}.png`;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-white/[0.07] bg-[#0B0D14]/90 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 transition-colors">
      {/* Left: Active Pathway Indicator */}
      <div className="relative">
        <button
          onClick={() => setShowGoalSwitcher(!showGoalSwitcher)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all text-left focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs sm:text-sm text-white truncate max-w-[140px] sm:max-w-[220px]">
              {goalTitle}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {/* Goal Switcher Modal */}
        {showGoalSwitcher && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowGoalSwitcher(false)}
            />
            <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-[#141826]/95 border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
              <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                Active Pathways
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {storeData?.graphs?.map((graph) => {
                  const isActive = graph.id === storeData?.activeGraphId;
                  return (
                    <button
                      key={graph.id}
                      onClick={() => handleSwitchGoal(graph.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-sans text-xs transition-colors ${
                        isActive
                          ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="truncate pr-2">{graph.goalText}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 mt-1 border-t border-white/[0.06]">
                <Link
                  href="/onboarding"
                  onClick={() => setShowGoalSwitcher(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] text-xs font-sans transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start New Pathway</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold shadow-xs">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{streak}</span>
        </div>

        {/* Retention Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all relative focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
            title="Retention & decay alerts"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadDecay && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B0D14]" />
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute top-full right-0 mt-1.5 w-80 rounded-2xl bg-[#141826]/95 border border-white/[0.1] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                  <span className="font-sans font-bold text-xs text-white">Retention Alerts</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {fadingConcepts.length} at risk
                  </span>
                </div>
                {fadingConcepts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 font-sans">
                    All skills fresh and retained!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {fadingConcepts.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-sans font-bold text-white truncate">{c.name}</p>
                          <p className="font-mono text-[10px] text-rose-400">
                            {Math.round(c.retentionRisk * 100)}% retention risk
                          </p>
                        </div>
                        <Link
                          href={`/tutor/${c.id}`}
                          onClick={() => setShowNotifications(false)}
                          className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] shrink-0"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile Avatar Entry */}
        <Link
          href="/profile"
          className="w-9 h-9 rounded-xl border border-white/[0.1] p-0.5 hover:border-indigo-400/50 hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none relative group"
          title="Learner Profile & Settings"
          aria-label="Profile and Settings"
        >
          <div className="w-full h-full rounded-lg bg-indigo-500/15 flex items-center justify-center overflow-hidden">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-full h-full object-contain drop-shadow"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
