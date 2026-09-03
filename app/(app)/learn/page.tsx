'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, selectNextTarget, UserStoreData, ConceptMastery } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
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
} from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  const target = useMemo(() => (storeData ? selectNextTarget(storeData) : null), [storeData]);
  const concepts = useMemo(() => storeData?.concepts || [], [storeData]);
  const fadingConcepts = useMemo(() => concepts.filter((c) => c.retentionRisk > 0.35), [concepts]);

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

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading learning journey...</span>
      </div>
    );
  }

  const goalTitle = storeData.goalText || 'Your Learning Journey';

  // Empty State Fallback
  if (concepts.length === 0) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8 font-sans select-none text-center">
        <Card variant="default" className="p-8 space-y-4 bg-[#141826]/90 border-white/[0.07]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-xl text-white">Start Your Learning Journey</h2>
          <p className="font-sans text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Configure your learning goal or topic to generate your personalized adaptive curriculum.
          </p>
          <div className="pt-2">
            <Link href="/onboarding">
              <Button variant="primary" size="md">
                Set Learning Goal &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16 font-sans select-none">
      {/* =========================================================================
          1. PAGE HEADER
          ========================================================================= */}
      <section className="space-y-1 pt-1">
        <h1 className="font-sans font-bold text-xl sm:text-2xl text-white">Learn</h1>
        <p className="font-sans text-xs sm:text-sm text-slate-400">
          <span className="text-cyan-300 font-semibold">{goalTitle}</span> • Build your skills through an adaptive learning journey.
        </p>
      </section>

      {/* =========================================================================
          2. CONTINUE YOUR JOURNEY (Primary Dominant Card)
          ========================================================================= */}
      <section>
        <Card
          variant="highlight"
          className="p-5 sm:p-6 space-y-4 border-indigo-500/40 bg-gradient-to-br from-[#121528] to-[#0A0D18] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge variant="cyan" size="sm" className="font-mono tracking-wider">
              CONTINUE YOUR JOURNEY
            </Badge>
            <span className="font-mono text-xs font-bold text-cyan-300">
              {goalProgress.overallPercent}% Mastery
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-sm">
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-sans font-bold text-lg sm:text-xl text-white truncate">
                  {goalTitle}
                </h2>
                <span className="font-mono text-xs text-slate-400">
                  {goalProgress.masteredCount} of {goalProgress.totalCount} milestones mastered
                </span>
              </div>
            </div>

            <p className="font-sans text-xs sm:text-sm text-slate-300 pt-1">
              Pick up where you left off in your {goalTitle} path.
            </p>
          </div>

          <ProgressBar
            value={goalProgress.overallPercent}
            max={100}
            variant={goalProgress.overallPercent >= 80 ? 'cyan' : 'indigo'}
            size="sm"
          />

          <div className="pt-1">
            <Link
              href={target?.conceptId && target.conceptId !== 'default' ? `/tutor/${target.conceptId}` : '/quest'}
              className="block w-full"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold shadow-lg shadow-indigo-600/30"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue Journey
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* =========================================================================
          3. LEARNING PATH / SKILL JOURNEY (Clean Vertical Journey)
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Your Learning Path
            </h3>
            <span className="font-sans text-[11px] text-slate-400">{goalTitle}</span>
          </div>
          <span className="font-mono text-[11px] text-cyan-300 font-semibold">
            {goalProgress.masteredCount}/{goalProgress.totalCount} Completed
          </span>
        </div>

        <div className="space-y-2 relative">
          {concepts.map((concept, index) => {
            const mastery =
              concept.thetaSolo !== undefined ? thetaToPercent(concept.thetaSolo) : concept.masteryPercentage || 0;
            const isMastered = mastery >= 80;
            const isFading = concept.retentionRisk > 0.35;
            const isTarget = target?.conceptId === concept.id;

            return (
              <div
                key={concept.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isTarget
                    ? 'bg-[#14182E] border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : isMastered
                    ? 'bg-[#0B101E] border-cyan-500/20'
                    : 'bg-[#141826]/90 border-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                {/* Concept Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isMastered
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                        : isTarget
                        ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                        : 'bg-white/[0.04] border border-white/[0.07] text-slate-400'
                    }`}
                  >
                    {isMastered ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : index + 1}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-xs sm:text-sm text-white truncate">
                        {concept.name}
                      </span>
                      {isFading && (
                        <Badge variant="warning" size="sm" className="text-[9px] py-0 px-1.5">
                          Review
                        </Badge>
                      )}
                      {isTarget && !isMastered && (
                        <Badge variant="indigo" size="sm" className="text-[9px] py-0 px-1.5">
                          Next Up
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[150px]">
                        <ProgressBar
                          value={mastery}
                          max={100}
                          variant={isMastered ? 'cyan' : 'indigo'}
                          size="sm"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{mastery}%</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action */}
                <Link href={`/tutor/${concept.id}`} className="shrink-0">
                  <Button
                    variant={isTarget ? 'primary' : isFading ? 'outline' : 'ghost'}
                    size="sm"
                    className="text-xs"
                  >
                    {isFading ? 'Review' : isMastered ? 'Practice' : mastery > 0 ? 'Continue' : 'Start'}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. NEXT BEST ACTION (Secondary Recommendation Card)
          ========================================================================= */}
      {target && target.conceptId !== 'default' && (
        <section className="space-y-2">
          <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Next For You
          </h3>

          <Card variant="default" className="p-4 sm:p-5 border-white/[0.07] bg-[#141826]/90 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h4 className="font-sans font-bold text-sm text-white truncate">
                  {target.conceptName}
                </h4>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <span>Adaptive Quest</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    ~10 min
                  </span>
                </div>
              </div>
            </div>

            <Link href="/quest" className="shrink-0">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Start Quest
              </Button>
            </Link>
          </Card>
        </section>
      )}

      {/* =========================================================================
          5. EXPLORE LEARNING MODES (Compact Action Grid)
          ========================================================================= */}
      <section className="space-y-2.5">
        <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Explore Learning Modes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Adaptive Quest */}
          <Link href="/quest" className="block group">
            <Card variant="default" className="p-3.5 border-white/[0.07] hover:border-cyan-400/30 bg-[#141826]/80 transition-all space-y-1">
              <div className="flex items-center justify-between">
                <Zap className="w-4 h-4 text-cyan-400" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition-colors" />
              </div>
              <h5 className="font-sans font-bold text-xs text-white">Adaptive Quest</h5>
              <p className="font-sans text-[10px] text-slate-400">Interactive drills adapting to your ability.</p>
            </Card>
          </Link>

          {/* Solo Challenge */}
          <Link href="/quest?mode=solo" className="block group">
            <Card variant="default" className="p-3.5 border-white/[0.07] hover:border-indigo-400/30 bg-[#141826]/80 transition-all space-y-1">
              <div className="flex items-center justify-between">
                <Award className="w-4 h-4 text-indigo-400" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 transition-colors" />
              </div>
              <h5 className="font-sans font-bold text-xs text-white">Solo Challenge</h5>
              <p className="font-sans text-[10px] text-slate-400">Unassisted test to measure true solo mastery.</p>
            </Card>
          </Link>

          {/* XIRA AI Tutor */}
          <Link href="/xira" className="block group">
            <Card variant="default" className="p-3.5 border-white/[0.07] hover:border-purple-400/30 bg-[#141826]/80 transition-all space-y-1">
              <div className="flex items-center justify-between">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-300 transition-colors" />
              </div>
              <h5 className="font-sans font-bold text-xs text-white">XIRA AI Tutor</h5>
              <p className="font-sans text-[10px] text-slate-400">Ask questions and explore conceptual analogies.</p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
