'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Bot, Compass } from 'lucide-react';
import { ClassroomLesson, ClassroomToolType } from './types';
import { getClassroomLesson } from '@/lib/classroom/classroomCatalog';
import { SmartBoard } from './SmartBoard';
import { BuddyTeacherStage } from './BuddyTeacherStage';
import { ClassroomXiraAssistant } from './ClassroomXiraAssistant';
import { ClassroomToolbar } from './ClassroomToolbar';
import { ClassroomToolsModal } from './tools/ClassroomToolsModal';
import { ProgressBar } from '@/components/ui';
import {
  defaultClassroomIntelligence,
  ClassroomTelemetryEvent,
  AdaptiveDirective,
} from '@/lib/classroom/classroomIntelligence';

export interface ClassroomLayoutProps {
  conceptId?: string;
  backHref?: string;
  onClassComplete?: () => void;
  className?: string;
}

export const ClassroomLayout: React.FC<ClassroomLayoutProps> = ({
  conceptId = 'dc_motor',
  backHref = '/learn',
  onClassComplete,
  className = '',
}) => {
  const lesson: ClassroomLesson = getClassroomLesson(conceptId);

  // 1. Step Navigation State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = lesson.steps[currentStepIndex] || lesson.steps[0];
  const totalSteps = lesson.steps.length;

  // 2. Adaptive Intelligence State
  const [activeDirective, setActiveDirective] = useState<AdaptiveDirective | null>(null);

  const handleTelemetry = useCallback(
    (event: ClassroomTelemetryEvent) => {
      const directive = defaultClassroomIntelligence.processTelemetry(event);
      setActiveDirective(directive);
    },
    []
  );

  // 3. Active Tool State (for bottom toolbar & drawer)
  const [activeTool, setActiveTool] = useState<ClassroomToolType | null>(null);

  // 4. Mobile Xira Drawer State
  const [isMobileXiraOpen, setIsMobileXiraOpen] = useState(false);

  // 5. Audio State for Buddy Narration
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const toggleAudio = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (isAudioPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsAudioPlaying(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep.buddyDialogue);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      setIsAudioPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStep.buddyDialogue, isAudioPlaying]);

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else if (onClassComplete) {
      onClassComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className={`min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-[#040714] text-slate-100 flex flex-col justify-between overflow-y-auto lg:overflow-hidden relative ${className}`}
    >
      {/* ===================================================================
          FUTURISTIC OBSERVATORY CLASSROOM ENVIRONMENT BACKDROP
         =================================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Photographic Master Reference Room Backdrop (Blend Screen) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 lg:opacity-30 mix-blend-screen filter saturate-125 pointer-events-none"
          style={{ backgroundImage: `url('/images/classroom/classroom-master-reference.png')` }}
        />

        {/* Deep Space Observatory Window on the Left (behind Buddy) */}
        <div className="absolute top-0 left-0 w-full sm:w-[480px] lg:w-[560px] h-full opacity-60">
          {/* Orbital Horizon Curve Glow */}
          <div className="absolute top-12 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-600/30 via-indigo-600/20 to-transparent blur-3xl" />
          {/* Planetary Glow */}
          <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-sky-400/15 blur-2xl" />
          {/* Distant Star Cluster Points */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(1.5px 1.5px at 80px 120px, #ffffff, transparent), radial-gradient(1px 1px at 160px 80px, #93c5fd, transparent), radial-gradient(1.5px 1.5px at 240px 180px, #ffffff, transparent), radial-gradient(1px 1px at 120px 280px, #67e8f9, transparent), radial-gradient(2px 2px at 320px 140px, #ffffff, transparent)',
              backgroundSize: '400px 400px',
            }}
          />
          {/* Futuristic Window Structural Beam */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-slate-700/40 via-sky-500/20 to-slate-800/60 border-r border-cyan-500/20" />
        </div>

        {/* Classroom Ceiling Lighting Beam focused on Smart Board */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl" />

        {/* Reflective Dark Floor Glow & Blue Neon Edge Runners */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#050B1E] via-[#040816]/80 to-transparent" />
        <div className="absolute bottom-14 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="absolute bottom-4 inset-x-1/4 h-px bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

        {/* Foreground Student Desk Silhouette (Creates "Attending Classroom" depth) */}
        <div className="hidden 2xl:block absolute bottom-0 left-6 w-56 h-18 rounded-tl-3xl bg-gradient-to-tr from-slate-900/90 to-slate-800/40 border-t border-l border-white/[0.08] backdrop-blur-md shadow-2xl opacity-50 pointer-events-none" />
        <div className="hidden 2xl:block absolute bottom-0 right-10 w-56 h-16 rounded-tr-3xl bg-gradient-to-tl from-slate-900/90 to-slate-800/40 border-t border-r border-white/[0.08] backdrop-blur-md shadow-2xl opacity-50 pointer-events-none" />
      </div>

      {/* ===================================================================
          1. CLASSROOM TOP BAR (Exact Reference Alignment)
         =================================================================== */}
      <header className="sticky top-0 z-40 h-13 sm:h-14 border-b border-white/[0.08] bg-[#060A18]/90 backdrop-blur-2xl flex items-center justify-between px-3 sm:px-6 select-none shrink-0 shadow-lg">
        {/* Left: XPEDITION Brand + [Classroom] Badge + Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              <span className="font-sans font-black text-white text-xs tracking-tighter">XP</span>
            </div>
            <span className="hidden sm:inline font-sans font-black text-sm text-white tracking-widest uppercase">
              XPEDITION
            </span>
          </div>

          {/* Classroom Mode Badge matching reference */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-sans text-xs font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)] shrink-0">
            <span className="text-cyan-400 text-xs">⊞</span>
            <span>Classroom</span>
          </div>

          {/* Breadcrumb Hierarchy */}
          <div className="hidden md:flex items-center gap-2 font-sans text-xs min-w-0">
            <span className="text-slate-400 font-medium truncate flex items-center gap-1">
              <span>⚛</span>
              <span>{lesson.subject} • Mechanics</span>
            </span>
            <span className="text-slate-600">›</span>
            <span className="text-slate-200 font-semibold truncate max-w-[240px] flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">🗔</span>
              <span>{lesson.topicTitle}</span>
            </span>
          </div>
        </div>

        {/* Right: Step Indicator Dots connected by line + Exit Button */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Connected Step Track: Step 1 / 5 ● ⎯ ○ ⎯ ○ ⎯ ○ ⎯ ○ */}
          <div className="flex items-center gap-2.5 font-sans text-xs">
            <span className="text-slate-300 font-mono font-medium text-[11px] whitespace-nowrap">
              Step {currentStepIndex + 1} / {totalSteps}
            </span>
            <div className="flex items-center">
              {Array.from({ length: totalSteps }).map((_, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                return (
                  <React.Fragment key={idx}>
                    <button
                      type="button"
                      onClick={() => setCurrentStepIndex(idx)}
                      aria-label={`Jump to step ${idx + 1}`}
                      className={`rounded-full transition-all cursor-pointer relative z-10 ${
                        isActive
                          ? 'w-2.5 h-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] scale-110'
                          : isPassed
                          ? 'w-2 h-2 bg-sky-500 hover:bg-sky-400'
                          : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                    {idx < totalSteps - 1 && (
                      <div
                        className={`w-3.5 sm:w-4 h-0.5 transition-colors ${
                          idx < currentStepIndex ? 'bg-sky-500' : 'bg-slate-800'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Mobile Xira Assistant Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileXiraOpen(true)}
            className="flex lg:hidden items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-sans text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Xira</span>
          </button>

          {/* Exit Class Button matching reference */}
          <Link
            href={backHref}
            aria-label="Exit Classroom"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.12] transition-colors font-sans text-xs font-semibold shrink-0"
          >
            <span className="text-xs">⎋</span>
            <span className="hidden sm:inline">Exit Class</span>
          </Link>
        </div>
      </header>

      {/* ===================================================================
          2. MAIN CLASSROOM STAGE (Exact 23% / 57% / 20% Proportions)
         =================================================================== */}
      <main className="flex-1 min-h-0 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex flex-col justify-center relative z-10 overflow-visible lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[23%_57%_20%] gap-3 xl:gap-4 items-stretch h-full max-h-full min-h-0">
          {/* Left on Desktop, Lower on Mobile: 🤖 3D Buddy Robot Teacher (approx 23%) */}
          <div className="order-2 lg:order-1 h-auto lg:h-full min-h-0 flex flex-col justify-end items-center overflow-hidden py-1 lg:py-0">
            <BuddyTeacherStage
              dialogue={activeDirective?.buddyDirective?.dialogueQuote || currentStep.buddyDialogue}
              state={activeDirective?.buddyDirective?.state || currentStep.buddyState}
              onNextAction={handleNextStep}
              nextActionLabel={currentStepIndex === totalSteps - 1 ? 'Finish Lesson' : 'Next Step'}
              className="h-full w-full"
            />
          </div>

          {/* Center on Desktop, Middle on Mobile: 🖥️ Smart Teaching Board (HERO DOMINANT: 57%) */}
          <div className="order-1 lg:order-2 h-full min-h-0 flex flex-col overflow-hidden">
            <SmartBoard
              step={currentStep}
              totalSteps={totalSteps}
              currentStepIndex={currentStepIndex}
              onPreviousStep={handlePreviousStep}
              onNextStep={handleNextStep}
              onOpenTool={(tool) => setActiveTool(tool)}
              adaptiveDirective={activeDirective || undefined}
              topicTitle={lesson.topicTitle}
              subject={lesson.subject}
              className="h-full w-full"
            />
          </div>

          {/* Right: ✨ Contextual Xira Assistant (COMPACT: 20%) */}
          <div className="order-3 hidden lg:flex h-full min-h-0 flex-col overflow-hidden">
            <ClassroomXiraAssistant
              topicTitle={lesson.topicTitle}
              subject={lesson.subject}
              currentStepTitle={currentStep.title}
              stepHint={currentStep.hintText}
              adaptiveDirective={activeDirective || undefined}
              activeMisconception={activeDirective?.detectedMisconception}
              onOpenTool={(tool) => setActiveTool(tool)}
              className="h-full w-full"
            />
          </div>
        </div>
      </main>

      {/* ===================================================================
          3. FLOATING LEARNING TOOLS DOCK (100% Viewport-Safe)
         =================================================================== */}
      <footer className="w-full px-3 py-1.5 shrink-0 select-none sticky lg:relative bottom-0 z-30 flex justify-center pb-2 bg-[#040714]/90 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none">
        <ClassroomToolbar
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          hasFormulas={Boolean(lesson.hasFormulas && lesson.formulas && lesson.formulas.length > 0)}
          hasQuestions={Boolean(currentStep.checkQuestion || (lesson.questions && lesson.questions.length > 0))}
          hasHint={Boolean(currentStep.hintText || currentStep.progressiveHint || (lesson.progressiveHints && lesson.progressiveHints.length > 0))}
          hasFlashcards={Boolean(lesson.flashcards && lesson.flashcards.length > 0)}
          hasSources={Boolean(lesson.sources && lesson.sources.length > 0)}
          isAudioPlaying={isAudioPlaying}
          onToggleAudio={toggleAudio}
        />
      </footer>

      {/* ===================================================================
          4. MODALS & DRAWERS FOR LEARNING TOOLS
         =================================================================== */}
      <ClassroomToolsModal
        isOpen={activeTool !== null}
        onClose={() => setActiveTool(null)}
        toolType={activeTool}
        lesson={lesson}
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        onSelectStep={(idx) => setCurrentStepIndex(idx)}
        onOpenTool={(tool) => setActiveTool(tool)}
        onTelemetry={handleTelemetry}
      />

      {/* Mobile Xira Assistant Drawer */}
      {isMobileXiraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="w-full max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl">
            <ClassroomXiraAssistant
              topicTitle={lesson.topicTitle}
              subject={lesson.subject}
              currentStepTitle={currentStep.title}
              stepHint={currentStep.hintText}
              adaptiveDirective={activeDirective || undefined}
              activeMisconception={activeDirective?.detectedMisconception}
              onOpenTool={(tool) => setActiveTool(tool)}
              onCloseMobileDrawer={() => setIsMobileXiraOpen(false)}
              className="h-[75vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomLayout;
