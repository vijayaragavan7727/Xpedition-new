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
import { ChevronLeft, ChevronRight, Sparkles, HelpCircle, CheckCircle2, RotateCw, Lightbulb } from 'lucide-react';
import type { ClassroomLesson, ClassroomToolType } from './types';
import type { AdaptiveDirective } from '@/lib/classroom/classroomIntelligence';
import type { CanonicalConcept } from '@/lib/concepts/types';
import type { ClassAnswerState } from '@/lib/classroom/classRuntime';
import { StickyNote } from '@/components/learning-objects';
import { SmartBoardVisualRenderer } from './SmartBoardVisualRenderer';
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
  onPreviousStep: () => void;
  onNextStep: () => void;
  onOpenTool?: (tool: ClassroomToolType) => void;
  adaptiveDirective?: AdaptiveDirective;
  /** Optional artwork already identity-checked for this concept + step. */
  artworkUrl?: string;
  className?: string;
}

export const SmartBoard: React.FC<SmartBoardProps> = React.memo(({
  concept,
  lesson,
  stepIndex,
  answer,
  onSelectOption,
  onSubmitAnswer,
  onRetryAnswer,
  onPreviousStep,
  onNextStep,
  onOpenTool,
  adaptiveDirective,
  artworkUrl,
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

  return (
    <div
      data-testid="smart-board"
      data-concept-id={concept.id}
      data-lesson-id={lesson.id}
      data-step-id={step.id}
      data-step-index={stepIndex}
      data-stage={stage}
      className={`relative flex flex-col justify-between rounded-3xl bg-[#060B1E]/90 border-2 border-cyan-500/40 shadow-[0_12px_48px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden ${className}`}
      style={{ boxShadow: '0 0 35px -5px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.12)' }}
    >
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/70 rounded-br-3xl pointer-events-none" />

      {/* Header */}
      <div className="w-full px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/[0.06] select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-xs font-black tracking-widest uppercase">› SMART BOARD</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span data-testid="stage-chip" className="ml-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-200 uppercase">
            {CLASS_STAGE_LABELS[stage]}
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
      <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden flex flex-col gap-2 min-h-0">
        {lesson.isOutline && (
          <div data-testid="outline-notice" className="px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-600/50 text-[11px] text-slate-300">
            Outline lesson: built from this topic’s curriculum summary. A full interactive lesson has not been authored yet.
          </div>
        )}

        <div className="space-y-1 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 data-testid="board-title" className="font-sans font-black text-lg sm:text-xl lg:text-2xl text-white tracking-tight">
              {step.boardTitle}
            </h2>
            {step.formulaSnippet && onOpenTool && (
              <button
                type="button"
                onClick={() => onOpenTool('formula')}
                title="Inspect formula card"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 text-amber-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>📐 Formula:</span>
                <span className="text-white font-bold">{step.formulaSnippet}</span>
              </button>
            )}
          </div>
          <p data-testid="board-summary" className="font-sans text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-3xl font-medium">
            {step.boardSummary}
          </p>
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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 xl:gap-4 items-stretch flex-1 min-h-[220px]">
          <div
            data-testid="smartboard-visual-column"
            className={`md:col-span-8 relative w-full h-full min-w-0 flex flex-col items-stretch justify-center overflow-hidden ${
              concept.visualKind === 'periodic_table_interactive' ? 'min-h-[380px]' : 'min-h-[280px]'
            } md:min-h-0`}
          >
            <SmartBoardVisualRenderer
              payload={visualPayload}
              activeConceptId={concept.id}
              isRotating={isRotating}
              onToggleRotation={handleToggleRotation}
              onHotspotClick={handleHotspotClick}
            />
          </div>

          <div className="md:col-span-4 flex flex-col justify-center gap-2.5 sm:gap-3 min-w-0">
            {step.keyPrinciple && (
              <div data-testid="key-principle" className="p-3 sm:p-3.5 rounded-2xl bg-[#090F26]/90 border border-amber-500/25 space-y-1 shadow-md">
                <div className="flex items-center gap-1.5 text-amber-300 font-sans font-bold text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Principle</span>
                </div>
                <p className="font-sans text-[11px] sm:text-xs text-slate-200 leading-relaxed whitespace-pre-line">{step.keyPrinciple}</p>
              </div>
            )}

            {step.tryThis && (
              <div data-testid="try-this" className="p-3 sm:p-3.5 rounded-2xl bg-[#080E24]/90 border border-sky-500/25 space-y-1 shadow-md">
                <div className="flex items-center gap-1.5 text-sky-300 font-sans font-bold text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Try This</span>
                </div>
                <p className="font-sans text-[11px] sm:text-xs text-slate-200 leading-relaxed">{step.tryThis}</p>
              </div>
            )}
          </div>
        </div>

        {question && (
          <div
            key={step.id}
            data-testid="check-question"
            data-question-step={step.id}
            className="p-3 rounded-2xl bg-[#080E24]/95 border border-indigo-500/30 space-y-2 shrink-0"
          >
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase shrink-0">Active Check</span>
              <p className="font-sans font-semibold text-xs text-white">{question.prompt}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options.map((opt) => {
                const isSelected = answerForThisStep?.selectedOptionId === opt.id;
                const submitted = Boolean(answerForThisStep?.submitted);
                let btnStyle = 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.08]';
                if (isSelected) btnStyle = 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm';
                if (submitted) {
                  if (opt.isCorrect) btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200';
                  else if (isSelected) btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-200';
                }
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-option-id={opt.id}
                    disabled={submitted}
                    aria-pressed={isSelected}
                    onClick={() => onSelectOption(step.id, opt.id)}
                    className={`p-2 rounded-xl border text-left text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {submitted && opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
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
                Submit Answer
              </button>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <p data-testid="answer-feedback" className="text-[11px] font-sans text-slate-300">{selectedOption?.feedback}</p>
                  <button
                    type="button"
                    onClick={() => onRetryAnswer(step.id)}
                    className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer shrink-0"
                  >
                    Try Again
                  </button>
                </div>
                {!selectedOption?.isCorrect && step.commonMistake && (
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
            onClick={onNextStep}
            aria-label="Next step"
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-sans font-bold text-xs shadow-[0_0_16px_rgba(14,165,233,0.4)] transition-all cursor-pointer border border-sky-400/40"
          >
            <span>{stepIndex === totalSteps - 1 ? 'Complete' : 'Next'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

SmartBoard.displayName = 'SmartBoard';

export default SmartBoard;
