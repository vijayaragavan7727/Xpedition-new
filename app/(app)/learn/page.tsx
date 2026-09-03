'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, selectNextTarget, UserStoreData } from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import {
  BookOpen,
  Play,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  Shield,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

export default function LearnHubPage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<UserStoreData | null>(null);

  useEffect(() => {
    setStoreData(getStoreData());
  }, []);

  if (!storeData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Learning Hub...</span>
      </div>
    );
  }

  const target = selectNextTarget(storeData);
  const concepts = storeData.concepts || [];
  const fadingConcepts = concepts.filter((c) => c.retentionRisk > 0.35);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 font-sans select-none">
      {/* 1. Header & Active Goal */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="font-sans font-bold text-2xl text-white">Learning Hub</h1>
          <p className="font-sans text-xs text-slate-400 mt-0.5">
            Active Pathway: <span className="text-cyan-300 font-semibold">{storeData.goalText || 'Core Course'}</span>
          </p>
        </div>
        <Badge variant="cyan" size="sm">
          {concepts.length} Concepts Total
        </Badge>
      </div>

      {/* 2. Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Continue Targeted Lesson */}
        <Card variant="highlight" className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="indigo" size="sm">
                Interactive Lesson
              </Badge>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-white">
              {target ? target.conceptName : 'Continue Next Concept'}
            </h2>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              Step-by-step interactive blackboard instruction tailored by XIRA with real-time checkpoints.
            </p>
          </div>

          <Link href={target ? `/tutor/${target.conceptId}` : '/home'} className="w-full">
            <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Lesson
            </Button>
          </Link>
        </Card>

        {/* Adaptive Quest Practice */}
        <Card variant="default" className="p-5 flex flex-col justify-between space-y-4 border-indigo-500/30 bg-[#121524]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" size="sm">
                Adaptive Testing
              </Badge>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-white">
              Adaptive Quest
            </h2>
            <p className="font-sans text-xs text-slate-300 leading-relaxed">
              Dynamic questions that calibrate in real time to measure and expand your cognitive mastery.
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Link href="/quest" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                Practice
              </Button>
            </Link>
            <Link href="/quest?mode=solo" className="flex-1">
              <Button variant="secondary" size="md" className="w-full">
                Solo Mode
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Review Fading Memories (If Any) */}
      {fadingConcepts.length > 0 && (
        <Card variant="default" className="p-4 sm:p-5 border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
              <span>Retention Review ({fadingConcepts.length} Fading)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fadingConcepts.map((concept) => (
              <Link
                key={concept.id}
                href={`/tutor/${concept.id}`}
                className="p-2.5 rounded-xl bg-[#090A0F]/80 border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-between transition-colors"
              >
                <span className="font-sans text-xs text-white truncate max-w-[180px]">{concept.name}</span>
                <span className="font-mono text-[10px] text-amber-400 font-semibold">Review &rarr;</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Complete Curriculum & Concept Mastery */}
      <Card variant="default" className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="font-sans font-bold text-sm text-white">Course Curriculum</h3>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {concepts.filter((c) => (c.thetaSolo !== undefined ? thetaToPercent(c.thetaSolo) : c.masteryPercentage || 0) >= 80).length} / {concepts.length} Mastered
          </span>
        </div>

        <div className="space-y-2.5">
          {concepts.map((concept, index) => {
            const mastery =
              concept.thetaSolo !== undefined ? thetaToPercent(concept.thetaSolo) : concept.masteryPercentage || 0;
            const isMastered = mastery >= 80;

            return (
              <div
                key={concept.id}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-mono text-xs text-slate-400 font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans font-bold text-xs text-white truncate">{concept.name}</span>
                      <span className="font-mono text-[11px] font-bold text-cyan-300 shrink-0">{mastery}%</span>
                    </div>
                    <ProgressBar value={mastery} max={100} variant={isMastered ? 'cyan' : 'indigo'} size="sm" />
                  </div>
                </div>

                <Link href={`/tutor/${concept.id}`}>
                  <Button variant="ghost" size="sm" className="shrink-0 text-slate-300 hover:text-white">
                    {mastery > 0 ? 'Practice' : 'Learn'}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
