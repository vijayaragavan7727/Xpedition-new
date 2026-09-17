'use client';

import React from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { XiraExperienceFeedback } from '@/lib/experience/types';

interface XiraFeedbackBannerProps {
  feedback?: XiraExperienceFeedback;
}

export const XiraFeedbackBanner: React.FC<XiraFeedbackBannerProps> = ({ feedback }) => {
  if (!feedback) return null;

  const isCelebrating = feedback.tone === 'celebrating';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
        isCelebrating
          ? 'border-emerald-500/35 bg-emerald-950/20 shadow-[0_4px_24px_rgba(16,185,129,0.15)]'
          : 'border-indigo-500/30 bg-[#141826]/90 shadow-xl'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isCelebrating ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-bold text-xs text-white">
            {isCelebrating ? 'Xira Celebrates' : 'Xira noticed...'}
          </span>
        </div>

        <span
          className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
            isCelebrating
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/[0.04] text-indigo-300 border border-white/[0.06]'
          }`}
        >
          {isCelebrating ? 'Mastery Confirmed' : 'Physics Insight'}
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="font-sans text-xs sm:text-sm font-medium text-slate-200">
          {feedback.observation}
        </p>
        <p className="font-sans text-xs text-slate-400 leading-relaxed">
          {feedback.pedagogicalInsight}
        </p>
      </div>

      <div className="pt-1 flex items-start gap-2 text-xs font-medium text-indigo-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-snug">{feedback.suggestedNextMove}</span>
      </div>
    </div>
  );
};
