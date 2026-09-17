'use client';

/**
 * Universal Fallback Visualizer Component
 *
 * For topics that don't benefit from 3D (or low-powered devices/accessible fallbacks),
 * this component renders an interactive, pedagogical node-flow diagram and concept map.
 */

import React from 'react';
import { FallbackTeachingPlan } from '@/lib/experience/universalTopicTypes';
import { Sparkles, ArrowRight, Layers, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UniversalFallbackVisualizerProps {
  fallbackPlan: FallbackTeachingPlan;
  parameterValues?: Record<string, any>;
  onParameterChange?: (name: string, value: any) => void;
  className?: string;
}

export const UniversalFallbackVisualizer: React.FC<UniversalFallbackVisualizerProps> = ({
  fallbackPlan,
  parameterValues = {},
  onParameterChange,
  className = '',
}) => {
  return (
    <div className={`w-full rounded-2xl bg-slate-950/80 border border-cyan-500/20 p-6 shadow-xl ${className}`}>
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Visual Model</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{fallbackPlan.title}</h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          {fallbackPlan.type.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-white/5">
        {fallbackPlan.summary}
      </p>

      {/* Interactive Concept Node Network */}
      {fallbackPlan.diagramElements && fallbackPlan.diagramElements.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
            Conceptual Components & Mechanisms
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {fallbackPlan.diagramElements.map((elem, idx) => (
              <div
                key={elem.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">{elem.label}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{elem.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Principles Checklist */}
      {fallbackPlan.principles && fallbackPlan.principles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
            Verified Governing Principles
          </div>
          <div className="flex flex-wrap gap-2">
            {fallbackPlan.principles.map((principle, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
