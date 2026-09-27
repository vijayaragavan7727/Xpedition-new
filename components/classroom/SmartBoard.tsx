'use client';

/**
 * Smart Board — the dominant teaching surface of the Class.
 *
 * Presentational only: all lesson-scoped state (step, answer, feedback) lives in
 * the class runtime reducer (lib/classroom/classRuntime.ts). Every piece of text
 * here comes from the ACTIVE lesson. There are no subject-specific defaults:
 * if a step has no "Try This" or common mistake, the card is simply not shown.
 *
 * The visual is built deterministically for the active concept + step
 * (buildStepVisualPayload) and passes the identity gate in the renderer.
 * Optional AI artwork is accepted upstream only for the same concept + step
 * and never replaces the deterministic visual.
 */

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, HelpCircle, CheckCircle2, RotateCw, Lightbulb, Trophy, ArrowRight, Eye } from 'lucide-react';
import type { ClassroomLesson, ClassroomToolType } from './types';
import type { AdaptiveDirective } from '@/lib/classroom/classroomIntelligence';
import type { CanonicalConcept } from '@/lib/concepts/types';
import type { ClassAnswerState, StepEvidence, LessonEvidenceSummary } from '@/lib/classroom/classRuntime';
import { REVEAL_AFTER_ATTEMPTS } from '@/lib/classroom/classRuntime';
import { orderOptions } from '@/lib/classroom/optionOrder';
import { StickyNote } from '@/components/learning-objects';
import { SmartBoardVisualRenderer } from './SmartBoardVisualRenderer';
import { BoardTeaching, useTeachingState } from './BoardTeaching';
import { buildStepVisualPayload } from '@/lib/classroom/visualIdentity';
import { resolveStepStage, CLASS_STAGE_LABELS } from '@/lib/classroom/classStage';

export interface SmartBoardProps {
  concept: CanonicalConcept;
  lesson: ClassroomLesson;
  stepIndex: number;
  answer: ClassAnswerState;
  onSelectOption: (stepId: string, optionId: string) => void;
  onSubmitAnswer: (stepId: string) => void;
  onRetryAnswer: (stepId: string) => void;
  /** Shows the answer + explanation; only offered after REVEAL_AFTER_ATTEMPTS wrong attempts. */
  onRevealAnswer?: (stepId: string) => void;
  /** Predict-first view of the active step (board summary / key principle visibility). */
  boardView?: { title?: string; summary: string; showKeyPrinciple: boolean; predicting: boolean };
  /** Learner evidence for the active step. */
  stepEvidence?: StepEvidence;
  /** True while the active step's check is unresolved: Next is blocked. */
  nextBlocked?: boolean;
  /** Hands-on board activity on this step (evidence), reported by the visual. */
  onBoardActivity?: (stepId: string, result: { completed: boolean; wrong: number }) => void;
  activityKind?: 'trace' | 'order' | 'challenge' | null;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onOpenTool?: (tool: ClassroomToolType) => void;
  adaptiveDirective?: AdaptiveDirective;
  /** Optional artwork already identity-checked for this concept + step. */
  artworkUrl?: string;
  /**
   * Set once the learner finishes the lesson: the board shows the class result
   * built from the recorded evidence (never step XP or invented mastery).
   */
  /** Buddy narrates the "How it works" point the learner is on (null = Buddy's lesson line). */
  onTeachLine?: (stepId: string, line: string | null) => void;
  completion?: {
    summary: LessonEvidenceSummary;
    onRevisit: (stepIndex: number) => void;
    onReviewCards?: () => void;
    nextHref: string;
  } | null;
  className?: string;
}

const REVIEW_LABEL: Record<LessonEvidenceSummary['review'][number]['outcome'], string> = {
  after_retry: 'right after a retry',
  revealed: 'answer was shown',
  activity_skipped: 'board activity not finished',
};

