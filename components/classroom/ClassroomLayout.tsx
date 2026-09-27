'use client';

/**
 * ClassroomLayout — the Class runtime shell (Buddy · Smart Board · Xira · tools).
 *
 * Input is a RESOLVED lesson from `resolveClassLesson()` (lib/concepts). This
 * component never looks up concepts itself and has no default concept.
 *
 * All lesson-scoped state is owned by `classRuntimeReducer`. The page mounts
 * this component with `key={conceptId|intent}`, so switching concept performs
 * a full reset. As a second line of defence, a concept/lesson change without a
 * remount re-initialises the reducer.
 */

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Search, Check, LogOut } from 'lucide-react';
import type { ClassroomToolType } from './types';
import { SmartBoard } from './SmartBoard';
import { BuddyTeacherStage } from './BuddyTeacherStage';
import { ClassroomEnvironment } from './ClassroomEnvironment';
import { ClassroomXiraAssistant } from './ClassroomXiraAssistant';
import { ClassroomToolbar } from './ClassroomToolbar';
import { ClassroomToolsModal } from './tools/ClassroomToolsModal';
import { defaultClassroomIntelligence, type ClassroomTelemetryEvent } from '@/lib/classroom/classroomIntelligence';
import { downloadFlashcards, downloadFormulaCards, downloadStudyNote } from '@/lib/learningObjectsDownloads';
import { requestExternalTeachingScene } from '@/lib/classroom/integrations/classroomIntegrationRuntime';
import {
  classRuntimeReducer,
  createClassRuntimeState,
  selectBuddy,
  selectCurrentStep,
  selectVisualToken,
  selectXiraContext,
  selectBoardView,
  selectEvidenceSummary,
  selectXiraObservation,
  isStepResolved,
  maxReachableStep,
  stepActivityKind,
} from '@/lib/classroom/classRuntime';
import { resolveStepStage } from '@/lib/classroom/classStage';
import { currentAuthMode } from '@/lib/auth/authMode';
import { supabase } from '@/lib/supabase';
import { shouldRequestServerSession, type ClassPersistence } from '@/lib/classroom/classPersistence';
import type { CanonicalConcept, ClassIntent } from '@/lib/concepts/types';
import type { ClassroomLesson } from './types';

export interface ClassroomLayoutProps {
  requestedConceptId: string;
  concept: CanonicalConcept;
  lesson: ClassroomLesson;
  intent: ClassIntent;
  backHref?: string;
  onClassComplete?: () => void;
  className?: string;
}

/** Room/board accent per teaching stage (see ClassroomEnvironment). */
const STAGE_ACCENT: Record<string, string> = {
  default: '#38BDF8',
  question: '#818CF8',
  practice: '#818CF8',
  challenge: '#F59E0B',
  assess: '#A78BFA',
  reward: '#34D399',
  complete: '#34D399',
};

const INTENT_LABELS: Partial<Record<ClassIntent, string>> = {
  revision: 'Revision',
  exam: 'Exam prep',
  gk: 'General knowledge',
  course: 'Course',
  project: 'Project',
};

