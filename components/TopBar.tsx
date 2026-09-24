'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoreData, UserStoreData, calculateStreak, switchActiveGraph } from '@/lib/store';
import { Flame, Bell, Plus, ChevronDown, Check, Sparkles, Compass } from 'lucide-react';

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

  // Dynamic context derivation: On teaching or class routes, reflect active topic/subject
  let goalTitle = activeGraph?.goalText || storeData?.goalText || 'Xpedition';
  if (pathname.startsWith('/teach') || pathname.startsWith('/class')) {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const topic = (urlParams.get('topic') || urlParams.get('concept') || '').toLowerCase();
      if (topic.includes('motor') || topic.includes('electric') || topic.includes('commutat') || pathname.includes('motor')) {
        goalTitle = 'Physics — DC Motor';
      } else if (topic.includes('projectile') || topic.includes('kinematic') || pathname.includes('projectile')) {
        goalTitle = 'Physics — Mechanics';
      } else if (topic.includes('heart') || topic.includes('cardio') || pathname.includes('heart')) {
        goalTitle = 'Biology — Heart Anatomy';
      } else if (topic) {
        goalTitle = decodeURIComponent(urlParams.get('topic') || urlParams.get('concept') || goalTitle);
      }
    }
  }

  const avatarId =
    storeData?.learnerProfile?.avatar_id ||
    activeGraph?.learnerProfile?.avatar_id ||
    'learner';
  const avatarSrc = `/world/characters/${avatarId}.png`;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[#263130] bg-[#080B0D]/95 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 transition-colors select-none">
      {/* Left: Brand Identity & Active Pathway Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/home"
          className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-[#0B7066]/50 outline-none rounded-xl p-1 transition-colors"
          aria-label="Xpedition Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#004741] border border-[#17655E] flex items-center justify-center text-white transition-colors shadow-sm">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans font-black tracking-tight text-sm text-white hidden xs:inline">
            XPEDITION
          </span>
        </Link>

        <span className="text-[#8E9693] text-xs hidden sm:inline" aria-hidden="true">/</span>

        <div className="relative">
          <button
            onClick={() => setShowGoalSwitcher(!showGoalSwitcher)}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-[#263130] transition-colors text-left focus-visible:ring-2 focus-visible:ring-[#0B7066]/50 outline-none"
            aria-expanded={showGoalSwitcher}
            aria-label={`Current pathway: ${goalTitle}. Click to switch pathway`}
          >
            <div className="w-2 h-2 rounded-full bg-[#0B7066] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-sans font-bold text-xs sm:text-sm text-white truncate max-w-[120px] sm:max-w-[200px]">
                {goalTitle}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8E9693] ml-0.5 shrink-0" />
          </button>

          {/* Goal Switcher Modal */}
          {showGoalSwitcher && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowGoalSwitcher(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-[#151B1B] border border-[#263130] shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8E9693] px-3 py-1.5">
                  Active Pathways
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {storeData?.graphs?.map((graph) => {
                    const isActive = graph.id === storeData?.activeGraphId;
                    return (
                      <button
                        key={graph.id}
                        onClick={() => handleSwitchGoal(graph.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left font-sans text-xs transition-colors ${
                          isActive
                            ? 'bg-[#004741] text-white font-semibold border border-[#17655E]'
                            : 'text-[#E5E0D5] hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="truncate pr-2">{graph.goalText}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 mt-1 border-t border-[#263130]">
                  <Link
                    href="/onboarding"
                    onClick={() => setShowGoalSwitcher(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#8E9693] hover:text-white hover:bg-white/[0.05] text-xs font-sans transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start New Pathway</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* 3D Lab Direct Launcher */}
        <Link
          href="/teach"
          className="hidden xs:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#004741]/30 border border-[#17655E] text-[#E5E0D5] font-mono text-xs font-bold hover:bg-[#004741]/50 hover:border-[#0B7066] transition-colors"
          title="Universal 3D Teaching Engine"
          aria-label="Launch Universal 3D Teaching Engine"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0B7066]" />
          <span>3D LAB</span>
        </Link>

        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1B2221] border border-[#263130] text-[#E5E0D5] font-mono text-xs font-bold">
          <Flame className="w-3.5 h-3.5 text-[#C29B38]" />
          <span>{streak}</span>
        </div>

        {/* Retention Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8E9693] hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-[#263130] transition-colors relative focus-visible:ring-2 focus-visible:ring-[#0B7066]/50 outline-none"
            title="Retention & decay alerts"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadDecay && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#A83232] ring-2 ring-[#080B0D]" />
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute top-full right-0 mt-1.5 w-80 rounded-xl bg-[#151B1B] border border-[#263130] shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#263130] mb-2">
                  <span className="font-sans font-bold text-xs text-white">Retention Alerts</span>
                  <span className="font-mono text-[10px] text-[#8E9693]">
                    {fadingConcepts.length} at risk
                  </span>
                </div>
                {fadingConcepts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#8E9693] font-sans">
                    All skills fresh and retained!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {fadingConcepts.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-white/[0.03] border border-[#263130] flex items-center justify-between gap-2 text-xs"
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
                          className="px-2 py-1 rounded-md bg-[#004741] hover:bg-[#075C55] text-white font-mono text-[10px] shrink-0 border border-[#17655E]"
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
          className="w-9 h-9 rounded-lg border border-[#263130] p-0.5 hover:border-[#17655E] transition-colors focus-visible:ring-2 focus-visible:ring-[#0B7066]/50 outline-none relative group"
          title="Learner Profile & Settings"
          aria-label="Profile and Settings"
        >
          <div className="w-full h-full rounded-md bg-[#151B1B] flex items-center justify-center overflow-hidden">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-full h-full object-contain"
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