/** Class result on the board. Every number comes from the learner's recorded evidence. */
const CompletionPanel: React.FC<{ topicTitle: string; completion: NonNullable<SmartBoardProps['completion']> }> = ({ topicTitle, completion }) => {
  const { summary } = completion;
  const allFirstTry = summary.totalChecks > 0 && summary.firstTryCorrect === summary.totalChecks && summary.activitiesCompleted === summary.activitiesTotal;
  const stats: Array<[string, string]> = [];
  if (summary.totalChecks > 0) stats.push(['Right first try', `${summary.firstTryCorrect} of ${summary.totalChecks}`]);
  if (summary.correctAfterRetry > 0) stats.push(['Right after retry', String(summary.correctAfterRetry)]);
  if (summary.revealed > 0) stats.push(['Answer shown', String(summary.revealed)]);
  if (summary.activitiesTotal > 0) stats.push(['Board activities', `${summary.activitiesCompleted} of ${summary.activitiesTotal}`]);
  if (summary.hintsUsed > 0) stats.push(['Hints opened', String(summary.hintsUsed)]);
  return (
    <section
      data-testid="class-completion"
      aria-label="Class result"
      className="shrink-0 rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/[0.12] via-[#071430] to-[#071430] p-3.5 sm:p-4 space-y-3 shadow-[0_0_30px_-10px_rgba(52,211,153,0.6)]"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
          <Trophy className="w-[18px] h-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">Class complete</p>
          <p className="font-sans font-bold text-sm sm:text-base text-white truncate">{topicTitle}</p>
        </div>
      </div>
      {stats.length > 0 && (
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-black/25 border border-white/[0.08] px-3 py-2">
              <dt className="text-[10px] font-sans text-slate-400">{label}</dt>
              <dd className="font-mono text-sm font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {summary.review.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] font-sans font-semibold text-amber-200">Worth another look</p>
          {summary.review.map((r) => (
            <button
              key={`${r.index}-${r.outcome}`}
              type="button"
              data-completion-revisit={r.index}
              onClick={() => completion.onRevisit(r.index)}
              className="w-full min-h-[36px] text-left px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-[12px] text-slate-200 flex items-center justify-between gap-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              <span className="truncate">Step {r.index + 1}: {r.title}</span>
              <span className="text-[10px] font-mono text-amber-300 shrink-0">{REVIEW_LABEL[r.outcome]}</span>
            </button>
          ))}
        </div>
      ) : (
        allFirstTry && <p className="text-[12px] text-emerald-200">Every check right on the first try, and every board activity done.</p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {completion.onReviewCards && (
          <button
            type="button"
            onClick={completion.onReviewCards}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 text-xs font-semibold cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
          >
            Review with flashcards
          </button>
        )}
        <Link
          href={completion.nextHref}
          data-testid="next-concept-link"
          className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
        >
          Choose your next concept <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
};

export const SmartBoard: React.FC<SmartBoardProps> = React.memo(({
  concept,
  lesson,
  stepIndex,
  answer,
  onSelectOption,
  onSubmitAnswer,
  onRetryAnswer,
  onRevealAnswer,
  boardView,
  stepEvidence,
  nextBlocked = false,
  onBoardActivity,
  activityKind = null,
  onPreviousStep,
  onNextStep,
  onOpenTool,
  adaptiveDirective,
  artworkUrl,
  completion,
  onTeachLine,
  className = '',
}) => {
  const step = lesson.steps[stepIndex];
  const totalSteps = lesson.steps.length;
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const handleToggleRotation = useCallback(() => setIsRotating((prev) => !prev), []);
  const handleHotspotClick = useCallback(() => onOpenTool?.('lesson'), [onOpenTool]);

  const stage = resolveStepStage(step, stepIndex, totalSteps);

  // Authoritative deterministic payload for the ACTIVE concept + step.
  const visualPayload = useMemo(() => {
    const payload = buildStepVisualPayload(concept, lesson, step, stepIndex);
    return artworkUrl ? { ...payload, assetUrl: artworkUrl } : payload;
  }, [concept, lesson, step, stepIndex, artworkUrl]);

  const question = step.checkQuestion;
  const answerForThisStep = answer.stepId === step.id ? answer : null;
  const selectedOption = question?.options.find((o) => o.id === answerForThisStep?.selectedOptionId);
  const displayOptions = useMemo(
    () => (question ? orderOptions(question.id || step.id, question.options) : []),
    [question, step.id]
  );
  const summaryText = boardView?.summary ?? step.boardSummary;
  const showKeyPrinciple = boardView?.showKeyPrinciple ?? true;
  const wrongAttempts = stepEvidence?.wrongOptionIds.length ?? 0;
  const resolution = stepEvidence?.resolution ?? null;
  const answerState: 'idle' | 'incorrect' | 'correct' | 'revealed' = resolution === 'revealed' || answerForThisStep?.revealed
    ? 'revealed'
    : answerForThisStep?.submitted
      ? answerForThisStep.isCorrect ? 'correct' : 'incorrect'
      : 'idle';
  const questionRef = React.useRef<HTMLDivElement>(null);
  const handleActivity = useCallback(
    (result: { completed: boolean; wrong: number }) => onBoardActivity?.(step.id, result),
    [onBoardActivity, step.id]
  );
  const activity = stepEvidence?.activity;
  // Theory for this step, and the part of the visual the current explanation is about.
  const teach = step.teach;
  const stepFormulas = useMemo(
    () => (teach?.formulaIds ?? []).map((id) => lesson.formulas?.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => Boolean(f)),
    [teach, lesson.formulas]
  );
  const handleBuddyLine = useCallback((line: string | null) => onTeachLine?.(step.id, line), [onTeachLine, step.id]);
  const teaching = useTeachingState(step.id, teach, handleBuddyLine);
  const theoryLocked = !(boardView?.showKeyPrinciple ?? true);
  const visualFocus = theoryLocked ? null : teaching.focus;
  const howPoints = teach?.how ?? [];
  const activeHow = !theoryLocked && teaching.tab === 'how' ? howPoints[teaching.point] : undefined;
  const visualColumnRef = React.useRef<HTMLDivElement>(null);
  // A visual that needs the full board width (all 18 groups of the periodic
  // table) sits under the theory instead of beside it.
  const wideVisual = concept.visualKind === 'periodic_table_interactive';
  // Phones: the visual sits above the theory, so bring it into view when the
  // learner moves to a "How it works" point that highlights part of it.
  React.useEffect(() => {
    if (!activeHow || typeof window === 'undefined' || window.innerWidth >= 768) return;
    visualColumnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeHow]);
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const isComplete = Boolean(completion);
  React.useEffect(() => {
    // Finishing the class: bring the result (top of the board) into view.
    if (isComplete) surfaceRef.current?.scrollTo({ top: 0 });
  }, [isComplete]);
  const handleNext = useCallback(() => {
    if (nextBlocked) {
      // Learning by doing: bring the unanswered check into view instead of skipping it.
      questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      questionRef.current?.querySelector<HTMLButtonElement>('button[data-option-id]:not([disabled])')?.focus({ preventScroll: true });
      return;
    }
    if (isComplete) {
      // Already finished: the button shows the class result again.
      surfaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onNextStep();
  }, [nextBlocked, onNextStep, isComplete]);

  return (
    <div
      data-testid="smart-board"
      data-concept-id={concept.id}
      data-lesson-id={lesson.id}
      data-step-id={step.id}
      data-step-index={stepIndex}
      data-stage={stage}
      className={`relative flex flex-col justify-between rounded-[18px] lg:rounded-[20px] bg-[radial-gradient(ellipse_at_top,#0B1A40_0%,#060C22_55%,#050A1C_100%)] border border-sky-300/20 overflow-hidden ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 60px rgba(2,6,23,0.8)' }}
    >
      {/* Screen glare */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.10),transparent_65%)]" />

      {/* Header */}
      <div className="w-full px-4 sm:px-5 pt-2.5 sm:pt-3.5 pb-2 flex items-center justify-between border-b border-white/[0.06] select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sky-300 font-sans text-[11px] font-bold tracking-[0.18em] uppercase">Smart Board</span>
          <span data-testid="stage-chip" className="ml-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.12] text-[10px] font-mono text-slate-200 uppercase tracking-wide">
            {completion ? 'Complete' : CLASS_STAGE_LABELS[stage]}
          </span>
        </div>
        {concept.visualKind === 'dc_motor_diagram' && (
          <button
            type="button"
            onClick={handleToggleRotation}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
          >
            <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isRotating ? 'Active' : 'Paused'}</span>
          </button>
        )}
      </div>

      {/* Teaching surface */}
      <div ref={surfaceRef} data-testid="board-surface" className="flex-1 p-3 sm:p-5 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5 min-h-0">
        {completion && <CompletionPanel topicTitle={lesson.topicTitle} completion={completion} />}

        {lesson.isOutline && (
          <div data-testid="outline-notice" className="px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-600/50 text-[11px] text-slate-300">
            Outline lesson: built from this topic’s curriculum summary. A full interactive lesson has not been authored yet.
          </div>
        )}

        {/* 1. Concept + step: what this is, in one line */}
        <div className="space-y-1 shrink-0">
          {stepIndex === 0 && lesson.definition && (
            <p data-testid="board-concept" className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-sky-300/90">
              {lesson.topicTitle}
            </p>
          )}
          <h2 data-testid="board-title" className="font-sans font-black text-lg sm:text-xl lg:text-2xl text-white tracking-tight">
            {boardView?.title ?? step.boardTitle}
          </h2>
          {/* First step: the concept's one-line definition leads; later steps: the step summary. */}
          {stepIndex === 0 && lesson.definition ? (
            <p data-testid="board-summary" data-board-definition="true" className="font-sans text-[13px] sm:text-sm text-white/90 leading-relaxed max-w-3xl">
              {lesson.definition}
            </p>
          ) : (
            <p data-testid="board-summary" className="font-sans text-[12.5px] sm:text-[13px] text-slate-200 leading-relaxed max-w-3xl">
              {summaryText}
            </p>
          )}
        </div>

        {adaptiveDirective?.smartBoardCallout && (
          <div
            className={`p-2.5 rounded-xl border flex items-start justify-between gap-2.5 shrink-0 ${
              adaptiveDirective.smartBoardCallout.type === 'challenge'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-sans font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{adaptiveDirective.smartBoardCallout.title}</span>
              </div>
              <p className="font-sans text-[11px] text-slate-200 leading-snug">{adaptiveDirective.smartBoardCallout.message}</p>
            </div>
            {onOpenTool && (
              <button
                type="button"
                onClick={() => onOpenTool('hint')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-semibold whitespace-nowrap text-white shrink-0 cursor-pointer"
              >
                {adaptiveDirective.smartBoardCallout.actionLabel || 'Details'} →
              </button>
            )}
          </div>
        )}

        {/* 2. One teaching unit: THEORY + the VISUAL it explains.
            The board scrolls instead of squeezing: the grid keeps its natural
            height (flex-none), so the visual can never be painted over the
            theory or the check. */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 xl:gap-4 items-start flex-none">
          {teach ? (
            <div className={`order-2 md:order-1 min-w-0 ${wideVisual ? 'md:col-span-12' : 'md:col-span-5'}`}>
              <BoardTeaching
                stepId={step.id}
                teach={teach}
                formulas={stepFormulas}
                formulaSnippet={step.formulaSnippet}
                locked={!showKeyPrinciple}
                state={teaching}
              />
            </div>
          ) : null}
          <div className={`order-1 md:order-2 ${teach && !wideVisual ? 'md:col-span-7' : 'md:col-span-12'} min-w-0 flex flex-col gap-1.5`}>
            {teach?.observe && (
              <p data-testid="visual-observe" className="flex items-start gap-1.5 text-[11.5px] sm:text-xs text-slate-300">
                <Eye className="w-3.5 h-3.5 mt-0.5 text-sky-300 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-sky-200">Look at: </span>
                  {teach.observe}
                </span>
              </p>
            )}
            <div
              ref={visualColumnRef}
              data-testid="smartboard-visual-column"
              className={`relative w-full min-w-0 flex flex-col items-stretch justify-center overflow-hidden ${
                concept.visualKind === 'periodic_table_interactive' ? 'min-h-[380px]' : 'min-h-[260px]'
              }`}
            >
              <SmartBoardVisualRenderer
                payload={visualPayload}
                activeConceptId={concept.id}
                isRotating={isRotating}
                onToggleRotation={handleToggleRotation}
                onHotspotClick={handleHotspotClick}
                onActivity={handleActivity}
                focus={visualFocus}
              />
            </div>
            {activeHow && (
              <div
                data-testid="visual-caption"
                className="md:hidden flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-500/10 px-2.5 py-2 text-[12px] text-sky-50"
              >
                <button
                  type="button"
                  aria-label="Previous point"
                  disabled={teaching.point === 0}
                  onClick={() => teaching.showPoint(teaching.point - 1)}
                  className="w-8 h-8 shrink-0 rounded-lg border border-white/15 flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="flex-1 min-w-0 leading-snug">
                  <span className="font-mono text-[10px] text-sky-300 mr-1">
                    {teaching.point + 1}/{howPoints.length}
                  </span>
                  {activeHow.text}
                </p>
                <button
                  type="button"
                  aria-label="Next point"
                  disabled={teaching.point >= howPoints.length - 1}
                  onClick={() => teaching.showPoint(teaching.point + 1)}
                  className="w-8 h-8 shrink-0 rounded-lg border border-white/15 flex items-center justify-center disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Key takeaway (after the first attempt on predict-first steps) */}
        {!teach && step.keyPrinciple && !showKeyPrinciple && (
          <div data-testid="key-principle-locked" className="p-3 rounded-2xl bg-[#090F26]/70 border border-dashed border-amber-500/30 text-[12px] text-slate-300">
            <span className="font-semibold text-amber-200">Predict first. </span>
            Commit to an answer below. The key idea appears after your first attempt.
          </div>
        )}
        {showKeyPrinciple && (teach?.takeaway || step.keyPrinciple) && (
          <div data-testid="key-principle" className="shrink-0 flex items-start gap-2.5 px-3 py-2.5 rounded-2xl bg-amber-500/[0.07] border border-amber-400/30">
            <Lightbulb className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" aria-hidden="true" />
            <p className="font-sans text-[12.5px] sm:text-[13px] text-slate-100 leading-relaxed whitespace-pre-line">
              <span className="font-bold text-amber-200">Key takeaway: </span>
              {teach?.takeaway ?? step.keyPrinciple}
            </p>
          </div>
        )}

        {/* 4. Learner action: Try This + hands-on board activity */}
        {(step.tryThis || activityKind) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 shrink-0">
            {step.tryThis && (
              <div data-testid="try-this" className={`p-3 rounded-2xl bg-[#080E24]/90 border border-sky-500/25 space-y-1 ${activityKind ? '' : 'md:col-span-2'}`}>
                <div className="flex items-center gap-1.5 text-sky-300 font-sans font-bold text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Try This</span>
                </div>
                <p className="font-sans text-[12px] sm:text-[12.5px] text-slate-200 leading-relaxed">{step.tryThis}</p>
              </div>
            )}
            {activityKind && (
              <div
                data-testid="board-activity-status"
                data-activity-completed={activity?.completed ? 'true' : 'false'}
                className={`px-3 py-2.5 rounded-2xl border text-[12px] font-sans ${
                  activity?.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-white/[0.03] border-white/[0.1] text-slate-300'
                } ${step.tryThis ? '' : 'md:col-span-2'}`}
              >
                {activity?.completed
                  ? `Board activity done${activity.wrong ? ` (${activity.wrong} wrong turn${activity.wrong > 1 ? 's' : ''} on the way)` : ' with no wrong turns'}.`
                  : activityKind === 'challenge'
                    ? 'Board challenge: solve 3 clues on the board. It counts towards your evidence for this class.'
                    : activityKind === 'trace'
                      ? 'Board activity: trace the blood on the diagram. It counts towards your evidence for this class.'
                      : 'Board activity: order the events on the timeline. It counts towards your evidence for this class.'}
              </div>
            )}
          </div>
        )}

        {question && (
          <div
            key={step.id}
            ref={questionRef}
            data-testid="check-question"
            data-question-step={step.id}
            data-answer-state={answerState}
            data-attempts={stepEvidence?.attempts ?? 0}
            className={`p-3 rounded-2xl bg-[#080E24]/95 border space-y-2 shrink-0 ${
              nextBlocked ? 'border-indigo-400/60' : 'border-indigo-500/30'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase shrink-0">
                {boardView?.predicting ? 'Predict' : 'Active Check'}
              </span>
              <p className="font-sans font-semibold text-xs text-white">{question.prompt}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayOptions.map((opt) => {
                const isSelected = answerForThisStep?.selectedOptionId === opt.id;
                const submitted = Boolean(answerForThisStep?.submitted);
                const triedWrong = stepEvidence?.wrongOptionIds.includes(opt.id) ?? false;
                let btnStyle = 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.08]';
                if (triedWrong && !isSelected) btnStyle = 'bg-white/[0.02] border-rose-500/20 text-slate-400';
                if (isSelected) btnStyle = 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm';
                if (submitted && isSelected) {
                  // Only the learner's own choice is marked. A wrong answer never reveals
                  // the correct option; it is shown only when answered correctly or
                  // when the learner asks to see it.
                  btnStyle = answerForThisStep?.isCorrect || answerForThisStep?.revealed
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-400 text-rose-200';
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-option-id={opt.id}
                    data-tried-wrong={triedWrong ? 'true' : undefined}
                    disabled={submitted}
                    aria-pressed={isSelected}
                    onClick={() => onSelectOption(step.id, opt.id)}
                    className={`p-2 rounded-xl border text-left text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {submitted && isSelected && (answerForThisStep?.isCorrect || answerForThisStep?.revealed) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {!answerForThisStep?.submitted ? (
              <button
                type="button"
                disabled={!answerForThisStep?.selectedOptionId}
                onClick={() => onSubmitAnswer(step.id)}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-sans font-bold transition-colors cursor-pointer"
              >
                {boardView?.predicting ? 'Commit Prediction' : 'Submit Answer'}
              </button>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p data-testid="answer-feedback" className="text-[11px] font-sans text-slate-300">
                    {answerState === 'revealed'
                      ? `Answer shown: ${selectedOption?.text ?? ''}. Not counted as correct; listed for review.`
                      : selectedOption?.feedback}
                  </p>
                  {answerState === 'incorrect' && (
                    <div className="flex items-center gap-3 shrink-0">
                      {wrongAttempts >= REVEAL_AFTER_ATTEMPTS && onRevealAnswer && (
                        <button
                          type="button"
                          onClick={() => onRevealAnswer(step.id)}
                          className="text-[10px] font-mono text-amber-300 hover:underline cursor-pointer"
                        >
                          Show answer
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRetryAnswer(step.id)}
                        className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
                {answerState !== 'correct' && step.commonMistake && (
                  <div className="flex justify-center pt-1">
                    <StickyNote
                      note={{
                        id: `mistake_${step.id}`,
                        type: 'common_mistake',
                        color: 'pink',
                        title: 'COMMON MISTAKE',
                        content: step.commonMistake,
                        author: 'Buddy',
                        rotation: 1.2,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="w-full px-4 sm:px-5 py-2.5 bg-[#040816]/90 border-t border-white/[0.06] flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span data-testid="step-label" className="font-mono text-xs text-slate-300 font-semibold truncate">
            Step {stepIndex + 1} of {totalSteps} • <span className="text-cyan-300">{step.title}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={onPreviousStep}
            aria-label="Previous step"
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 disabled:pointer-events-none text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/[0.08]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next step"
            aria-disabled={nextBlocked}
            data-blocked={nextBlocked ? 'true' : 'false'}
            title={nextBlocked ? 'Answer the check on this step first' : undefined}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-white font-sans font-bold text-xs transition-all cursor-pointer border ${
              nextBlocked
                ? 'bg-slate-700/70 border-slate-500/40'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-[0_0_16px_rgba(14,165,233,0.4)] border-sky-400/40'
            }`}
          >
            <span>{nextBlocked ? 'Answer the check' : isComplete ? 'See result' : stepIndex === totalSteps - 1 ? 'Complete' : 'Next'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

SmartBoard.displayName = 'SmartBoard';

export default SmartBoard;
