'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getStoreData,
  selectNextTarget,
  switchActiveGraph,
  UserStoreData,
  SkillGraph,
  ConceptMastery,
} from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import {
  getNextAdaptiveAction,
  getActionRoute,
  formatActionTitle,
  getActionCtaLabel,
  ACTION_CATALOG,
} from '@/lib/intelligence';
import { experienceRegistry } from '@/lib/experience';
import {
  BookOpen,
  Zap,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Play,
  HelpCircle,
  Compass,
  Layers,
  Award,
  Lock,
  ChevronRight,
  Code2,
  Activity,
  RotateCw,
  Atom,
  Heart,
  Plus,
  Flame,
  Check,
} from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const activeGraph = useMemo(() => {
    if (!storeData) return null;
    return (
      storeData.graphs?.find((g) => g.id === storeData.activeGraphId) ||
      storeData.graphs?.[0] ||
      null
    );
  }, [storeData]);

  const target = useMemo(() => (storeData ? selectNextTarget(storeData) : null), [storeData]);
  const nextAction = useMemo(() => (storeData ? getNextAdaptiveAction(storeData) : null), [storeData]);
  const concepts: ConceptMastery[] = useMemo(() => activeGraph?.concepts || storeData?.concepts || [], [activeGraph, storeData]);

  // Handle switching active subject/pathway
  const handleSwitchSubject = (graphId: string) => {
    switchActiveGraph(graphId);
    setStoreData(getStoreData());
  };

  // Derive aggregate journey progress directly from existing concept mastery state
  const goalProgress = useMemo(() => {
    if (!concepts || concepts.length === 0) {
      return { overallPercent: 0, masteredCount: 0, totalCount: 0 };
    }
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
  }, [concepts]);

  // Experience icon resolver
  const getExperienceBadge = (conceptId: string) => {
    if (!experienceRegistry.hasExperience(conceptId)) return null;
    switch (conceptId) {
      case 'python_debugging_basics':
        return { label: 'Interactive Code Lab', icon: Code2, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      case 'human_heart_anatomy':
        return { label: '3D Anatomy Explorer', icon: Heart, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
      case 'spatial_reasoning':
        return { label: '3D Spatial Lab', icon: RotateCw, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'projectile_motion':
        return { label: 'Physics Simulation', icon: Activity, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' };
      case 'molecular_bonding':
        return { label: '3D Molecule Builder', icon: Atom, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
      default:
        return { label: 'Hands-On Lab', icon: Zap, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' };
    }
  };

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading curriculum knowledge map...</span>
      </div>
    );
  }

  const goalTitle = activeGraph?.goalText || storeData.goalText || 'Learning Pathway';
  const actionRoute = getActionRoute(nextAction, '/quest');
  const ctaLabel = getActionCtaLabel(nextAction) || 'Continue Quest';

  // Empty State Fallback
  if (concepts.length === 0) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 font-sans select-none text-center">
        <div className="p-8 rounded-2xl bg-[#141826]/90 border border-white/[0.08] space-y-4 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-xl text-white">Your Curriculum Begins Here</h2>
          <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Configure your learning pathway to unlock your interactive skill map, hands-on 3D labs, and adaptive quests.
          </p>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md"
            >
              <span>Initialize Pathway &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24 font-sans select-none overflow-hidden">
      {/* =========================================================================
          1. HEADER & SUBJECT SWITCHER
          ========================================================================= */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-medium">
              Curriculum & Knowledge Map
            </span>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {goalTitle}
            </h1>
          </div>

          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
            title="Start an additional subject pathway"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </Link>
        </div>

        {/* Subject Pills (if multiple pathways exist) */}
        {storeData.graphs && storeData.graphs.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Available Subjects">
            {storeData.graphs.map((g) => {
              const isActive = g.id === (activeGraph?.id || storeData.activeGraphId);
              return (
                <button
                  key={g.id}
                  onClick={() => handleSwitchSubject(g.id)}
                  className={`px-3 py-1.5 rounded-xl font-sans text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                      : 'bg-[#141826]/80 text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{g.goalText}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          UNIVERSAL TEACHING ENGINE BANNER
          ========================================================================= */}
      <section aria-label="Universal Teaching Engine">
        <Link
          href="/teach"
          className="group block rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 p-4 sm:p-5 shadow-lg shadow-cyan-950/20 hover:border-cyan-400/60 transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                    Teach Me Anything — Universal 3D Lab
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Type any topic (Newton’s Laws, Photosynthesis, Circuits, Fractions...) and launch an interactive 3D learning world.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
              <span>EXPLORE TOPIC</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      </section>

      {/* =========================================================================
          2. SUBJECT PROGRESS OVERVIEW (Hero Card)
          ========================================================================= */}
      <section aria-label="Subject Progression Overview">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#161a2f] via-[#121524] to-[#0c0e18] p-5 sm:p-6 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/35 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>ACTIVE CURRICULUM</span>
            </span>

            <span className="font-mono text-sm font-bold text-indigo-300">
              {goalProgress.overallPercent}% Overall Mastery
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="font-sans font-bold text-base sm:text-lg text-white truncate">
                {goalTitle}
              </h2>
              <p className="font-sans text-xs text-slate-300">
                {goalProgress.masteredCount} of {goalProgress.totalCount} core concepts mastered.
              </p>
            </div>

            <Link
              href={actionRoute}
              className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, goalProgress.overallPercent)}%` }}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SUBJECT KNOWLEDGE MAP & CONCEPTS
          ========================================================================= */}
      <section className="space-y-3" aria-label="Curriculum Concepts">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Concepts & Milestones
            </h3>
            <span className="font-sans text-[11px] text-slate-400">
              Select any concept to enter its hub or launch quests
            </span>
          </div>

          <span className="font-mono text-xs text-indigo-300 font-semibold">
            {goalProgress.masteredCount}/{goalProgress.totalCount} Mastered
          </span>
        </div>

        <div className="space-y-2.5">
          {concepts.map((concept, index) => {
            const mastery =
              concept.thetaSolo !== undefined ? thetaToPercent(concept.thetaSolo) : concept.masteryPercentage || 0;
            const isMastered = mastery >= 80;
            const isFading = (concept.retentionRisk || 0) > 0.35;
            const isTarget = target?.conceptId === concept.id || nextAction?.targetConceptId === concept.id;
            const expBadge = getExperienceBadge(concept.id);
            const ExpIcon = expBadge?.icon;

            return (
              <div
                key={concept.id}
                className={`p-4 sm:p-4.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  isTarget
                    ? 'bg-[#151930] border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : isMastered
                    ? 'bg-[#0e1220] border-emerald-500/25'
                    : 'bg-[#141826]/85 border-white/[0.07] hover:border-white/[0.12]'
                }`}
              >
                {/* Concept Main Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                      isMastered
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : isTarget
                        ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                        : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                    }`}
                  >
                    {isMastered ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : index + 1}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/learn/${encodeURIComponent(concept.id)}`}
                        className="font-sans font-bold text-sm sm:text-base text-white hover:text-indigo-300 transition-colors truncate"
                      >
                        {concept.name}
                      </Link>

                      {isFading && (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold uppercase">
                          Review Needed
                        </span>
                      )}

                      {isTarget && !isMastered && (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 font-semibold uppercase animate-pulse">
                          Current Focus
                        </span>
                      )}

                      {expBadge && ExpIcon && (
                        <span className={`inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-md border font-semibold ${expBadge.color}`}>
                          <ExpIcon className="w-3 h-3" />
                          <span>{expBadge.label}</span>
                        </span>
                      )}
                    </div>

                    {/* Progress Bar and Percentage */}
                    <div className="flex items-center gap-2.5 max-w-xs">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isMastered
                              ? 'bg-emerald-400'
                              : isTarget
                              ? 'bg-indigo-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.max(3, mastery)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">{mastery}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/learn/${encodeURIComponent(concept.id)}`}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white font-sans text-xs font-semibold transition-colors"
                    title="View Concept Details & Objectives"
                  >
                    Details
                  </Link>

                  <Link
                    href={
                      isFading
                        ? `/quest?concept=${encodeURIComponent(concept.id)}&mode=review`
                        : `/quest?concept=${encodeURIComponent(concept.id)}`
                    }
                    className={`px-3.5 py-1.5 rounded-xl font-sans text-xs font-semibold transition-all flex items-center gap-1 ${
                      isTarget
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                        : isFading
                        ? 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300'
                        : 'bg-white/[0.06] hover:bg-white/[0.1] text-white'
                    }`}
                  >
                    <span>{isFading ? 'Review' : isMastered ? 'Practice' : 'Launch'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. EXPLORE LEARNING MODES
          ========================================================================= */}
      <section className="space-y-2.5 pt-2" aria-label="Available Learning Modalities">
        <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Explore Learning Modes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Adaptive Quest */}
          <Link
            href="/quest"
            className="p-4 rounded-xl border border-white/[0.07] hover:border-indigo-500/40 bg-[#141826]/80 hover:bg-[#141826] transition-all space-y-1.5 group focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
          >
            <div className="flex items-center justify-between">
              <Zap className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition-colors" />
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Adaptive Quests</h4>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Interactive exercises that dynamically scale difficulty to your skill.
            </p>
          </Link>

          {/* Solo Challenge */}
          <Link
            href="/quest?mode=solo"
            className="p-4 rounded-xl border border-white/[0.07] hover:border-cyan-500/40 bg-[#141826]/80 hover:bg-[#141826] transition-all space-y-1.5 group focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
          >
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 text-cyan-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 transition-colors" />
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Solo Assessment</h4>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Unassisted calibration to measure true solo mastery for your passport.
            </p>
          </Link>

          {/* XIRA AI Tutor */}
          <Link
            href="/xira"
            className="p-4 rounded-xl border border-white/[0.07] hover:border-amber-500/40 bg-[#141826]/80 hover:bg-[#141826] transition-all space-y-1.5 group focus-visible:ring-2 focus-visible:ring-amber-400 outline-none"
          >
            <div className="flex items-center justify-between">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition-colors" />
            </div>
            <h4 className="font-sans font-bold text-sm text-white">Xira AI Companion</h4>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Deep pedagogical explanations, conceptual analogies, and targeted hints.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
