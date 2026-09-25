'use client';

import React from 'react';
import Image from 'next/image';
import { SmartBoardVisualPayload } from '@/lib/visualIntelligence/types';
import { Sparkles, Play, RotateCw, Info, CheckCircle2 } from 'lucide-react';

export interface SmartBoardVisualRendererProps {
  payload?: SmartBoardVisualPayload;
  isRotating?: boolean;
  onToggleRotation?: () => void;
  onHotspotClick?: (hotspotId: string) => void;
  className?: string;
}

export const SmartBoardVisualRenderer: React.FC<SmartBoardVisualRendererProps> = ({
  payload,
  isRotating = true,
  onToggleRotation,
  onHotspotClick,
  className = '',
}) => {
  if (!payload) {
    return <FallbackRenderer title="Interactive Learning Surface" purpose="Loading pedagogical visualization..." />;
  }

  switch (payload.visualType) {
    case 'interactive_simulation':
      return (
        <SimulationRenderer
          payload={payload}
          isRotating={isRotating}
          onToggleRotation={onToggleRotation}
          className={className}
        />
      );

    case 'graph':
      return <GraphRenderer payload={payload} className={className} />;

    case 'formula_visual':
      return <FormulaRenderer payload={payload} className={className} />;

    case 'timeline':
      return <TimelineRenderer payload={payload} className={className} />;

    case 'scientific_diagram':
    case 'educational_illustration':
    case 'anatomical_visual':
    case 'molecular_visual':
    default:
      return (
        <DiagramRenderer
          payload={payload}
          isRotating={isRotating}
          onHotspotClick={onHotspotClick}
          className={className}
        />
      );
  }
};

/**
 * Diagram & Educational Illustration Renderer (e.g. DC Motor, Anatomy)
 */
