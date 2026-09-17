'use client';

/**
 * Xpedition Visual Teaching Mode Engine v1 — Motion Visual Player
 *
 * Lightweight, procedural SVG motion explanation system.
 * Shows processes and sequences automatically without requiring heavy 3D or video files.
 * Target: ~30s to 2min, minimum interaction, maximum understanding.
 */

import React, { useState, useEffect, useRef } from 'react';
import { VisualTeachingPlan, MotionStage } from '@/lib/experience/visualTeaching/types';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Sparkles, Eye } from 'lucide-react';

interface MotionVisualPlayerProps {
  plan: VisualTeachingPlan;
  onStageComplete?: (stageIndex: number) => void;
  className?: string;
  prefersReducedMotion?: boolean;
}

export const MotionVisualPlayer: React.FC<MotionVisualPlayerProps> = ({
  plan,
  onStageComplete,
  className = '',
  prefersReducedMotion = false,
}) => {
  const stages = plan.stages && plan.stages.length > 0 ? plan.stages : [
    {
      stageId: 'default_1',
      order: 1,
      title: 'Beginning of Process',
      narrative: plan.learningObjective,
      durationMs: 3000,
      visualState: {},
    },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);
  const [progress, setProgress] = useState(0); // 0 to 100 within current stage
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStage: MotionStage = stages[currentStageIdx] || stages[0];
  const stageDuration = prefersReducedMotion ? 5000 : (activeStage.durationMs || 3000);

  // Auto-advance timer when playing
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 50;
    const stepIncrement = (intervalMs / stageDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev + stepIncrement >= 100) {
          // Advance stage
          if (currentStageIdx < stages.length - 1) {
            setCurrentStageIdx((idx) => idx + 1);
            if (onStageComplete) onStageComplete(currentStageIdx);
            return 0;
          } else {
            // Finished all stages
            setIsPlaying(false);
            if (onStageComplete) onStageComplete(currentStageIdx);
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStageIdx, stages.length, stageDuration, onStageComplete]);

  const handlePlayPause = () => {
    if (!isPlaying && progress >= 100 && currentStageIdx === stages.length - 1) {
      // Replay from start
      setCurrentStageIdx(0);
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStageIdx(0);
    setProgress(0);
  };

  const handleNext = () => {
    if (currentStageIdx < stages.length - 1) {
      setCurrentStageIdx((idx) => idx + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    if (currentStageIdx > 0) {
      setCurrentStageIdx((idx) => idx - 1);
      setProgress(0);
    }
  };

  // SVG Procedural Visuals
  const isPhotosynthesis = plan.conceptId.includes('photo');
  const isSorting = plan.conceptId.includes('sort');

  return (
    <div className={`flex flex-col gap-4 w-full rounded-2xl bg-slate-950/90 border border-cyan-500/20 p-5 shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Motion Visual Explanation
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Stage {currentStageIdx + 1} of {stages.length}
        </div>
      </div>

      {/* Main Visual Stage Canvas */}
      <div className="relative w-full h-72 sm:h-80 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 overflow-hidden flex items-center justify-center">
        {/* Dynamic Procedural Visual Render */}
        {isPhotosynthesis ? (
          <svg className="w-full h-full max-w-lg p-4" viewBox="0 0 500 300">
            {/* Background Chloroplast Thylakoid Organelle */}
            <ellipse cx="250" cy="150" rx="190" ry="100" fill="#14532d" fillOpacity="0.25" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" />
            <ellipse cx="250" cy="150" rx="160" ry="75" fill="#166534" fillOpacity="0.3" stroke="#4ade80" strokeWidth="1" />

            {/* Sunlight Photons (Stage 1+) */}
            <g className={`transition-opacity duration-700 ${currentStageIdx >= 0 ? 'opacity-100' : 'opacity-20'}`}>
              <circle cx="90" cy="60" r="30" fill="#f59e0b" fillOpacity="0.8" className="animate-pulse" />
              <line x1="90" y1="90" x2="160" y2="130" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5 5" />
              <text x="70" y="65" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="monospace">Light</text>
            </g>

            {/* Water H2O Input (Stage 2+) */}
            <g className={`transition-opacity duration-700 ${currentStageIdx >= 1 ? 'opacity-100' : 'opacity-20'}`}>
              <rect x="50" y="210" width="80" height="35" rx="8" fill="#0284c7" fillOpacity="0.8" />
              <line x1="130" y1="225" x2="180" y2="180" stroke="#38bdf8" strokeWidth="2" />
              <text x="65" y="232" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace">H₂O</text>
            </g>

            {/* CO2 Intake (Stage 3+) */}
            <g className={`transition-opacity duration-700 ${currentStageIdx >= 2 ? 'opacity-100' : 'opacity-20'}`}>
              <rect x="370" y="60" width="80" height="35" rx="8" fill="#475569" fillOpacity="0.8" />
              <line x1="370" y1="95" x2="310" y2="135" stroke="#94a3b8" strokeWidth="2" />
              <text x="385" y="82" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace">CO₂</text>
            </g>

            {/* Calvin Cycle Central Hub */}
            <circle cx="250" cy="150" r="40" fill="#0f766e" fillOpacity="0.7" stroke="#2dd4bf" strokeWidth="2" />
            <text x="215" y="154" fill="#5eead4" fontSize="11" fontWeight="bold" fontFamily="monospace">Calvin Cycle</text>

            {/* Glucose Output (Stage 4+) */}
            <g className={`transition-opacity duration-700 ${currentStageIdx >= 3 ? 'opacity-100' : 'opacity-15'}`}>
              <rect x="360" y="210" width="110" height="40" rx="8" fill="#d97706" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="290" y1="170" x2="360" y2="215" stroke="#fbbf24" strokeWidth="3" />
              <text x="372" y="235" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace">C₆H₁₂O₆ (Sugar)</text>
            </g>

            {/* Oxygen O2 Release (Stage 5) */}
            <g className={`transition-opacity duration-700 ${currentStageIdx >= 4 ? 'opacity-100' : 'opacity-10'}`}>
              <circle cx="250" cy="45" r="24" fill="#059669" fillOpacity="0.9" stroke="#34d399" strokeWidth="2" />
              <line x1="250" y1="110" x2="250" y2="70" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
              <text x="238" y="50" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="monospace">O₂</text>
            </g>
          </svg>
        ) : isSorting ? (
          <div className="flex items-end gap-3 h-48 px-6">
            {[45, 80, 25, 95, 60, 30].map((h, i) => {
              const isHighlight = (currentStageIdx === 1 && (i === 1 || i === 2)) || (currentStageIdx >= 2 && i >= 4);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400">{h}</span>
                  <div
                    style={{ height: `${h * 1.5}px` }}
                    className={`w-8 rounded-t-lg transition-all duration-500 ${
                      isHighlight ? 'bg-amber-400 shadow-lg shadow-amber-500/30' : 'bg-cyan-500/70'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Generic Sequential Process Visualizer */
          <div className="flex items-center justify-center gap-4 px-4 w-full">
            {stages.map((s, idx) => (
              <div
                key={s.stageId}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  idx === currentStageIdx
                    ? 'bg-cyan-500/20 border-cyan-400 scale-105 shadow-lg shadow-cyan-500/20'
                    : idx < currentStageIdx
                    ? 'bg-slate-900 border-emerald-500/40 opacity-70'
                    : 'bg-slate-900/40 border-white/5 opacity-40'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-cyan-300 mb-2">
                  {idx + 1}
                </div>
                <span className="text-xs font-semibold text-slate-200 text-center line-clamp-1">{s.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Narrative Overlay Banner */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {activeStage.title}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-100 leading-snug">
            {activeStage.narrative}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-cyan-400 h-1.5 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Player Controls Strip */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 text-xs font-mono"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors text-xs font-mono"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            disabled={currentStageIdx === 0}
            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 disabled:opacity-30 transition-colors"
            title="Previous Stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentStageIdx === stages.length - 1}
            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 disabled:opacity-30 transition-colors"
            title="Next Stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
