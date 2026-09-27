'use client';

/**
 * Heart & dual circulation Smart Board visual.
 *
 * Audit finding: the previous heart visual was one static box diagram for all
 * five steps. It showed no valves, no direction of flow and no lungs or body,
 * although the lesson taught valves and asked the learner to "trace the pathway".
 *
 * The step selects the view via `visualData.mode`:
 *   chambers  four chambers and the septum
 *   valves    adds the four valves where they actually sit
 *   trace     the learner traces one loop by clicking the next structure; a
 *             wrong click explains why that structure is not next
 *   circuits  both circuits drawn with flow direction
 *
 * The diagram uses the standard anatomical convention: the heart's RIGHT side
 * is drawn on the viewer's LEFT.
 */

import React, { useCallback, useState } from 'react';

export type HeartMode = 'chambers' | 'valves' | 'trace' | 'circuits';

export type NodeId = 'RA' | 'RV' | 'LUNGS' | 'LA' | 'LV' | 'BODY';

export const TRACE_SEQUENCE: NodeId[] = ['RA', 'RV', 'LUNGS', 'LA', 'LV', 'BODY'];

const NODE_LABEL: Record<NodeId, string> = {
  RA: 'right atrium',
  RV: 'right ventricle',
  LUNGS: 'lungs',
  LA: 'left atrium',
  LV: 'left ventricle',
  BODY: 'body',
};

/** Why the EXPECTED structure is next (shown after a wrong click). */
export const WHY_NEXT: Record<NodeId, string> = {
  RA: 'Blood from the body returns through the venae cavae into the right atrium.',
  RV: 'From the right atrium, blood drops through the tricuspid valve into the right ventricle below it.',
  LUNGS:
    'The blood is still oxygen-poor. The right ventricle pumps it through the pulmonary valve to the lungs. It cannot cross the septum.',
  LA: 'Oxygen-rich blood returns from the lungs through the pulmonary veins into the left atrium.',
  LV: 'From the left atrium, blood passes the mitral valve into the left ventricle.',
  BODY: 'The left ventricle pumps it through the aortic valve into the aorta and out to the body.',
};

const TRACE_PROMPT: Record<NodeId, string> = {
  RA: 'Oxygen-poor blood is coming back from the body. Click where it enters the heart.',
  RV: 'Where does it go from the right atrium?',
  LUNGS: 'It still has no oxygen. Where does the right ventricle send it?',
  LA: 'It has picked up oxygen. Where does it re-enter the heart?',
  LV: 'Where does it go from the left atrium?',
  BODY: 'Where does the left ventricle pump it?',
};

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const BOXES: Record<NodeId, Box> = {
  LUNGS: { x: 200, y: 6, w: 160, h: 38 },
  RA: { x: 110, y: 64, w: 140, h: 68 },
  LA: { x: 310, y: 64, w: 140, h: 68 },
  RV: { x: 110, y: 152, w: 140, h: 76 },
  LV: { x: 310, y: 152, w: 140, h: 76 },
  BODY: { x: 200, y: 252, w: 160, h: 38 },
};

const FILL: Record<NodeId, { fill: string; stroke: string }> = {
  LUNGS: { fill: '#1E293B', stroke: '#94A3B8' },
  BODY: { fill: '#1E293B', stroke: '#94A3B8' },
  RA: { fill: '#1E3A8A', stroke: '#3B82F6' },
  RV: { fill: '#1D4ED8', stroke: '#60A5FA' },
  LA: { fill: '#991B1B', stroke: '#EF4444' },
  LV: { fill: '#B91C1C', stroke: '#F87171' },
};

const TITLE: Record<NodeId, string> = {
  LUNGS: 'Lungs',
  BODY: 'Body',
  RA: 'Right Atrium',
  RV: 'Right Ventricle',
  LA: 'Left Atrium',
  LV: 'Left Ventricle',
};

const SUB: Partial<Record<NodeId, string>> = {
  RA: 'receives from body',
  RV: 'pumps to lungs',
  LA: 'receives from lungs',
  LV: 'thickest wall',
  LUNGS: 'blood picks up O₂',
  BODY: 'cells use O₂',
};

