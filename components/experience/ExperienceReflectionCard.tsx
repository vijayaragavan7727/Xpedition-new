'use client';

import React from 'react';
import { CheckCircle2, Sparkles, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';
import { ExperienceResult } from '@/lib/experience/types';
import type { AdaptiveExperienceLoopResult } from '@/lib/intelligence/types';

interface ExperienceReflectionCardProps {
  result: ExperienceResult;
  onContinue: (targetRoute?: string) => void;
  nextActionReason?: string;
  nextActionTitle?: string;
  adaptiveResult?: AdaptiveExperienceLoopResult | null;
}

export const ExperienceReflectionCard: React.FC<ExperienceReflectionCardProps> = ({
  result,
  onContinue,
  nextActionReason,
  nextActionTitle = 'Continue Learning Pathway',
  adaptiveResult,
}) => {
  const isBullseye = result.finalResult === 'target_hit' || result.completed;
  const closestError = result.interactionEvidence ? Math.abs(result.interactionEvidence.finalError).toFixed(1) : '1.5';

  const assessmentSignal = adaptiveResult?.assessment.signal;
  const nextQuest = adaptiveResult?.nextQuest;
  const nextExp = adaptiveResult?.nextExperience;

  // Resolve dynamic button label & title based on Decision Engine & NextQuestResolver
  const displayButtonLabel = nextQuest?.buttonLabel || nextActionTitle || 'Continue Learning Pathway';
  const displayQuestTitle = nextQuest?.title || nextExp?.title || 'Next Curricular Quest';
  const displayAction = nextQuest?.action || adaptiveResult?.decision?.action;
  const targetRoute = nextQuest?.route;

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-[#161a2f] via-[#121524] to-[#0d0f1a] p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 block font-semibold">
              EVIDENCE RECORDED
            </span>
            <h2 className="font-sans font-bold text-lg text-white">
              Experience Complete
            </h2>
          </div>
        </div>

        {assessmentSignal && (
          <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 uppercase tracking-wide">
            {assessmentSignal.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* What You Discovered / Experience Summary */}
      <div className="space-y-2.5">
        <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>What You Discovered</span>
        </h3>

        <div className="space-y-2 text-xs font-sans text-slate-300 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
          <div className="flex items-start gap-2">
            <span className="text-indigo-400 font-bold">•</span>
            <span>
              {result.summary?.patternSummary ||
                result.evidence?.patternSummary ||
                (isBullseye
                  ? 'You systematically resolved the challenge and verified output correctness.'
                  : `Over ${result.attempts} attempts, your observations contributed to your learner model.`)}
            </span>
          </div>
          {result.codeEvidence && (
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">•</span>
              <span>
                <strong>Execution Stats:</strong> {result.codeEvidence.runs} run(s), {result.codeEvidence.edits} edit(s), {result.codeEvidence.hintsUsed} hint(s) used.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Xira's Adaptive Analysis */}
      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-sans font-bold text-xs text-indigo-200">
              Xira&apos;s Adaptive Analysis
            </span>
          </div>
          {assessmentSignal && (
            <span className="font-mono text-[10px] text-indigo-300">
              Diagnostic Verified
            </span>
          )}
        </div>

        <p className="font-sans text-xs text-slate-200 leading-relaxed">
          {adaptiveResult?.xiraGuidance ||
            nextActionReason ||
            `Your experiential observations for ${result.conceptName} have been synthesized into your learner model. Ready for your next challenge.`}
        </p>
      </div>

      {/* Next Quest Section */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
              NEXT QUEST
            </span>
            {displayAction && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {displayAction.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {nextQuest && (
            <span className="font-mono text-[10px] text-slate-400">
              {nextQuest.isExperiential ? 'Interactive Lab' : 'Curriculum Quest'}
            </span>
          )}
        </div>

        <div>
          <h4 className="font-sans font-semibold text-sm text-white">
            {displayQuestTitle}
          </h4>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            {nextQuest?.description || nextQuest?.reason || 'Advancing to the next recommended learning activity.'}
          </p>
        </div>
      </div>

      {/* Primary Continue Button */}
      <div className="pt-2">
        <button
          onClick={() => onContinue(targetRoute)}
          className="w-full min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-650 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          id="continue-after-experience-btn"
          aria-label={displayButtonLabel}
        >
          <span>{displayButtonLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

