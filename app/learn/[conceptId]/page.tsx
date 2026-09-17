'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  getStoreData,
  saveStoreData,
  recordAttempt,
  computeItemHash,
  UserStoreData,
  ConceptMastery,
} from '@/lib/store';
import { thetaToPercent } from '@/lib/engine/mastery';
import { experienceRegistry } from '@/lib/experience';
import { downloadNotesPdf, downloadFlashcardsPdf } from '@/lib/pdf';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Zap,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  FileText,
  RotateCcw,
  Compass,
  Code2,
  Activity,
  RotateCw,
  Atom,
  Heart,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface LessonChunk {
  say: string;
  code?: string;
}

interface LessonCheckpoint {
  ask: string;
  options: string[];
  answerIndex: number;
  why: string;
}

interface LessonData {
  chunks: LessonChunk[];
  checkpoint: LessonCheckpoint;
}

export default function ConceptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conceptId = (params?.conceptId as string) || 'c_1';

  const [storeData, setStoreData] = useState<UserStoreData | null>(null);
  const [activeConcept, setActiveConcept] = useState<ConceptMastery | null>(null);
  const [conceptName, setConceptName] = useState<string>('Core Concept');
  const [conceptSummary, setConceptSummary] = useState<string>('');
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hub' | 'walkthrough'>('hub');

  // Walkthrough Lesson Progression State
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [showCheckpoint, setShowCheckpoint] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const store = getStoreData();
    setStoreData(store);

    const activeGraph =
      store.graphs?.find((g) => g.id === store.activeGraphId) ||
      store.graphs?.[0];
    const concept = activeGraph?.concepts?.find((c) => c.id === conceptId);
    setActiveConcept(concept || null);

    const cName = concept?.name || store.goalText || 'Core Concept';
    const cSummary = (concept as any)?.summary || `Core foundational milestone in ${activeGraph?.goalText || store.goalText}.`;
    const lang = activeGraph?.learnerProfile?.language || store.learnerProfile?.language || 'english';
    const level = activeGraph?.learnerProfile?.startingLevel || store.learnerProfile?.startingLevel || 'Complete beginner';
    const mastery = concept?.masteryPercentage || 0;

    setConceptName(cName);
    setConceptSummary(cSummary);

    // Fetch interactive lesson content from API
    async function fetchLesson() {
      setLoading(true);
      try {
        const res = await fetch('/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptId,
            conceptName: cName,
            conceptSummary: cSummary,
            language: lang,
            startingLevel: level,
            masteryPercentage: mastery,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.chunks) && data.chunks.length > 0) {
            setLesson(data);
          }
        }
      } catch (err) {
        console.warn('Lesson fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [conceptId]);

  const handleNextChunk = () => {
    if (!lesson) return;
    if (currentChunkIndex + 1 < lesson.chunks.length) {
      setCurrentChunkIndex((prev) => prev + 1);
    } else {
      setShowCheckpoint(true);
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitCheckpoint = () => {
    if (selectedOption === null || !lesson || isSubmitted) return;
    const correct = selectedOption === lesson.checkpoint.answerIndex;
    setIsSubmitted(true);
    setIsCorrect(correct);
  };

  const handleGoBackThrough = () => {
    setCurrentChunkIndex(0);
    setShowCheckpoint(false);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  const goalTitle = storeData?.goalText || 'Curriculum Pathway';
  const masteryVal = activeConcept
    ? activeConcept.thetaSolo !== undefined
      ? thetaToPercent(activeConcept.thetaSolo)
      : activeConcept.masteryPercentage || 0
    : 0;
  const isMastered = masteryVal >= 80;
  const isFading = (activeConcept?.retentionRisk || 0) > 0.35;

  // Check if concept has registered interactive experience
  const isRegisteredExperience = experienceRegistry.hasExperience(conceptId);
  const getExperienceMeta = () => {
    switch (conceptId) {
      case 'python_debugging_basics':
        return {
          title: 'Programming Code Lab: Debug by Doing',
          description: 'Hands-on live code debugging lab. Diagnose variable accumulation misconceptions in an interactive terminal.',
          badge: 'Interactive Code Lab',
          icon: Code2,
          color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        };
      case 'human_heart_anatomy':
        return {
          title: '3D Human Heart Anatomy Explorer',
          description: 'Inspect chambers, identify tricuspid and mitral valves, and trace the 12-step cardiovascular blood-flow loop.',
          badge: '3D Anatomy Explorer',
          icon: Heart,
          color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        };
      case 'spatial_reasoning':
        return {
          title: "3D Object Manipulation: Scholar's Prism",
          description: 'Rotate and align 3D polyhedral models to match target spatial orientations in pitch, yaw, and roll.',
          badge: '3D Spatial Lab',
          icon: RotateCw,
          color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        };
      case 'projectile_motion':
        return {
          title: 'Projectile Motion Physics Lab',
          description: 'Formulate trajectory hypotheses, adjust launch angles, simulate gravity & drag, and strike targets.',
          badge: 'Physics Simulation',
          icon: Activity,
          color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
        };
      case 'molecular_bonding':
        return {
          title: '3D Molecule Builder: Covalent Bonding',
          description: 'Drag atoms, construct single and double covalent bonds, and satisfy valence octet rules for water and carbon dioxide.',
          badge: '3D Molecule Builder',
          icon: Atom,
          color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
        };
      default:
        return null;
    }
  };

  const expMeta = isRegisteredExperience ? getExperienceMeta() : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24 pt-3 font-sans select-none overflow-hidden px-4 sm:px-0">
      {/* =========================================================================
          1. BREADCRUMB & HEADER
          ========================================================================= */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/learn" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Curriculum</span>
          </Link>
          <span>/</span>
          <span className="truncate max-w-[150px] sm:max-w-xs">{goalTitle}</span>
          <span>/</span>
          <span className="text-white font-semibold">{conceptName}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {conceptName}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-400 pt-0.5">
              Part of <span className="text-slate-200 font-medium">{goalTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isMastered ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mastered ({masteryVal}%)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/35 font-mono text-xs font-bold text-indigo-300">
                <span>{masteryVal}% Mastery</span>
              </span>
            )}
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit pt-1">
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'hub'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quests & Experiences Hub
          </button>
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'walkthrough'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Guided Walkthrough
          </button>
        </div>
      </section>

      {/* =========================================================================
          TAB 1: QUESTS & EXPERIENCES HUB
          ========================================================================= */}
      {activeTab === 'hub' ? (
        <div className="space-y-6">
          {/* 1. Interactive 3D / Code Experience Card (Dominant if available) */}
          {expMeta && (
            <section aria-label="Interactive Hands-on Experience">
              <div className="rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-[#161a2f] via-[#121524] to-[#0c0e18] p-5 sm:p-6 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${expMeta.color}`}>
                    <Sparkles className="w-3 h-3" />
                    <span>{expMeta.badge}</span>
                  </span>

                  <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>~10-15 min</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                      <expMeta.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-sans font-bold text-base sm:text-lg text-white">
                        {expMeta.title}
                      </h2>
                    </div>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                    {expMeta.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/quest?concept=${encodeURIComponent(conceptId)}`}
                    className="w-full min-h-[46px] px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-450 hover:to-indigo-650 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <span>Launch Interactive Experience</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* 2. Available Learning Activities Grid */}
          <section className="space-y-3" aria-label="Available Quests">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Available Quests & Practice Modes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Adaptive Quest */}
              <Link
                href={`/quest?concept=${encodeURIComponent(conceptId)}`}
                className="p-4 rounded-xl border border-white/[0.07] bg-[#141826]/90 hover:border-indigo-500/40 hover:bg-[#141826] transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-indigo-300 font-semibold">
                      Adaptive
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                    Adaptive Quest
                  </h4>
                  <p className="font-sans text-xs text-slate-400 leading-relaxed">
                    Dynamic challenge adapting question difficulty directly to your mastery theta.
                  </p>
                </div>
                <div className="flex items-center justify-end text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Start Quest &rarr;</span>
                </div>
              </Link>

              {/* Solo Challenge */}
              <Link
                href={`/quest?concept=${encodeURIComponent(conceptId)}&mode=solo`}
                className="p-4 rounded-xl border border-white/[0.07] bg-[#141826]/90 hover:border-cyan-500/40 hover:bg-[#141826] transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-cyan-300 font-semibold">
                      Solo Calibration
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    Solo Assessment
                  </h4>
                  <p className="font-sans text-xs text-slate-400 leading-relaxed">
                    Unassisted challenge drill measuring true independent recall for your Skill Passport.
                  </p>
                </div>
                <div className="flex items-center justify-end text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Begin Solo &rarr;</span>
                </div>
              </Link>

              {/* Spaced Review */}
              <Link
                href={`/quest?concept=${encodeURIComponent(conceptId)}&mode=review`}
                className="p-4 rounded-xl border border-white/[0.07] bg-[#141826]/90 hover:border-amber-500/40 hover:bg-[#141826] transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-amber-300 font-semibold">
                      {isFading ? 'Urgent' : 'Optional'}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                    Spaced Retention Review
                  </h4>
                  <p className="font-sans text-xs text-slate-400 leading-relaxed">
                    Targeted refresher designed to reset retention decay and strengthen long-term recall.
                  </p>
                </div>
                <div className="flex items-center justify-end text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Start Review &rarr;</span>
                </div>
              </Link>

              {/* XIRA Visual Tutor */}
              <Link
                href={`/tutor/${encodeURIComponent(conceptId)}`}
                className="p-4 rounded-xl border border-white/[0.07] bg-[#141826]/90 hover:border-purple-500/40 hover:bg-[#141826] transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-purple-300 font-semibold">
                      Interactive Tutor
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    Visual Board Tutor
                  </h4>
                  <p className="font-sans text-xs text-slate-400 leading-relaxed">
                    Step-by-step whiteboard explanations with diagrams, TTS audio, and conceptual analogies.
                  </p>
                </div>
                <div className="flex items-center justify-end text-xs font-semibold text-purple-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Tutor &rarr;</span>
                </div>
              </Link>
            </div>
          </section>
        </div>
      ) : (
        /* =========================================================================
            TAB 2: INTERACTIVE STEP-BY-STEP WALKTHROUGH
            ========================================================================= */
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-slate-400 animate-pulse">
              Generating interactive lesson content for &quot;{conceptName}&quot;...
            </div>
          ) : !lesson ? (
            <div className="p-8 rounded-2xl bg-[#141826] border border-white/[0.08] text-center space-y-3">
              <h3 className="font-sans font-bold text-base text-white">Interactive Lesson Ready</h3>
              <p className="font-sans text-xs text-slate-400 max-w-md mx-auto">
                Dive directly into hands-on questions or open the Visual Board Tutor for audio narration.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href={`/quest?concept=${encodeURIComponent(conceptId)}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Start Questions &rarr;
                </Link>
                <Link
                  href={`/tutor/${encodeURIComponent(conceptId)}`}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-200 text-xs font-semibold"
                >
                  Open Visual Board Tutor
                </Link>
              </div>
            </div>
          ) : !showCheckpoint ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#141826]/90 p-5 sm:p-6 space-y-4 shadow-xl">
              {/* Progress Dots */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  {lesson.chunks.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentChunkIndex
                          ? 'w-6 bg-indigo-400'
                          : idx < currentChunkIndex
                          ? 'w-2 bg-indigo-600'
                          : 'w-2 bg-white/[0.1]'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                  SECTION {currentChunkIndex + 1} OF {lesson.chunks.length}
                </span>
              </div>

              {/* Chunk Speech & Code */}
              <div className="space-y-4 py-2">
                <p className="font-sans text-sm sm:text-base text-slate-200 leading-relaxed">
                  {lesson.chunks[currentChunkIndex]?.say}
                </p>

                {lesson.chunks[currentChunkIndex]?.code && (
                  <div className="p-3.5 rounded-xl bg-[#0e111a] border border-white/[0.08] overflow-x-auto">
                    <span className="block font-mono text-[9px] uppercase text-indigo-300 font-bold mb-1">
                      CODE EXAMPLE
                    </span>
                    <pre className="font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed">
                      {lesson.chunks[currentChunkIndex].code}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex justify-end">
                <button
                  type="button"
                  onClick={handleNextChunk}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md"
                >
                  <span>{currentChunkIndex + 1 === lesson.chunks.length ? 'Go to Checkpoint' : 'Next Step'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Checkpoint Card */
            <div className="rounded-2xl border border-white/[0.08] bg-[#141826]/90 p-5 sm:p-6 space-y-5 shadow-xl">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase text-indigo-300 font-bold tracking-wider">
                  LESSON CHECKPOINT
                </span>
                <h3 className="font-sans font-bold text-base sm:text-lg text-white">
                  {lesson.checkpoint.ask}
                </h3>
              </div>

              <div className="space-y-2">
                {lesson.checkpoint.options.map((optionText, idx) => {
                  const isSelected = selectedOption === idx;
                  const isAnswerIdx = idx === lesson.checkpoint.answerIndex;

                  let optionStyle = 'bg-white/[0.03] border-white/[0.06] hover:border-indigo-400 text-slate-200';
                  if (isSubmitted) {
                    if (isAnswerIdx) {
                      optionStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold';
                    } else if (isSelected) {
                      optionStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold';
                    } else {
                      optionStyle = 'bg-white/[0.01] border-transparent text-slate-500';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-indigo-600/20 border-indigo-500 text-white';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleOptionSelect(idx)}
                      className={`w-full min-h-[46px] p-3 rounded-xl border text-left font-sans text-xs sm:text-sm flex items-center gap-3 transition-all ${optionStyle}`}
                    >
                      <span className="font-mono text-xs font-bold text-slate-400 min-w-[18px]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="leading-snug">{optionText}</span>
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="space-y-4 pt-2">
                  <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                    <span className="font-mono text-xs font-bold block mb-1">
                      {isCorrect ? '✓ Spot on!' : '✕ Not quite.'}
                    </span>
                    <p className="font-sans text-xs leading-relaxed text-slate-200">
                      {lesson.checkpoint.why}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    {!isCorrect && (
                      <button
                        type="button"
                        onClick={handleGoBackThrough}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                      >
                        ← Review Walkthrough
                      </button>
                    )}
                    <Link
                      href={`/quest?concept=${encodeURIComponent(conceptId)}`}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ml-auto"
                    >
                      <span>Start Adaptive Quest</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {!isSubmitted && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleSubmitCheckpoint}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedOption !== null
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        : 'bg-white/[0.05] text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Verify Answer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Download Study Materials */}
          {lesson && (
            <div className="p-4 rounded-xl border border-white/[0.06] bg-[#141826]/60 flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-[11px] text-slate-400 font-semibold uppercase">
                Offline Study Credentials
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadNotesPdf({ conceptName, chunks: lesson.chunks })}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-indigo-300 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Notes PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFlashcardsPdf({ conceptName, chunks: lesson.chunks })}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-cyan-300 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Flashcards</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
