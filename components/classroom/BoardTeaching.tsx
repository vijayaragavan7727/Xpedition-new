'use client';

/**
 * BoardTeaching — the theory half of the Smart Board's teaching unit.
 *
 * The board teaches first and illustrates second:
 *   Core idea     why it matters + 3–5 concise points
 *   How it works  an ordered explanation; each point highlights the part of the
 *                 visual it talks about (focus) and Buddy says it out loud
 *   Formula       only when the step uses one: expression, variables, when used
 *
 * Sections are revealed one at a time (tabs, then point by point) so the board
 * never becomes a wall of text. Everything comes from the active lesson's
 * authored content (lib/classroom/lessons/lessonTeaching.ts); nothing here is
 * subject-specific. On predict-first steps the theory stays locked until the
 * learner's first attempt, so it cannot answer the prediction for them.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ListOrdered, Sigma, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import type { FormulaItem, StepTeaching } from './types';

export type TeachingTab = 'core' | 'how' | 'formula';

export interface BoardTeachingProps {
  /** Identifies the step (kept for callers; state resets live in useTeachingState). */
  stepId?: string;
  teach: StepTeaching;
  /** Formulas explained on this step (already resolved from the lesson). */
  formulas: FormulaItem[];
  /** The step's formula line, when it has one that is not a lesson formula card. */
  formulaSnippet?: string;
  /** Predict-first: theory is locked until the first attempt. */
  locked: boolean;
  /** Section / point state, owned by the Smart Board (see useTeachingState). */
  state: TeachingState;
}

export interface TeachingState {
  tab: TeachingTab;
  point: number;
  /** Visual part the current explanation is about (null = the whole visual). */
  focus: string | null;
  selectTab: (tab: TeachingTab) => void;
  showPoint: (index: number) => void;
}

/**
 * Which theory section and "How it works" point the learner is on. Lives in the
 * Smart Board so the visual (focus + caption) and Buddy follow the same point.
 */
