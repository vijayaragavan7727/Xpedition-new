'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getStoreData, UserStoreData } from '@/lib/store';
import { resolveHomeState, HomeState } from '@/lib/home/homeState';
import {
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  BookOpen,
  Clock,
  Globe,
  TrendingUp,
  Compass,
  CheckCircle2,
  ChevronRight,
  Code2,
  Boxes,
  Activity,
  Heart,
  RotateCw,
  Atom,
  AlertTriangle,
  Award,
  Circle,
} from 'lucide-react';

export default function HomePage() {
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  // Compute Home command center presentation model purely from storeData
  const homeState: HomeState | null = useMemo(() => {
    if (!storeData) return null;
    return resolveHomeState(storeData);
  }, [storeData]);

  // Background lesson pre-fetch for target concept to eliminate cold LLM latency
  useEffect(() => {
    if (!storeData || !homeState) return;
    const conceptId = homeState.mission.conceptId;
    const conceptName = homeState.mission.conceptName;

    if (conceptId && conceptId !== 'default') {
      const cacheKey = `xyra_lesson_${conceptId}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(cacheKey)) {
        fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId,
            conceptName,
            conceptSummary: '',
            language: storeData?.learnerProfile?.language || 'english',
            startingLevel: storeData?.learnerProfile?.startingLevel || 'Complete beginner',
            masteryPercentage: homeState.stats.masteryPercentage || 0,
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
  }, [storeData?.activeGraphId, homeState?.mission.conceptId, homeState?.mission.conceptName, homeState?.stats.masteryPercentage]);

  // Calm skeleton loader
  if (!storeData || !homeState) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans select-none animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-36 bg-white/[0.05] rounded" />
          <div className="h-8 w-72 bg-white/[0.08] rounded-xl" />
          <div className="h-4 w-52 bg-white/[0.04] rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Mission Skeleton */}
          <div className="lg:col-span-7 space-y-6">
            <div className="h-72 w-full rounded-2xl bg-[#141826]/70 border border-white/[0.06] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 bg-white/[0.08] rounded-full" />
                <div className="h-4 w-16 bg-white/[0.06] rounded" />
              </div>
              <div className="h-8 w-3/4 bg-white/[0.08] rounded-lg" />
              <div className="h-4 w-full bg-white/[0.05] rounded" />
              <div className="h-12 w-full bg-indigo-500/20 rounded-xl" />
            </div>
            <div className="h-44 w-full rounded-xl bg-[#141826]/50 border border-white/[0.05] p-5" />
          </div>

          {/* Secondary Skeleton */}
          <div className="lg:col-span-5 space-y-5">
            <div className="h-28 w-full rounded-xl bg-[#141826]/50 border border-white/[0.05] p-4" />
            <div className="h-40 w-full rounded-xl bg-[#141826]/50 border border-white/[0.05] p-4" />
            <div className="h-28 w-full rounded-xl bg-[#141826]/50 border border-white/[0.05] p-4" />
          </div>
        </div>
      </div>
    );
  }

  const {
    greeting,
    contextSubtitle,
    isNewLearner,
    mission,
    stats,
    pathway,
    xiraInsight,
    quickEntry,
  } = homeState;

  // Icon selector helper for experience modality
  const renderExperienceIcon = () => {
    switch (mission.nextQuestTarget.experienceType) {
      case 'CODE_DEBUGGING':
        return <Code2 className="w-5 h-5 text-emerald-300" />;
      case 'PROJECTILE_SIMULATION':
        return <Activity className="w-5 h-5 text-indigo-300" />;
      case 'OBJECT_MANIPULATION':
        return <RotateCw className="w-5 h-5 text-amber-300" />;
      case 'MOLECULE_BUILDER':
        return <Atom className="w-5 h-5 text-cyan-300" />;
      case 'HEART_ANATOMY_EXPLORER':
        return <Heart className="w-5 h-5 text-rose-300" />;
      default:
        return <Zap className="w-5 h-5 text-indigo-300" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-12 font-sans select-none overflow-hidden">
      {/* =========================================================================
          B. GREETING & CONTEXTUAL STATUS (Top Anchor)
          ========================================================================= */}
      <section className="space-y-1.5 pt-1" aria-label="Learner Greeting">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium">
            {greeting}
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        </div>

        <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          {isNewLearner ? 'Your expedition begins here.' : 'What should you do now?'}
        </h1>

        <p className="font-sans text-xs sm:text-sm text-slate-400">
          {contextSubtitle}
        </p>
      </section>

      {/* =========================================================================
          RESPONSIVE GRID:
          Mobile: Stack 1 column in strict priority order.
          Desktop (lg:): Two balanced columns with generous breathing room.
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            LEFT COLUMN (Desktop 7 cols) / Top Section (Mobile):
            Contains Mission (Dominant CTA) and Continue Learning (Pathway)
            ===================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* ===================================================================
              C. PRIMARY MISSION & D. PRIMARY CTA (The Real Command Center Hero)
              =================================================================== */}
          <section aria-label="Today's Mission">
            <div className="relative rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-[#161a2f] via-[#121524] to-[#0c0e18] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] overflow-hidden transition-all">
              {/* Subtle ambient lighting */}
              <div
                className="absolute -top-14 -right-14 w-48 h-48 bg-indigo-500/12 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative space-y-4">
                {/* Mission Header Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/35 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isNewLearner ? 'FIRST EXPEDITION' : "TODAY'S MISSION"}</span>
                    </span>

                    {mission.experienceTypeLabel && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono text-[10px] font-medium text-emerald-300">
                        <span>{mission.experienceTypeLabel}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>~{mission.estimatedMinutes} min</span>
                  </div>
                </div>

                {/* Mission Activity Details */}
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {renderExperienceIcon()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-sans font-bold text-lg sm:text-xl text-white tracking-tight leading-snug break-words">
                        {mission.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-indigo-300 font-semibold">
                          {mission.actionBadge}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="font-sans text-xs text-slate-400 truncate">
                          {mission.conceptName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Reason */}
                  <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed pt-1 pl-0.5">
                    {mission.reason}
                  </p>
                </div>

                {/* Primary CTA (Touch target >= 48px, bold, accessible) */}
                <div className="pt-2">
                  <Link
                    href={mission.route}
                    className="w-full min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-650 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
                    id="home-primary-cta"
                    aria-label={`${mission.buttonLabel}: ${mission.title}`}
                  >
                    <span>{mission.buttonLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              E. PROGRESS SNAPSHOT (Rendered here on mobile to be directly under CTA)
              Hidden on desktop (lg:hidden) because desktop renders it in right column.
              =================================================================== */}
          <div className="block lg:hidden">
            <ProgressSnapshotSection stats={stats} isNewLearner={isNewLearner} />
          </div>

          {/* ===================================================================
              F. CONTINUE LEARNING (Active Learning Pathway & Milestones)
              =================================================================== */}
          <section aria-label="Active Pathway Progression">
            <div className="rounded-xl border border-white/[0.08] bg-[#141826]/90 p-4 sm:p-5 space-y-4 hover:border-white/[0.12] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans font-bold text-sm sm:text-base text-white truncate">
                      {pathway.goalTitle}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-400">
                      {stats.totalCount > 0
                        ? `${stats.masteredCount} of ${stats.totalCount} milestones mastered`
                        : 'Curriculum pathway initialized'}
                    </span>
                  </div>
                </div>

                {stats.totalCount > 0 && (
                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-bold text-indigo-300">
                      {pathway.overallMastery}%
                    </span>
                    <span className="font-sans text-[10px] text-slate-400 block uppercase tracking-wider">
                      Mastery
                    </span>
                  </div>
                )}
              </div>

              {/* Overall Pathway Progress Bar */}
              {stats.totalCount > 0 && (
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, pathway.overallMastery)}%` }}
                  />
                </div>
              )}

              {/* Concept Milestone List (Up to 4 concepts) */}
              {pathway.concepts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {pathway.concepts.map((concept, idx) => (
                    <div
                      key={concept.id}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors ${
                        concept.isCurrent
                          ? 'bg-indigo-600/15 border border-indigo-500/30 text-white'
                          : 'bg-white/[0.02] border border-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {concept.isMastered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : concept.isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                        ) : (
                          <Circle className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        )}
                        <span className="font-sans font-medium truncate">
                          {concept.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {concept.isCurrent && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                            Active
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-400">
                          {concept.mastery}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adaptive sequence active</span>
                </span>

                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none rounded px-2 py-1 transition-colors"
                >
                  <span>View Full Curriculum</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* ===================================================================
              XIRA INSIGHT & QUICK ENTRY (Mobile order)
              Hidden on desktop (lg:hidden) because desktop renders them in right column.
              =================================================================== */}
          <div className="space-y-6 block lg:hidden">
            {xiraInsight && <XiraInsightSection xiraInsight={xiraInsight} />}
            <QuickEntrySection quickEntry={quickEntry} />
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (Desktop 5 cols):
            Contains Progress Snapshot, Xira Insight, and Quick Entry Portals.
            Hidden on mobile (hidden lg:block) to preserve the exact mobile order.
            ===================================================================== */}
        <div className="hidden lg:block lg:col-span-5 space-y-6">
          {/* E. PROGRESS SNAPSHOT (Desktop) */}
          <ProgressSnapshotSection stats={stats} isNewLearner={isNewLearner} />

          {/* G. XIRA INSIGHT (Desktop) */}
          {xiraInsight && <XiraInsightSection xiraInsight={xiraInsight} />}

          {/* H. QUICK ENTRY (Desktop) */}
          <QuickEntrySection quickEntry={quickEntry} />
        </div>
      </div>
    </div>
  );
}

/**
 * Section E: Progress Snapshot
 * Strictly renders real store data for Level, XP, Streak, and Mastery.
 */
function ProgressSnapshotSection({
  stats,
  isNewLearner,
}: {
  stats: HomeState['stats'];
  isNewLearner: boolean;
}) {
  return (
    <section aria-label="Journey Progress Snapshot">
      <div className="rounded-xl border border-white/[0.08] bg-[#141826]/85 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Award className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-300">
              Expedition Metrics
            </h3>
          </div>

          {stats.streak > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{stats.streak} day streak</span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-slate-400">
              0 day streak
            </span>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-0.5">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
            <span className="font-sans text-[10px] text-slate-400 uppercase tracking-wider block">
              Level
            </span>
            <span className="font-sans font-black text-lg text-white">
              {stats.level}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
            <span className="font-sans text-[10px] text-slate-400 uppercase tracking-wider block">
              Total XP
            </span>
            <span className="font-mono font-bold text-lg text-indigo-300">
              {stats.xp.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
            <span className="font-sans text-[10px] text-slate-400 uppercase tracking-wider block">
              Mastery
            </span>
            <span className="font-mono font-bold text-lg text-cyan-300">
              {stats.masteryPercentage}%
            </span>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Level {stats.level} Progress</span>
            <span>{stats.progressToNextLevel} XP to Level {stats.level + 1}</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(2, stats.levelProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Section G: Xira Insight
 * Grounded 100% in actual learner telemetry evidence.
 */
function XiraInsightSection({
  xiraInsight,
}: {
  xiraInsight: HomeState['xiraInsight'];
}) {
  return (
    <section aria-label="Xira Pedagogical Insight">
      <div className="rounded-xl border border-white/[0.08] bg-[#141826]/85 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-white">
              Xira noticed...
            </span>
          </div>

          <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-300 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 font-semibold">
            {xiraInsight.tag}
          </span>
        </div>

        <div className="space-y-1 pt-0.5">
          <p className="font-sans text-xs sm:text-sm font-semibold text-slate-200 leading-snug">
            {xiraInsight.lead}
          </p>
          <p className="font-sans text-xs text-slate-400 leading-relaxed">
            {xiraInsight.body}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex items-center justify-between">
          <Link
            href="/xira"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded px-1.5 py-1"
          >
            Ask Xira
          </Link>

          {xiraInsight.actionRoute && xiraInsight.actionLabel && (
            <Link
              href={xiraInsight.actionRoute}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
            >
              <span>{xiraInsight.actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Section H: Quick Entry
 * Accessible grid of the 4 canonical product destinations.
 */
function QuickEntrySection({
  quickEntry,
}: {
  quickEntry: HomeState['quickEntry'];
}) {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'learn':
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'world':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'xira':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'progress':
        return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      default:
        return <Compass className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <section aria-label="Quick Destinations">
      <div className="grid grid-cols-2 gap-2.5">
        {quickEntry.map((item) => (
          <Link
            key={item.id}
            href={item.route}
            className="min-h-[48px] p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none"
            aria-label={`${item.title} - ${item.subtitle}`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              {getIcon(item.icon)}
            </div>
            <div className="min-w-0">
              <span className="font-sans text-xs font-bold text-white block truncate group-hover:text-indigo-300 transition-colors">
                {item.title}
              </span>
              <span className="font-sans text-[10px] text-slate-400 block truncate">
                {item.subtitle}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
