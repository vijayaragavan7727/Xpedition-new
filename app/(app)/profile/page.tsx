'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, clearStoreData, switchActiveGraph, UserStoreData, SkillGraph } from '@/lib/store';

export default function ProfilePage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const handleSwitchGoal = (graphId: string) => {
    const updated = switchActiveGraph(graphId);
    setStoreData(updated);
    window.location.reload();
  };

  const handleResetData = () => {
    if (confirm('Reset local store to fresh zero-state? This is useful for testing fresh account states.')) {
      clearStoreData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 select-none pt-4 max-w-xl mx-auto">
      <div>
        <h1 className="font-sans font-semibold text-2xl text-text">Profile & Skill Graphs</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Manage your active learning goals, switch between skill graphs, or create new goals.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-[#150F2A] rounded-[16px] border border-line/40 p-6 space-y-4">
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
        </div>

        {/* =================================================================== */}
        {/* SKILL GRAPHS LIST & GOAL SWITCHER */}
        {/* =================================================================== */}
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

        {/* Reset & Sign Out Controls */}
        <div className="space-y-2.5 pt-4 border-t border-line/40">
          <button
            type="button"
            onClick={handleResetData}
            className="w-full h-10 rounded-[10px] bg-danger/15 border border-danger/40 text-danger hover:bg-danger/25 font-sans font-medium text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            Reset Store to Fresh Zero-State (Testing)
          </button>

          <Link
            href="/"
            className="w-full h-10 rounded-[10px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-colors block text-center pt-2"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