export const ClassroomLayout: React.FC<ClassroomLayoutProps> = ({
  requestedConceptId,
  concept,
  lesson,
  intent,
  backHref = '/learn',
  onClassComplete,
  className = '',
}) => {
  const [state, dispatch] = useReducer(classRuntimeReducer, undefined, () => createClassRuntimeState(lesson, intent));

  // Defensive re-init if props change without a remount.
  useEffect(() => {
    if (state.conceptId !== lesson.conceptId || state.lessonId !== lesson.id || state.intent !== intent) {
      dispatch({ type: 'INIT', lesson, intent });
    }
  }, [lesson, intent, state.conceptId, state.lessonId, state.intent]);

  const step = selectCurrentStep(state);
  const totalSteps = lesson.steps.length;
  const stage = resolveStepStage(step, state.stepIndex, totalSteps);
  const buddy = selectBuddy(state);
  const xiraContext = selectXiraContext(state);
  const boardView = selectBoardView(state);
  const evidenceSummary = selectEvidenceSummary(state);
  const xiraObservation = selectXiraObservation(state);
  const stepEvidence = state.evidence[step.id];
  const nextBlocked = !isStepResolved(state, state.stepIndex);
  const reachable = maxReachableStep(state);

  // ---- Server session (identity-checked; never drives content) -------------
  // One create per concept|intent; the request is aborted on unmount.
  const initializedConceptRef = useRef<string | null>(null);
  const [persistence, setPersistence] = useState<ClassPersistence>('pending');
  useEffect(() => {
    const sessionKey = `${lesson.conceptId}|${intent}`;
    if (initializedConceptRef.current === sessionKey) return;
    initializedConceptRef.current = sessionKey;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // See lib/classroom/classPersistence.ts: only an authenticated learner gets a
    // server session; guests are explicitly ephemeral (nothing persisted).
    shouldRequestServerSession(currentAuthMode(), supabase ? supabase.auth : null).then((eligible) => {
      if (controller.signal.aborted) return;
      if (!eligible) {
        setPersistence('guest_ephemeral');
        return;
      }
      timer = setTimeout(() => controller.abort(), 3000);
      fetch('/api/classroom/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', conceptId: lesson.conceptId, intent }),
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.session) {
            dispatch({ type: 'SESSION_CREATED', session: data.session });
            setPersistence('server_session');
          } else {
            setPersistence('guest_ephemeral');
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') console.warn('[ClassroomLayout] Session init warning:', err?.message);
        })
        .finally(() => {
          if (timer) clearTimeout(timer);
        });
    });
    return () => {
      if (timer) clearTimeout(timer);
      controller.abort();
      initializedConceptRef.current = null;
    };
  }, [lesson.conceptId, intent]);

  // ---- Optional external scene (artwork only; identity + generation gated) --
  const token = selectVisualToken(state);
  useEffect(() => {
    const controller = new AbortController();
    const requestToken = { ...token };
    requestExternalTeachingScene({ lesson, step, stepIndex: requestToken.stepIndex, signal: controller.signal })
      .then((payload) => {
        if (!controller.signal.aborted && payload) {
          dispatch({ type: 'EXTERNAL_VISUAL', token: requestToken, payload });
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.warn('[ClassroomLayout] External scene warning:', err?.message);
      });
    return () => controller.abort();
    // token fields are primitives; listing them keeps the effect keyed to concept+step+generation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token.conceptId, token.stepIndex, token.generation]);

  // ---- Adaptive intelligence (directive is concept-tagged) -----------------
  const handleTelemetry = useCallback(
    (event: ClassroomTelemetryEvent) => {
      // The service keeps its own counters, but its generic directives are NOT
      // surfaced in the Class: Xira's observations come from this class's real
      // evidence (selectXiraObservation). A hint request counts as evidence.
      defaultClassroomIntelligence.processTelemetry(event);
      if (event.eventType === 'hint_requested' && event.conceptId === lesson.conceptId) {
        dispatch({ type: 'REVEAL_HINT' });
      }
    },
    [lesson.conceptId]
  );

  // ---- Tools / UI state -----------------------------------------------------
  const [activeTool, setActiveTool] = useState<ClassroomToolType | null>(null);
  const [isMobileXiraOpen, setIsMobileXiraOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const xiraNeedsAttention = Boolean(xiraObservation && (xiraObservation.kind === 'misconception' || xiraObservation.kind === 'scaffold'));

  const completedRef = useRef(false);
  useEffect(() => {
    if (state.completed && !completedRef.current) {
      completedRef.current = true;
      onClassComplete?.();
    }
  }, [state.completed, onClassComplete]);

  const toggleAudio = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isAudioPlaying) {
      setIsAudioPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(buddy.dialogue);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onend = () => setIsAudioPlaying(false);
    utterance.onerror = () => setIsAudioPlaying(false);
    setIsAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [buddy.dialogue, isAudioPlaying]);

  const handleNextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const handlePreviousStep = useCallback(() => dispatch({ type: 'PREVIOUS_STEP' }), []);
  const handleGoToStep = useCallback((index: number) => dispatch({ type: 'GO_TO_STEP', index }), []);
  const handleSelectOption = useCallback((stepId: string, optionId: string) => dispatch({ type: 'SELECT_OPTION', stepId, optionId }), []);
  const handleRetryAnswer = useCallback((stepId: string) => dispatch({ type: 'RETRY_ANSWER', stepId }), []);
  const handleRevealAnswer = useCallback((stepId: string) => dispatch({ type: 'REVEAL_ANSWER', stepId }), []);
  const handleBoardActivity = useCallback(
    (stepId: string, result: { completed: boolean; wrong: number }) =>
      dispatch({ type: 'BOARD_ACTIVITY', stepId, completed: result.completed, wrong: result.wrong }),
    []
  );
  const handleObservationAction = useCallback(
    (action: { kind: 'hint' | 'reveal_answer' | 'revisit'; stepIndex?: number }) => {
      if (action.kind === 'hint') dispatch({ type: 'REVEAL_HINT' });
      else if (action.kind === 'reveal_answer') dispatch({ type: 'REVEAL_ANSWER', stepId: step.id });
      else if (action.kind === 'revisit' && typeof action.stepIndex === 'number') dispatch({ type: 'GO_TO_STEP', index: action.stepIndex });
    },
    [step.id]
  );

  const handleSubmitAnswer = useCallback(
    (stepId: string) => {
      const option = step.checkQuestion?.options.find((o) => o.id === state.answer.selectedOptionId);
      dispatch({ type: 'SUBMIT_ANSWER', stepId });
      if (option && stepId === step.id) {
        handleTelemetry({
          eventType: 'question_attempt',
          conceptId: lesson.conceptId,
          conceptName: lesson.topicTitle,
          stepIndex: state.stepIndex,
          stepTitle: step.title,
          timestamp: Date.now(),
          data: {
            isCorrect: option.isCorrect,
            questionId: step.checkQuestion?.id || step.id,
            attemptNumber: state.answer.attempts + 1,
          },
        });
      }
    },
    [step, state.answer.selectedOptionId, state.answer.attempts, state.stepIndex, lesson.conceptId, lesson.topicTitle, handleTelemetry]
  );

  const flashNotice = (text: string) => {
    setDownloadNotice(text);
    window.setTimeout(() => setDownloadNotice(null), 2600);
  };

  // Every tool opens INSIDE the class (focused sheet). Saving a card as a file
  // is an explicit action inside the tool, never a surprise download.
  const handleOpenTool = useCallback((tool: ClassroomToolType) => setActiveTool(tool), []);

  const handleDownload = useCallback(
    async (kind: 'formula' | 'flashcards' | 'notes', notes?: string) => {
      if (kind === 'formula' && lesson.formulas && lesson.formulas.length > 0) {
        await downloadFormulaCards(lesson.topicTitle, lesson.formulas);
        flashNotice('Formula cards downloaded');
      } else if (kind === 'flashcards' && lesson.flashcards && lesson.flashcards.length > 0) {
        await downloadFlashcards(
          lesson.topicTitle,
          lesson.flashcards.map((card, idx) => ({ title: card.front.slice(0, 30) || `Card ${idx + 1}`, front: card.front, back: card.back, number: idx + 1 }))
        );
        flashNotice('Flashcards downloaded');
      } else if (kind === 'notes') {
        const noteContent = [
          `Step: ${step.title}`,
          step.boardSummary,
          step.keyPrinciple ? `Key Principle: ${step.keyPrinciple}` : '',
          step.formulaSnippet ? `Formula: ${step.formulaSnippet}` : '',
          notes?.trim() ? `My notes: ${notes.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        await downloadStudyNote(lesson.topicTitle, noteContent);
        flashNotice('Study note card downloaded');
      }
    },
    [lesson, step]
  );

  const hasFormulas = Boolean(lesson.hasFormulas && lesson.formulas && lesson.formulas.length > 0);
  const hasQuestions = Boolean(step.checkQuestion || (lesson.questions && lesson.questions.length > 0));
  const hasHint = Boolean(step.hintText || step.progressiveHint || (lesson.progressiveHints && lesson.progressiveHints.length > 0));
  const hasFlashcards = Boolean(lesson.flashcards && lesson.flashcards.length > 0);
  const hasSources = Boolean(lesson.sources && lesson.sources.length > 0);
  const conceptProgress = Math.round(((state.stepIndex + 1) / totalSteps) * 100);
  const intentLabel = INTENT_LABELS[intent];

  // The room answers the teaching stage: the board glow and wall wash change
  // colour for challenge / assessment / the class result.
  const accent = state.completed
    ? STAGE_ACCENT.complete
    : STAGE_ACCENT[stage] ?? STAGE_ACCENT.default;
  const completion = state.completed
    ? {
        summary: evidenceSummary,
        onRevisit: handleGoToStep,
        onReviewCards: hasFlashcards ? () => setActiveTool('flashcards') : undefined,
        nextHref: '/learn?tab=explore',
      }
    : null;

  const xiraButton = (
    <button
      type="button"
      data-testid="xira-open"
      onClick={() => setIsMobileXiraOpen(true)}
      aria-label={xiraNeedsAttention ? 'Open Xira: Xira has a note on your answer' : 'Open Xira'}
      className="relative shrink-0 w-[52px] self-stretch rounded-2xl border border-indigo-400/35 bg-indigo-500/15 text-indigo-200 flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300"
    >
      <Sparkles className="w-4 h-4" />
      <span className="text-[10px] font-semibold">Xira</span>
      {xiraNeedsAttention && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
    </button>
  );

  return (
    <div
      data-testid="classroom"
      data-persistence={persistence}
      data-class-stage={state.completed ? 'complete' : stage}
      className={`h-[100dvh] max-h-[100dvh] w-full bg-[#040714] text-slate-100 flex flex-col overflow-hidden relative pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] ${className}`}
    >
      {/* Identity probe: read by browser tests to assert the identity chain. */}
      <div
        hidden
        data-testid="class-identity"
        data-requested-concept={requestedConceptId}
        data-resolved-concept={concept.id}
        data-lesson-concept={lesson.conceptId}
        data-state-concept={state.conceptId}
        data-stage-concept={state.conceptId === lesson.conceptId ? lesson.conceptId : ''}
        data-intent={state.intent}
        data-step-index={state.stepIndex}
        data-stage={stage}
        data-session-concept={state.session?.conceptId ?? ''}
        data-rejected-count={state.rejectedCount}
      />

      {/* The classroom itself (DOM/SVG + reused interior render; no screenshot). */}
      <ClassroomEnvironment accent={accent} />

      {/* Top bar */}
      <header className="relative z-40 h-12 lg:h-14 border-b border-white/[0.07] bg-[#050A1A]/80 backdrop-blur-md flex items-center justify-between gap-2 px-3 sm:px-5 lg:px-7 select-none shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span aria-hidden="true" className="font-sans font-black text-lg lg:text-xl leading-none text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]">✕</span>
            <span className="hidden sm:inline font-sans font-semibold text-sm lg:text-[15px] text-white tracking-[0.28em] uppercase">Xpedition</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 lg:py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-200 font-sans text-xs font-semibold shrink-0">
            <span aria-hidden="true" className="text-sky-300 text-[11px]">⊞</span>
            <span>Classroom</span>
          </div>
          {intentLabel && (
            <span data-testid="intent-badge" className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[10px] sm:text-[11px] font-semibold shrink-0">
              {intentLabel}
            </span>
          )}
          <div data-testid="class-breadcrumb" className="hidden md:flex items-center gap-3 font-sans text-xs lg:text-[13px] min-w-0">
            <span className="text-slate-300 font-medium truncate">
              {lesson.subject}
              {lesson.category ? ` • ${lesson.category}` : ''}
            </span>
            <span aria-hidden="true" className="w-px h-4 bg-white/15" />
            <span data-testid="lesson-title" className="text-white font-semibold truncate max-w-[280px]">{lesson.topicTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 lg:gap-3 font-sans text-xs">
            <span className="text-slate-200 font-semibold text-[11px] lg:text-[13px] whitespace-nowrap">
              Step {state.stepIndex + 1} / {totalSteps}
            </span>
            <div className="hidden sm:flex items-center" role="group" aria-label="Lesson steps">
              {lesson.steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'GO_TO_STEP', index: idx })}
                    disabled={idx > reachable}
                    aria-label={`Jump to step ${idx + 1}`}
                    aria-current={idx === state.stepIndex ? 'step' : undefined}
                    className="p-1 rounded-full cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                  >
                    <span
                      className={`block rounded-full transition-all ${
                        idx === state.stepIndex
                          ? 'w-3 h-3 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                          : idx < state.stepIndex
                          ? 'w-2 h-2 bg-sky-500/80'
                          : 'w-2 h-2 bg-slate-600'
                      }`}
                    />
                  </button>
                  {idx < totalSteps - 1 && <span aria-hidden="true" className={`w-3 lg:w-4 h-px ${idx < state.stepIndex ? 'bg-sky-500/80' : 'bg-slate-600/70'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Link
            href="/learn?tab=explore"
            aria-label="Search and learn a new concept"
            className="flex items-center justify-center w-8 h-8 lg:w-auto lg:h-auto lg:px-3 lg:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.1] text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden lg:inline ml-1.5 text-xs font-semibold">New concept</span>
          </Link>
          <Link
            href={backHref}
            aria-label="Exit Classroom"
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 lg:h-auto lg:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/[0.14] font-sans text-xs font-semibold shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Class</span>
          </Link>
        </div>
      </header>

      {/* Classroom stage: Buddy · Smart Board · Xira */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-[1680px] mx-auto px-2.5 sm:px-4 lg:px-6 pt-2 lg:pt-4 pb-1">
        <div className="h-full min-h-0 grid grid-cols-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-rows-1 lg:grid-cols-[minmax(200px,19%)_minmax(0,1fr)_minmax(232px,18%)] gap-2 lg:gap-5 xl:gap-6">
          {/* Buddy: standing beside the board (desktop) / on the strip under it (phones). */}
          <div
            data-testid="buddy-column"
            className="order-2 lg:order-1 min-h-0 h-[108px] sm:h-[116px] lg:h-full flex lg:flex-col lg:justify-end"
          >
            <BuddyTeacherStage dialogue={buddy.dialogue} state={buddy.mood} variant="stage" className="hidden lg:flex" />
            <BuddyTeacherStage dialogue={buddy.dialogue} state={buddy.mood} variant="compact" className="lg:hidden" accessory={xiraButton} />
          </div>

          {/* Smart Board: the main teaching surface, framed as a wall display. */}
          <div className="order-1 lg:order-2 min-h-0 min-w-0 flex flex-col">
            <div
              data-testid="smartboard-frame"
              className="relative flex-1 min-h-0 rounded-[22px] lg:rounded-[26px] p-[4px] lg:p-[7px] bg-gradient-to-b from-[#1A2448] via-[#0B1230] to-[#070B1D] border border-slate-400/20 transition-shadow duration-700"
              style={{ boxShadow: `0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px ${accent}40, 0 0 36px -6px ${accent}80` }}
            >
              <div aria-hidden="true" className="pointer-events-none absolute top-0 right-6 left-1/3 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
              <SmartBoard
                concept={concept}
                lesson={lesson}
                stepIndex={state.stepIndex}
                answer={state.answer}
                onSelectOption={handleSelectOption}
                onSubmitAnswer={handleSubmitAnswer}
                onRetryAnswer={handleRetryAnswer}
                onRevealAnswer={handleRevealAnswer}
                boardView={boardView}
                stepEvidence={stepEvidence}
                nextBlocked={nextBlocked}
                onBoardActivity={handleBoardActivity}
                activityKind={stepActivityKind(step)}
                onPreviousStep={handlePreviousStep}
                onNextStep={handleNextStep}
                onOpenTool={handleOpenTool}
                artworkUrl={state.artwork?.conceptId === state.conceptId && state.artwork.stepIndex === state.stepIndex ? state.artwork.assetUrl : undefined}
                completion={completion}
                className="h-full w-full"
              />
            </div>
            {/* Board mount */}
            <div aria-hidden="true" className="hidden lg:block mx-auto w-[42%] h-2 rounded-b-xl bg-gradient-to-b from-[#1A2448] to-[#070B1D] border-x border-b border-slate-400/15" />
          </div>

          {/* Xira: contextual assistance beside the board (desktop). Phones open it as a sheet. */}
          <div className="order-3 hidden lg:flex min-h-0 flex-col self-start max-h-full">
            <ClassroomXiraAssistant
              context={xiraContext}
              prompts={lesson.xiraPrompts}
              observation={xiraObservation}
              onObservationAction={handleObservationAction}
              onOpenTool={handleOpenTool}
              className="max-h-full w-full"
            />
          </div>
        </div>
      </main>

      {downloadNotice && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-24 z-[70] inline-flex items-center gap-2 rounded-full bg-emerald-500/95 text-white px-4 py-2 text-xs font-semibold shadow-xl">
          <Check className="w-4 h-4" />
          {downloadNotice}
        </div>
      )}

      {/* Learning dock */}
      <footer className="relative z-30 w-full px-2 sm:px-3 pt-1 pb-1.5 lg:pb-3 shrink-0 select-none flex justify-center">
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
          conceptProgress={conceptProgress}
          checksFirstTry={evidenceSummary.firstTryCorrect}
          checksTotal={evidenceSummary.totalChecks}
        />
      </footer>

      <ClassroomToolsModal
        isOpen={activeTool !== null}
        onClose={() => setActiveTool(null)}
        toolType={activeTool}
        lesson={lesson}
        currentStep={step}
        currentStepIndex={state.stepIndex}
        onSelectStep={handleGoToStep}
        onOpenTool={handleOpenTool}
        onTelemetry={handleTelemetry}
        maxReachableStep={reachable}
        onDownload={handleDownload}
      />

      {isMobileXiraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#02040C]/70 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileXiraOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xira"
            className="w-full max-h-[85dvh] rounded-t-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ClassroomXiraAssistant
              context={xiraContext}
              prompts={lesson.xiraPrompts}
              observation={xiraObservation}
              onObservationAction={(a) => {
                handleObservationAction(a);
                if (a.kind !== 'hint') setIsMobileXiraOpen(false);
              }}
              onOpenTool={(t) => {
                setIsMobileXiraOpen(false);
                handleOpenTool(t);
              }}
              onCloseMobileDrawer={() => setIsMobileXiraOpen(false)}
              className="max-h-[80dvh] rounded-b-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomLayout;
