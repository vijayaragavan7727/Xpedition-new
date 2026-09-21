'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, completeCalibration } from '@/lib/store';
import {
  Compass,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export interface CalibrationItem {
  id: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
}

export default function CalibratePage() {
  const router = useRouter();

  // Calibration stage: 'welcome' | 'active' | 'completed'
  const [stage, setStage] = useState<'welcome' | 'active' | 'completed'>('welcome');

  // Item pool and active item
  const [calibrationItems, setCalibrationItems] = useState<CalibrationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [goalTitle, setGoalTitle] = useState<string>('Your Learning Goal');

  // Adaptive IRT estimation state
  const [theta, setTheta] = useState<number>(-0.4);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  useEffect(() => {
    const store = getStoreData();
    setGoalTitle(store.goalText || 'Learning Foundations');

    const activeQuests = store.quests || [];
    const conceptsMap = new Map((store.concepts || []).map((c) => [c.id, c.name]));

    let pool: CalibrationItem[] = activeQuests.map((q: any) => ({
      id: q.id,
      conceptId: q.conceptId,
      conceptName: conceptsMap.get(q.conceptId) || store.goalText || 'Core Concept',
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.answerIndex ?? q.correctIndex ?? 0,
      explanation: q.explanation || '',
      difficulty: Number(q.difficulty) || 0,
    }));

    if (pool.length === 0 && Array.isArray(store.concepts) && store.concepts.length > 0) {
      // Fallback from existing store concepts
      pool = store.concepts.map((c, idx) => ({
        id: `calib_${c.id}`,
        conceptId: c.id,
        conceptName: c.name,
        prompt: `Core assessment question for ${c.name}`,
        options: ['Correct application', 'Incorrect approach A', 'Incorrect approach B', 'Incorrect approach C'],
        correctIndex: 0,
        explanation: `Evaluates fundamental understanding of ${c.name}.`,
        difficulty: -1.5 + idx * 0.8,
      }));
    } else if (pool.length === 0) {
      // Immediate foundational pool when first entering without prior state
      const defaultConcepts = [
        { id: 'c_foundations', name: 'Core Foundations' },
        { id: 'c_logic', name: 'Systematic Logic' },
        { id: 'c_application', name: 'Problem Application' },
        { id: 'c_analysis', name: 'Analytical Reasoning' },
        { id: 'c_synthesis', name: 'Synthesis & Transfer' },
      ];
      pool = defaultConcepts.map((c, idx) => ({
        id: `calib_${c.id}`,
        conceptId: c.id,
        conceptName: c.name,
        prompt: `Diagnostic challenge evaluating understanding of ${c.name}.`,
        options: ['Optimal principle-based solution', 'Common naive approach', 'Unrelated alternative', 'Inverse relationship'],
        correctIndex: 0,
        explanation: `Demonstrates mastery of core ${c.name} principles.`,
        difficulty: -1.5 + idx * 0.75,
      }));
    }

    // Sort items by difficulty
    const sorted = [...pool].sort((a, b) => a.difficulty - b.difficulty);

    // Select 5 items evenly spread across the difficulty range
    let selected: CalibrationItem[] = [];
    if (sorted.length >= 5) {
      const step = (sorted.length - 1) / 4;
      selected = [
        sorted[0],
        sorted[Math.round(step * 1)],
        sorted[Math.round(step * 2)],
        sorted[Math.round(step * 3)],
        sorted[sorted.length - 1],
      ];
    } else {
      selected = sorted;
    }

    setCalibrationItems(selected);
  }, []);

  const totalItems = calibrationItems.length;
  const currentItem = calibrationItems[currentIndex];

  const handleOptionSelect = (idx: number) => {
    if (isAnswered || !currentItem) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentItem.correctIndex;
    const itemDiff = currentItem.difficulty ?? 0;

    // Coarse Elo / IRT update equation:
    // p = 1 / (1 + exp(-(theta - itemDifficulty)))
    // theta = theta + 0.9 * ((correct ? 1 : 0) - p)
    const p = 1 / (1 + Math.exp(-(theta - itemDiff)));
    const newTheta = theta + 0.9 * ((isCorrect ? 1 : 0) - p);
    setTheta(newTheta);

    // Encouraging non-judgmental companion feedback
    const feedbacks = [
      'Xira is learning from this...',
      'Good signal. Adjusting your path...',
      'Calibrating your starting baseline...',
      'Refining your learning profile...',
    ];
    setFeedbackMessage(feedbacks[currentIndex % feedbacks.length]);

    // Auto-advance after brief, responsive transition (420ms)
    setTimeout(() => {
      if (currentIndex + 1 < totalItems) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setFeedbackMessage('');
      } else {
        // Complete calibration and save to store
        completeCalibration(Number(newTheta.toFixed(2)));
        setStage('completed');
      }
    }, 420);
  };

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('xpedition_exit_override', 'true');
    }
    router.push('/home');
  };

  const handleEnterExpedition = () => {
    router.push('/home');
  };

  if (calibrationItems.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0B0D14] text-[#F8FAFC] flex items-center justify-center p-4 font-sans text-sm text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span>Xira is preparing your challenges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0B0D14] text-[#F8FAFC] flex flex-col justify-between overflow-x-hidden selection:bg-indigo-600 selection:text-white font-sans">
      {/* =========================================================================
          ATMOSPHERIC AMBIENT BACKDROP (Nocturne Scholar)
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          </div>
          <span className="font-orbitron font-bold text-sm tracking-wordmark text-white leading-none">
            XPEDITION
          </span>
        </div>

        {stage === 'active' && (
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Challenge {currentIndex + 1} of {totalItems}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleExit}
          className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors py-1.5 px-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
        >
          Exit
        </button>
      </header>

      {/* =========================================================================
          MAIN CONTAINER: CALIBRATION WORKSPACE
          ========================================================================= */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 my-auto flex flex-col items-center">
        {/* =====================================================================
            STAGE 1: OPENING STATE ("Let's find your starting point")
            ===================================================================== */}
        {stage === 'welcome' && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                <span>Initial Calibration</span>
              </div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                Let&apos;s find your starting point.
              </h1>
              <p className="font-sans text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                Xira will use a few challenges to understand what you already know — and where your journey should begin.
              </p>
            </div>

            {/* Reassurance Card */}
            <div className="p-5 sm:p-6 bg-[#141826]/90 border border-white/[0.08] rounded-2xl space-y-3.5 shadow-xl shadow-black/40">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="space-y-1 text-left">
                  <h2 className="font-sans font-semibold text-base text-[#F8FAFC]">
                    This isn&apos;t a test you can fail.
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-slate-400 leading-relaxed">
                    There are no grades or penalties here. Your answers simply help Xira establish an honest baseline so your quests are never too easy or too overwhelming.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  <span>Expedition: <strong className="text-white font-medium">{goalTitle}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>~3 minutes</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStage('active')}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] cursor-pointer"
              >
                <span>Begin Calibration</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 2: ACTIVE CALIBRATION CHALLENGE
            ===================================================================== */}
        {stage === 'active' && currentItem && (
          <div className="w-full space-y-6 transition-all duration-200">
            {/* Context & Progress Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                  {currentItem.conceptName}
                </span>
                <span className="font-sans text-xs text-slate-400">
                  Xira is adapting your journey
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
                />
              </div>
            </div>

            {/* Challenge Card */}
            <div className="p-6 sm:p-7 bg-[#141826]/95 border border-white/[0.08] rounded-2xl space-y-6 shadow-2xl shadow-black/50">
              <h1 className="font-sans font-semibold text-lg sm:text-xl text-[#F8FAFC] leading-relaxed text-left">
                {currentItem.prompt}
              </h1>

              {/* Options */}
              <div className="space-y-3">
                {currentItem.options.map((optionText, idx) => {
                  const isSelected = selectedOption === idx;

                  let cardStyle =
                    'bg-[#0F121C] border-white/[0.08] hover:border-white/[0.2] hover:bg-[#161B2E] text-slate-300 hover:text-white';

                  if (isAnswered) {
                    if (isSelected) {
                      cardStyle = 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/15';
                    } else {
                      cardStyle = 'bg-[#0F121C]/50 border-white/[0.04] text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleOptionSelect(idx)}
                      aria-pressed={isSelected}
                      className={`w-full min-h-[50px] p-4 rounded-xl border text-left font-sans text-sm sm:text-[15px] flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3.5 pr-2">
                        <span className="font-mono text-xs font-semibold text-slate-500 min-w-[20px]">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="leading-snug">{optionText}</span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-white/[0.2] bg-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Adaptive Status Notice during auto-advance */}
              {isAnswered && feedbackMessage && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-center text-xs font-mono text-indigo-300 animate-pulse">
                  {feedbackMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 3: COMPLETION STATE ("Your expedition is ready")
            ===================================================================== */}
        {stage === 'completed' && (
          <div className="w-full space-y-6 transition-all duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" aria-hidden="true" />
              </div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                Your expedition is ready.
              </h1>
              <p className="font-sans text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                Xira has a starting picture of how you learn. Your first learning quest is ready.
              </p>
            </div>

            {/* Calibration Summary Card */}
            <div className="p-5 sm:p-6 bg-[#141826]/95 border border-white/[0.08] rounded-2xl space-y-3.5 shadow-2xl shadow-black/40 text-left">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-sans text-sm text-[#F8FAFC]">
                  Starting point established from baseline challenges
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-sans text-sm text-[#F8FAFC]">
                  Learning path tailored to: <strong className="text-indigo-400 font-semibold">{goalTitle}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-sans text-sm text-[#F8FAFC]">
                  First quest and adaptive skill nodes prepared
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleEnterExpedition}
                className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] cursor-pointer"
              >
                <span>Enter Xpedition</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MINIMALIST FOOTER
          ========================================================================= */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-[12px] font-sans text-slate-500 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <span>© {new Date().getFullYear()} XPedition</span>
        <Link href="/terms" className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline">
          Terms & Privacy
        </Link>
      </footer>
    </div>
  );
}
