'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SmartBoardVisualPayload } from '@/lib/visualIntelligence/types';
import {
  Sparkles,
  Play,
  RotateCw,
  Info,
  CheckCircle2,
  Compass,
  Sliders,
  Layers,
  Zap,
  ArrowRight,
  Maximize2,
  Eye,
  RefreshCw,
} from 'lucide-react';

export interface SmartBoardVisualRendererProps {
  payload?: SmartBoardVisualPayload;
  isRotating?: boolean;
  onToggleRotation?: () => void;
  onHotspotClick?: (hotspotId: string) => void;
  className?: string;
}

export const SmartBoardVisualRenderer: React.FC<SmartBoardVisualRendererProps> = React.memo(({
  payload,
  isRotating = true,
  onToggleRotation,
  onHotspotClick,
  className = '',
}) => {
  if (!payload) {
    return <FallbackRenderer title="Interactive Learning Surface" purpose="Loading pedagogical visualization..." />;
  }

  const conceptId = String(payload.metadata?.conceptId || payload.title || '').toLowerCase();

  // 1. DC Motor & Electromagnetism: Dedicated Scientific Deterministic Renderer
  if (
    conceptId.includes('motor') ||
    conceptId.includes('commutation') ||
    conceptId.includes('lorentz') ||
    payload.title.toLowerCase().includes('dc motor')
  ) {
    return (
      <DCMotorScientificRenderer
        payload={payload}
        isRotating={isRotating}
        onToggleRotation={onToggleRotation}
        onHotspotClick={onHotspotClick}
        className={className}
      />
    );
  }

  // 2. Interactive Simulations (Projectile Motion, Kinematics)
  if (payload.visualType === 'interactive_simulation' || conceptId.includes('projectile')) {
    return (
      <ProjectileSimulationRenderer
        payload={payload}
        isRotating={isRotating}
        onToggleRotation={onToggleRotation}
        className={className}
      />
    );
  }

  // 3. Coordinate Graphs (Quadratic Equations, Linear Regression, Distributions)
  if (payload.visualType === 'graph' || conceptId.includes('quadratic') || conceptId.includes('regression')) {
    return <GraphRenderer payload={payload} className={className} />;
  }

  // 4. Molecular Bonding (Chemistry)
  if (payload.visualType === 'molecular_visual' || conceptId.includes('molecule') || conceptId.includes('bond')) {
    return <MolecularRenderer payload={payload} className={className} />;
  }

  // 5. Anatomical Visual (Human Heart)
  if (payload.visualType === 'anatomical_visual' || conceptId.includes('heart') || conceptId.includes('cardio')) {
    return <AnatomicalHeartRenderer payload={payload} className={className} />;
  }

  // 6. Chronological Timelines (History, Process Flow)
  if (payload.visualType === 'timeline' || conceptId.includes('revolution') || conceptId.includes('history')) {
    return <TimelineRenderer payload={payload} className={className} />;
  }

  // 7. Code Visualizer (Algorithms, Binary Search)
  if (payload.visualType === 'code_visual' || conceptId.includes('binary') || conceptId.includes('search')) {
    return <CodeVisualizerRenderer payload={payload} className={className} />;
  }

  // 8. General Scientific Diagram & Verified Existing Asset Fallback
  return (
    <GeneralDiagramRenderer
      payload={payload}
      isRotating={isRotating}
      onHotspotClick={onHotspotClick}
      className={className}
    />
  );
});

SmartBoardVisualRenderer.displayName = 'SmartBoardVisualRenderer';

// =========================================================================
// 1. DC MOTOR DETERMINISTIC SCIENTIFIC SVG RENDERER (NO GREEN BOX - GPU COMPOSITED)
// =========================================================================

