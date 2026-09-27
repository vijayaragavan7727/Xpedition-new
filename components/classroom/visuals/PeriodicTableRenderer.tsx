'use client';

/**
 * Deterministic, interactive periodic table for the Smart Board.
 *
 * No generated imagery. Data comes from lib/chemistry/periodicTableData.ts.
 * The lesson step selects the opening view via `visualData.mode`:
 *   overview | numbers | periods_groups | classes | trends | challenge
 */

import React, { useMemo, useState } from 'react';
import {
  PERIODIC_TABLE_ELEMENTS,
  CATEGORY_LABELS,
  LOCATION_CHALLENGES,
  type ChemicalElement,
  type ElementClass,
} from '@/lib/chemistry/periodicTableData';

export type PeriodicTableMode = 'overview' | 'numbers' | 'periods_groups' | 'classes' | 'trends' | 'challenge';

const CLASS_STYLE: Record<ElementClass, string> = {
  metal: 'bg-sky-900/70 border-sky-500/40 text-sky-100',
  nonmetal: 'bg-emerald-900/70 border-emerald-500/40 text-emerald-100',
  metalloid: 'bg-amber-900/70 border-amber-500/50 text-amber-100',
  unknown: 'bg-slate-800/70 border-slate-600/40 text-slate-300',
};

const CLASS_LABEL: Record<ElementClass, string> = {
  metal: 'Metals',
  nonmetal: 'Nonmetals',
  metalloid: 'Metalloids',
  unknown: 'Unknown',
};

type Filter = 'all' | ElementClass;

export interface PeriodicTableRendererProps {
  mode?: PeriodicTableMode;
  /** Reports challenge progress as learner evidence. */
  onActivity?: (result: { completed: boolean; wrong: number }) => void;
  className?: string;
}

/** Location challenges a learner must solve for the challenge step to count as completed. */
export const CHALLENGES_TO_COMPLETE = 3;

