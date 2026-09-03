'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getStoreData, calculateStreak, UserStoreData } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
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

  // Compute XP and Level from verified attempts & mastered concepts
  const { level, xp, progressToNextLevel, levelProgressPercent } = useMemo(() => {
    if (!storeData) return { level: 1, xp: 0, progressToNextLevel: 300, levelProgressPercent: 0 };
    const correctCount = (storeData.attempts || []).filter((a) => a.isCorrect && !a.isVoid).length;
    const totalAttempts = (storeData.attempts || []).filter((a) => !a.isVoid).length;
    const masteredCount = (storeData.concepts || []).filter(
      (c) => (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0) >= 80
    ).length;

    const totalXp = correctCount * 25 + totalAttempts * 10 + masteredCount * 100;
    const lvl = Math.floor(totalXp / 300) + 1;
    const xpInLevel = totalXp % 300;
    const pct = Math.min(100, Math.round((xpInLevel / 300) * 100));

    return {
      level: lvl,
      xp: totalXp,
      progressToNextLevel: 300 - xpInLevel,
      levelProgressPercent: pct,
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

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading your progress...</span>
      </div>
    );
  }

  const goalTitle =
    storeData.goalText ||
    (storeData.concepts && storeData.concepts.length > 0
      ? 'Your Learning Journey'
      : 'Your Learning Path');
  const concepts = storeData.concepts || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14 font-sans select-none">
      {/* =========================================================================
          1. PAGE HEADER (Clean, Calm, Concise)
          ========================================================================= */}
      <div className="space-y-1 border-b border-white/[0.06] pb-4">
        <h1 className="font-sans font-bold text-2xl text-white">Progress</h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          See how far you have come.
        </p>
      </div>

      {/* =========================================================================
          2. JOURNEY SUMMARY (Primary Metric Cards)
          ========================================================================= */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Level & XP Card */}
          <Card variant="default" className="p-4 border-white/[0.07] bg-[#141826]/90 space-y-2 col-span-2 sm:col-span-1">
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
              <div className="font-mono text-xs text-slate-400">
                {xp} Total XP
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <ProgressBar value={levelProgressPercent} max={100} variant="indigo" size="sm" />
              <div className="font-mono text-[10px] text-slate-500 text-right">
                {progressToNextLevel} XP to Level {level + 1}
              </div>
            </div>
          </Card>

          {/* Learning Streak */}
          <Card variant="default" className="p-4 border-white/[0.07] bg-[#141826]/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Learning Streak
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="font-sans font-bold text-xl text-white">
                {streak} {streak === 1 ? 'day' : 'days'}
              </div>
              <p className="font-sans text-xs text-slate-400">
                {streak > 0 ? 'Consistency unlocked' : 'Start practicing today'}
              </p>
            </div>
          </Card>

          {/* Journey Mastery */}
          <Card variant="default" className="p-4 border-white/[0.07] bg-[#141826]/90 space-y-2">
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
                {masteredCount} of {totalCount} concepts mastered
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          3. MASTERY / SKILLS (Main Section Organized Under Parent Goal)
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Skills in {goalTitle}
            </h2>
            <p className="font-sans text-xs text-slate-400">
              Your concept mastery and competency development
            </p>
          </div>
          <Badge variant="cyan" size="sm" className="font-mono text-[11px]">
            {masteredCount}/{totalCount} Mastered
          </Badge>
        </div>

        <Card variant="default" className="p-4 sm:p-5 border-white/[0.07] bg-[#141826]/90 space-y-4">
          {/* Overall Goal Progress Bar */}
          <div className="space-y-1.5 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-bold text-white flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Overall Journey Progress
              </span>
              <span className="font-mono font-bold text-cyan-300">{overallPercent}%</span>
            </div>
            <ProgressBar value={overallPercent} max={100} variant="cyan" size="md" />
          </div>

          {/* Vertical List of Concepts */}
          <div className="divide-y divide-white/[0.04]">
            {concepts.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No concept mastery data recorded yet. Complete an adaptive quest to begin.
              </p>
            ) : (
              concepts.map((concept, idx) => {
                const mastery =
                  concept.thetaSolo !== undefined
                    ? thetaToPercent(concept.thetaSolo)
                    : concept.masteryPercentage || 0;

                const isMastered = mastery >= 80;
                const isStrong = mastery >= 50 && mastery < 80;
                const isDeveloping = mastery >= 25 && mastery < 50;

                const statusLabel = isMastered
                  ? 'Mastered'
                  : isStrong
                  ? 'Strong'
                  : isDeveloping
                  ? 'Developing'
                  : 'Learning';

                return (
                  <div
                    key={concept.id || idx}
                    className="py-3.5 flex items-center justify-between gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={
                          isMastered
                            ? 'w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                            : 'w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 bg-white/[0.04] border border-white/[0.07] text-slate-400'
                        }
                      >
                        {isMastered ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-semibold text-xs sm:text-sm text-white truncate">
                            {concept.name}
                          </span>
                          <Badge
                            variant={isMastered ? 'cyan' : isStrong ? 'indigo' : 'default'}
                            size="sm"
                            className="text-[9px] py-0 px-1.5"
                          >
                            {statusLabel}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 max-w-[180px]">
                            <ProgressBar
                              value={mastery}
                              max={100}
                              variant={isMastered ? 'cyan' : 'indigo'}
                              size="sm"
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {mastery}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>

      {/* =========================================================================
          4. PASSPORT & VERIFICATION (Reflective Deep Dive)
          ========================================================================= */}
      <section className="space-y-2.5">
        <h2 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Credential & Verification
        </h2>

        <Card variant="default" className="p-4 sm:p-5 border-white/[0.07] bg-[#141826]/90 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-sans font-bold text-sm text-white truncate">
                Verified Skill Passport
              </h3>
              <p className="font-sans text-xs text-slate-400">
                View cryptographic proofs, calibration accuracy, and shareable credential.
              </p>
            </div>
          </div>

          <Link href="/passport" className="shrink-0">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Passport
            </Button>
          </Link>
        </Card>
      </section>

      {/* =========================================================================
          5 & 6. ACHIEVEMENTS & ACTIVITY HISTORY (Secondary Access Rows)
          ========================================================================= */}
      <section className="space-y-2.5">
        <h2 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Journey Records
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Achievements Preview */}
          <Link href="/passport" className="block group">
            <Card variant="default" className="p-4 border-white/[0.07] hover:border-amber-400/30 bg-[#141826]/80 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="font-sans font-bold text-xs text-white">Milestones</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition-colors" />
              </div>
              <p className="font-sans text-xs text-slate-400">
                {masteredCount > 0 ? `${masteredCount} mastery milestones achieved` : 'Earn milestones as you master concepts'}
              </p>
            </Card>
          </Link>

          {/* Activity History */}
          <Link href="/history" className="block group">
            <Card variant="default" className="p-4 border-white/[0.07] hover:border-indigo-400/30 bg-[#141826]/80 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span className="font-sans font-bold text-xs text-white">Activity History</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 transition-colors" />
              </div>
              <p className="font-sans text-xs text-slate-400">
                {(storeData.attempts || []).length} past learning attempts logged
              </p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
