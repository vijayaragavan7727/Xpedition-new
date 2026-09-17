'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getStoreData,
  selectNextTarget,
  UserStoreData,
  FlowState,
} from '@/lib/store';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { calibrationScore, confidenceBreakdown, blindSpots } from '@/lib/engine/calibration';
import { thetaToPercent } from '@/lib/engine/mastery';
import { downloadNotesPdf, downloadFlashcardsPdf } from '@/lib/pdf';
import {
  mapStoreToLearnerState,
  defaultDecisionEngine,
} from '@/lib/intelligence';
import { resolveNextExperience } from '@/lib/experience/nextExperienceResolver';
import { resolveNextQuest } from '@/lib/experience/nextQuestResolver';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Zap,
  Flame,
  Award,
  BookOpen,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';

export default function SessionSummaryPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  // Compute session metrics and next quest
  const { sessionXp, recentAttempts, totalAnswered, correctCount, conceptSummaries, nextQuest } = useMemo(() => {
    if (!storeData) {
      return {
        sessionXp: 0,
        recentAttempts: [],
        totalAnswered: 0,
        correctCount: 0,
        conceptSummaries: [],
        nextQuest: null,
      };
    }

    const attempts = (storeData.attempts || []).filter((a) => !a.isVoid);
    const recent = attempts.slice(-6);
    const correct = recent.filter((a) => a.isCorrect).length;
    const answered = recent.length;
    const xp = correct * 25 + answered * 10;

    // Track concept mastery deltas
    const touchedConceptMap = new Map<string, { conceptName: string; delta: number }>();
    recent.forEach((att) => {
      const existing = touchedConceptMap.get(att.conceptId) || {
        conceptName: att.conceptName,
        delta: 0,
      };
      const attemptDelta = att.isCorrect ? 8 : -3;
      touchedConceptMap.set(att.conceptId, {
        conceptName: att.conceptName,
        delta: existing.delta + attemptDelta,
      });
    });

    const summaries = Array.from(touchedConceptMap.entries()).map(([conceptId, info]) => {
      const conceptObj = storeData.concepts.find((c) => c.id === conceptId);
      const finalMastery = conceptObj ? conceptObj.masteryPercentage : 50;
      const initialMastery = Math.min(100, Math.max(0, finalMastery - info.delta));
      return {
        id: conceptId,
        name: info.conceptName,
        initialMastery,
        finalMastery,
        delta: info.delta,
      };
    });

    // Resolve Canonical Next Quest
    const target = selectNextTarget(storeData);
    const learnerState = mapStoreToLearnerState(storeData, target?.conceptId);
    const nextAction = defaultDecisionEngine.decideNextAction(learnerState);
    const resolvedExp = resolveNextExperience(nextAction.action, nextAction.targetConceptId, learnerState);
    const quest = resolveNextQuest({
      action: nextAction.action,
      conceptId: nextAction.targetConceptId,
      learnerState,
      resolvedExperience: resolvedExp,
    });

    return {
      sessionXp: xp,
      recentAttempts: recent,
      totalAnswered: answered,
      correctCount: correct,
      conceptSummaries: summaries,
      nextQuest: quest,
    };
  }, [storeData]);

  if (!storeData) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0D14] text-white flex items-center justify-center p-4">
        <div className="font-mono text-sm text-slate-400 animate-pulse">
          Loading session summary...
        </div>
      </div>
    );
  }

  const getStateDescription = (state: FlowState) => {
    switch (state) {
      case 'flow':
        return 'You maintained strong focus and held the optimal flow band.';
      case 'frustrated':
        return 'Challenging session. The difficulty is recalibrating to support your pace.';
      case 'bored':
        return 'High accuracy detected. Advanced challenges will be unlocked next.';
      case 'drifting':
        return 'Refocus drill completed. Steady learning rhythm restored.';
      default:
        return 'Learning session completed successfully.';
    }
  };

  const breakdown = confidenceBreakdown(storeData.attempts);
  const score = calibrationScore(storeData.attempts);
  const detectedBlindSpots = blindSpots(storeData.attempts, storeData.concepts);

  return (
    <div className="min-h-[100dvh] bg-[#0B0D14] text-white flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#141826]/95 border border-white/[0.08] rounded-2xl p-6 sm:p-8 backdrop-blur-2xl relative z-10 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 p-1 mx-auto flex items-center justify-center text-emerald-400 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight">
            Session Complete
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {getStateDescription(storeData.flowState)}
          </p>

          {/* XP Reward Banner */}
          {sessionXp > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs font-bold text-emerald-300 animate-pulse mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{sessionXp} XP EARNED</span>
            </div>
          )}
        </div>

        {/* Core Session Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl text-center space-y-0.5">
            <span className="block font-mono text-[9px] uppercase text-slate-400 tracking-wider">
              ANSWERED
            </span>
            <span className="block font-sans text-lg font-bold text-white">
              {totalAnswered}
            </span>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl text-center space-y-0.5">
            <span className="block font-mono text-[9px] uppercase text-slate-400 tracking-wider">
              CORRECT
            </span>
            <span className="block font-sans text-lg font-bold text-emerald-400">
              {correctCount}
            </span>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl text-center space-y-0.5">
            <span className="block font-mono text-[9px] uppercase text-slate-400 tracking-wider">
              ACCURACY
            </span>
            <span className="block font-mono text-lg font-bold text-indigo-300">
              {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Concept Mastery Shifts */}
        {conceptSummaries.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider block px-0.5">
              MASTERY DELTAS
            </span>
            <div className="space-y-2">
              {conceptSummaries.map((cs) => (
                <div
                  key={cs.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <span className="font-sans font-semibold text-xs text-white block truncate">
                      {cs.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block">
                      {cs.initialMastery}% &rarr; {cs.finalMastery}%
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      cs.delta > 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : cs.delta < 0
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-white/[0.05] text-slate-400'
                    }`}
                  >
                    {cs.delta > 0 ? `+${cs.delta}%` : `${cs.delta}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Calibration */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider block px-0.5">
            CALIBRATION & CONFIDENCE
          </span>
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="bg-white/[0.02] p-2 rounded-lg border border-emerald-500/20">
              <span className="block text-[8px] text-slate-400 uppercase">SOLID</span>
              <span className="block text-sm font-bold text-emerald-400">{breakdown.solid}</span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-lg border border-cyan-500/20">
              <span className="block text-[8px] text-slate-400 uppercase">HONEST</span>
              <span className="block text-sm font-bold text-cyan-400">{breakdown.honestGap}</span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-lg border border-indigo-500/20">
              <span className="block text-[8px] text-slate-400 uppercase">FRAGILE</span>
              <span className="block text-sm font-bold text-indigo-300">{breakdown.fragile}</span>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-lg border border-amber-500/20">
              <span className="block text-[8px] text-amber-300 uppercase font-bold">BLIND SPOT</span>
              <span className="block text-sm font-bold text-amber-400">{breakdown.blindSpot}</span>
            </div>
          </div>
        </div>

        {/* Primary Next Quest & Home Actions */}
        <div className="space-y-2.5 pt-2">
          {nextQuest && (
            <Link
              href={nextQuest.route}
              className="w-full min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-650 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span>{nextQuest.buttonLabel || 'Continue Next Quest'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/home"
            className="w-full min-h-[44px] px-4 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-slate-300 hover:text-white font-sans font-semibold text-xs sm:text-sm flex items-center justify-center transition-all"
          >
            <span>Return to Command Center</span>
          </Link>
        </div>
      </div>

      <FeedbackSheet />
    </div>
  );
}
