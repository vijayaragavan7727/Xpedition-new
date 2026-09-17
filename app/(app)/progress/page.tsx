'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getStoreData,
  calculateStreak,
  UserStoreData,
  ConceptMastery,
} from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { calibrationScore, confidenceBreakdown } from '@/lib/engine/calibration';
import {
  Sparkles,
  Award,
  Zap,
  Flame,
  ArrowRight,
  ShieldCheck,
  History,
  CheckCircle2,
  TrendingUp,
  Compass,
  Layers,
  Star,
  Clock,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Shield,
  Brain,
} from 'lucide-react';

export default function ProgressPage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const streak = useMemo(
    () => (storeData ? calculateStreak(storeData.attempts) : 0),
    [storeData]
  );

  // Compute XP and Level strictly from verified attempts & mastered concepts
  const { level, xp, progressToNextLevel, levelProgressPercent, totalAttempts, correctCount } = useMemo(() => {
    if (!storeData) {
      return { level: 1, xp: 0, progressToNextLevel: 300, levelProgressPercent: 0, totalAttempts: 0, correctCount: 0 };
    }
    const correct = (storeData.attempts || []).filter((a) => a.isCorrect && !a.isVoid).length;
    const total = (storeData.attempts || []).filter((a) => !a.isVoid).length;
    const mastered = (storeData.concepts || []).filter(
      (c) => (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0) >= 80
    ).length;

    const totalXp = correct * 25 + total * 10 + mastered * 100;
    const lvl = Math.floor(totalXp / 300) + 1;
    const xpInLevel = totalXp % 300;
    const pct = Math.min(100, Math.round((xpInLevel / 300) * 100));

    return {
      level: lvl,
      xp: totalXp,
      progressToNextLevel: 300 - xpInLevel,
      levelProgressPercent: pct,
      totalAttempts: total,
      correctCount: correct,
    };
  }, [storeData]);

  // Overall Goal/Branch Progress derived directly from existing concept mastery state
  const { overallPercent, masteredCount, totalCount } = useMemo(() => {
    if (!storeData || !storeData.concepts || storeData.concepts.length === 0) {
      return { overallPercent: 0, masteredCount: 0, totalCount: 0 };
    }
    const concepts = storeData.concepts;
    const mastered = concepts.filter(
      (c) => (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0) >= 80
    ).length;
    const total = Math.round(
      concepts.reduce(
        (acc, c) => acc + (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0),
        0
      ) / concepts.length
    );
    return {
      overallPercent: total,
      masteredCount: mastered,
      totalCount: concepts.length,
    };
  }, [storeData]);

  // Retention & Spaced Review Queue
  const { fadingConcepts, freshConceptsCount } = useMemo(() => {
    if (!storeData || !storeData.concepts) return { fadingConcepts: [], freshConceptsCount: 0 };
    const fading = storeData.concepts
      .filter((c) => (c.retentionRisk || 0) > 0.35)
      .sort((a, b) => (b.retentionRisk || 0) - (a.retentionRisk || 0));
    return {
      fadingConcepts: fading,
      freshConceptsCount: storeData.concepts.length - fading.length,
    };
  }, [storeData]);

  // Solo verification and calibration stats
  const { soloSessionsCount, avgSoloMastery, avgAssistedMastery, calibrationMetric } = useMemo(() => {
    if (!storeData) {
      return { soloSessionsCount: 0, avgSoloMastery: 0, avgAssistedMastery: 0, calibrationMetric: null };
    }
    const soloAttempts = (storeData.attempts || []).filter((a) => a.isSolo && !a.isVoid).length;
    const sessions = Math.floor(soloAttempts / 6);

    const totalC = storeData.concepts.length;
    const solo = totalC > 0
      ? Math.round(
          storeData.concepts.reduce(
            (acc, c) => acc + (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0),
            0
          ) / totalC
        )
      : 0;

    const assisted = totalC > 0
      ? Math.round(
          storeData.concepts.reduce(
            (acc, c) => acc + (c.thetaAssisted !== undefined ? thetaToPercent(c.thetaAssisted) : c.masteryPercentage || 0),
            0
          ) / totalC
        )
      : 0;

    const calScore = calibrationScore(storeData.attempts || []);

    return {
      soloSessionsCount: sessions,
      avgSoloMastery: solo,
      avgAssistedMastery: assisted,
      calibrationMetric: calScore,
    };
  }, [storeData]);

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading your progress & retention telemetry...</span>
      </div>
    );
  }

  const goalTitle = storeData.goalText || 'Learning Pathway';
  const concepts = storeData.concepts || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24 font-sans select-none overflow-hidden">
      {/* =========================================================================
          1. PAGE HEADER
          ========================================================================= */}
      <section className="space-y-1 pt-1">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium">
          Learner Analytics & Retention
        </span>
        <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Progress & Mastery
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          Tracking your competency, memory retention, and solo verified mastery in <span className="text-slate-200 font-medium">{goalTitle}</span>.
        </p>
      </section>

      {/* =========================================================================
          2. CORE METRICS SNAPSHOT
          ========================================================================= */}
      <section aria-label="Core Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Level & XP */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141826]/90 space-y-2 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Current Level
              </span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="font-sans font-bold text-xl text-white">
                Level {level}
              </div>
              <div className="font-mono text-xs text-indigo-300 font-semibold">
                {xp.toLocaleString()} XP
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, levelProgressPercent)}%` }}
                />
              </div>
              <div className="font-mono text-[10px] text-slate-500 text-right">
                {progressToNextLevel} XP to Level {level + 1}
              </div>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141826]/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Streak
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="font-sans font-bold text-xl text-white">
                {streak} {streak === 1 ? 'day' : 'days'}
              </div>
              <p className="font-sans text-xs text-slate-400">
                {streak > 0 ? 'Consistent practice' : 'Start your streak'}
              </p>
            </div>
          </div>

          {/* Overall Mastery */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141826]/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                Total Mastery
              </span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="font-sans font-bold text-xl text-white">
                {overallPercent}%
              </div>
              <p className="font-sans text-xs text-slate-400">
                {masteredCount} of {totalCount} concepts
              </p>
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-[#141826]/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Accuracy
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-sans font-bold text-xl text-white">
                {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0}%
              </div>
              <p className="font-sans text-xs text-slate-400">
                {totalAttempts} total attempts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SPACED REVISION & MEMORY RETENTION QUEUE (The Real Revision Experience)
          ========================================================================= */}
      <section className="space-y-3" aria-label="Spaced Revision Queue">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
              Spaced Revision Queue
            </h2>
          </div>

          <span className="font-mono text-xs text-slate-400">
            {fadingConcepts.length > 0 ? `${fadingConcepts.length} concepts due` : 'All skills fresh'}
          </span>
        </div>

        {fadingConcepts.length === 0 ? (
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#141826]/80 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-sans font-bold text-sm text-white">
                Memory Retention Strong
              </h3>
              <p className="font-sans text-xs text-slate-400">
                All {totalCount} concepts in your active pathway have fresh retention telemetry. No memory decay detected.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {fadingConcepts.map((concept) => {
              const riskPct = Math.round((concept.retentionRisk || 0) * 100);
              const isHighPriority = (concept.retentionRisk || 0) >= 0.5;

              return (
                <div
                  key={concept.id}
                  className="p-4 rounded-xl border border-amber-500/30 bg-[#141826]/95 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-sm text-white truncate">
                        {concept.name}
                      </span>
                      <span
                        className={`font-mono text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          isHighPriority
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                        }`}
                      >
                        {isHighPriority ? 'High Decay Risk' : 'Review Priority'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span className="text-amber-300 font-semibold">{riskPct}% Retention Decay Risk</span>
                      <span>•</span>
                      <span>Mastery: {concept.masteryPercentage}%</span>
                    </div>
                  </div>

                  <Link
                    href={`/quest?concept=${encodeURIComponent(concept.id)}&mode=review`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <span>Start Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          4. CONCEPT MASTERY BREAKDOWN
          ========================================================================= */}
      <section className="space-y-3" aria-label="Concept Competency Breakdown">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Concept Mastery in {goalTitle}
            </h2>
            <p className="font-sans text-xs text-slate-400">
              Verified competency across individual learning milestones
            </p>
          </div>
          <span className="font-mono text-xs text-cyan-300 font-semibold">
            {masteredCount}/{totalCount} Mastered
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#141826]/90 p-4 sm:p-5 space-y-4">
          <div className="divide-y divide-white/[0.04]">
            {concepts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No concepts initialized yet. Complete calibration or onboarding to begin.
              </p>
            ) : (
              concepts.map((concept, idx) => {
                const mastery =
                  concept.thetaSolo !== undefined
                    ? thetaToPercent(concept.thetaSolo)
                    : concept.masteryPercentage || 0;
                const isMastered = mastery >= 80;
                const isStrong = mastery >= 50 && mastery < 80;

                return (
                  <div
                    key={concept.id || idx}
                    className="py-3.5 flex items-center justify-between gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          isMastered
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                        }`}
                      >
                        {isMastered ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : idx + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/learn/${encodeURIComponent(concept.id)}`}
                            className="font-sans font-semibold text-xs sm:text-sm text-white hover:text-indigo-300 transition-colors truncate"
                          >
                            {concept.name}
                          </Link>
                          <span
                            className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              isMastered
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : isStrong
                                ? 'bg-indigo-500/15 text-indigo-300'
                                : 'bg-white/[0.05] text-slate-400'
                            }`}
                          >
                            {isMastered ? 'Mastered' : isStrong ? 'Strong' : 'Developing'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 max-w-xs">
                          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isMastered ? 'bg-emerald-400' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.max(3, mastery)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{mastery}%</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/learn/${encodeURIComponent(concept.id)}`}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 hover:text-white font-sans text-xs transition-colors shrink-0"
                    >
                      Hub &rarr;
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PASSPORT & VERIFICATION ACCESS
          ========================================================================= */}
      <section className="space-y-2.5">
        <h2 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Verified Credentials
        </h2>

        <div className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#141826]/90 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-sans font-bold text-sm text-white truncate">
                Verified Skill Passport
              </h3>
              <p className="font-sans text-xs text-slate-400">
                {soloSessionsCount} verified solo sessions • Calibration confidence breakdown • Shareable credential.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/history"
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white font-sans text-xs font-semibold transition-colors"
            >
              Activity Logs
            </Link>
            <Link
              href="/passport"
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-sans text-xs font-bold transition-all shadow-md"
            >
              View Passport &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
