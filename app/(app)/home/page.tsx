'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, calculateStreak, selectNextTarget, UserStoreData } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import {
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const streak = useMemo(() => (storeData ? calculateStreak(storeData.attempts) : 0), [storeData]);
  const target = useMemo(() => (storeData ? selectNextTarget(storeData) : null), [storeData]);

  // Background lesson pre-fetch for the target concept to eliminate cold LLM latency
  useEffect(() => {
    if (storeData && target?.conceptId && target.conceptId !== 'default') {
      const cacheKey = `xyra_lesson_${target.conceptId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(cacheKey)) {
        fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId: target.conceptId,
            conceptName: target.conceptName,
            conceptSummary: '',
            language: storeData?.learnerProfile?.language || 'english',
            startingLevel: storeData?.learnerProfile?.startingLevel || 'Complete beginner',
            masteryPercentage: target.masteryPercentage || 0,
            isQuickLearn: false,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.chunks && typeof window !== 'undefined') {
              sessionStorage.setItem(cacheKey, JSON.stringify(data));
            }
          })
          .catch(() => {});
      }
    }
  }, [storeData?.activeGraphId, target?.conceptId]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute clean Level & XP metrics
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
  const goalProgress = useMemo(() => {
    if (!storeData || !storeData.concepts || storeData.concepts.length === 0) {
      return { overallPercent: 0, masteredCount: 0, totalCount: 0 };
    }
    const concepts = storeData.concepts;
    const masteredCount = concepts.filter(
      (c) => (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0) >= 80
    ).length;
    const totalPercent = Math.round(
      concepts.reduce(
        (acc, c) => acc + (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0),
        0
      ) / concepts.length
    );
    return {
      overallPercent: totalPercent,
      masteredCount,
      totalCount: concepts.length,
    };
  }, [storeData]);

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading your learning path...</span>
      </div>
    );
  }

  // Friendly contextual reason for recommendation
  const recommendationReason = target?.inProgress
    ? 'Resume your adaptive quest in progress'
    : target?.hasAttempts && (target?.masteryPercentage || 0) < 50
    ? 'Reinforce fundamentals to build confidence'
    : target?.hasAttempts
    ? 'Solidify and level up your mastery'
    : 'Next foundational milestone in your learning path';

  const goalTitle = storeData.goalText || 'Your Learning Journey';
  const learnerName = storeData.handle || 'Explorer';

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16 font-sans select-none">
      {/* =========================================================================
          1. HEADER / GREETING
          ========================================================================= */}
      <section className="space-y-1 pt-1">
        <h1 className="font-sans font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
          <span>{greeting}, {learnerName}</span>
          <span className="text-xl">👋</span>
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          Your journey toward mastering <span className="text-cyan-300 font-medium">{goalTitle}</span>
        </p>
      </section>

      {/* =========================================================================
          2. YOUR NEXT BEST MOVE (The Dominant Primary Action)
          ========================================================================= */}
      <section>
        <Card
          variant="highlight"
          className="p-5 sm:p-6 space-y-4 border-indigo-500/40 bg-gradient-to-br from-[#121528] to-[#0A0D18] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          {/* Top Meta Line */}
          <div className="flex items-center justify-between">
            <Badge variant="cyan" size="sm" className="font-mono tracking-wider">
              YOUR NEXT BEST MOVE
            </Badge>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>~10 min</span>
            </div>
          </div>

          {/* Activity Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-sm">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-sans font-bold text-lg sm:text-xl text-white truncate">
                  {target?.conceptName || 'Foundational Principles'}
                </h2>
                <span className="font-mono text-xs text-indigo-300 font-medium">
                  Adaptive Quest
                </span>
              </div>
            </div>

            {/* Contextual Reason */}
            <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {recommendationReason}
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="pt-1">
            <Link href="/quest" className="block w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold shadow-lg shadow-indigo-600/30"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Quest
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* =========================================================================
          3. JOURNEY PROGRESS (Compact Single Strip)
          ========================================================================= */}
      <section>
        <Card variant="default" className="p-4 sm:p-5 space-y-2.5 bg-[#141826]/90 border-white/[0.07]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-sans font-bold text-white">
              <span className="text-cyan-300">Level {level}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-mono text-[11px]">{xp.toLocaleString()} XP</span>
            </div>

            {streak > 0 ? (
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{streak} day streak</span>
              </div>
            ) : (
              <span className="font-mono text-[10px] text-slate-400">
                {progressToNextLevel} XP to Level {level + 1}
              </span>
            )}
          </div>

          <ProgressBar value={levelProgressPercent} max={100} variant="cyan" size="sm" />
        </Card>
      </section>

      {/* =========================================================================
          4. CONTINUE LEARNING (Parent Goal / Journey Level Card)
          ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Learning Journey
          </h3>
          <Link href="/learn" className="font-mono text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
            <span>Explore Curriculum</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <Card
          variant="default"
          className="p-5 space-y-4 bg-[#141826]/90 border-white/[0.07] hover:border-white/[0.14] transition-all"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm sm:text-base text-white">
                    Continue {goalTitle}
                  </h4>
                  <span className="font-mono text-[10px] text-slate-400">
                    {goalProgress.masteredCount} of {goalProgress.totalCount} milestones mastered
                  </span>
                </div>
              </div>

              {goalProgress.totalCount > 0 && (
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-cyan-300">
                    {goalProgress.overallPercent}%
                  </span>
                  <span className="font-sans text-[10px] text-slate-400 block">Overall Mastery</span>
                </div>
              )}
            </div>

            <p className="font-sans text-xs text-slate-300 leading-relaxed pt-1">
              Continue your {goalTitle} journey. Keep building your skills through adaptive practice and real-time concept reinforcement.
            </p>

            {goalProgress.totalCount > 0 && (
              <div className="pt-1">
                <ProgressBar
                  value={goalProgress.overallPercent}
                  max={100}
                  variant={goalProgress.overallPercent >= 80 ? 'cyan' : 'indigo'}
                  size="sm"
                />
              </div>
            )}
          </div>

          <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Adaptive pathway ready</span>
            </span>

            <Link href="/learn">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Continue Journey
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* =========================================================================
          5. XIRA CONTEXTUAL ENTRY (Secondary Helper)
          ========================================================================= */}
      <section>
        <Card variant="default" className="p-4 sm:p-5 border-white/[0.07] bg-[#141826]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-sans font-bold text-xs sm:text-sm text-white">Need help?</h4>
              <p className="font-sans text-[11px] text-slate-400 truncate">
                Ask XIRA anything about what you&apos;re learning.
              </p>
            </div>
          </div>

          <Link href="/xira" className="shrink-0">
            <Button variant="secondary" size="sm">
              Ask XIRA
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