export const PeriodicTableRenderer: React.FC<PeriodicTableRendererProps> = ({ mode = 'overview', onActivity, className = '' }) => {
  const [challengeWrong, setChallengeWrong] = useState(0);
  const [selected, setSelected] = useState<ChemicalElement | null>(null);
  const [filter, setFilter] = useState<Filter>(mode === 'classes' ? 'metalloid' : 'all');
  const [showTrends, setShowTrends] = useState(mode === 'trends');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [challengeResult, setChallengeResult] = useState<'correct' | 'wrong' | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);

  const isChallenge = mode === 'challenge';
  const challenge = LOCATION_CHALLENGES[challengeIdx % LOCATION_CHALLENGES.length];
  const showNumbers = mode !== 'classes';

  const highlight = useMemo(() => {
    if (!selected) return null;
    if (mode === 'periods_groups') return { period: selected.period, group: selected.group };
    return null;
  }, [selected, mode]);

  const handleSelect = (el: ChemicalElement) => {
    setSelected(el);
    if (isChallenge) {
      if (challengeResult === 'correct') return; // already solved; move to the next clue
      if (el.symbol === challenge.answer) {
        setChallengeResult('correct');
        const solved = solvedCount + 1;
        setSolvedCount(solved);
        onActivity?.({ completed: solved >= CHALLENGES_TO_COMPLETE, wrong: challengeWrong });
      } else {
        setChallengeResult('wrong');
        setChallengeWrong((w) => w + 1);
        onActivity?.({ completed: false, wrong: challengeWrong + 1 });
      }
    }
  };

  const nextChallenge = () => {
    setChallengeIdx((i) => i + 1);
    setChallengeResult(null);
    setSelected(null);
  };

  const cellOpacity = (el: ChemicalElement): string => {
    if (filter !== 'all' && el.elementClass !== filter) return 'opacity-20';
    if (highlight && !(el.period === highlight.period || (highlight.group !== null && el.group === highlight.group))) {
      return 'opacity-35';
    }
    return 'opacity-100';
  };

  return (
    <div
      data-testid="periodic-table"
      data-visual-kind="periodic_table_interactive"
      className={`relative w-full h-full flex flex-col gap-2 p-2 sm:p-3 bg-[#050B1A]/95 rounded-2xl border border-emerald-500/30 overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
        <span className="text-emerald-300 font-bold tracking-wide">PERIODIC TABLE · 118 ELEMENTS</span>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter element class">
          {(['all', 'metal', 'nonmetal', 'metalloid'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-1.5 py-0.5 rounded border cursor-pointer ${
                filter === f ? 'bg-emerald-600/40 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : CLASS_LABEL[f]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowTrends((v) => !v)}
            aria-pressed={showTrends}
            className={`px-1.5 py-0.5 rounded border cursor-pointer ${
              showTrends ? 'bg-indigo-600/40 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            Trends
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden">
        <div className="relative min-w-[430px]">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(10, auto)' }}
          >
            {PERIODIC_TABLE_ELEMENTS.map((el) => (
              <button
                key={el.z}
                type="button"
                data-element={el.symbol}
                onClick={() => handleSelect(el)}
                title={`${el.name} (Z = ${el.z})`}
                aria-label={`${el.name}, atomic number ${el.z}`}
                style={{ gridRow: el.gridRow, gridColumn: el.gridColumn }}
                className={`relative aspect-square min-w-0 rounded-[3px] border flex flex-col items-center justify-center leading-none transition-all cursor-pointer ${
                  CLASS_STYLE[el.elementClass]
                } ${cellOpacity(el)} ${selected?.z === el.z ? 'ring-2 ring-white z-10 scale-110' : 'hover:brightness-125'}`}
              >
                {showNumbers && <span className="text-[6px] sm:text-[7px] text-white/60">{el.z}</span>}
                <span className="text-[8px] sm:text-[10px] font-bold">{el.symbol}</span>
              </button>
            ))}
            {/* f-block placeholders in group 3 */}
            <div style={{ gridRow: 6, gridColumn: 3 }} className="rounded-[3px] border border-dashed border-white/15 flex items-center justify-center text-[6px] text-slate-500">57–71</div>
            <div style={{ gridRow: 7, gridColumn: 3 }} className="rounded-[3px] border border-dashed border-white/15 flex items-center justify-center text-[6px] text-slate-500">89–103</div>
            <div style={{ gridRow: 8, gridColumn: '1 / span 18' }} className="h-1" />
          </div>

          {showTrends && (
            <div
              data-testid="periodic-trends"
              className="pointer-events-none absolute inset-x-0 top-0 h-[70%] flex flex-col justify-between p-1 text-[9px] font-mono"
            >
              <div className="self-center px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-400/50 text-indigo-100">
                Across a period →: atomic radius ↓ · electronegativity ↑
              </div>
              <div className="self-start px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-400/50 text-indigo-100">
                Down a group ↓: atomic radius ↑ · electronegativity ↓
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-slate-400">
        {(['metal', 'nonmetal', 'metalloid', 'unknown'] as ElementClass[]).map((c) => (
          <span key={c} className="flex items-center gap-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm border ${CLASS_STYLE[c]}`} />
            {CLASS_LABEL[c]}
          </span>
        ))}
        <span className="text-slate-500">General trends exclude the noble gases for electronegativity.</span>
      </div>

      {isChallenge && (
        <div data-testid="periodic-challenge" className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-2 text-[11px] text-amber-100 flex flex-wrap items-center justify-between gap-2">
          <span>
            <b>Challenge {(challengeIdx % LOCATION_CHALLENGES.length) + 1}:</b> {challenge.clue}
          </span>
          <span className="flex items-center gap-2">
            {challengeResult === 'correct' && <span className="text-emerald-300 font-semibold">Correct!</span>}
            {challengeResult === 'wrong' && selected && (
              <span className="text-rose-300">
                {selected.symbol} is period {selected.period}
                {selected.group ? `, group ${selected.group}` : ' (f-block)'}. Try again.
              </span>
            )}
            <span className="text-amber-300/80">Solved: {solvedCount}</span>
            {challengeResult === 'correct' && (
              <button type="button" onClick={nextChallenge} className="px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400 cursor-pointer">
                Next clue →
              </button>
            )}
          </span>
        </div>
      )}

      <div data-testid="element-inspector" className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-[11px] text-slate-200 min-h-[44px]">
        {selected ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-base font-black text-white">{selected.symbol}</span>
            <span className="font-semibold">{selected.name}</span>
            <span>Atomic number Z = {selected.z}</span>
            <span>Period {selected.period}</span>
            <span>{selected.group ? `Group ${selected.group}` : 'f-block (no group number)'}</span>
            <span>{CATEGORY_LABELS[selected.category]}</span>
            <span>{selected.block}-block</span>
            {selected.valenceElectrons !== null && <span>Valence electrons: {selected.valenceElectrons}</span>}
          </div>
        ) : (
          <span className="text-slate-400">Select an element to inspect its atomic number, period, group and class.</span>
        )}
      </div>
    </div>
  );
};

export default PeriodicTableRenderer;
