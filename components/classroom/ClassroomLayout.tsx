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
import { Sparkles, Search, Check } from 'lucide-react';
import type { ClassroomToolType } from './types';
import { SmartBoard } from './SmartBoard';
import { BuddyTeacherStage } from './BuddyTeacherStage';
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
  const directive = state.directive?.conceptId === state.conceptId ? state.directive.value : null;

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
      const result = defaultClassroomIntelligence.processTelemetry(event);
      dispatch({ type: 'SET_DIRECTIVE', conceptId: event.conceptId, directive: result });
    },
    []
  );

  // ---- Tools / UI state -----------------------------------------------------
  const [activeTool, setActiveTool] = useState<ClassroomToolType | null>(null);
  const [mobileCompanionTab, setMobileCompanionTab] = useState<'buddy' | 'xira'>('buddy');
  const [isMobileXiraOpen, setIsMobileXiraOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  useEffect(() => {
    if (directive?.smartBoardCallout) setMobileCompanionTab('xira');
  }, [directive]);

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
  const handleSelectOption = useCallback((stepId: string, optionId: string) => dispatch({ type: 'SELECT_OPTION', stepId, optionId }), []);
  const handleRetryAnswer = useCallback((stepId: string) => dispatch({ type: 'RETRY_ANSWER', stepId }), []);

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

  const handleOpenTool = useCallback(
    async (tool: ClassroomToolType) => {
      if (tool === 'formula' && lesson.formulas && lesson.formulas.length > 0) {
        await downloadFormulaCards(lesson.topicTitle, lesson.formulas);
        flashNotice('Formula cards generated & downloaded');
        return;
      }
      if (tool === 'flashcards' && lesson.flashcards && lesson.flashcards.length > 0) {
        await downloadFlashcards(
          lesson.topicTitle,
          lesson.flashcards.map((card, idx) => ({ title: card.front.slice(0, 30) || `Card ${idx + 1}`, front: card.front, back: card.back, number: idx + 1 }))
        );
        flashNotice('Flashcards generated & downloaded');
        return;
      }
      if (tool === 'notes') {
        const noteContent = [
          `Step: ${step.title}`,
          step.boardSummary,
          step.keyPrinciple ? `Key Principle: ${step.keyPrinciple}` : '',
          step.formulaSnippet ? `Formula: ${step.formulaSnippet}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        await downloadStudyNote(lesson.topicTitle, noteContent);
        flashNotice('Study note card generated & downloaded');
        return;
      }
      setActiveTool(tool);
    },
    [lesson, step]
  );

  const hasFormulas = Boolean(lesson.hasFormulas && lesson.formulas && lesson.formulas.length > 0);
  const hasQuestions = Boolean(step.checkQuestion || (lesson.questions && lesson.questions.length > 0));
  const hasHint = Boolean(step.hintText || step.progressiveHint || (lesson.progressiveHints && lesson.progressiveHints.length > 0));
  const hasFlashcards = Boolean(lesson.flashcards && lesson.flashcards.length > 0);
  const hasSources = Boolean(lesson.sources && lesson.sources.length > 0);
  const conceptProgress = Math.round(((state.stepIndex + 1) / totalSteps) * 100);
  const currentXp = (state.stepIndex + 1) * 25;
  const nextActionLabel = state.stepIndex === totalSteps - 1 ? 'Finish Lesson' : 'Next Step';
  const intentLabel = INTENT_LABELS[intent];

  return (
    <div
      data-testid="classroom"
      data-persistence={persistence}
      className={`h-[100dvh] max-h-[100dvh] w-full bg-[#040714] text-slate-100 flex flex-col justify-between overflow-hidden relative pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] ${className}`}
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

      {/* Neutral classroom atmosphere (CSS only — no baked-in lesson imagery). */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.14),transparent_60%),linear-gradient(180deg,#060B1E_0%,#040714_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute bottom-12 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 h-12 sm:h-14 border-b border-white/[0.08] bg-[#060A18]/90 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-6 select-none shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              <span className="font-sans font-black text-white text-[11px] sm:text-xs tracking-tighter">XP</span>
            </div>
            <span className="hidden sm:inline font-sans font-black text-sm text-white tracking-widest uppercase">XPEDITION</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-sans text-[11px] sm:text-xs font-semibold shrink-0">
            <span className="text-cyan-400 text-xs">⊞</span>
            <span>Classroom</span>
          </div>
          {intentLabel && (
            <span data-testid="intent-badge" className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[10px] sm:text-[11px] font-semibold shrink-0">
              {intentLabel}
            </span>
          )}
          <div data-testid="class-breadcrumb" className="hidden md:flex items-center gap-2 font-sans text-xs min-w-0">
            <span className="text-slate-400 font-medium truncate">
              {lesson.subject}
              {lesson.category ? ` • ${lesson.category}` : ''}
            </span>
            <span className="text-slate-600">›</span>
            <span data-testid="lesson-title" className="text-slate-200 font-semibold truncate max-w-[260px]">{lesson.topicTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 font-sans text-xs">
            <span className="text-slate-300 font-mono font-medium text-[10px] sm:text-[11px] whitespace-nowrap">
              Step {state.stepIndex + 1}/{totalSteps}
            </span>
            <div className="hidden sm:flex items-center">
              {lesson.steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'GO_TO_STEP', index: idx })}
                    aria-label={`Jump to step ${idx + 1}`}
                    className={`rounded-full transition-all cursor-pointer ${
                      idx === state.stepIndex
                        ? 'w-2.5 h-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]'
                        : idx < state.stepIndex
                        ? 'w-2 h-2 bg-sky-500'
                        : 'w-2 h-2 bg-slate-700'
                    }`}
                  />
                  {idx < totalSteps - 1 && <div className={`w-3 h-0.5 ${idx < state.stepIndex ? 'bg-sky-500' : 'bg-slate-800'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Link
            href="/learn?tab=explore"
            aria-label="Search and learn a new concept"
            className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.1] text-slate-300 hover:text-white"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1.5 text-xs font-semibold">New concept</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileCompanionTab('xira');
              setIsMobileXiraOpen(true);
            }}
            className="flex lg:hidden items-center gap-1 px-2 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-sans text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden min-[400px]:inline">Ask Xira</span>
          </button>
          <Link
            href={backHref}
            aria-label="Exit Classroom"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.12] font-sans text-xs font-semibold shrink-0"
          >
            <span className="text-xs">⎋</span>
            <span className="hidden sm:inline">Exit Class</span>
          </Link>
        </div>
      </header>

      {/* Main stage */}
      <main className="flex-1 min-h-0 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-1 sm:py-2 flex flex-col justify-center relative z-10 overflow-hidden">
        <div className="flex lg:hidden items-center justify-between px-2.5 py-1 rounded-xl bg-[#080E24]/85 border border-white/[0.08] mb-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileCompanionTab('buddy')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                mobileCompanionTab === 'buddy' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 border border-transparent'
              }`}
            >
              <span>🤖</span>
              <span>Buddy</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileCompanionTab('xira')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                mobileCompanionTab === 'xira' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 border border-transparent'
              }`}
            >
              <span>✨</span>
              <span>Xira</span>
              {directive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </button>
          </div>
          <button type="button" onClick={() => setIsMobileXiraOpen(true)} className="text-[11px] font-mono text-indigo-300 cursor-pointer">
            Chat ↗
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[20%_60%_20%] xl:grid-cols-[18%_64%_18%] gap-2 sm:gap-3 xl:gap-4 items-stretch h-full max-h-full min-h-0">
          <div
            data-testid="buddy-column"
            className={`order-2 lg:order-1 min-h-0 flex-col justify-end items-center overflow-hidden ${
              mobileCompanionTab === 'buddy' ? 'flex h-[26vh] sm:h-[30vh] lg:h-full' : 'hidden lg:flex lg:h-full'
            }`}
          >
            <BuddyTeacherStage
              dialogue={buddy.dialogue}
              state={buddy.mood}
              onNextAction={handleNextStep}
              nextActionLabel={nextActionLabel}
              className="h-full w-full"
            />
          </div>

          <div className="order-1 lg:order-2 flex-1 min-h-[260px] sm:min-h-[320px] lg:h-full lg:min-h-0 flex flex-col overflow-hidden min-w-0">
            <SmartBoard
              concept={concept}
              lesson={lesson}
              stepIndex={state.stepIndex}
              answer={state.answer}
              onSelectOption={handleSelectOption}
              onSubmitAnswer={handleSubmitAnswer}
              onRetryAnswer={handleRetryAnswer}
              onPreviousStep={handlePreviousStep}
              onNextStep={handleNextStep}
              onOpenTool={handleOpenTool}
              adaptiveDirective={directive ?? undefined}
              artworkUrl={state.artwork?.conceptId === state.conceptId && state.artwork.stepIndex === state.stepIndex ? state.artwork.assetUrl : undefined}
              className="h-full w-full"
            />
          </div>

          <div
            className={`order-3 min-h-0 flex-col overflow-hidden ${
              mobileCompanionTab === 'xira' ? 'flex h-[26vh] sm:h-[30vh] lg:h-full' : 'hidden lg:flex lg:h-full'
            }`}
          >
            <ClassroomXiraAssistant
              context={xiraContext}
              prompts={lesson.xiraPrompts}
              adaptiveDirective={directive ?? undefined}
              activeMisconception={directive?.detectedMisconception}
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

      <footer className="w-full px-2 sm:px-3 py-1 shrink-0 select-none relative z-30 flex justify-center pb-1">
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
          currentXp={currentXp}
        />
      </footer>

      <ClassroomToolsModal
        isOpen={activeTool !== null}
        onClose={() => setActiveTool(null)}
        toolType={activeTool}
        lesson={lesson}
        currentStep={step}
        currentStepIndex={state.stepIndex}
        onSelectStep={(idx) => dispatch({ type: 'GO_TO_STEP', index: idx })}
        onOpenTool={handleOpenTool}
        onTelemetry={handleTelemetry}
      />

      {isMobileXiraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="w-full max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl">
            <ClassroomXiraAssistant
              context={xiraContext}
              prompts={lesson.xiraPrompts}
              adaptiveDirective={directive ?? undefined}
              activeMisconception={directive?.detectedMisconception}
              onOpenTool={handleOpenTool}
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