const DiagramRenderer: React.FC<{
  payload: SmartBoardVisualPayload;
  isRotating: boolean;
  onHotspotClick?: (id: string) => void;
  className?: string;
}> = ({ payload, isRotating, onHotspotClick, className = '' }) => {
  const imageUrl = payload.assetUrl || '/images/classroom/dc-motor-diagram-clean.png';

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <div className="relative w-full max-w-xl h-full max-h-[310px] flex items-center justify-center select-none group">
        <Image
          src={imageUrl}
          alt={payload.title || 'Educational Scientific Diagram'}
          width={600}
          height={320}
          priority
          className={`w-full max-h-[280px] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.9)] transition-all duration-500 ${
            isRotating ? 'filter brightness-105' : 'filter brightness-95'
          }`}
        />

        {/* Ambient rotational glow field */}
        {isRotating && (
          <div
            aria-hidden="true"
            className="absolute inset-x-1/4 inset-y-6 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none animate-pulse"
          />
        )}

        {/* Dynamic Hotspots from payload */}
        {payload.interaction?.hotspots && payload.interaction.hotspots.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {payload.interaction.hotspots.map((hotspot, idx) => {
              // Deterministic spatial placement across four corners/edges
              const positions = [
                'top-2 left-[20%] sm:left-[24%]',
                'top-2 right-[20%] sm:right-[24%]',
                'bottom-3 left-[18%] sm:left-[22%]',
                'bottom-3 right-[18%] sm:right-[22%]',
                'top-1/2 left-4 -translate-y-1/2',
              ];
              const posClass = positions[idx % positions.length];

              return (
                <button
                  key={hotspot.id}
                  type="button"
                  onClick={() => onHotspotClick?.(hotspot.id)}
                  title={`${hotspot.label}: ${hotspot.description}`}
                  aria-label={`${hotspot.label} details`}
                  className={`absolute pointer-events-auto bg-[#080E24]/95 hover:bg-[#0E1738] border border-cyan-400/50 hover:border-cyan-300 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-cyan-300 shadow-[0_2px_10px_rgba(0,0,0,0.8)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 ${posClass}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{hotspot.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Interactive Simulation Renderer (e.g. Kinematics, Motor parameter tuning)
 */
const SimulationRenderer: React.FC<{
  payload: SmartBoardVisualPayload;
  isRotating: boolean;
  onToggleRotation?: () => void;
  className?: string;
}> = ({ payload, isRotating, onToggleRotation, className = '' }) => {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-[#080E24]/90 to-[#040816]/90 rounded-2xl border border-cyan-500/30 overflow-hidden ${className}`}>
      {/* Simulation Header */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono">
        <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
          <Play className="w-3.5 h-3.5 fill-cyan-400" />
          <span>SIMULATION: {payload.title}</span>
        </span>
        <button
          type="button"
          onClick={onToggleRotation}
          className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
        >
          <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
          <span>{isRotating ? 'Running' : 'Paused'}</span>
        </button>
      </div>

      {/* Main Simulation Viewport */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        <Image
          src={payload.assetUrl || '/images/classroom/dc-motor-diagram-clean.png'}
          alt={payload.title}
          width={500}
          height={260}
          className="max-h-[220px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
        />
        {/* Interactive Parameter Overlay */}
        <div className="absolute bottom-2 left-2 bg-[#060A18]/90 border border-cyan-500/40 rounded-xl p-2 text-[10px] font-mono text-slate-300 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Current (I):</span>
            <span className="text-cyan-300 font-bold">2.5 A</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Magnetic Field (B):</span>
            <span className="text-cyan-300 font-bold">0.8 T</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Net Torque (τ):</span>
            <span className="text-amber-300 font-bold">0.45 N·m</span>
          </div>
        </div>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium truncate">
        {payload.purpose}
      </div>
    </div>
  );
};

/**
 * Coordinate Graph Renderer (e.g. Parabola, Function curve, Distributions)
 */
const GraphRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = ({
  payload,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#05091B]/90 rounded-2xl border border-indigo-500/30 overflow-hidden ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-indigo-300">
        <span>📈 COORDINATE GRAPH: {payload.title}</span>
        <span className="text-[10px] text-slate-400">Precision: Mathematical</span>
      </div>

      {/* SVG Coordinate Grid & Parabolic Curve */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        <svg viewBox="0 0 400 200" className="w-full max-h-[220px] stroke-current text-indigo-400">
          {/* Grid lines */}
          <line x1="20" y1="100" x2="380" y2="100" stroke="#334155" strokeWidth="1" />
          <line x1="200" y1="10" x2="200" y2="190" stroke="#334155" strokeWidth="1" />
          {/* Quadratic Parabola Curve */}
          <path
            d="M 60 170 Q 200 20 340 170"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Vertex point */}
          <circle cx="200" cy="20" r="5" fill="#f59e0b" />
          <text x="210" y="25" fill="#f59e0b" fontSize="10" fontFamily="monospace">Vertex (0, y_max)</text>
          {/* Root points */}
          <circle cx="110" cy="100" r="4" fill="#38bdf8" />
          <circle cx="290" cy="100" r="4" fill="#38bdf8" />
        </svg>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium">
        {payload.purpose}
      </div>
    </div>
  );
};

/**
 * Formula Visual Renderer (e.g. Mathematical Derivations)
 */
const FormulaRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = ({
  payload,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#070D22]/90 rounded-2xl border border-amber-500/30 overflow-hidden ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-amber-300">
        <span>📐 FORMULA FOCUS: {payload.title}</span>
        <span className="text-[10px] text-slate-400">Analytical View</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-4 my-2">
        <div className="px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 font-mono text-lg sm:text-xl font-bold tracking-wide shadow-lg">
          F = I · (L × B) · sin(θ)
        </div>
        <p className="font-sans text-xs text-slate-300 text-center max-w-md leading-relaxed">
          {payload.purpose}
        </p>
      </div>

      <div className="w-full flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400 border-t border-white/[0.06] pt-2">
        <span>I = Current</span>
        <span>L = Wire Length</span>
        <span>B = Magnetic Flux</span>
        <span>θ = Angle</span>
      </div>
    </div>
  );
};

/**
 * Chronological Timeline Renderer (e.g. History, Process Sequence)
 */
const TimelineRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = ({
  payload,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#060B1E]/90 rounded-2xl border border-sky-500/30 overflow-hidden ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-sky-300">
        <span>⏱️ CHRONOLOGICAL TIMELINE: {payload.title}</span>
      </div>

      <div className="flex-1 w-full flex items-center justify-around my-4 px-2">
        <div className="flex flex-col items-center space-y-1">
          <span className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-mono font-bold text-white">0°</span>
          <span className="text-[9px] text-slate-400">Horizontal Max Torque</span>
        </div>
        <div className="h-0.5 flex-1 bg-cyan-400/40 mx-2" />
        <div className="flex flex-col items-center space-y-1">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-[10px] font-mono font-bold text-white">90°</span>
          <span className="text-[9px] text-slate-400">Commutator Inversion</span>
        </div>
        <div className="h-0.5 flex-1 bg-cyan-400/40 mx-2" />
        <div className="flex flex-col items-center space-y-1">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-mono font-bold text-white">180°</span>
          <span className="text-[9px] text-slate-400">Continuous Torque</span>
        </div>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300">
        {payload.purpose}
      </div>
    </div>
  );
};

/**
 * Safe Structured Fallback Renderer (Guarantees zero blank screens)
 */
const FallbackRenderer: React.FC<{ title: string; purpose: string }> = ({ title, purpose }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#060B1E]/80 rounded-2xl border border-cyan-500/20 text-center">
      <Sparkles className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" />
      <h3 className="font-sans font-bold text-white text-base mb-1">{title}</h3>
      <p className="font-sans text-xs text-slate-300 max-w-md leading-relaxed">{purpose}</p>
    </div>
  );
};
