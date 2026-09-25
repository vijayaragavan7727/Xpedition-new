'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Search, Check } from 'lucide-react';
import { ClassroomLesson, ClassroomToolType } from './types';
import { getClassroomLesson } from '@/lib/classroom/classroomCatalog';
import { SmartBoard } from './SmartBoard';
import { BuddyTeacherStage } from './BuddyTeacherStage';
import { ClassroomXiraAssistant } from './ClassroomXiraAssistant';
import { ClassroomToolbar } from './ClassroomToolbar';
import { ClassroomToolsModal } from './tools/ClassroomToolsModal';
import {
  defaultClassroomIntelligence,
  ClassroomTelemetryEvent,
  AdaptiveDirective,
} from '@/lib/classroom/classroomIntelligence';
import { downloadFlashcards, downloadFormulaCards, downloadStudyNote } from '@/lib/learningObjectsDownloads';

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
  const lesson: ClassroomLesson = React.useMemo(() => getClassroomLesson(conceptId), [conceptId]);

  // 1. Step Navigation State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = lesson.steps[currentStepIndex] || lesson.steps[0];
  const totalSteps = lesson.steps.length;

  // 2. Classroom Session & Orchestrator State (Phase 4)
  const [sessionState, setSessionState] = useState<any | null>(null);
  const initializedConceptRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (initializedConceptRef.current === conceptId) return;
    initializedConceptRef.current = conceptId;

    let isMounted = true;
    const controller = new AbortController();

    fetch('/api/classroom/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', conceptId }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data?.session) {
          setSessionState(data.session);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[ClassroomLayout] Session init warning:', err?.message);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [conceptId]);

  // 3. Adaptive Intelligence State
  const [activeDirective, setActiveDirective] = useState<AdaptiveDirective | null>(null);

  const handleTelemetry = useCallback(
    (event: ClassroomTelemetryEvent) => {
      const directive = defaultClassroomIntelligence.processTelemetry(event);
      setActiveDirective(directive);
    },
    []
  );

  // 4. Active Tool State (for bottom toolbar & drawer)
  const [activeTool, setActiveTool] = useState<ClassroomToolType | null>(null);

  // 5. Mobile Xira Drawer State
  const [isMobileXiraOpen, setIsMobileXiraOpen] = useState(false);

  // 6. Audio State for Buddy Narration
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // 7. Learning-object download feedback
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

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
      const textToSpeak = sessionState?.buddyDialogue || currentStep.buddyDialogue;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      setIsAudioPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStep.buddyDialogue, isAudioPlaying, sessionState?.buddyDialogue]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else if (onClassComplete) {
      onClassComplete();
    }

    if (sessionState?.sessionId) {
      fetch('/api/classroom/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          conceptId,
          sessionId: sessionState.sessionId,
          learnerAction: { type: 'ADVANCE_STAGE' },
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.session) {
            setSessionState(data.session);
          }
        })
        .catch(() => {});
    }
  }, [currentStepIndex, totalSteps, onClassComplete, sessionState?.sessionId, conceptId]);

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }

    if (sessionState?.sessionId) {
      fetch('/api/classroom/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          conceptId,
          sessionId: sessionState.sessionId,
          learnerAction: { type: 'PREVIOUS_STAGE' },
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.session) {
            setSessionState(data.session);
          }
        })
        .catch(() => {});
    }
  }, [currentStepIndex, sessionState?.sessionId, conceptId]);

  const handleQuestionAnswered = useCallback(
    (isCorrect: boolean) => {
      handleTelemetry({
        eventType: 'question_attempt',
        conceptId: lesson.conceptId,
        conceptName: lesson.topicTitle,
        stepIndex: currentStepIndex,
        stepTitle: currentStep.title,
        timestamp: Date.now(),
        data: {
          questionId: currentStep.checkQuestion?.prompt,
          isCorrect,
          misconceptionTag: currentStep.checkQuestion?.options.find((o) => !o.isCorrect)?.feedback,
        },
      });

      if (sessionState?.sessionId) {
        fetch('/api/classroom/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'process',
            conceptId,
            sessionId: sessionState.sessionId,
            learnerAction: {
              type: 'ANSWER_QUESTION',
              optionId: isCorrect ? 'opt_correct' : 'opt_incorrect',
            },
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.success && data?.session) {
              setSessionState(data.session);
            }
          })
          .catch(() => {});
      }
    },
    [handleTelemetry, lesson.conceptId, lesson.topicTitle, currentStepIndex, currentStep, sessionState?.sessionId, conceptId]
  );

  const handleOpenTool = useCallback(async (tool: ClassroomToolType | null) => {
    if (!tool) {
      setActiveTool(null);
      return;
    }

    // On small screens, and for quick-reference objects everywhere, the tool action
    // is a direct save action instead of opening a cramped preview drawer.
    if (tool === 'formula' && lesson.formulas?.length) {
      await downloadFormulaCards(lesson.topicTitle, lesson.formulas);
      setDownloadNotice('Formula cards saved to your device.');
      window.setTimeout(() => setDownloadNotice(null), 2600);
      return;
    }
    if (tool === 'flashcards' && lesson.flashcards?.length) {
      await downloadFlashcards(lesson.topicTitle, lesson.flashcards.map((card, index) => ({
        title: card.category || `Concept Card ${index + 1}`,
        front: card.front,
        back: card.back,
        number: index + 1,
      })));
      setDownloadNotice('Flashcards saved to your device.');
      window.setTimeout(() => setDownloadNotice(null), 2600);
      return;
    }
    if (tool === 'notes') {
      const note = typeof window !== 'undefined' ? localStorage.getItem(`xpedition_notes_${lesson.conceptId}`) || `${currentStep.title}\n${currentStep.boardSummary}\n${currentStep.keyPrinciple || ''}` : `${currentStep.title}\n${currentStep.boardSummary}`;
      await downloadStudyNote(lesson.topicTitle, note);
      setDownloadNotice('Study note saved to your device.');
      window.setTimeout(() => setDownloadNotice(null), 2600);
      return;
    }

    setActiveTool(tool);
  }, [lesson, currentStep]);

  const handleCloseTool = useCallback(() => {
    setActiveTool(null);
  }, []);

  const handleOpenMobileXira = useCallback(() => {
    setIsMobileXiraOpen(true);
  }, []);

  const handleCloseMobileXira = useCallback(() => {
    setIsMobileXiraOpen(false);
  }, []);

  const buddyDialogue = sessionState?.buddyDialogue || activeDirective?.buddyDirective?.dialogueQuote || currentStep.buddyDialogue;
  const buddyState = sessionState?.buddyState || activeDirective?.buddyDirective?.state || currentStep.buddyState;
  const nextActionLabel = currentStepIndex === totalSteps - 1 ? 'Finish Lesson' : 'Next Step';

  const hasFormulas = React.useMemo(() => Boolean(lesson.hasFormulas && lesson.formulas && lesson.formulas.length > 0), [lesson.hasFormulas, lesson.formulas]);
  const hasQuestions = React.useMemo(() => Boolean(currentStep.checkQuestion || (lesson.questions && lesson.questions.length > 0)), [currentStep.checkQuestion, lesson.questions]);
  const hasHint = React.useMemo(() => Boolean(currentStep.hintText || currentStep.progressiveHint || (lesson.progressiveHints && lesson.progressiveHints.length > 0)), [currentStep.hintText, currentStep.progressiveHint, lesson.progressiveHints]);
  const hasFlashcards = React.useMemo(() => Boolean(lesson.flashcards && lesson.flashcards.length > 0), [lesson.flashcards]);
  const hasSources = React.useMemo(() => Boolean(lesson.sources && lesson.sources.length > 0), [lesson.sources]);

  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] w-full bg-[#040714] text-slate-100 flex flex-col justify-between overflow-hidden relative ${className}`}
    >
      {/* ===================================================================
          FUTURISTIC OBSERVATORY CLASSROOM ENVIRONMENT BACKDROP (100% FIDELITY)
         =================================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Photographic Master Reference Room Backdrop - 100% Crisp Visual Match */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-100 pointer-events-none"
          style={{ backgroundImage: `url('/images/classroom/classroom-master-reference.png')` }}
        />

        {/* Ambient Observatory Ceiling Spotlight - Fast hardware-accelerated radial gradient without Gaussian blur */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.05) 55%, transparent 100%)',
          }}
        />

        {/* Subtle Blue Neon Floor Highlights */}
        <div className="absolute bottom-12 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        <div className="absolute bottom-3 inset-x-1/4 h-px bg-gradient-to-r from-transparent via-sky-400/25 to-transparent" />
      </div>

      {/* ===================================================================
          1. CLASSROOM TOP BAR (Exact Reference Alignment)
         =================================================================== */}
      <header className="sticky top-0 z-40 h-13 sm:h-14 border-b border-white/[0.08] bg-[#060A18]/90 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 select-none shrink-0 shadow-lg">
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

          {/* Search / New Concept */}
          <Link
            href="/learn?tab=explore"
            aria-label="Search and learn a new concept"
            className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.1] text-slate-300 hover:text-white transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5 text-xs font-semibold">New concept</span>
          </Link>

          {/* Mobile Xira Assistant Trigger Button */}
          <button
            type="button"
            onClick={handleOpenMobileXira}
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
          2. MAIN CLASSROOM STAGE (Dedicated Landscape Composition)
         =================================================================== */}
      <main className="flex-1 min-h-0 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-1 sm:py-2 flex flex-col justify-center relative z-10 overflow-y-auto lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[20%_60%_20%] xl:grid-cols-[18%_64%_18%] gap-2 sm:gap-3 xl:gap-4 items-stretch h-auto lg:h-full max-h-full min-h-0">
          {/* Left on Desktop/Landscape: 🤖 3D Buddy Robot Teacher */}
          <div className="order-2 lg:order-1 h-[22vh] min-h-[150px] lg:h-full lg:min-h-0 flex flex-col justify-end items-center overflow-hidden">
            <BuddyTeacherStage
              dialogue={buddyDialogue}
              state={buddyState}
              onNextAction={handleNextStep}
              nextActionLabel={nextActionLabel}
              className="h-full w-full"
            />
          </div>

          {/* Center on Desktop/Landscape: 🖥️ Smart Teaching Board (HERO DOMINANT) */}
          <div className="order-1 lg:order-2 h-[56vh] min-h-[390px] lg:h-full lg:min-h-0 flex flex-col overflow-hidden">
            <SmartBoard
              step={currentStep}
              totalSteps={totalSteps}
              currentStepIndex={currentStepIndex}
              onPreviousStep={handlePreviousStep}
              onNextStep={handleNextStep}
              onQuestionAnswered={handleQuestionAnswered}
              onOpenTool={handleOpenTool}
              adaptiveDirective={activeDirective || undefined}
              visualPayload={sessionState?.currentVisualPayload}
              topicTitle={lesson.topicTitle}
              subject={lesson.subject}
              className="h-full w-full"
            />
          </div>

          {/* Right on Desktop/Landscape: ✨ Contextual Xira Assistant (COMPACT) */}
          <div className="order-3 flex lg:flex h-auto min-h-[180px] lg:h-full lg:min-h-0 flex-col overflow-hidden">
            <ClassroomXiraAssistant
              topicTitle={lesson.topicTitle}
              subject={lesson.subject}
              currentStepTitle={currentStep.title}
              stepHint={currentStep.hintText}
              adaptiveDirective={activeDirective || undefined}
              activeMisconception={sessionState?.xiraIntervention?.message || activeDirective?.detectedMisconception}
              onOpenTool={handleOpenTool}
              className="h-full w-full"
            />
          </div>
        </div>
      </main>

      {downloadNotice && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-16 z-[70] inline-flex items-center gap-2 rounded-full bg-emerald-500/95 text-white px-4 py-2 text-xs font-semibold shadow-xl">
          <Check className="w-4 h-4" />
          {downloadNotice}
        </div>
      )}

      {/* ===================================================================
          3. FLOATING LEARNING TOOLS DOCK (100% Viewport-Safe)
         =================================================================== */}
      <footer className="w-full px-2 sm:px-3 py-1 shrink-0 select-none relative bottom-0 z-30 flex justify-center pb-1">
        <ClassroomToolbar
          activeTool={activeTool}
          onSelectTool={handleOpenTool}
          hasFormulas={hasFormulas}
          hasQuestions={hasQuestions}
          hasHint={hasHint}
          hasFlashcards={hasFlashcards}
          hasSources={hasSources}
          isAudioPlaying={isAudioPlaying}
          onToggleAudio={toggleAudio}
        />
      </footer>

      {/* ===================================================================
          4. MODALS & DRAWERS FOR LEARNING TOOLS
         =================================================================== */}
      <ClassroomToolsModal
        isOpen={activeTool !== null}
        onClose={handleCloseTool}
        toolType={activeTool}
        lesson={lesson}
        currentStep={currentStep}
        currentStepIndex={currentStepIndex}
        onSelectStep={(idx) => setCurrentStepIndex(idx)}
        onOpenTool={handleOpenTool}
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
              onOpenTool={handleOpenTool}
              onCloseMobileDrawer={handleCloseMobileXira}
              className="h-[75vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomLayout;
