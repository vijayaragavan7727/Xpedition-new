'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, clearStoreData, switchActiveGraph, saveLearnerProfile, UserStoreData, SkillGraph } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ProfilePage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [learningMode, setLearningMode] = useState<'tutor' | 'read' | 'quest'>('tutor');

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);
    const mode = store.learnerProfile?.learningMode as 'tutor' | 'read' | 'quest';
    if (mode) setLearningMode(mode);
  }, []);

  const handleSwitchGoal = (graphId: string) => {
    const updated = switchActiveGraph(graphId);
    setStoreData(updated);
    window.location.reload();
  };

  const handleChangeLearningMode = (mode: 'tutor' | 'read' | 'quest') => {
    setLearningMode(mode);
    const updated = saveLearnerProfile({ learningMode: mode });
    setStoreData(updated);
  };

  const handleResetData = () => {
    if (confirm('Reset local store to fresh zero-state? This is useful for testing fresh account states.')) {
      clearStoreData();
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    window.location.href = '/';
  };

  return (
    <div className="space-y-6 select-none pt-4 max-w-xl mx-auto">
      <div>
        <h1 className="font-sans font-semibold text-2xl text-text">Profile & Preferences</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Manage your active learning goals, switch between skill graphs, or change your lesson teaching mode.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-[#150F2A] rounded-[16px] border border-line/40 p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-line/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-signature-gradient p-0.5">
              <div className="w-full h-full rounded-full bg-panel flex items-center justify-center font-mono font-bold text-sm">
                {storeData?.handle ? storeData.handle.slice(0, 2).toUpperCase() : 'OP'}
              </div>
            </div>
            <div>
              <h2 className="font-sans font-semibold text-base text-text">
                {storeData?.handle || 'Learner'}
              </h2>
              <span className="font-mono text-[10px] text-cyan uppercase tracking-eyebrow">
                AUTHENTICATED SESSION
              </span>
            </div>
          </div>

          {/* REWARDS TILE (MOVED FROM HOME STAT STRIP) */}
          <div className="bg-[#1A1430] border border-violet/30 px-3.5 py-2 rounded-[10px] text-center font-mono shrink-0">
            <span className="text-[9px] text-muted block uppercase">REWARDS</span>
            <span className="text-sm font-bold text-violet">+{storeData?.rewardsCount || 0} 🏆</span>
          </div>
        </div>

        {/* LEARNING LESSON MODE PREFERENCE */}
        <div className="space-y-3 pt-1 border-b border-line/40 pb-5">
          <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow block">
            LESSON TEACHING MODE PREFERENCE
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleChangeLearningMode('tutor')}
              className={`p-3 rounded-[12px] border text-left flex flex-col justify-between transition-all cursor-pointer ${
                learningMode === 'tutor'
                  ? 'bg-cyan/15 border-cyan text-cyan font-semibold shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-raised/40 border-line/40 text-muted hover:text-text'
              }`}
            >
              <span className="font-sans text-xs font-bold block mb-1">🤖 Tutor Mode</span>
              <span className="font-mono text-[9px] leading-tight block">Paced speech, avatar, and Python whiteboard.</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeLearningMode('read')}
              className={`p-3 rounded-[12px] border text-left flex flex-col justify-between transition-all cursor-pointer ${
                learningMode === 'read'
                  ? 'bg-cyan/15 border-cyan text-cyan font-semibold shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-raised/40 border-line/40 text-muted hover:text-text'
              }`}
            >
              <span className="font-sans text-xs font-bold block mb-1">📖 Read Mode</span>
              <span className="font-mono text-[9px] leading-tight block">Interactive text chunks revealed at your own pace.</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeLearningMode('quest')}
              className={`p-3 rounded-[12px] border text-left flex flex-col justify-between transition-all cursor-pointer ${
                learningMode === 'quest'
                  ? 'bg-cyan/15 border-cyan text-cyan font-semibold shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-raised/40 border-line/40 text-muted hover:text-text'
              }`}
            >
              <span className="font-sans text-xs font-bold block mb-1">🎯 Quest Only</span>
              <span className="font-mono text-[9px] leading-tight block">Skip lessons and jump straight to assessment quests.</span>
            </button>
          </div>
        </div>

        {/* SKILL GRAPHS LIST & GOAL SWITCHER */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
              YOUR SKILL GRAPHS ({storeData?.graphs?.length || 1})
            </span>
            <Link
              href="/onboarding"
              className="h-8 px-3 rounded-[8px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center gap-1.5 hover:brightness-108 transition-all"
            >
              <span>＋ New Goal</span>
            </Link>
          </div>

          <div className="space-y-2">
            {storeData?.graphs?.map((graph: SkillGraph) => {
              const isActive = graph.id === storeData.activeGraphId;
              const conceptCount = graph.concepts?.length || 0;
              const attemptCount = graph.attempts?.length || 0;

              return (
                <div
                  key={graph.id}
                  className={`p-4 rounded-[12px] border transition-all ${
                    isActive
                      ? 'bg-cyan/10 border-cyan text-text'
                      : 'bg-raised/40 border-line/40 text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-semibold text-sm text-text flex items-center gap-2">
                        <span>{graph.goalText}</span>
                        {isActive && (
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-cyan/20 text-cyan uppercase font-bold">
                            ACTIVE
                          </span>
                        )}
                      </h3>
                      <p className="font-mono text-[11px] text-muted mt-1">
                        {conceptCount} Concepts • {attemptCount} Attempts
                      </p>
                    </div>

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSwitchGoal(graph.id)}
                        className="h-8 px-3 rounded-[8px] bg-raised border border-line text-xs font-sans text-text font-medium hover:border-cyan transition-colors cursor-pointer"
                      >
                        Switch to Goal
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MANUAL TESTING SOLO MODE LAUNCHER */}
        <div className="p-4 rounded-[14px] bg-violet-600/15 border border-violet-500/40 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-violet-400 text-lg">🔒</span>
              <div>
                <h3 className="font-sans font-semibold text-sm text-text">Launch Solo Mode (Manual Test)</h3>
                <p className="font-sans text-xs text-muted">6 items with zero assistance, hints, or mid-session feedback.</p>
              </div>
            </div>
            <Link
              href="/quest?mode=solo"
              className="h-9 px-4 rounded-[10px] bg-violet-600 hover:bg-violet-500 text-white font-sans font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.3)] shrink-0"
            >
              <span>Start Solo Session</span>
              <span>🔒</span>
            </Link>
          </div>
        </div>

        {/* Reset & Sign Out Controls */}
        <div className="space-y-2.5 pt-4 border-t border-line/40">
          <button
            type="button"
            onClick={handleResetData}
            className="w-full h-10 rounded-[10px] bg-danger/15 border border-danger/40 text-danger hover:bg-danger/25 font-sans font-medium text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            Reset Store to Fresh Zero-State (Testing)
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-10 rounded-[10px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