export function useTeachingState(
  stepId: string,
  teach: StepTeaching | undefined,
  onBuddyLine?: (line: string | null) => void
): TeachingState {
  const how = React.useMemo(() => teach?.how ?? [], [teach]);
  const [tab, setTab] = useState<TeachingTab>('core');
  const [point, setPoint] = useState(0);
  // New step: start again from the core idea and the whole visual. Reset during
  // render (not in an effect) so the new step never paints with the old section.
  const [forStep, setForStep] = useState(stepId);
  if (forStep !== stepId) {
    setForStep(stepId);
    setTab('core');
    setPoint(0);
  }

  // …and Buddy returns to his own lesson line.
  useEffect(() => {
    onBuddyLine?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  const showPoint = useCallback(
    (index: number) => {
      const p = how[index];
      if (!p) return;
      setTab('how');
      setPoint(index);
      onBuddyLine?.(p.buddy ?? null);
    },
    [how, onBuddyLine]
  );

  const selectTab = useCallback(
    (next: TeachingTab) => {
      if (next === 'how') {
        showPoint(point);
        return;
      }
      setTab(next);
      onBuddyLine?.(null);
    },
    [showPoint, point, onBuddyLine]
  );

  const focus = tab === 'how' ? how[point]?.focus ?? null : null;
  return { tab, point, focus, selectTab, showPoint };
}

export const BoardTeaching: React.FC<BoardTeachingProps> = React.memo(({
  teach,
  formulas,
  formulaSnippet,
  locked,
  state,
}) => {
  const how = teach.how ?? [];
  const hasFormula = formulas.length > 0 || Boolean(formulaSnippet);
  const tabs = useMemo(
    () =>
      [
        { id: 'core' as const, label: 'Core idea', icon: <BookOpen className="w-3.5 h-3.5" /> },
        ...(how.length > 0 ? [{ id: 'how' as const, label: 'How it works', icon: <ListOrdered className="w-3.5 h-3.5" /> }] : []),
        ...(hasFormula ? [{ id: 'formula' as const, label: 'Formula', icon: <Sigma className="w-3.5 h-3.5" /> }] : []),
      ],
    [how.length, hasFormula]
  );
  const { tab, point, selectTab, showPoint } = state;

  return (
    <section
      data-testid="board-theory"
      data-theory-tab={locked ? 'locked' : tab}
      aria-label="Theory"
      className="min-w-0 flex flex-col rounded-2xl border border-white/[0.09] bg-[#071231]/80"
    >
      {!locked && tabs.length > 1 && (
        <div role="tablist" aria-label="Theory sections" className="flex flex-wrap items-center gap-1 p-1.5 border-b border-white/[0.07]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-theory-tab-button={t.id}
              onClick={() => selectTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 min-h-[34px] px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${
                tab === t.id ? 'bg-sky-500/20 text-sky-100 border border-sky-400/40' : 'text-slate-300 hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div role={locked ? undefined : 'tabpanel'} className="p-3 sm:p-3.5 space-y-2.5 text-[12.5px] sm:text-[13px] leading-relaxed text-slate-200">
        {teach.why && (
          <p data-testid="theory-why" className="text-slate-300">
            <span className="font-semibold text-sky-300">Why it matters: </span>
            {teach.why}
          </p>
        )}

        {locked ? (
          <div data-testid="key-principle-locked" className="rounded-xl border border-dashed border-amber-400/35 bg-amber-500/[0.06] p-2.5 space-y-1">
            <p className="flex items-center gap-1.5 text-amber-200 font-semibold text-xs">
              <Lightbulb className="w-3.5 h-3.5" /> Predict first
            </p>
            <p className="text-[12px] text-slate-300">
              Look at the board and commit to an answer in the check below. The explanation opens after your first attempt.
            </p>
          </div>
        ) : tab === 'core' ? (
          <ul data-testid="theory-points" className="space-y-1.5">
            {teach.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden="true" className="mt-[7px] w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        ) : tab === 'how' ? (
          <div data-testid="theory-how" data-how-point={point} className="space-y-2">
            <ol className="space-y-1">
              {how.map((p, i) => {
                const active = i === point;
                return (
                  <li key={`${i}-${p.text}`}>
                    <button
                      type="button"
                      data-how-index={i}
                      data-how-focus={p.focus ?? ''}
                      aria-current={active ? 'step' : undefined}
                      onClick={() => showPoint(i)}
                      className={`w-full text-left flex gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${
                        active ? 'bg-sky-500/15 border border-sky-400/40 text-white' : i < point ? 'text-slate-300 border border-transparent hover:bg-white/[0.04]' : 'text-slate-400 border border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          active ? 'bg-sky-400 text-slate-950' : 'bg-white/[0.08] text-slate-300'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span>{p.text}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => showPoint(point - 1)}
                disabled={point === 0}
                className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg border border-white/[0.1] text-[11px] text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous point
              </button>
              <span className="text-[10px] font-mono text-slate-400">
                {point + 1} / {how.length}
              </span>
              <button
                type="button"
                data-testid="how-next"
                onClick={() => showPoint(point + 1)}
                disabled={point >= how.length - 1}
                className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg border border-sky-400/35 bg-sky-500/10 text-[11px] text-sky-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                Next point <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div data-testid="theory-formula" className="space-y-2.5">
            {formulaSnippet && formulas.length === 0 && (
              <p className="font-mono text-[13px] text-amber-100 bg-black/30 border border-amber-400/25 rounded-lg px-2.5 py-2 break-words">{formulaSnippet}</p>
            )}
            {formulas.map((f) => (
              <div key={f.id} data-formula-id={f.id} className="rounded-xl border border-amber-400/25 bg-amber-500/[0.05] p-2.5 space-y-1.5">
                <p className="text-[11px] font-semibold text-amber-200">{f.name}</p>
                <p className="font-mono text-[14px] text-white break-words">{f.formula}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[12px]">
                  {f.variables.map((v) => (
                    <React.Fragment key={v.symbol}>
                      <dt className="font-mono text-amber-100">{v.symbol}</dt>
                      <dd className="text-slate-300">
                        {v.description}
                        {v.unit ? <span className="text-slate-400"> ({v.unit})</span> : null}
                      </dd>
                    </React.Fragment>
                  ))}
                </dl>
                <p className="text-[12px] text-slate-300">
                  <span className="font-semibold text-slate-200">Used for: </span>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

BoardTeaching.displayName = 'BoardTeaching';

export default BoardTeaching;
