'use client';

/**
 * Xpedition Visual Teaching Mode Engine v1 — Transformation Visual View
 *
 * Teaches fundamental state transformations:
 * State A -> Transformation Mechanism -> State B
 * Example: DNA semi-conservative replication, mitosis cell division, phase changes.
 */

import React, { useState } from 'react';
import { VisualTeachingPlan, TransformationStage } from '@/lib/experience/visualTeaching/types';
import { RefreshCw, ArrowRight, Dna, Sparkles, CheckCircle2 } from 'lucide-react';

interface TransformationVisualViewProps {
  plan: VisualTeachingPlan;
  className?: string;
}

export const TransformationVisualView: React.FC<TransformationVisualViewProps> = ({
  plan,
  className = '',
}) => {
  const stages: TransformationStage[] = plan.transformationStages || [
    {
      stageId: 't1',
      title: 'State A: Initial Structure',
      stateLabel: 'Original Molecule',
      description: 'The initial stable molecular state prior to reaction.',
      stateData: {},
      keyTransformationMechanism: 'Stable baseline',
    },
    {
      stageId: 't2',
      title: 'Active Transformation',
      stateLabel: 'Catalytic Transition',
      description: 'Enzyme unzips bonds and binds complementary active substrates.',
      stateData: {},
      keyTransformationMechanism: 'Enzymatic catalysis and unzipping',
    },
    {
      stageId: 't3',
      title: 'State B: Transformed Products',
      stateLabel: 'Two Duplicated Helices',
      description: 'Replication finishes, yielding two identical daughter molecules.',
      stateData: {},
      keyTransformationMechanism: 'Complete semi-conservative synthesis',
    },
  ];

  const [activeStep, setActiveStep] = useState(1); // 0: State A, 1: Transforming, 2: State B

  const isDna = plan.conceptId.includes('dna');

  return (
    <div className={`flex flex-col gap-5 w-full rounded-2xl bg-slate-950/90 border border-cyan-500/20 p-5 shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Transformation Visual
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          State {activeStep + 1} of {stages.length}
        </span>
      </div>

      {/* Main State Canvas */}
      <div className="relative w-full h-80 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 overflow-hidden flex items-center justify-center p-4">
        {isDna ? (
          <svg className="w-full h-full max-w-lg" viewBox="0 0 500 240">
            {/* Stage 0: Single Intact Helix */}
            {activeStep === 0 && (
              <g className="animate-in fade-in duration-300">
                <path d="M 80 120 Q 150 70, 220 120 T 360 120 T 450 120" fill="none" stroke="#06b6d4" strokeWidth="4" />
                <path d="M 80 120 Q 150 170, 220 120 T 360 120 T 450 120" fill="none" stroke="#38bdf8" strokeWidth="4" />
                {/* Rungs (Base pairs) */}
                {[110, 150, 190, 250, 290, 330, 390, 420].map((x, i) => (
                  <line key={i} x1={x} y1="95" x2={x} y2="145" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />
                ))}
                <text x="180" y="45" fill="#67e8f9" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  Original Parent Double Helix
                </text>
              </g>
            )}

            {/* Stage 1: Unzipping & Base Pairing */}
            {activeStep === 1 && (
              <g className="animate-in fade-in duration-300">
                {/* Upper unwound strand */}
                <path d="M 60 120 Q 180 120, 260 70 L 440 50" fill="none" stroke="#06b6d4" strokeWidth="4" />
                {/* Lower unwound strand */}
                <path d="M 60 120 Q 180 120, 260 170 L 440 190" fill="none" stroke="#38bdf8" strokeWidth="4" />

                {/* Helicase Enzyme */}
                <circle cx="230" cy="120" r="24" fill="#d97706" stroke="#fbbf24" strokeWidth="2" />
                <text x="210" y="125" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="monospace">Helicase</text>

                {/* Free complementary bases floating in */}
                <g transform="translate(300, 75)">
                  <rect width="30" height="15" rx="3" fill="#22c55e" />
                  <text x="10" y="12" fill="#fff" fontSize="11" fontWeight="bold">A</text>
                  <line x1="35" y1="8" x2="50" y2="8" stroke="#fff" strokeDasharray="2 2" />
                  <rect x="55" width="30" height="15" rx="3" fill="#ef4444" />
                  <text x="65" y="12" fill="#fff" fontSize="11" fontWeight="bold">T</text>
                </g>

                <g transform="translate(320, 150)">
                  <rect width="30" height="15" rx="3" fill="#3b82f6" />
                  <text x="10" y="12" fill="#fff" fontSize="11" fontWeight="bold">C</text>
                  <line x1="35" y1="8" x2="50" y2="8" stroke="#fff" strokeDasharray="2 2" />
                  <rect x="55" width="30" height="15" rx="3" fill="#f59e0b" />
                  <text x="65" y="12" fill="#fff" fontSize="11" fontWeight="bold">G</text>
                </g>

                <text x="130" y="35" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  Replication Fork: Helicase Unwinds & Bases Pair
                </text>
              </g>
            )}

            {/* Stage 2: Two Duplicated Helices */}
            {activeStep === 2 && (
              <g className="animate-in fade-in duration-300">
                {/* Helix 1 (Upper) */}
                <g transform="translate(0, -45)">
                  <path d="M 60 110 Q 140 70, 220 110 T 380 110 T 450 110" fill="none" stroke="#06b6d4" strokeWidth="3.5" />
                  <path d="M 60 110 Q 140 150, 220 110 T 380 110 T 450 110" fill="none" stroke="#10b981" strokeWidth="3.5" />
                  <text x="160" y="60" fill="#a7f3d0" fontSize="11" fontWeight="bold" fontFamily="monospace">Daughter Helix 1 (Semi-Conservative)</text>
                </g>

                {/* Helix 2 (Lower) */}
                <g transform="translate(0, 65)">
                  <path d="M 60 110 Q 140 70, 220 110 T 380 110 T 450 110" fill="none" stroke="#10b981" strokeWidth="3.5" />
                  <path d="M 60 110 Q 140 150, 220 110 T 380 110 T 450 110" fill="none" stroke="#38bdf8" strokeWidth="3.5" />
                  <text x="160" y="60" fill="#a7f3d0" fontSize="11" fontWeight="bold" fontFamily="monospace">Daughter Helix 2 (Identical Copy)</text>
                </g>
              </g>
            )}
          </svg>
        ) : (
          /* Generic State Transformation */
          <div className="flex items-center justify-between w-full max-w-md px-6">
            <div className={`p-4 rounded-xl border text-center transition-all ${activeStep === 0 ? 'bg-cyan-500/20 border-cyan-400 scale-105' : 'bg-slate-900 border-white/10 opacity-50'}`}>
              <span className="text-xs font-mono text-cyan-400 block mb-1">STATE A</span>
              <span className="text-sm font-bold text-white">Initial</span>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-500 animate-pulse" />
            <div className={`p-4 rounded-xl border text-center transition-all ${activeStep === 1 ? 'bg-amber-500/20 border-amber-400 scale-105' : 'bg-slate-900 border-white/10 opacity-50'}`}>
              <span className="text-xs font-mono text-amber-400 block mb-1">TRANSFORM</span>
              <span className="text-sm font-bold text-white">Mechanism</span>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-500 animate-pulse" />
            <div className={`p-4 rounded-xl border text-center transition-all ${activeStep === 2 ? 'bg-emerald-500/20 border-emerald-400 scale-105' : 'bg-slate-900 border-white/10 opacity-50'}`}>
              <span className="text-xs font-mono text-emerald-400 block mb-1">STATE B</span>
              <span className="text-sm font-bold text-white">Result</span>
            </div>
          </div>
        )}

        {/* State Narrative Card */}
        <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-sm flex items-start gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-white font-mono">
              {stages[activeStep]?.title || 'Transformation Phase'}
            </span>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              {stages[activeStep]?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Step Selector Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {stages.map((stage, idx) => (
          <button
            key={stage.stageId}
            onClick={() => setActiveStep(idx)}
            className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
              activeStep === idx
                ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10'
                : 'bg-slate-900/60 border-white/10 hover:border-white/20'
            }`}
          >
            <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase">
              Step {idx + 1}
            </span>
            <span className="font-semibold text-slate-200 truncate">
              {stage.stateLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
