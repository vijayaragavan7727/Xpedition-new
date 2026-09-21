'use client';

import React, { useState } from 'react';
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
      className={`relative flex flex-col justify-between rounded-3xl bg-[#060B1E]/95 border-2 border-indigo-500/30 shadow-[0_12px_48px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden ${className}`}
      style={{
        boxShadow: '0 0 35px -5px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
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
          <h2 className="font-sans font-black text-lg sm:text-xl lg:text-2xl text-white tracking-tight">
            {step.boardTitle}
          </h2>
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-1 min-h-0 my-1">
          {/* Hero Visual Schematic (Dominant: 8 cols) */}
          <div className="md:col-span-8 relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Assembly matching reference: sits directly on board */}
            <div className="relative w-full max-w-lg h-full max-h-[300px] flex items-center justify-center select-none">
              {/* Central Axle Steel Rod with Metallic Highlights */}
              <div className="absolute w-[92%] h-3 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.9)]" />

              {/* Left Stator Magnet: 3D Beveled Red North Pole (N) */}
              <div className="absolute left-2 sm:left-6 flex flex-col items-center z-10">
                <div className="relative w-20 sm:w-24 lg:w-28 h-32 sm:h-36 lg:h-40 rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-red-950 border-2 border-rose-400/80 shadow-[0_0_35px_rgba(239,68,68,0.55),inset_0_3px_6px_rgba(255,255,255,0.4)] flex items-center justify-center transform -skew-y-1 overflow-hidden">
                  {/* Top Bevel Highlight */}
                  <div className="absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-white/30 to-transparent" />
                  {/* Inner Concave Curve for Rotor */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-24 rounded-l-full bg-red-950/80" />
                  <span className="font-sans font-black text-4xl sm:text-5xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    N
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-black text-rose-400 mt-1.5 uppercase tracking-wider drop-shadow-sm">
                  North Pole
                </span>
              </div>

              {/* Central Rotating Armature Coil & Commutator Assembly */}
              <div className="relative z-20 flex items-center justify-center">
                {/* Armature Rotor Cylinder */}
                <div className={`relative flex items-center justify-center ${isRotating ? 'animate-pulse' : ''}`}>
                  {/* High-fidelity Copper Armature Core (Wider & Chunky matching reference) */}
                  <div className="w-32 sm:w-36 lg:w-42 h-34 sm:h-38 lg:h-42 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-400 to-amber-900 border-2 border-amber-300/80 shadow-[0_0_40px_rgba(245,158,11,0.55),inset_0_2px_5px_rgba(255,255,255,0.7)] flex flex-col justify-between p-2">
                    {/* Winding Segments */}
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                    <div className="w-full h-1.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded-full" />
                  </div>

                  {/* Split-Ring Commutator (Brass Segment) */}
                  <div className="absolute -right-9 sm:-right-10 w-10 sm:w-11 h-22 sm:h-24 rounded-xl bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-800 border-2 border-amber-200 shadow-lg flex items-center justify-center">
                    <div className="w-full h-1.5 bg-slate-950 shadow-sm" />
                  </div>

                  {/* Carbon Contact Brushes (Top and Bottom) */}
                  <div className="absolute -right-12 sm:-right-13 -top-1 w-4 h-8 rounded bg-slate-950 border border-slate-500 shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-ping" />
                  </div>
                  <div className="absolute -right-12 sm:-right-13 -bottom-1 w-4 h-8 rounded bg-slate-950 border border-slate-500 shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-ping" />
                  </div>

                  {/* Rotational Torque Dynamic Curved Vectors (Cyan & Magenta) */}
                  <div className="absolute -top-6 left-2 text-cyan-300 text-xs sm:text-sm font-mono font-black flex items-center gap-1">
                    <span className="text-xl text-cyan-400 animate-pulse">↶</span>
                    <span className="text-[9px] uppercase tracking-wider bg-[#060C22]/90 px-1.5 py-0.5 rounded border border-cyan-500/40 shadow-sm">Torque</span>
                  </div>
                  <div className="absolute -bottom-6 right-2 text-fuchsia-300 text-xs sm:text-sm font-mono font-black flex items-center gap-1">
                    <span className="text-xl text-fuchsia-400 animate-pulse">↷</span>
                    <span className="text-[9px] uppercase tracking-wider bg-[#060C22]/90 px-1.5 py-0.5 rounded border border-fuchsia-500/40 shadow-sm">Force</span>
                  </div>
                </div>
              </div>

              {/* Right Stator Magnet: 3D Beveled Blue South Pole (S) */}
              <div className="absolute right-2 sm:right-6 flex flex-col items-center z-10">
                <div className="relative w-20 sm:w-24 lg:w-28 h-32 sm:h-36 lg:h-40 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-600 to-blue-950 border-2 border-sky-400/80 shadow-[0_0_35px_rgba(14,165,233,0.55),inset_0_3px_6px_rgba(255,255,255,0.4)] flex items-center justify-center transform skew-y-1 overflow-hidden">
                  {/* Top Bevel Highlight */}
                  <div className="absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-white/30 to-transparent" />
                  {/* Inner Concave Curve for Rotor */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-24 rounded-r-full bg-blue-950/80" />
                  <span className="font-sans font-black text-4xl sm:text-5xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    S
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-black text-sky-400 mt-1.5 uppercase tracking-wider drop-shadow-sm">
                  South Pole
                </span>
              </div>

              {/* Crisp Component Callout Tags matching reference */}
              <div className="absolute top-2 left-28 sm:left-40 bg-[#080E24]/95 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center gap-1 z-30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Armature Coil</span>
              </div>
              <div className="absolute top-2 right-20 sm:right-28 bg-[#080E24]/95 border border-cyan-400/40 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-cyan-300 shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center gap-1 z-30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Commutator</span>
              </div>
              <div className="absolute bottom-2 right-16 sm:right-24 bg-[#080E24]/95 border border-slate-400/40 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center gap-1 z-30">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Brushes</span>
              </div>
            </div>
          </div>

          {/* Contextual Side Callouts (Spacious & Clean: 4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-center gap-2.5 sm:gap-3">
            {/* 1. Key Principle Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#090F26]/90 border border-amber-500/25 space-y-1 shadow-md">
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
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#080E24]/90 border border-sky-500/25 space-y-1 shadow-md">
              <div className="flex items-center gap-1.5 text-sky-300 font-sans font-bold text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Try This</span>
              </div>
              <p className="font-sans text-[11px] sm:text-xs text-slate-200 leading-relaxed font-normal">
                Predict what happens when the current reverses direction?
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
              <div className="flex items-center justify-between pt-1">
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
