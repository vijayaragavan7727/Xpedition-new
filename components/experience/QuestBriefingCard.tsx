'use client';

import React from 'react';
import { Compass, Zap, Sparkles, ArrowRight, Target } from 'lucide-react';
import { Quest } from '@/lib/types';

interface QuestBriefingCardProps {
  quest: Quest;
  onEnterExperience: () => void;
}

export const QuestBriefingCard: React.FC<QuestBriefingCardProps> = ({
  quest,
  onEnterExperience,
}) => {
  const briefingText =
    quest.briefing ||
    'Discover how physical variables govern real-world outcomes. You will form a hypothesis, manipulate parameters in real time, and observe the results.';
  const objectiveText =
    quest.objective ||
    quest.prompt ||
    'Explore the interactive experience and master the underlying physical principles.';
  const conceptTitle = quest.conceptName || 'Interactive Concept';

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-[#161a2f] via-[#121524] to-[#0d0f1a] p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6 select-none">
      {/* Header Eyebrow */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/35 font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>EXPERIENTIAL QUEST</span>
        </span>
        <span className="font-mono text-xs text-slate-400">Adaptive Simulation</span>
      </div>

      {/* Main Title & Concept */}
      <div className="space-y-1.5">
        <h2 className="font-sans font-bold text-xl sm:text-2xl text-white tracking-tight">
          {conceptTitle}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
          {briefingText}
        </p>
      </div>

      {/* Structured Objective & Xira Role Grid */}
      <div className="space-y-3 pt-1">
        {/* Objective */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className="font-sans font-bold text-xs text-white block">Mission Objective</span>
            <p className="font-sans text-xs text-slate-300 mt-0.5 leading-relaxed">
              {objectiveText}
            </p>
          </div>
        </div>

        {/* Xira Intelligence Role */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <span className="font-sans font-bold text-xs text-white block">Xira&apos;s Role</span>
            <p className="font-sans text-xs text-slate-300 mt-0.5 leading-relaxed">
              Xira will observe your hypothesis and variable adjustments in real time, offering contextual feedback based on your physical trials.
            </p>
          </div>
        </div>
      </div>

      {/* Primary CTA: Enter Experience */}
      <div className="pt-2">
        <button
          onClick={onEnterExperience}
          className="w-full min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-650 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          id="enter-experience-btn"
          aria-label="Enter Interactive Learning Experience"
        >
          <Zap className="w-4 h-4 text-cyan-300" />
          <span>Enter Experience</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