const DCMotorScientificRenderer: React.FC<{
  payload: SmartBoardVisualPayload;
  isRotating: boolean;
  onToggleRotation?: () => void;
  onHotspotClick?: (id: string) => void;
  className?: string;
}> = React.memo(({ payload, isRotating, onToggleRotation, onHotspotClick, className = '' }) => {
  // Interactive circuit parameters
  const [currentReversed, setCurrentReversed] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [showArtworkView, setShowArtworkView] = useState(true);

  const stage = String(payload.metadata?.stage || 'explain').toLowerCase();

  const hasRealArtwork =
    Boolean(payload.assetUrl) &&
    !payload.assetUrl?.includes('97eb0310bc') &&
    payload.assetUrl !== '/images/classroom/dc-motor-diagram-clean.png';

  const handleHotspotSelect = useCallback((name: string) => {
    setSelectedHotspot((prev) => (prev === name ? null : name));
    onHotspotClick?.(name.toLowerCase().replace(/\s+/g, '_'));
  }, [onHotspotClick]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-2.5 sm:p-4 bg-gradient-to-b from-[#080E24]/95 via-[#05091B]/95 to-[#030612]/95 rounded-2xl border border-cyan-500/40 overflow-hidden shadow-2xl ${className}`}>
      {/* Hardware-accelerated GPU Keyframes for 60-120fps smooth coil oscillation without React re-renders */}
      <style>{`
        @keyframes xpeditionCoilRock {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(24deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes xpeditionCoilRockReverse {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-24deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      {/* Top Controls Banner */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono select-none z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold tracking-wider text-[11px] sm:text-xs uppercase">
            ⚡ DC Motor & Commutator Mechanism
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-[9px] text-cyan-400">
            Stage: {stage.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Polarity Reversal Toggle */}
          <button
            type="button"
            onClick={() => setCurrentReversed(!currentReversed)}
            title="Reverse battery terminal voltage polarity"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
              currentReversed
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Polarity: {currentReversed ? 'Reverse (-/+)' : 'Normal (+/-)'}</span>
          </button>

          {/* Real AI Artwork vs Scientific Schematic Toggle */}
          {hasRealArtwork && (
            <button
              type="button"
              onClick={() => setShowArtworkView(!showArtworkView)}
              className="flex items-center gap-1 text-[10px] font-mono text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10"
              title="Toggle between scientific schematic and generated illustration"
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>{showArtworkView ? 'Diagram' : 'AI Render'}</span>
            </button>
          )}

          {/* Play/Pause Rotation */}
          <button
            type="button"
            onClick={onToggleRotation}
            className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px]"
          >
            <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span className="hidden sm:inline">{isRotating ? 'Spinning' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Stage-Aware Pedagogical Visual Cue Banner */}
      <div className="w-full px-2.5 py-1 bg-black/40 border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono select-none shrink-0 z-10">
        {stage === 'introduce' || stage === 'INTRODUCE' ? (
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="font-bold">INTRODUCE:</span>
            <span className="text-slate-300">Clean DC motor overview — Energy conversion: Electrical (V · I) ──▶ Mechanical (τ · ω)</span>
          </div>
        ) : stage === 'explain' || stage === 'EXPLAIN' ? (
          <div className="flex items-center gap-2 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-bold">EXPLAIN:</span>
            <span className="text-slate-300">Labelled scientific diagram — 5 core components & Fleming&apos;s Left Hand Rule</span>
          </div>
        ) : stage === 'demonstrate' || stage === 'DEMONSTRATE' ? (
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">DEMONSTRATE:</span>
            <span className="text-slate-300">Continuous rotational mechanism — Commutator inverts current every 180°</span>
          </div>
        ) : stage === 'interact' || stage === 'INTERACT' ? (
          <div className="flex items-center gap-2 text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="font-bold">INTERACT:</span>
            <span className="text-slate-300">Toggle Polarity (+/-) or click any component hotspot to inspect physics</span>
          </div>
        ) : stage === 'question' || stage === 'QUESTION' ? (
          <div className="flex items-center gap-2 text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="font-bold">QUESTION:</span>
            <span className="text-slate-300">Visual Prediction: If current direction reverses, what happens to torque τ?</span>
          </div>
        ) : stage === 'feedback' || stage === 'FEEDBACK' ? (
          <div className="flex items-center gap-2 text-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span className="font-bold">FEEDBACK:</span>
            <span className="text-slate-300">Lorentz Force Law: F = I · (L × B) confirms torque direction strictly follows current vector</span>
          </div>
        ) : stage === 'challenge' || stage === 'CHALLENGE' || stage === 'practice' || stage === 'PRACTICE' ? (
          <div className="flex items-center gap-2 text-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span className="font-bold">CHALLENGE:</span>
            <span className="text-slate-300">Diagnostic scenario: What happens if commutator gap is filled with conductor?</span>
          </div>
        ) : stage === 'assess' || stage === 'ASSESS' ? (
          <div className="flex items-center gap-2 text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="font-bold">ASSESS:</span>
            <span className="text-slate-300">Evaluate component functions: Stator field (B), Armature coil (I), and Commutator gap</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="font-bold">EXPLORE:</span>
            <span className="text-slate-300">Interactive DC Motor exploration and physical simulation</span>
          </div>
        )}
      </div>

      {/* Main Visual Surface */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center my-1 select-none overflow-hidden">
        {showArtworkView && hasRealArtwork ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={payload.assetUrl!}
              alt="DC Motor Generated Illustration"
              width={560}
              height={300}
              className="max-h-[260px] object-contain rounded-xl drop-shadow-[0_12px_36px_rgba(0,0,0,0.9)]"
            />
          </div>
        ) : (
          /* =================================================================
             HIGH-PRECISION ACCURACY-SENSITIVE DC MOTOR SVG SCHEMATIC
             Visible elements:
             - Permanent North Stator Magnet (Red)
             - Permanent South Stator Magnet (Blue)
             - Magnetic Field (B) flux lines (Cyan vectors)
             - Rectangular copper armature loop (3D perspective)
             - Central rotation axle (Steel shaft)
             - Split-ring commutator (Copper semicircles with gap)
             - Carbon brushes (Graphite contacts with lead wires)
             - Current flow vectors (I)
             - Lorentz force vectors (F_1 up, F_2 down)
             - Rotational torque arc (tau)
             ================================================================= */
          <svg
            viewBox="0 0 680 320"
            className="w-full h-full max-h-[270px] drop-shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="northMagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="70%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="southMagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="70%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>
              <linearGradient id="copperCoilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id="axleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
              <linearGradient id="graphiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <marker id="cyanArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#22D3EE" />
              </marker>
              <marker id="forceArrowUp" markerWidth="8" markerHeight="8" refX="4" refY="7" orient="auto">
                <path d="M0,7 L4,0 L8,7 Z" fill="#10B981" />
              </marker>
              <marker id="forceArrowDown" markerWidth="8" markerHeight="8" refX="4" refY="1" orient="auto">
                <path d="M0,1 L4,8 L8,1 Z" fill="#10B981" />
              </marker>
              <marker id="currentArrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#FBBF24" />
              </marker>
            </defs>

            {/* Ambient Observatory Grid Lines */}
            <g opacity="0.12">
              <line x1="50" y1="160" x2="630" y2="160" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="340" y1="30" x2="340" y2="290" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
            </g>

            {/* 1. MAGNETIC FIELD (B) FLUX LINES (N -> S) */}
            <g opacity="0.65">
              <line x1="170" y1="100" x2="490" y2="100" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#cyanArrow)" />
              <line x1="170" y1="130" x2="490" y2="130" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#cyanArrow)" />
              <line x1="170" y1="160" x2="490" y2="160" stroke="#22D3EE" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#cyanArrow)" />
              <line x1="170" y1="190" x2="490" y2="190" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#cyanArrow)" />
              <line x1="170" y1="220" x2="490" y2="220" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#cyanArrow)" />
              {/* Field Label */}
              <text x="340" y="85" fill="#22D3EE" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                MAGNETIC FIELD (B) →
              </text>
            </g>

            {/* 2. STATOR MAGNETS (N on Left, S on Right) */}
            {/* Left Stator: North Pole */}
            <g
              className="cursor-pointer transition-transform hover:opacity-95"
              onClick={() => handleHotspotSelect('Permanent Stator Magnets')}
            >
              <rect x="70" y="80" width="100" height="160" rx="8" fill="url(#northMagGrad)" stroke="#F87171" strokeWidth="2" />
              {/* 3D bevel edge */}
              <rect x="70" y="80" width="20" height="160" rx="8" fill="#991B1B" opacity="0.4" />
              <text x="120" y="172" fill="#FFFFFF" fontSize="36" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
                N
              </text>
              <text x="120" y="225" fill="#FCA5A5" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                NORTH POLE
              </text>
            </g>

            {/* Right Stator: South Pole */}
            <g
              className="cursor-pointer transition-transform hover:opacity-95"
              onClick={() => handleHotspotSelect('Permanent Stator Magnets')}
            >
              <rect x="500" y="80" width="100" height="160" rx="8" fill="url(#southMagGrad)" stroke="#60A5FA" strokeWidth="2" />
              {/* 3D bevel edge */}
              <rect x="580" y="80" width="20" height="160" rx="8" fill="#1E3A8A" opacity="0.4" />
              <text x="550" y="172" fill="#FFFFFF" fontSize="36" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
                S
              </text>
              <text x="550" y="225" fill="#93C5FD" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                SOUTH POLE
              </text>
            </g>

            {/* 3. CENTRAL STEEL ROTATION AXLE */}
            <g onClick={() => handleHotspotSelect('Central Rotation Axle')} className="cursor-pointer">
              <rect x="190" y="154" width="290" height="12" rx="6" fill="url(#axleGrad)" stroke="#CBD5E1" strokeWidth="1" />
              {/* Axle Bearings */}
              <circle cx="210" cy="160" r="11" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="470" cy="160" r="11" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
              <text x="210" y="138" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">Axle Bearing</text>
            </g>

            {/* 4. RECTANGULAR ARMATURE COPPER COIL (Isometric Projection with Live Angle Tilt) */}
            <g
              style={{
                transformOrigin: '340px 160px',
                animation: isRotating
                  ? `${currentReversed ? 'xpeditionCoilRockReverse' : 'xpeditionCoilRock'} 3.5s ease-in-out infinite`
                  : 'none',
                willChange: isRotating ? 'transform' : 'auto',
              }}
              onClick={() => handleHotspotSelect('Armature Copper Coil')}
              className="cursor-pointer"
            >
              {/* Coil Loop Shadow */}
              <rect
                x="240"
                y="95"
                width="200"
                height="130"
                rx="6"
                fill="none"
                stroke="#000000"
                strokeWidth="10"
                opacity="0.4"
                transform="translate(4, 4)"
              />
              {/* Main Copper Loop Windings */}
              <rect
                x="240"
                y="95"
                width="200"
                height="130"
                rx="6"
                fill="none"
                stroke="url(#copperCoilGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                filter={selectedHotspot === 'Armature Copper Coil' ? 'url(#cyanGlow)' : undefined}
              />
              {/* Internal Copper Wire Secondary Strand */}
              <rect
                x="245"
                y="100"
                width="190"
                height="120"
                rx="4"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                opacity="0.75"
              />

              {/* Current Direction Vectors (I) along Left & Right Arms */}
              {!currentReversed ? (
                <>
                  {/* Left Arm: Current coming Forward (Down on screen view) */}
                  <line x1="240" y1="120" x2="240" y2="180" stroke="#FBBF24" strokeWidth="3" markerEnd="url(#currentArrow)" />
                  <text x="228" y="155" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>

                  {/* Right Arm: Current going Backward (Up on screen view) */}
                  <line x1="440" y1="180" x2="440" y2="120" stroke="#FBBF24" strokeWidth="3" markerEnd="url(#currentArrow)" />
                  <text x="446" y="155" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>
                </>
              ) : (
                <>
                  {/* Reversed: Left Arm Up, Right Arm Down */}
                  <line x1="240" y1="180" x2="240" y2="120" stroke="#FBBF24" strokeWidth="3" markerEnd="url(#currentArrow)" />
                  <text x="228" y="155" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>

                  <line x1="440" y1="120" x2="440" y2="180" stroke="#FBBF24" strokeWidth="3" markerEnd="url(#currentArrow)" />
                  <text x="446" y="155" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">I</text>
                </>
              )}

              {/* Armature Center Core */}
              <ellipse cx="340" cy="160" rx="35" ry="18" fill="#1E293B" stroke="#64748B" strokeWidth="2" opacity="0.9" />
              <text x="340" y="164" fill="#E2E8F0" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                ARMATURE
              </text>
            </g>

            {/* 5. LORENTZ FORCE (F) VECTORS & TORQUE (τ) COUPLE */}
            {!currentReversed ? (
              <g>
                {/* Left Arm Force: UPWARD Vector */}
                <line x1="240" y1="95" x2="240" y2="45" stroke="#10B981" strokeWidth="4" markerEnd="url(#forceArrowUp)" />
                <rect x="205" y="30" width="70" height="18" rx="4" fill="#064E3B" stroke="#10B981" strokeWidth="1" />
                <text x="240" y="43" fill="#6EE7B7" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  F₁ (UP) ↑
                </text>

                {/* Right Arm Force: DOWNWARD Vector */}
                <line x1="440" y1="225" x2="440" y2="275" stroke="#10B981" strokeWidth="4" markerEnd="url(#forceArrowDown)" />
                <rect x="405" y="278" width="75" height="18" rx="4" fill="#064E3B" stroke="#10B981" strokeWidth="1" />
                <text x="442" y="291" fill="#6EE7B7" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  F₂ (DOWN) ↓
                </text>

                {/* Rotational Torque Arc (Clockwise spin) */}
                <path d="M 320 60 A 40 20 0 0 1 360 60" fill="none" stroke="#F59E0B" strokeWidth="3" markerEnd="url(#currentArrow)" />
                <text x="340" y="52" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  TORQUE (τ = 2·F·r) ↻
                </text>
              </g>
            ) : (
              <g>
                {/* Reversed Forces: Left DOWN, Right UP */}
                <line x1="240" y1="95" x2="240" y2="145" stroke="#10B981" strokeWidth="4" markerEnd="url(#forceArrowDown)" />
                <rect x="205" y="148" width="75" height="18" rx="4" fill="#064E3B" stroke="#10B981" strokeWidth="1" />
                <text x="242" y="161" fill="#6EE7B7" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  F₁ (DOWN) ↓
                </text>

                <line x1="440" y1="225" x2="440" y2="175" stroke="#10B981" strokeWidth="4" markerEnd="url(#forceArrowUp)" />
                <rect x="405" y="152" width="70" height="18" rx="4" fill="#064E3B" stroke="#10B981" strokeWidth="1" />
                <text x="440" y="165" fill="#6EE7B7" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  F₂ (UP) ↑
                </text>

                {/* Rotational Torque Arc (Counter-Clockwise spin) */}
                <path d="M 360 60 A 40 20 0 0 0 320 60" fill="none" stroke="#F59E0B" strokeWidth="3" markerEnd="url(#currentArrow)" />
                <text x="340" y="52" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  TORQUE (REVERSED) ↺
                </text>
              </g>
            )}

            {/* 6. SPLIT-RING COMMUTATOR & CARBON BRUSHES (Axle Output End) */}
            <g
              transform="translate(420, 142)"
              onClick={() => handleHotspotSelect('Split-Ring Commutator')}
              className="cursor-pointer"
            >
              {/* Upper Commutator Segment */}
              <path
                d="M 5 6 A 14 14 0 0 1 25 6"
                fill="none"
                stroke="#D97706"
                strokeWidth="7"
                strokeLinecap="round"
                filter={selectedHotspot === 'Split-Ring Commutator' ? 'url(#cyanGlow)' : undefined}
              />
              {/* Commutator Insulation Gap (Critical physics feature) */}
              <line x1="4" y1="18" x2="26" y2="18" stroke="#0F172A" strokeWidth="2.5" />
              {/* Lower Commutator Segment */}
              <path
                d="M 5 30 A 14 14 0 0 0 25 30"
                fill="none"
                stroke="#D97706"
                strokeWidth="7"
                strokeLinecap="round"
                filter={selectedHotspot === 'Split-Ring Commutator' ? 'url(#cyanGlow)' : undefined}
              />

              {/* Upper Carbon Brush Contact */}
              <rect x="8" y="-4" width="14" height="8" rx="2" fill="url(#graphiteGrad)" stroke="#94A3B8" strokeWidth="1" />
              {/* Lower Carbon Brush Contact */}
              <rect x="8" y="32" width="14" height="8" rx="2" fill="url(#graphiteGrad)" stroke="#94A3B8" strokeWidth="1" />

              {/* Battery Connection Leads */}
              <path d="M 15 -4 L 15 -18 L -15 -18" fill="none" stroke="#EF4444" strokeWidth="2" />
              <circle cx="-15" cy="-18" r="6" fill="#DC2626" />
              <text x="-15" y="-15" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                {currentReversed ? '-' : '+'}
              </text>

              <path d="M 15 40 L 15 54 L -15 54" fill="none" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="-15" cy="54" r="6" fill="#2563EB" />
              <text x="-15" y="57" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                {currentReversed ? '+' : '-'}
              </text>

              <text x="35" y="20" fill="#FCD34D" fontSize="9" fontFamily="monospace" fontWeight="bold">
                COMMUTATOR GAP
              </text>
            </g>

            {/* 7. PEDAGOGICAL COMPONENT LABELS / HOTSPOTS PINNED ON THE DRAWING */}
            <g className="font-mono text-[9px] font-bold">
              {/* Permanent Stator */}
              <g onClick={() => handleHotspotSelect('Permanent Stator Magnets')} className="cursor-pointer">
                <circle cx="120" cy="70" r="4" fill="#22D3EE" />
                <line x1="120" y1="70" x2="120" y2="80" stroke="#22D3EE" strokeWidth="1" />
              </g>

              {/* Carbon Brushes */}
              <g onClick={() => handleHotspotSelect('Carbon Brushes')} className="cursor-pointer">
                <rect x="420" y="240" width="95" height="18" rx="4" fill="#0F172A" stroke="#94A3B8" strokeWidth="1" />
                <text x="467" y="252" fill="#E2E8F0" textAnchor="middle">
                  • Carbon Brushes
                </text>
                <line x1="435" y1="185" x2="467" y2="240" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
              </g>

              {/* Split-Ring Commutator */}
              <g onClick={() => handleHotspotSelect('Split-Ring Commutator')} className="cursor-pointer">
                <rect x="365" y="202" width="120" height="18" rx="4" fill="#0F172A" stroke="#D97706" strokeWidth="1" />
                <text x="425" y="214" fill="#FCD34D" textAnchor="middle">
                  • Split-Ring Commutator
                </text>
                <line x1="430" y1="165" x2="425" y2="202" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" />
              </g>

              {/* Armature Coil */}
              <g onClick={() => handleHotspotSelect('Armature Copper Coil')} className="cursor-pointer">
                <rect x="290" y="240" width="115" height="18" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
                <text x="347" y="252" fill="#FBBF24" textAnchor="middle">
                  • Armature Copper Coil
                </text>
                <line x1="340" y1="225" x2="347" y2="240" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2" />
              </g>

              {/* Central Axle */}
              <g onClick={() => handleHotspotSelect('Central Rotation Axle')} className="cursor-pointer">
                <rect x="180" y="202" width="115" height="18" rx="4" fill="#0F172A" stroke="#94A3B8" strokeWidth="1" />
                <text x="237" y="214" fill="#CBD5E1" textAnchor="middle">
                  • Central Rotation Axle
                </text>
                <line x1="210" y1="170" x2="237" y2="202" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
              </g>
            </g>
          </svg>
        )}
      </div>

      {/* Selected Hotspot Inspector Callout Bar */}
      {selectedHotspot && (
        <div className="w-full bg-[#081230]/95 border border-cyan-400/40 rounded-xl p-2 flex items-center justify-between text-xs text-slate-200 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-cyan-300 font-mono">{selectedHotspot}:</span>
            <span className="text-[11px] text-slate-300">
              {selectedHotspot === 'Split-Ring Commutator'
                ? 'Rotates with the axle, switching brush contact every 180° to invert coil current and sustain continuous unidirectional torque.'
                : selectedHotspot === 'Carbon Brushes'
                ? 'Stationary graphite blocks that conduct direct current from the DC power source to the spinning commutator with low friction.'
                : selectedHotspot === 'Permanent Stator Magnets'
                ? 'Provides the fixed horizontal magnetic flux field (B) spanning North to South across the motor rotor cavity.'
                : selectedHotspot === 'Armature Copper Coil'
                ? 'Conducts current (I) across parallel sides, experiencing opposing Lorentz forces (F = I·L·B) that create rotational torque.'
                : 'Hardened steel drive shaft that transfers mechanical rotational torque (τ) to external loads.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedHotspot(null)}
            className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Educational Purpose & Governing Formula Bar */}
      <div className="w-full border-t border-white/[0.08] pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-300 select-none z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
            F = I · (L × B)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
            τ = 2 · F · r
          </span>
        </div>
        <div className="text-slate-400 text-right truncate max-w-sm hidden sm:block">
          {payload.purpose || 'Continuous rotational torque powered by Lorentz force and commutator polarity inversion.'}
        </div>
      </div>
    </div>
  );
});

DCMotorScientificRenderer.displayName = 'DCMotorScientificRenderer';

// =========================================================================
// 2. PROJECTILE MOTION SIMULATION RENDERER
// =========================================================================

const ProjectileSimulationRenderer: React.FC<{
  payload: SmartBoardVisualPayload;
  isRotating: boolean;
  onToggleRotation?: () => void;
  className?: string;
}> = React.memo(({ payload, isRotating, onToggleRotation, className = '' }) => {
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(20);
  const [isFiring, setIsFiring] = useState(false);
  const [progress, setProgress] = useState(1);
  const animRef = React.useRef<number | null>(null);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  const g = 9.8;
  const rad = (angle * Math.PI) / 180;
  const vx = velocity * Math.cos(rad);
  const vy = velocity * Math.sin(rad);
  const totalTime = (2 * vy) / g;
  const maxRange = vx * totalTime;
  const maxHeight = (vy * vy) / (2 * g);

  // Parabolic path points for SVG
  const pathPoints: string[] = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalTime;
    const x = vx * t;
    const y = vy * t - 0.5 * g * t * t;
    // Map x (0..60m) to svgX (80..580), y (0..25m) to svgY (240..60)
    const svgX = 80 + (x / 60) * 500;
    const svgY = 240 - (y / 25) * 180;
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`);
  }
  const pathD = pathPoints.join(' ');

  const fireCannon = () => {
    if (isFiring) return;
    setIsFiring(true);
    setProgress(0);
    const start = performance.now();
    const duration = totalTime * 400; // ms

    const step = (now: number) => {
      const elapsed = now - start;
      const frac = Math.min(elapsed / duration, 1);
      setProgress(frac);
      if (frac < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setIsFiring(false);
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  const currT = progress * totalTime;
  const currX = vx * currT;
  const currY = Math.max(0, vy * currT - 0.5 * g * currT * currT);
  const ballSvgX = 80 + (currX / 60) * 500;
  const ballSvgY = 240 - (currY / 25) * 180;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-[#0A122C]/95 to-[#040816]/95 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl ${className}`}>
      {/* Simulation Header */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono select-none">
        <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
          <Play className="w-3.5 h-3.5 fill-cyan-400" />
          <span>TRAJECTORY SIMULATION: {payload.title}</span>
        </span>
        <button
          type="button"
          onClick={fireCannon}
          disabled={isFiring}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
        >
          <span>🎯 Fire Projectile</span>
        </button>
      </div>

      {/* SVG Parabolic Flight Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        <svg viewBox="0 0 640 280" className="w-full h-full max-h-[230px]">
          {/* Ground Grid */}
          <line x1="60" y1="240" x2="600" y2="240" stroke="#334155" strokeWidth="2" />
          <line x1="80" y1="50" x2="80" y2="250" stroke="#334155" strokeWidth="2" />

          {/* Distance Ticks */}
          {[10, 20, 30, 40, 50].map((d) => {
            const tx = 80 + (d / 60) * 500;
            return (
              <g key={d}>
                <line x1={tx} y1="240" x2={tx} y2="246" stroke="#64748B" strokeWidth="1" />
                <text x={tx} y="258" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {d}m
                </text>
              </g>
            );
          })}

          {/* Parabolic Trajectory Path */}
          <path d={pathD} fill="none" stroke="#06B6D4" strokeWidth="3" strokeDasharray="6 4" opacity="0.85" />

          {/* Target Flag at 45m */}
          <g transform={`translate(${80 + (45 / 60) * 500}, 210)`}>
            <line x1="0" y1="30" x2="0" y2="0" stroke="#F59E0B" strokeWidth="2" />
            <polygon points="0,0 16,7 0,14" fill="#F59E0B" />
            <text x="0" y="38" fill="#FCD34D" fontSize="9" fontFamily="monospace" textAnchor="middle">Target 45m</text>
          </g>

          {/* Launcher Cannon at (80, 240) */}
          <g transform={`translate(80, 240) rotate(${-angle})`}>
            <rect x="0" y="-7" width="28" height="14" rx="3" fill="#64748B" stroke="#94A3B8" strokeWidth="1.5" />
          </g>
          <circle cx="80" cy="240" r="9" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />

          {/* Flying Projectile Ball */}
          <circle cx={ballSvgX} cy={ballSvgY} r="7" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="0.8s" repeatCount="indefinite" />
          </circle>

          {/* Max Height Apex Marker */}
          <g transform={`translate(${80 + (maxRange * 0.5 / 60) * 500}, ${240 - (maxHeight / 25) * 180})`}>
            <circle cx="0" cy="0" r="4" fill="#F59E0B" />
            <text x="0" y="-8" fill="#FCD34D" fontSize="9" fontFamily="monospace" textAnchor="middle">
              Apex: {maxHeight.toFixed(1)}m
            </text>
          </g>
        </svg>
      </div>

      {/* Direct Interactive Sliders */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.08] text-[10px] font-mono select-none">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-300">
            <span>Angle (θ):</span>
            <span className="text-cyan-300 font-bold">{angle}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="75"
            step="5"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="accent-cyan-400 h-1 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-300">
            <span>Velocity (v₀):</span>
            <span className="text-cyan-300 font-bold">{velocity} m/s</span>
          </div>
          <input
            type="range"
            min="10"
            max="30"
            step="1"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="accent-cyan-400 h-1 cursor-pointer"
          />
        </div>

        <div className="flex flex-col justify-center bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
          <span className="text-slate-400">Range (R):</span>
          <span className="text-emerald-400 font-bold text-xs">{maxRange.toFixed(1)} meters</span>
        </div>

        <div className="flex flex-col justify-center bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
          <span className="text-slate-400">Flight Time:</span>
          <span className="text-amber-300 font-bold text-xs">{totalTime.toFixed(2)} seconds</span>
        </div>
      </div>
    </div>
  );
});

ProjectileSimulationRenderer.displayName = 'ProjectileSimulationRenderer';

// =========================================================================
// 3. MATHEMATICAL COORDINATE GRAPH RENDERER (QUADRATIC & REGRESSION)
// =========================================================================

const GraphRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = React.memo(({
  payload,
  className = '',
}) => {
  const isRegression = payload.title.toLowerCase().includes('regression');

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#05091B]/95 rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-indigo-300">
        <span className="font-bold flex items-center gap-1.5">
          <span>📈</span>
          <span>{isRegression ? 'OLS REGRESSION LINE' : 'COORDINATE GRAPH: PARABOLA'}</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {isRegression ? 'y = m·x + c' : 'y = a·x² + b·x + c'}
        </span>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        <svg viewBox="0 0 540 240" className="w-full h-full max-h-[220px]">
          {/* Grid lines */}
          <g stroke="#1E293B" strokeWidth="1">
            {[-200, -150, -100, -50, 0, 50, 100, 150, 200].map((offset) => (
              <line key={`x-${offset}`} x1={270 + offset} y1="20" x2={270 + offset} y2="220" />
            ))}
            {[-80, -40, 0, 40, 80].map((offset) => (
              <line key={`y-${offset}`} x1="50" y1="130 + offset" x2="490" y2="130 + offset" />
            ))}
          </g>

          {/* Axes */}
          <line x1="50" y1="130" x2="490" y2="130" stroke="#475569" strokeWidth="2" />
          <line x1="270" y1="20" x2="270" y2="220" stroke="#475569" strokeWidth="2" />
          <text x="480" y="145" fill="#94A3B8" fontSize="10" fontFamily="monospace">x</text>
          <text x="255" y="32" fill="#94A3B8" fontSize="10" fontFamily="monospace">y</text>

          {!isRegression ? (
            /* Quadratic Parabola Curve */
            <>
              <path
                d="M 120 210 Q 270 30 420 210"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Vertex Point */}
              <circle cx="270" cy="30" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="280" y="35" fill="#FCD34D" fontSize="10" fontFamily="monospace" fontWeight="bold">
                Vertex (h, k)
              </text>
              {/* Axis of Symmetry */}
              <line x1="270" y1="20" x2="270" y2="220" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

              {/* Roots / Intercepts */}
              <circle cx="178" cy="130" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="160" y="145" fill="#6EE7B7" fontSize="9" fontFamily="monospace">Root x₁</text>
              <circle cx="362" cy="130" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="366" y="145" fill="#6EE7B7" fontSize="9" fontFamily="monospace">Root x₂</text>
            </>
          ) : (
            /* Linear Regression Scatter & Best Fit Line */
            <>
              {/* Data points */}
              {[
                [100, 190], [140, 175], [180, 160], [210, 140], [250, 130],
                [300, 110], [340, 95], [380, 80], [420, 65]
              ].map(([px, py], idx) => (
                <circle key={idx} cx={px} cy={py} r="4" fill="#38BDF8" />
              ))}
              {/* Regression line */}
              <line x1="80" y1="200" x2="440" y2="55" stroke="#F59E0B" strokeWidth="3" />
              <text x="360" y="50" fill="#FCD34D" fontSize="10" fontFamily="monospace" fontWeight="bold">
                y = 0.42x + 12 (R² = 0.94)
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium">
        {payload.purpose}
      </div>
    </div>
  );
});

GraphRenderer.displayName = 'GraphRenderer';

// =========================================================================
// 4. MOLECULAR BONDING RENDERER (CHEMISTRY H₂O VSEPR)
// =========================================================================

const MolecularRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = React.memo(({
  payload,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#051410]/95 rounded-2xl border border-emerald-500/30 overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-emerald-300">
        <span className="font-bold flex items-center gap-1.5">
          <span>🧪</span>
          <span>COVALENT MOLECULAR GEOMETRY: H₂O</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          VSEPR: Bent 104.5°
        </span>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        <svg viewBox="0 0 460 220" className="w-full h-full max-h-[210px]">
          {/* Lone Pair Electron Repulsion Clouds */}
          <ellipse cx="205" cy="55" rx="22" ry="32" fill="#10B981" opacity="0.15" transform="rotate(-25, 205, 55)" />
          <circle cx="198" cy="50" r="3" fill="#34D399" />
          <circle cx="212" cy="45" r="3" fill="#34D399" />

          <ellipse cx="255" cy="55" rx="22" ry="32" fill="#10B981" opacity="0.15" transform="rotate(25, 255, 55)" />
          <circle cx="248" cy="45" r="3" fill="#34D399" />
          <circle cx="262" cy="50" r="3" fill="#34D399" />

          <text x="230" y="32" fill="#6EE7B7" fontSize="9" fontFamily="monospace" textAnchor="middle">
            2 Non-Bonding Lone Pairs
          </text>

          {/* Covalent Single Bonds (O-H) */}
          <line x1="230" y1="110" x2="140" y2="175" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
          <line x1="230" y1="110" x2="320" y2="175" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />

          {/* Bond Angle Arc (104.5°) */}
          <path d="M 195 135 A 45 45 0 0 0 265 135" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
          <text x="230" y="152" fill="#FCD34D" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            104.5°
          </text>

          {/* Central Oxygen Nucleus (Red) */}
          <circle cx="230" cy="110" r="32" fill="#EF4444" stroke="#FCA5A5" strokeWidth="2.5" />
          <text x="230" y="116" fill="#FFFFFF" fontSize="18" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            O
          </text>
          <text x="230" y="88" fill="#FCA5A5" fontSize="8" fontFamily="monospace" textAnchor="middle">
            δ⁻ (3.44)
          </text>

          {/* Hydrogen Atom 1 (White) */}
          <circle cx="140" cy="175" r="20" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          <text x="140" y="180" fill="#0F172A" fontSize="13" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            H
          </text>
          <text x="140" y="206" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
            δ⁺ (2.20)
          </text>

          {/* Hydrogen Atom 2 (White) */}
          <circle cx="320" cy="175" r="20" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          <text x="320" y="180" fill="#0F172A" fontSize="13" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            H
          </text>
          <text x="320" y="206" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
            δ⁺ (2.20)
          </text>
        </svg>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium">
        {payload.purpose}
      </div>
    </div>
  );
});

MolecularRenderer.displayName = 'MolecularRenderer';

// =========================================================================
// 5. ANATOMICAL HEART 4-CHAMBER SCHEMATIC (BIOLOGY)
// =========================================================================

const AnatomicalHeartRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = React.memo(({
  payload,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#14060B]/95 rounded-2xl border border-rose-500/30 overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-rose-300">
        <span className="font-bold flex items-center gap-1.5">
          <span>❤️</span>
          <span>CARDIOVASCULAR ANATOMY: DUAL CIRCULATION</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
          4 Cardiac Chambers
        </span>
      </div>

      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        <svg viewBox="0 0 520 220" className="w-full h-full max-h-[210px]">
          {/* Left/Right Separation Split */}
          {/* Blue Side: Right Atrium and Right Ventricle (Deoxygenated) */}
          <rect x="110" y="40" width="140" height="70" rx="8" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="2" />
          <text x="180" y="70" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            Right Atrium
          </text>
          <text x="180" y="88" fill="#93C5FD" fontSize="9" fontFamily="monospace" textAnchor="middle">
            (From Vena Cava)
          </text>

          <rect x="110" y="125" width="140" height="75" rx="8" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="2" />
          <text x="180" y="155" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            Right Ventricle
          </text>
          <text x="180" y="173" fill="#BFDBFE" fontSize="9" fontFamily="monospace" textAnchor="middle">
            (Pumps to Lungs)
          </text>

          {/* Red Side: Left Atrium and Left Ventricle (Oxygenated) */}
          <rect x="270" y="40" width="140" height="70" rx="8" fill="#991B1B" stroke="#EF4444" strokeWidth="2" />
          <text x="340" y="70" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            Left Atrium
          </text>
          <text x="340" y="88" fill="#FCA5A5" fontSize="9" fontFamily="monospace" textAnchor="middle">
            (From Pulmonary Veins)
          </text>

          {/* Left Ventricle (Thick Myocardium Wall) */}
          <rect x="270" y="125" width="140" height="75" rx="8" fill="#DC2626" stroke="#F87171" strokeWidth="4" />
          <text x="340" y="155" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            Left Ventricle
          </text>
          <text x="340" y="173" fill="#FECDD3" fontSize="9" fontFamily="monospace" textAnchor="middle">
            (3x Thick Myocardium)
          </text>

          {/* Septum Barrier */}
          <line x1="260" y1="40" x2="260" y2="200" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 2" />

          {/* Blood flow circuit badges */}
          <text x="180" y="25" fill="#60A5FA" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            PULMONARY CIRCUIT (BLUE)
          </text>
          <text x="340" y="25" fill="#F87171" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            SYSTEMIC CIRCUIT (RED)
          </text>
        </svg>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium">
        {payload.purpose}
      </div>
    </div>
  );
});

AnatomicalHeartRenderer.displayName = 'AnatomicalHeartRenderer';

// =========================================================================
// 6. CHRONOLOGICAL TIMELINE RENDERER (HISTORY)
// =========================================================================

const TimelineRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = React.memo(({
  payload,
  className = '',
}) => {
  const milestones = [
    { year: 'May 1789', title: 'Estates-General', desc: 'King Louis XVI convenes assembly; Third Estate breaks away.' },
    { year: 'Jul 14, 1789', title: 'Storming of Bastille', desc: 'Citizens seize the medieval royal weapons fortress.' },
    { year: 'Aug 1789', title: 'Rights of Man', desc: 'National Assembly drafts Declaration of Equality.' },
    { year: 'Sep 1792', title: 'First Republic', desc: 'Monarchy abolished; popular sovereignty proclaimed.' },
  ];

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#140E05]/95 rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-amber-300">
        <span className="font-bold flex items-center gap-1.5">
          <span>⏱️</span>
          <span>HISTORICAL TIMELINE: {payload.title}</span>
        </span>
        <span className="text-[10px] text-amber-400">Sequential Milestones</span>
      </div>

      <div className="w-full flex-1 flex items-center justify-between my-2 px-3 gap-2">
        {milestones.map((m, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center text-center relative">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold mb-1">
              {m.year}
            </span>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white my-1 shadow-md" />
            <span className="font-bold text-white text-xs mt-1 leading-snug">{m.title}</span>
            <span className="text-[10px] text-slate-400 mt-1 leading-tight max-w-[130px] hidden sm:block">
              {m.desc}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium">
        {payload.purpose}
      </div>
    </div>
  );
});

TimelineRenderer.displayName = 'TimelineRenderer';

// =========================================================================
// 7. CODE & ALGORITHM VISUALIZER (PROGRAMMING - BINARY SEARCH)
// =========================================================================

const CodeVisualizerRenderer: React.FC<{ payload: SmartBoardVisualPayload; className?: string }> = React.memo(({
  payload,
  className = '',
}) => {
  const array = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const low = 0;
  const high = 9;
  const mid = 4; // value: 16

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between p-4 bg-[#0A0D24]/95 rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs font-mono text-indigo-300">
        <span className="font-bold flex items-center gap-1.5">
          <span>💻</span>
          <span>ALGORITHM VISUALIZER: BINARY SEARCH</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Target: 23 • O(log n)
        </span>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 my-2">
        {/* Array visual cells */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {array.map((val, idx) => {
            const isMid = idx === mid;
            const isTarget = val === 23;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-9 sm:w-11 h-11 sm:h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm sm:text-base border transition-all ${
                    isMid
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 scale-105 shadow-md shadow-amber-500/20'
                      : isTarget
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-white/[0.04] border-white/10 text-slate-300'
                  }`}
                >
                  {val}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1">[{idx}]</span>
                {idx === low && <span className="text-[9px] font-mono font-bold text-sky-400">low</span>}
                {idx === mid && <span className="text-[9px] font-mono font-bold text-amber-400">mid</span>}
                {idx === high && <span className="text-[9px] font-mono font-bold text-purple-400">high</span>}
              </div>
            );
          })}
        </div>

        {/* Step Comparison Banner */}
        <div className="bg-[#12163A] border border-indigo-400/30 rounded-xl px-4 py-2 text-xs font-mono text-slate-200">
          <span className="text-amber-300 font-bold">Step 1: </span>
          <span>array[mid] = 16. Target 23 {'>'} 16 → Discard left half, set </span>
          <span className="text-cyan-300 font-bold">low = mid + 1 (index 5)</span>
        </div>
      </div>

      <div className="w-full text-center text-[11px] font-sans text-slate-300 font-medium">
        {payload.purpose}
      </div>
    </div>
  );
});

CodeVisualizerRenderer.displayName = 'CodeVisualizerRenderer';

// =========================================================================
// 8. GENERAL SCIENTIFIC DIAGRAM & VERIFIED ASSET RENDERER
// =========================================================================

const GeneralDiagramRenderer: React.FC<{
  payload: SmartBoardVisualPayload;
  isRotating: boolean;
  onHotspotClick?: (id: string) => void;
  className?: string;
}> = React.memo(({ payload, isRotating, onHotspotClick, className = '' }) => {
  const imageUrl = payload.assetUrl;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <div className="relative w-full max-w-xl h-full max-h-[310px] flex items-center justify-center select-none group">
        {imageUrl ? (
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
        ) : (
          <div className="w-full h-56 rounded-2xl bg-[#080E24]/90 border border-cyan-500/30 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            <h4 className="font-sans font-bold text-white text-sm">{payload.title}</h4>
            <p className="font-sans text-xs text-slate-300 max-w-md">{payload.purpose}</p>
          </div>
        )}

        {/* Ambient rotational glow */}
        {isRotating && (
          <div
            aria-hidden="true"
            className="absolute inset-x-1/4 inset-y-6 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none animate-pulse"
          />
        )}
      </div>
    </div>
  );
});

GeneralDiagramRenderer.displayName = 'GeneralDiagramRenderer';

// =========================================================================
// 9. SAFE STRUCTURED FALLBACK RENDERER
// =========================================================================

const FallbackRenderer: React.FC<{ title: string; purpose: string }> = React.memo(({ title, purpose }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#060B1E]/90 rounded-2xl border border-cyan-500/20 text-center select-none">
      <Sparkles className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" />
      <h3 className="font-sans font-bold text-white text-base mb-1">{title}</h3>
      <p className="font-sans text-xs text-slate-300 max-w-md leading-relaxed">{purpose}</p>
    </div>
  );
});

FallbackRenderer.displayName = 'FallbackRenderer';

export default SmartBoardVisualRenderer;
