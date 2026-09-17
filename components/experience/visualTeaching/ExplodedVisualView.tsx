'use client';

/**
 * Xpedition Visual Teaching Mode Engine v1 — Exploded Visual View
 *
 * Separates complex multi-part objects (e.g. DC Electric Motor) into isolated,
 * inspectable components with an assembly slider, component highlighting,
 * and scientific function descriptions.
 */

import React, { useState } from 'react';
import { VisualTeachingPlan, ExplodedComponent } from '@/lib/experience/visualTeaching/types';
import { Layers, Sliders, Info, CheckCircle2, RotateCw } from 'lucide-react';

interface ExplodedVisualViewProps {
  plan: VisualTeachingPlan;
  className?: string;
}

export const ExplodedVisualView: React.FC<ExplodedVisualViewProps> = ({
  plan,
  className = '',
}) => {
  const components: ExplodedComponent[] = plan.explodedComponents || [
    {
      id: 'comp_1',
      name: 'Primary Stator Magnet',
      functionDescription: 'Produces stationary magnetic flux B.',
      color: '#ef4444',
      separatedOffset: { x: -80, y: 0 },
      assembledPosition: { x: -20, y: 0 },
    },
    {
      id: 'comp_2',
      name: 'Rotor Armature',
      functionDescription: 'Experiences electromagnetic Lorentz torque.',
      color: '#f59e0b',
      separatedOffset: { x: 0, y: -40 },
      assembledPosition: { x: 0, y: 0 },
    },
    {
      id: 'comp_3',
      name: 'Split-Ring Commutator',
      functionDescription: 'Reverses current polarity every half-turn.',
      color: '#06b6d4',
      separatedOffset: { x: 60, y: 0 },
      assembledPosition: { x: 20, y: 0 },
    },
  ];

  const [separation, setSeparation] = useState(60); // 0 (assembled) to 100 (fully exploded)
  const [selectedCompId, setSelectedCompId] = useState<string | null>(components[0]?.id || null);
  const [isRotating, setIsRotating] = useState(true);

  const selectedComponent = components.find((c) => c.id === selectedCompId) || components[0];
  const sepFactor = separation / 100;

  return (
    <div className={`flex flex-col gap-5 w-full rounded-2xl bg-slate-950/90 border border-cyan-500/20 p-5 shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Exploded Component View
          </span>
        </div>
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
            isRotating ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-900 text-slate-400 border border-white/10'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>{isRotating ? 'Rotation: ON' : 'Rotation: PAUSED'}</span>
        </button>
      </div>

      {/* Main Exploded View Canvas */}
      <div className="relative w-full h-80 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 overflow-hidden flex items-center justify-center p-4">
        <svg className="w-full h-full max-w-lg" viewBox="0 0 500 280">
          {/* Central Shaft Alignment Axis */}
          <line x1="60" y1="140" x2="440" y2="140" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />

          {/* Stator North Magnet (Left) */}
          <g
            transform={`translate(${100 - (sepFactor * 70)}, 90)`}
            onClick={() => setSelectedCompId('magnets')}
            className="cursor-pointer transition-transform duration-300"
          >
            <rect x="0" y="0" width="55" height="100" rx="8" fill="#dc2626" stroke={selectedCompId === 'magnets' ? '#fff' : '#ef4444'} strokeWidth={selectedCompId === 'magnets' ? 3 : 1} />
            <text x="20" y="55" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="monospace">N</text>
            <text x="-5" y="118" fill="#f87171" fontSize="10" fontFamily="monospace">Permanent Magnet</text>
          </g>

          {/* Armature Coil Rotor (Center) */}
          <g
            transform={`translate(220, ${100 - (sepFactor * 45)})`}
            onClick={() => setSelectedCompId('armature')}
            className="cursor-pointer transition-transform duration-300"
          >
            <rect
              x="0"
              y="0"
              width="60"
              height="80"
              rx="6"
              fill="#d97706"
              stroke={selectedCompId === 'armature' ? '#fff' : '#f59e0b'}
              strokeWidth={selectedCompId === 'armature' ? 3 : 1.5}
            />
            {/* Coil windings */}
            <line x1="10" y1="20" x2="50" y2="20" stroke="#fef08a" strokeWidth="2" />
            <line x1="10" y1="40" x2="50" y2="40" stroke="#fef08a" strokeWidth="2" />
            <line x1="10" y1="60" x2="50" y2="60" stroke="#fef08a" strokeWidth="2" />
            <text x="5" y="-8" fill="#fbbf24" fontSize="10" fontFamily="monospace">Rotor Armature</text>
          </g>

          {/* Split-Ring Commutator */}
          <g
            transform={`translate(${300 + (sepFactor * 50)}, 115)`}
            onClick={() => setSelectedCompId('commutator')}
            className="cursor-pointer transition-transform duration-300"
          >
            <circle cx="25" cy="25" r="22" fill="#0891b2" stroke={selectedCompId === 'commutator' ? '#fff' : '#06b6d4'} strokeWidth={selectedCompId === 'commutator' ? 3 : 1.5} />
            {/* Split Gap */}
            <line x1="3" y1="25" x2="47" y2="25" stroke="#0f172a" strokeWidth="3" />
            <text x="-15" y="-8" fill="#67e8f9" fontSize="10" fontFamily="monospace">Split Commutator</text>
          </g>

          {/* Carbon Brushes */}
          <g
            transform={`translate(${365 + (sepFactor * 75)}, 125)`}
            onClick={() => setSelectedCompId('brushes')}
            className="cursor-pointer transition-transform duration-300"
          >
            <rect x="0" y="0" width="22" height="15" rx="3" fill="#64748b" stroke={selectedCompId === 'brushes' ? '#fff' : '#94a3b8'} strokeWidth={selectedCompId === 'brushes' ? 3 : 1} />
            <rect x="0" y="20" width="22" height="15" rx="3" fill="#64748b" stroke={selectedCompId === 'brushes' ? '#fff' : '#94a3b8'} strokeWidth={selectedCompId === 'brushes' ? 3 : 1} />
            <text x="-10" y="50" fill="#cbd5e1" fontSize="10" fontFamily="monospace">Brushes</text>
          </g>

          {/* Stator South Magnet (Far Left/Right) */}
          <g
            transform={`translate(${170 + (sepFactor * 30)}, 90)`}
            onClick={() => setSelectedCompId('magnets')}
            className="cursor-pointer transition-transform duration-300 opacity-60"
          >
            <rect x="0" y="0" width="25" height="100" rx="6" fill="#2563eb" stroke="#3b82f6" strokeWidth="1" />
            <text x="8" y="55" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">S</text>
          </g>
        </svg>

        {/* Selected Component Inspection Overlay Card */}
        {selectedComponent && (
          <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-sm flex items-start gap-3 shadow-lg">
            <div
              className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: selectedComponent.color }}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white font-mono">
                {selectedComponent.name}
              </span>
              <p className="text-xs text-slate-300 leading-snug">
                {selectedComponent.functionDescription}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Exploded Separation Slider */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Assembly Separation Distance</span>
          </span>
          <span className="text-cyan-400 font-bold">{separation}% {separation === 0 ? '(Assembled)' : '(Exploded)'}</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={separation}
          onChange={(e) => setSeparation(Number(e.target.value))}
          className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>0% (Fully Assembled)</span>
          <span>100% (Maximum Separation)</span>
        </div>
      </div>
    </div>
  );
};