/** Flow edges between consecutive structures (drawn as arrows). */
/** Visual-part tokens for focus highlighting (see SmartBoardVisualRenderer `focus`). */
const NODE_PARTS: Record<NodeId, string> = {
  RA: 'RA right systemic',
  RV: 'RV right pulmonary',
  LUNGS: 'LUNGS pulmonary',
  LA: 'LA left pulmonary',
  LV: 'LV left systemic',
  BODY: 'BODY systemic',
};
function edgeParts(from: NodeId, to: NodeId): string {
  const parts = [`${from}_${to}`];
  if (from === 'LUNGS' || to === 'LUNGS') parts.push('pulmonary');
  if (from === 'BODY' || to === 'BODY') parts.push('systemic');
  if ((from === 'RA' && to === 'RV') || (from === 'LA' && to === 'LV')) parts.push(from === 'RA' ? 'right' : 'left');
  parts.push(to);
  return parts.join(' ');
}

const EDGES: Array<{ from: NodeId; to: NodeId; d: string; label: string }> = [
  { from: 'BODY', to: 'RA', d: 'M 200 272 L 70 272 L 70 98 L 108 98', label: 'venae cavae' },
  { from: 'RA', to: 'RV', d: 'M 180 134 L 180 150', label: '' },
  { from: 'RV', to: 'LUNGS', d: 'M 108 190 L 40 190 L 40 25 L 198 25', label: 'pulmonary artery' },
  { from: 'LUNGS', to: 'LA', d: 'M 362 25 L 520 25 L 520 98 L 452 98', label: 'pulmonary veins' },
  { from: 'LA', to: 'LV', d: 'M 380 134 L 380 150', label: '' },
  { from: 'LV', to: 'BODY', d: 'M 452 190 L 490 190 L 490 272 L 362 272', label: 'aorta' },
];

