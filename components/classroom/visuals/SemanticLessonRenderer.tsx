'use client';

/**
 * Generic deterministic fallback visual, built ONLY from the current lesson.
 *
 * Used when a concept has no specialised renderer (e.g. curriculum outline
 * lessons). It shows the lesson as a concept map: the topic at the centre and
 * each step's board title as a node, with the active step's key idea below.
 * It contains no fixed wording from any other concept.
 */

import React from 'react';
import type { SemanticLessonContext } from '@/lib/classroom/visualIdentity';

export interface SemanticLessonRendererProps {
  context: SemanticLessonContext | null;
  className?: string;
}

export const SemanticLessonRenderer: React.FC<SemanticLessonRendererProps> = ({ context, className = '' }) => {
  if (!context) {
    return (
      <div data-testid="semantic-lesson" className={`w-full h-full flex items-center justify-center p-4 rounded-2xl border border-white/10 text-xs text-slate-400 ${className}`}>
        No lesson context is available for this visual.
      </div>
    );
  }
  const active = context.steps[context.activeIndex];
  return (
    <div
      data-testid="semantic-lesson"
      data-visual-kind="semantic_lesson"
      className={`w-full h-full flex flex-col gap-3 p-3 sm:p-4 bg-[#060D24]/95 rounded-2xl border border-cyan-500/30 overflow-hidden ${className}`}
    >
      <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wide">
        {context.subject} · Lesson map
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-0">
        <div className="px-4 py-2 rounded-xl border-2 border-cyan-400/60 bg-cyan-950/50 text-white font-bold text-sm text-center">
          {context.title}
        </div>
        <div className="w-full grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(context.steps.length, 3)}, minmax(0, 1fr))` }}>
          {context.steps.map((s, i) => (
            <div
              key={`${i}-${s.title}`}
              className={`p-2 rounded-xl border text-left ${
                i === context.activeIndex ? 'border-cyan-300 bg-cyan-900/40' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="text-[9px] font-mono text-cyan-300">Step {i + 1}</div>
              <div className="text-[11px] font-semibold text-white leading-snug">{s.boardTitle}</div>
            </div>
          ))}
        </div>
      </div>
      {active?.keyPrinciple && (
        <div className="text-[11px] text-slate-200 text-center leading-relaxed">{active.keyPrinciple}</div>
      )}
    </div>
  );
};

export default SemanticLessonRenderer;
