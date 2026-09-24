'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ClassroomLessonStep, ClassroomToolType } from './types';
import { AdaptiveDirective } from '@/lib/classroom/classroomIntelligence';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Lightbulb,
} from 'lucide-react';
import { StickyNote } from '@/components/learning-objects';

export interface SmartBoardProps {
  step: ClassroomLessonStep;
  totalSteps: number;
  currentStepIndex: number;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onQuestionAnswered?: (isCorrect: boolean) => void;
  onOpenTool?: (tool: ClassroomToolType) => void;
  adaptiveDirective?: AdaptiveDirective;
  topicTitle: string;
  subject: string;
  className?: string;
}

export const SmartBoard: React.FC<SmartBoardProps> = ({
  step,
  totalSteps,
  currentStepIndex,
  onPreviousStep,
  onNextStep,
  onQuestionAnswered,
  onOpenTool,
  adaptiveDirective,
  topicTitle,
  subject,
  className = '',
}) => {
  // Interactive Question State (for Step 4 / interactive check)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

  // Rotation animation toggle for motor
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || !step.checkQuestion) return;
    setIsAnswerSubmitted(true);
    const selected = step.checkQuestion.options.find((o) => o.id === selectedOptionId);
    if (onQuestionAnswered && selected) {
      onQuestionAnswered(selected.isCorrect);
    }
  };

  const handleResetAnswer = () => {
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
  };

  const selectedOption = step.checkQuestion?.options.find((o) => o.id === selectedOptionId);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl bg-[#060B1E]/80 border-2 border-cyan-500/40 shadow-[0_12px_48px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden ${className}`}
      style={{
        boxShadow: '0 0 35px -5px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      {/* Outer Smart Board Metal Frame Highlights */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/70 rounded-br-3xl pointer-events-none" />

      {/* =====================================================================
          1. SMART BOARD TOP HEADER
         ===================================================================== */}
      <div className="w-full px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/[0.06] select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-xs font-black tracking-widest uppercase">
            › SMART BOARD
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>

        {/* Rotation / View Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
          >
            <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isRotating ? 'Active' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. CORE TEACHING SURFACE (HERO DOMINANT SURFACE)
         ===================================================================== */}
      <div className="flex-1 p-3.5 sm:p-5 overflow-hidden flex flex-col justify-between min-h-0">
        {/* Board Headline & Single Concise Explanation */}
        <div className="space-y-1 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-sans font-black text-lg sm:text-xl lg:text-2xl text-white tracking-tight">
              {step.boardTitle}
            </h2>
            {step.formulaSnippet && onOpenTool && (
              <button
                type="button"
                onClick={() => onOpenTool('formula')}
                title="Inspect scientific formula card"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 text-amber-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
              >
                <span>📐 Formula:</span>
                <span className="text-white font-bold">{step.formulaSnippet}</span>
                <span className="text-[10px] text-amber-300">Inspect Card →</span>
              </button>
            )}
          </div>
          <p className="font-sans text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-2xl font-medium">
            {step.boardSummary}
          </p>
        </div>

        {/* Adaptive Remedial Banner if active */}
        {adaptiveDirective?.smartBoardCallout && (
          <div
            className={`p-2.5 rounded-xl border flex items-start justify-between gap-2.5 transition-all shrink-0 ${
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
              <p className="font-sans text-[11px] text-slate-200 leading-snug">
                {adaptiveDirective.smartBoardCallout.message}
              </p>
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

        {/* Main Stage: Large Centered Visual + Clean Side Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 xl:gap-4 items-center flex-1 min-h-0 my-1">
          {/* Hero Visual Schematic (Dominant: 8 cols) */}
          <div className="md:col-span-8 relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="relative w-full max-w-xl h-full max-h-[310px] flex items-center justify-center select-none group">
              {/* DC Motor 3D Production Diagram Render */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src="/images/classroom/dc-motor-diagram-clean.png"
                  alt="DC Motor & Commutation 3D Interactive Diagram"
                  width={600}
                  height={320}
                  priority
                  className={`w-full max-h-[280px] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.9)] transition-all duration-500 ${
                    isRotating ? 'filter brightness-105' : 'filter brightness-95'
                  }`}
                />

                {/* Animated Rotational Glow Field when active */}
                {isRotating && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-1/4 inset-y-6 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none animate-pulse"
                  />
                )}

                {/* Interactive Hotspot Pills (Armature Coil, Commutator, Brushes, North & South Poles) */}
                <button
                  type="button"
                  onClick={() => onOpenTool?.('lesson')}
                  title="Armature Coil: High-conductivity copper windings that carry rotor current"
                  aria-label="Armature Coil detail"
                  className="absolute top-2 left-[20%] sm:left-[24%] bg-[#080E24]/95 hover:bg-[#0E1738] border border-cyan-400/50 hover:border-cyan-300 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-cyan-300 shadow-[0_2px_10px_rgba(0,0,0,0.8)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Armature Coil</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTool?.('lesson')}
                  title="Split-Ring Commutator: Inverts current polarity every 180° for continuous rotation"
                  aria-label="Commutator detail"
                  className="absolute top-2 right-[20%] sm:right-[24%] bg-[#080E24]/95 hover:bg-[#0E1738] border border-cyan-400/50 hover:border-cyan-300 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-cyan-300 shadow-[0_2px_10px_rgba(0,0,0,0.8)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Commutator</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTool?.('lesson')}
                  title="Carbon Brushes: Sliding stationary graphite contacts that feed current into the spinning commutator"
                  aria-label="Brushes detail"
                  className="absolute bottom-2 right-[24%] sm:right-[28%] bg-[#080E24]/95 hover:bg-[#0E1738] border border-slate-400/50 hover:border-slate-300 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.8)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Brushes</span>
                </button>

                <div className="absolute bottom-2 left-[12%] sm:left-[16%] text-[10px] font-mono font-bold text-rose-400/90 bg-[#080E24]/90 px-2 py-0.5 rounded-full border border-rose-500/30">
                  North Pole
                </div>

                <div className="absolute bottom-2 right-[12%] sm:right-[16%] text-[10px] font-mono font-bold text-sky-400/90 bg-[#080E24]/90 px-2 py-0.5 rounded-full border border-sky-500/30">
                  South Pole
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Side Callouts (Matching Reference: 4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-center gap-2.5 sm:gap-3">
            {/* 1. Key Principle Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#090F26]/90 border border-amber-500/25 space-y-1 shadow-md hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-1.5 text-amber-300 font-sans font-bold text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Key Principle</span>
              </div>
              <p className="font-sans text-[11px] sm:text-xs text-slate-200 leading-relaxed font-normal">
                {step.keyPrinciple ||
                  'The magnetic field exerts a force on the current-carrying coil, creating a torque that rotates the armature.'}
              </p>
            </div>

            {/* 2. Student Action / Try This Callout */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#080E24]/90 border border-sky-500/25 space-y-1 shadow-md hover:border-sky-500/40 transition-colors">
              <div className="flex items-center gap-1.5 text-sky-300 font-sans font-bold text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Try This</span>
              </div>
              <p className="font-sans text-[11px] sm:text-xs text-slate-200 leading-relaxed font-normal">
                {step.stepNumber === 1
                  ? 'Predict what happens when the current reverses direction?'
                  : step.stepNumber === 2
                  ? 'Click on the component callouts to inspect their electromagnetic functions.'
                  : step.stepNumber === 3
                  ? 'Use Fleming’s Left Hand Rule: align Thumb (Force), Index (Field), Middle (Current).'
                  : step.stepNumber === 4
                  ? 'Observe how the commutator inverts contacts exactly as the coil passes vertical.'
                  : 'Test your understanding: will changing magnetic polarity reverse rotational direction?'}
              </p>
            </div>
          </div>
        </div>

        {/* Step Check Question if on assessment / practice step */}
        {step.checkQuestion && (
          <div className="p-3 rounded-2xl bg-[#080E24]/95 border border-indigo-500/30 space-y-2 mt-1 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase">
                Active Check
              </span>
              <p className="font-sans font-semibold text-xs text-white">
                {step.checkQuestion.prompt}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {step.checkQuestion.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                let btnStyle = 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.08]';
                if (isSelected) {
                  btnStyle = 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm';
                }
                if (isAnswerSubmitted) {
                  if (opt.isCorrect) {
                    btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-200';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-2 rounded-xl border text-left text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {isAnswerSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {!isAnswerSubmitted ? (
              <button
                type="button"
                disabled={!selectedOptionId}
                onClick={handleSubmitAnswer}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-sans font-bold transition-colors cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-sans text-slate-300">
                    {selectedOption?.feedback}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAnswer}
                    className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>

                {/* Tactile Common Mistake Sticky Note */}
                {!selectedOption?.isCorrect && (
                  <div className="flex justify-center pt-2">
                    <StickyNote
                      note={{
                        id: 'mistake_note',
                        type: 'common_mistake',
                        color: 'pink',
                        title: 'COMMON MISTAKE',
                        content:
                          'Do not confuse current direction with magnetic-field direction.',
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

      {/* =====================================================================
          3. SMART BOARD BOTTOM NAVIGATION
         ===================================================================== */}
      <div className="w-full px-4 sm:px-5 py-2.5 bg-[#040816]/90 border-t border-white/[0.06] flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs text-slate-300 font-semibold">
            Step {currentStepIndex + 1} of {totalSteps} • <span className="text-cyan-300">{step.title}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentStepIndex === 0}
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
            <span>{currentStepIndex === totalSteps - 1 ? 'Complete' : 'Next'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartBoard;
