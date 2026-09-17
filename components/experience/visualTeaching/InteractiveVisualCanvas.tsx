'use client';

/**
 * Xpedition Visual Teaching Mode Engine v1 — Interactive Visual Canvas
 *
 * Lightweight, direct interactive visual demonstration.
 * Implements: "Minimum interaction, maximum understanding."
 * 1-2 controls that produce immediate, intuitive visual feedback.
 */

import React, { useState, useMemo } from 'react';
import { VisualTeachingPlan, ParameterControl } from '@/lib/experience/visualTeaching/types';
import { Sliders, Zap, ArrowRight, Activity, Gauge } from 'lucide-react';

interface InteractiveVisualCanvasProps {
  plan: VisualTeachingPlan;
  onParameterChange?: (name: string, value: number) => void;
  className?: string;
}

export const InteractiveVisualCanvas: React.FC<InteractiveVisualCanvasProps> = ({
  plan,
  onParameterChange,
  className = '',
}) => {
  // Initialize controls
  const controls: ParameterControl[] = plan.interactiveControls.slice(0, 2);

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    controls.forEach((c) => {
      init[c.name] = c.defaultValue;
    });
    return init;
  });

  const handleSliderChange = (name: string, val: number) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    if (onParameterChange) {
      onParameterChange(name, val);
    }
  };

  const conceptId = plan.conceptId.toLowerCase();

  // --- Newton's Laws Math & State ---
  const isNewton = conceptId.includes('newton') || conceptId.includes('force');
  const force = values['appliedForce'] ?? 20;
  const mass = values['cartMass'] ?? 5;
  const acceleration = mass > 0 ? (force / mass) : 0;
  // Normalized cart visual offset
  const cartOffset = Math.min(280, Math.max(20, (acceleration / 10) * 200 + 40));

  // --- Ohm's Law Math & State ---
  const isCircuit = conceptId.includes('circuit') || conceptId.includes('ohm');
  const voltage = values['voltage'] ?? 12;
  const resistance = values['resistance'] ?? 10;
  const current = resistance > 0 ? (voltage / resistance) : 0;
  const bulbGlowOpacity = Math.min(1.0, Math.max(0.1, current / 2.0));

  // --- Fractions Math & State ---
  const isFraction = conceptId.includes('fraction') || conceptId.includes('numerator');
  const num = values['numerator'] ?? 3;
  const den = Math.max(1, values['denominator'] ?? 4);
  const fractionRatio = Math.min(1.0, num / den);

  // --- Supply & Demand Math & State ---
  const isSupplyDemand = conceptId.includes('supply') || conceptId.includes('demand');
  const demandShift = values['demandShift'] ?? 0;
  const supplyShift = values['supplyShift'] ?? 0;
  const equilibriumPrice = 50 + (demandShift * 0.8) - (supplyShift * 0.8);
  const equilibriumQty = 50 + (demandShift * 0.5) + (supplyShift * 0.5);

  // --- English Grammar Syntax ---
  const isGrammar = conceptId.includes('grammar') || conceptId.includes('syntax');
  const isPassive = (values['voiceMode'] ?? 0) === 1;

  return (
    <div className={`flex flex-col gap-5 w-full rounded-2xl bg-slate-950/90 border border-cyan-500/20 p-5 shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Interactive Visual Demonstration
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Live Parameter Simulation
        </span>
      </div>

      {/* Main Dynamic Visual Canvas */}
      <div className="relative w-full h-72 sm:h-80 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 overflow-hidden flex items-center justify-center p-4">
        {/* Case 1: Newton's Laws */}
        {isNewton && (
          <svg className="w-full h-full max-w-lg" viewBox="0 0 500 240">
            {/* Ground / Track */}
            <line x1="30" y1="180" x2="470" y2="180" stroke="#475569" strokeWidth="4" />
            <line x1="30" y1="184" x2="470" y2="184" stroke="#334155" strokeWidth="2" strokeDasharray="10 10" />

            {/* Force Arrow */}
            {force > 0 && (
              <g>
                <line
                  x1={cartOffset - (force * 1.5)}
                  y1="130"
                  x2={cartOffset}
                  y2="130"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  markerEnd="url(#arrow)"
                />
                <text x={cartOffset - (force * 1.5)} y="120" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  F = {force} N →
                </text>
              </g>
            )}

            {/* The Cart */}
            <rect
              x={cartOffset}
              y="110"
              width="90"
              height="50"
              rx="8"
              fill="#0891b2"
              stroke="#22d3ee"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            <text x={cartOffset + 25} y="140" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="monospace">
              {mass} kg
            </text>

            {/* Cart Wheels */}
            <circle cx={cartOffset + 22} cy="168" r="10" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
            <circle cx={cartOffset + 68} cy="168" r="10" fill="#334155" stroke="#94a3b8" strokeWidth="2" />

            {/* Acceleration Gauge Readout */}
            <g transform="translate(360, 20)">
              <rect width="110" height="60" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
              <text x="12" y="24" fill="#94a3b8" fontSize="10" fontFamily="monospace">ACCELERATION</text>
              <text x="12" y="48" fill="#10b981" fontSize="18" fontWeight="bold" fontFamily="monospace">
                {acceleration.toFixed(2)} <tspan fontSize="11">m/s²</tspan>
              </text>
            </g>

            {/* Formula badge */}
            <text x="40" y="40" fill="#67e8f9" fontSize="14" fontWeight="bold" fontFamily="monospace">
              a = F / m = {force} / {mass} = {acceleration.toFixed(2)} m/s²
            </text>
          </svg>
        )}

        {/* Case 2: Electric Circuit & Ohm's Law */}
        {isCircuit && (
          <svg className="w-full h-full max-w-lg" viewBox="0 0 500 240">
            {/* Wire Loop */}
            <rect x="70" y="50" width="360" height="140" rx="20" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray={current > 0 ? "8 6" : "none"} className={current > 0 ? "animate-pulse" : ""} />

            {/* Battery (Left) */}
            <g transform="translate(50, 100)">
              <rect x="0" y="0" width="40" height="40" rx="6" fill="#dc2626" />
              <text x="10" y="25" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">+{voltage}V</text>
              <text x="8" y="-8" fill="#ef4444" fontSize="10" fontFamily="monospace">Battery</text>
            </g>

            {/* Resistor (Top) */}
            <g transform="translate(210, 35)">
              <rect x="0" y="0" width="80" height="30" rx="4" fill="#4338ca" stroke="#818cf8" strokeWidth="1.5" />
              <text x="18" y="20" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="monospace">{resistance} Ω</text>
              <text x="14" y="-8" fill="#a5b4fc" fontSize="10" fontFamily="monospace">Resistor</text>
            </g>

            {/* Bulb (Bottom) */}
            <g transform="translate(220, 160)">
              {/* Glow Aura */}
              <circle cx="30" cy="20" r="35" fill="#fbbf24" fillOpacity={bulbGlowOpacity * 0.6} />
              <circle cx="30" cy="20" r="20" fill="#fef08a" fillOpacity={bulbGlowOpacity} stroke="#eab308" strokeWidth="2" />
              <text x="16" y="25" fill="#713f12" fontSize="11" fontWeight="bold" fontFamily="monospace">LAMP</text>
            </g>

            {/* Current Readout */}
            <g transform="translate(350, 20)">
              <rect width="110" height="60" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="12" y="24" fill="#94a3b8" fontSize="10" fontFamily="monospace">CURRENT (I)</text>
              <text x="12" y="48" fill="#38bdf8" fontSize="18" fontWeight="bold" fontFamily="monospace">
                {current.toFixed(2)} <tspan fontSize="11">A</tspan>
              </text>
            </g>

            {/* Formula badge */}
            <text x="40" y="30" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
              I = V / R = {voltage} V / {resistance} Ω = {current.toFixed(2)} A
            </text>
          </svg>
        )}

        {/* Case 3: Fractions Visualizer */}
        {isFraction && (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-cyan-400 font-mono">{num}</span>
              <span className="text-2xl text-slate-500 font-mono">/</span>
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">{den}</span>
              <span className="text-xl text-slate-400 font-mono ml-4">= {(num / den).toFixed(3)}</span>
            </div>

            {/* Fraction Bar Partitioning */}
            <div className="w-full h-14 bg-slate-900 border-2 border-white/20 rounded-xl overflow-hidden flex">
              {Array.from({ length: den }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full border-r border-slate-950 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    idx < num
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                  style={{ width: `${100 / den}%` }}
                >
                  1/{den}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 font-mono text-center">
              {num} shaded part{num > 1 ? 's' : ''} out of {den} total equal partitions.
            </p>
          </div>
        )}

        {/* Case 4: Supply & Demand Coordinate Plane */}
        {isSupplyDemand && (
          <svg className="w-full h-full max-w-lg" viewBox="0 0 400 240">
            {/* Axes */}
            <line x1="50" y1="20" x2="50" y2="200" stroke="#64748b" strokeWidth="2" />
            <line x1="50" y1="200" x2="360" y2="200" stroke="#64748b" strokeWidth="2" />
            <text x="20" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">Price (P)</text>
            <text x="320" y="220" fill="#94a3b8" fontSize="10" fontFamily="monospace">Quantity (Q)</text>

            {/* Demand Curve (Downward sloping) */}
            <line
              x1={60}
              y1={40 - demandShift}
              x2={340}
              y2={190 - demandShift}
              stroke="#38bdf8"
              strokeWidth="3"
            />
            <text x="345" y={195 - demandShift} fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">D</text>

            {/* Supply Curve (Upward sloping) */}
            <line
              x1={60}
              y1={190 + supplyShift}
              x2={340}
              y2={40 + supplyShift}
              stroke="#10b981"
              strokeWidth="3"
            />
            <text x="345" y={45 + supplyShift} fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace">S</text>

            {/* Equilibrium Point */}
            <circle
              cx={200 + (demandShift * 0.6) + (supplyShift * 0.6)}
              cy={115 - (demandShift * 0.6) + (supplyShift * 0.6)}
              r="6"
              fill="#f59e0b"
            />
            <text
              x={210 + (demandShift * 0.6) + (supplyShift * 0.6)}
              y={110 - (demandShift * 0.6) + (supplyShift * 0.6)}
              fill="#f59e0b"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Equilibrium
            </text>
          </svg>
        )}

        {/* Case 5: English Grammar Syntactic Tree */}
        {isGrammar && (
          <div className="flex flex-col items-center gap-5 w-full max-w-lg">
            <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-white/10 font-sans text-lg">
              {isPassive ? (
                <>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">The reaction</span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold">was observed by</span>
                  <span className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">the scientist</span>
                </>
              ) : (
                <>
                  <span className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">The scientist</span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold">observed</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">the reaction</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono w-full">
              <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                Subject (Agent)
              </div>
              <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">
                Predicate Verb
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                Direct Object
              </div>
            </div>
          </div>
        )}

        {/* Generic Parameter Feedback fallback */}
        {!isNewton && !isCircuit && !isFraction && !isSupplyDemand && !isGrammar && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Gauge className="w-12 h-12 text-cyan-400 animate-pulse" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white font-mono">{plan.title}</span>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Adjust the variables below to observe direct system output modifications.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 1-2 Interactive Sliders Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {controls.map((control) => (
          <div key={control.name} className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">{control.label}</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {values[control.name] ?? control.defaultValue} {control.unit || ''}
              </span>
            </div>

            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step ?? 1}
              value={values[control.name] ?? control.defaultValue}
              onChange={(e) => handleSliderChange(control.name, Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>{control.min} {control.unit}</span>
              <span>{control.max} {control.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
