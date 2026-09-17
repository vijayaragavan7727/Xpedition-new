'use client';

/**
 * Xpedition Visual Teaching Mode Engine v1 — Enhanced 2D Fallback
 *
 * For abstract, non-spatial, or novel topics (or devices with hardware limitations),
 * renders a high-clarity relational concept network and progressive explanation.
 * Never looks like an error screen; feels calm, modern, premium, and educational.
 */

import React, { useState } from 'react';
import { VisualTeachingPlan } from '@/lib/experience/visualTeaching/types';
import { Network, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';

interface Enhanced2DFallbackProps {
  plan: VisualTeachingPlan;
  className?: string;
}

export const Enhanced2DFallback: React.FC<Enhanced2DFallbackProps> = ({
  plan,
  className = '',
}) => {
  const entities = plan.entities && plan.entities.length > 0 ? plan.entities : [
    { id: 'e1', label: 'Core Mechanism', role: 'primary', color: '#06b6d4', description: 'Foundational concept governing behavior.' },
    { id: 'e2', label: 'Inputs & Variables', role: 'input', color: '#f59e0b', description: 'Parameters driving observable change.' },
    { id: 'e3', label: 'System Outcomes', role: 'output', color: '#10b981', description: 'Measurable equilibrium results.' },
  ];

  const [activeNodeId, setActiveNodeId] = useState<string>(entities[0]?.id || 'e1');
  const activeEntity = entities.find((e) => e.id === activeNodeId) || entities[0];

  return (
    <div className={`flex flex-col gap-5 w-full rounded-2xl bg-slate-950/90 border border-cyan-500/20 p-5 shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Conceptual Node Network
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Interactive Diagram Mode
        </span>
      </div>

      {/* Relational Node Network Diagram */}
      <div className="relative w-full h-80 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 overflow-hidden flex flex-col items-center justify-center p-6">
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-lg z-10">
          {entities.map((ent, idx) => {
            const isSelected = ent.id === activeNodeId;
            return (
              <React.Fragment key={ent.id}>
                <button
                  onClick={() => setActiveNodeId(ent.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 scale-105 shadow-xl shadow-cyan-500/20'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                  style={{ minWidth: '130px' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ent.color || '#38bdf8' }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      {ent.role}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white leading-snug">
                    {ent.label}
                  </span>
                </button>
                {idx < entities.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-cyan-500/60 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Entity Inspector Banner */}
        {activeEntity && (
          <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-sm flex items-start gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: activeEntity.color || '#06b6d4' }}
            />
            <div>
              <span className="text-xs font-bold text-white font-mono">
                {activeEntity.label} ({activeEntity.role.toUpperCase()})
              </span>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                {activeEntity.description || plan.learningObjective}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Relational Connections Strip */}
      {plan.relationships && plan.relationships.length > 0 && (
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/80 border border-white/10">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            System Relationships & Governing Mechanics
          </span>
          <div className="flex flex-wrap gap-2">
            {plan.relationships.map((rel) => (
              <div
                key={rel.id}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/5 text-xs text-slate-300 flex items-center gap-2"
              >
                <span className="text-cyan-400 font-mono font-bold">•</span>
                <span>{rel.label}</span>
                {rel.equation && (
                  <span className="font-mono text-amber-300 text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {rel.equation}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
