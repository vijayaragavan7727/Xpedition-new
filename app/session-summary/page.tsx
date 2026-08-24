'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData, FlowState } from '@/lib/store';
import { FeedbackSheet } from '@/components/FeedbackSheet';

export default function SessionSummaryPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return (
      <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4">
        <div className="font-mono text-sm text-muted animate-pulse">Loading session summary...</div>
      </div>
    );
  }

  const recentAttempts = storeData.attempts.slice(-6);
  const totalAnswered = recentAttempts.length;
  const correctCount = recentAttempts.filter((a) => a.isCorrect).length;

  const getStateDescription = (state: FlowState) => {
    switch (state) {
      case 'flow':
        return 'You held the flow band the whole way.';
      case 'frustrated':
        return 'That one was hard. Difficulty is adjusting.';
      case 'bored':
        return 'Too easy. Next session comes in harder.';
      case 'drifting':
        return 'Short refocus run complete. Steady pace restored.';
      default:
        return 'Session completed smoothly.';
    }
  };

  // Group touched concepts from recent session attempts and calculate exact real deltas
  const touchedConceptMap = new Map<string, { conceptName: string; delta: number }>();

  recentAttempts.forEach((att) => {
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

  const conceptSummaries = Array.from(touchedConceptMap.entries()).map(([conceptId, info]) => {
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

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#120E22]/90 border border-line rounded-[20px] p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-signature-gradient p-0.5 mx-auto">
            <div className="w-full h-full rounded-full bg-panel flex items-center justify-center text-cyan font-mono text-2xl font-bold">
              ✓
            </div>
          </div>
          <h1 className="font-sans font-semibold text-2xl text-text">Session complete</h1>
          <p className="font-sans text-xs text-muted">
            {getStateDescription(storeData.flowState)}
          </p>
        </div>

        {/* Core Session Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#150F2A] p-3.5 rounded-[12px] text-center space-y-1">
            <span className="block font-mono text-[9px] uppercase text-muted">ANSWERED</span>
            <span className="block font-mono text-xl font-bold text-text">{totalAnswered}</span>
          </div>

          <div className="bg-[#150F2A] p-3.5 rounded-[12px] text-center space-y-1">
            <span className="block font-mono text-[9px] uppercase text-muted">ACCURACY</span>
            <span className="block font-mono text-xl font-bold text-cyan">
              {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
            </span>
          </div>

          <div className="bg-[#150F2A] p-3.5 rounded-[12px] text-center space-y-1">
            <span className="block font-mono text-[9px] uppercase text-muted">REWARDS</span>
            <span className="block font-mono text-xl font-bold text-violet">
              +{storeData.rewardsCount > 0 ? 1 : 0}
            </span>
          </div>
        </div>

        {/* Concept Mastery Changes */}
        <div className="space-y-2.5 pt-2">
          <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold block px-1">
            CONCEPT MASTERY PROGRESSION
          </span>

          <div className="space-y-2">
            {conceptSummaries.length > 0 ? (
              conceptSummaries.map((summary) => (
                <div key={summary.id} className="bg-[#150F2A] p-3.5 rounded-[12px] flex items-center justify-between text-xs">
                  <span className="font-sans font-medium text-text">{summary.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-muted">{summary.initialMastery}%</span>
                    <span className="text-muted">→</span>
                    <span className="text-cyan font-bold">{summary.finalMastery}%</span>
                    <span className={summary.delta >= 0 ? 'text-success text-[10px] font-bold' : 'text-danger text-[10px] font-bold'}>
                      {summary.delta >= 0 ? `+${summary.delta}%` : `${summary.delta}%`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#150F2A] rounded-[12px] text-center text-xs text-muted font-mono">
                No concept deltas recorded for this session.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/quest"
            className="w-full h-[52px] min-h-[52px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all"
          >
            <span>Another session</span>
            <span>→</span>
          </Link>

          <Link
            href="/home"
            className="w-full h-[46px] min-h-[46px] rounded-[12px] border border-line text-muted hover:text-text font-sans font-medium text-xs flex items-center justify-center transition-all block text-center"
          >
            Back to home
          </Link>
        </div>

      </div>

      {/* Floating Feedback Sheet */}
      <FeedbackSheet />
    </div>
  );
}
