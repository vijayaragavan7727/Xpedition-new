'use client';

import React, { useState } from 'react';
import { Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PredictionChallengeConfig } from '@/lib/experience/types';

interface PredictionCardProps {
  config: PredictionChallengeConfig;
  onSubmit: (selectedOptionId: string) => void;
  isSubmitted: boolean;
  selectedOptionId?: string;
  isCorrect?: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  config,
  onSubmit,
  isSubmitted,
  selectedOptionId,
  isCorrect,
}) => {
  const [selectedId, setSelectedId] = useState<string>(selectedOptionId || '');

  const handleSelect = (id: string) => {
    if (isSubmitted) return;
    setSelectedId(id);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onSubmit(selectedId);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-[#141826]/90 p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">
            Step 1: Form Your Hypothesis
          </span>
        </div>
        <span className="font-mono text-[10px] text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          PRE-LAUNCH PREDICTION
        </span>
      </div>

      <p className="font-sans text-xs sm:text-sm text-slate-200 font-medium">
        {config.prompt}
      </p>

      {/* Options List */}
      <div className="space-y-2">
        {config.options.map((opt) => {
          const isSelected = (isSubmitted ? selectedOptionId : selectedId) === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isSubmitted}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-600/20 text-white font-semibold'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
              }`}
              aria-label={opt.label}
            >
              <div>
                <span className="font-sans font-bold block">{opt.label}</span>
                {opt.description && (
                  <span className="font-sans text-[11px] text-slate-400 font-normal">
                    {opt.description}
                  </span>
                )}
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-500 text-white'
                    : 'border-white/[0.2]'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm Button or Submission Status */}
      {!isSubmitted ? (
        <div className="pt-1">
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          >
            <span>Lock In Prediction & Unlock Cannon</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="pt-1 flex items-center gap-2 text-xs font-mono text-indigo-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Prediction recorded. Now adjust variables and fire!</span>
        </div>
      )}
    </div>
  );
};