export const HeartCirculationRenderer: React.FC<{
  mode?: HeartMode;
  /** Reports the trace as learner evidence (completed / wrong turns). */
  onActivity?: (result: { completed: boolean; wrong: number }) => void;
  className?: string;
}> = ({ mode = 'chambers', onActivity, className = '' }) => {
  const [traced, setTraced] = useState(0);
  const [wrong, setWrong] = useState<{ clicked: NodeId; expected: NodeId } | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const isTrace = mode === 'trace';
  const showValves = mode !== 'chambers';
  const traceDone = traced >= TRACE_SEQUENCE.length;

  const onNode = useCallback(
    (id: NodeId) => {
      if (!isTrace || traceDone) return;
      const expected = TRACE_SEQUENCE[traced];
      if (id === expected) {
        setTraced((t) => t + 1);
        setWrong(null);
        if (traced + 1 === TRACE_SEQUENCE.length) onActivity?.({ completed: true, wrong: wrongCount });
      } else {
        setWrong({ clicked: id, expected });
        setWrongCount((c) => c + 1);
        onActivity?.({ completed: false, wrong: wrongCount + 1 });
      }
    },
    [isTrace, traceDone, traced, wrongCount, onActivity]
  );

  const reset = () => {
    setTraced(0);
    setWrong(null);
    setWrongCount(0);
  };

  // Edges drawn: all in circuits mode; in trace mode only the path traced so far.
  const visibleEdges = EDGES.filter((e) => {
    if (mode === 'circuits') return true;
    if (!isTrace) return false;
    const toIdx = TRACE_SEQUENCE.indexOf(e.to);
    const fromIdx = e.from === 'BODY' ? -1 : TRACE_SEQUENCE.indexOf(e.from);
    return toIdx < traced && fromIdx < toIdx;
  });

  return (
    <div
      data-testid="heart-visual"
      data-heart-mode={mode}
      className={`relative w-full h-full flex flex-col items-center justify-between gap-1 p-3 bg-[#14060B]/95 rounded-2xl border border-rose-500/30 overflow-hidden ${className}`}
    >
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-1.5 text-xs font-mono text-rose-300">
        <span className="font-bold">HEART &amp; DUAL CIRCULATION</span>
        <span className="text-[10px] text-slate-400">right side drawn on the left</span>
      </div>

      <svg viewBox="0 0 560 296" className="w-full flex-1 min-h-0 max-h-[260px]" role="img" aria-label="Heart chambers, valves and circulation">
        <defs>
          <marker id="heart-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FBBF24" />
          </marker>
        </defs>

        {/* Septum */}
        <line data-part="septum" x1="280" y1="60" x2="280" y2="232" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 3" />
        <text x="280" y="244" fill="#CBD5E1" fontSize="9" fontFamily="monospace" textAnchor="middle">septum</text>

        {visibleEdges.map((e) => (
          <g key={`${e.from}-${e.to}`} data-edge={`${e.from}-${e.to}`} data-part={edgeParts(e.from, e.to)}>
            <path d={e.d} fill="none" stroke="#FBBF24" strokeWidth="2.5" markerEnd="url(#heart-arrow)" />
          </g>
        ))}

        {(Object.keys(BOXES) as NodeId[]).map((id) => {
          const b = BOXES[id];
          const done = isTrace && TRACE_SEQUENCE.indexOf(id) < traced;
          const isWrong = wrong?.clicked === id;
          const fill = FILL[id];
          return (
            <g
              key={id}
              data-heart-node={id}
              data-part={NODE_PARTS[id]}
              role={isTrace ? 'button' : undefined}
              tabIndex={isTrace ? 0 : undefined}
              aria-label={isTrace ? `Select ${NODE_LABEL[id]}` : undefined}
              onClick={() => onNode(id)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') onNode(id);
              }}
              style={{ cursor: isTrace && !traceDone ? 'pointer' : 'default' }}
            >
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="8"
                fill={fill.fill}
                stroke={isWrong ? '#F43F5E' : done ? '#FBBF24' : fill.stroke}
                strokeWidth={id === 'LV' ? 4 : isWrong || done ? 3 : 2}
              />
              <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 2} fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                {TITLE[id]}
              </text>
              {SUB[id] && (
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 13} fill="#E2E8F0" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {SUB[id]}
                </text>
              )}
            </g>
          );
        })}

        {showValves && (
          <g data-testid="heart-valves" data-part="valves">
            {/* Atrioventricular valves */}
            <rect x="160" y="138" width="40" height="8" rx="2" fill="#FDE68A" />
            <text x="206" y="146" fill="#FDE68A" fontSize="9" fontFamily="monospace">tricuspid</text>
            <rect x="360" y="138" width="40" height="8" rx="2" fill="#FDE68A" />
            <text x="406" y="146" fill="#FDE68A" fontSize="9" fontFamily="monospace">mitral</text>
            {/* Exit valves */}
            <rect x="100" y="176" width="8" height="28" rx="2" fill="#FDE68A" />
            <text x="46" y="222" fill="#FDE68A" fontSize="9" fontFamily="monospace">pulmonary</text>
            <rect x="452" y="176" width="8" height="28" rx="2" fill="#FDE68A" />
            <text x="464" y="222" fill="#FDE68A" fontSize="9" fontFamily="monospace">aortic</text>
          </g>
        )}
      </svg>

      {isTrace && (
        <div
          data-testid="heart-trace"
          data-trace-progress={traced}
          data-trace-wrong={wrongCount}
          className="w-full rounded-xl border border-amber-500/40 bg-amber-950/40 p-2 text-[11px] text-amber-100 flex flex-wrap items-center justify-between gap-2"
        >
          <span>
            {traceDone ? (
              <>
                <b>Loop complete</b> ({wrongCount === 0 ? 'no wrong turns' : `${wrongCount} wrong turn${wrongCount > 1 ? 's' : ''}`}): body → right atrium → right
                ventricle → lungs → left atrium → left ventricle → body.
              </>
            ) : wrong ? (
              <>
                <b>Not the {NODE_LABEL[wrong.clicked]}.</b> {WHY_NEXT[wrong.expected]}
              </>
            ) : (
              <>
                <b>Trace step {traced + 1} of 6:</b> {TRACE_PROMPT[TRACE_SEQUENCE[traced]]}
              </>
            )}
          </span>
          {(traceDone || traced > 0) && (
            <button type="button" onClick={reset} className="px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400 cursor-pointer">
              Trace again
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HeartCirculationRenderer;
