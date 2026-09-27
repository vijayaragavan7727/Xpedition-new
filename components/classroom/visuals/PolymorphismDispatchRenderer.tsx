'use client';

/**
 * Deterministic dynamic-dispatch visualiser for the polymorphism lesson.
 * The code on the board is real TypeScript. "Run" evaluates the selected
 * object's own area() implementation and shows which method was dispatched.
 */

import React, { useMemo, useState } from 'react';

type ShapeKind = 'Circle' | 'Rectangle' | 'Triangle';

interface ShapeObject {
  id: string;
  kind: ShapeKind;
  ctor: string;
  area: () => number;
  formula: string;
}

const OBJECTS: ShapeObject[] = [
  { id: 's0', kind: 'Circle', ctor: 'new Circle(1)', area: () => Math.PI * 1 * 1, formula: 'Math.PI * r * r' },
  { id: 's1', kind: 'Rectangle', ctor: 'new Rectangle(2, 3)', area: () => 2 * 3, formula: 'w * h' },
  { id: 's2', kind: 'Triangle', ctor: 'new Triangle(4, 3)', area: () => 0.5 * 4 * 3, formula: '0.5 * b * h' },
];

const CLASS_SOURCE: Record<ShapeKind, string[]> = {
  Circle: ['class Circle implements Shape {', '  constructor(private r: number) {}', '  area() { return Math.PI * this.r * this.r; }', '}'],
  Rectangle: ['class Rectangle implements Shape {', '  constructor(private w: number, private h: number) {}', '  area() { return this.w * this.h; }', '}'],
  Triangle: ['class Triangle implements Shape {', '  constructor(private b: number, private h: number) {}', '  area() { return 0.5 * this.b * this.h; }', '}'],
};

export interface PolymorphismDispatchRendererProps {
  focus?: string;
  className?: string;
}

export const PolymorphismDispatchRenderer: React.FC<PolymorphismDispatchRendererProps> = ({ focus = 'overview', className = '' }) => {
  const [selectedId, setSelectedId] = useState<string>('s1');
  const [ran, setRan] = useState(false);
  const selected = OBJECTS.find((o) => o.id === selectedId) ?? OBJECTS[0];
  const result = useMemo(() => selected.area(), [selected]);
  const total = useMemo(() => OBJECTS.reduce((sum, o) => sum + o.area(), 0), []);

  return (
    <div
      data-testid="polymorphism-dispatch"
      data-visual-kind="polymorphism_dispatch"
      className={`w-full h-full flex flex-col gap-2 p-2.5 sm:p-3 bg-[#0A0D24]/95 rounded-2xl border border-indigo-500/30 overflow-hidden text-[10px] sm:text-[11px] font-mono ${className}`}
    >
      <div className="flex items-center justify-between text-indigo-300">
        <span className="font-bold">POLYMORPHISM · DYNAMIC DISPATCH (TypeScript)</span>
        <span className="text-[9px] text-slate-400">focus: {focus}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0">
        <pre className={`rounded-lg border p-2 whitespace-pre-wrap leading-snug ${focus === 'interface' ? 'border-cyan-400 bg-cyan-950/40' : 'border-white/10 bg-black/30'} text-cyan-200`}>
{`interface Shape {
  area(): number;
}

function totalArea(shapes: Shape[]) {
  let sum = 0;
  for (const s of shapes) sum += s.area();
  return sum;
}`}
        </pre>
        <pre className={`rounded-lg border p-2 whitespace-pre-wrap leading-snug ${focus === 'implementations' || focus === 'dispatch' ? 'border-emerald-400 bg-emerald-950/30' : 'border-white/10 bg-black/30'} text-emerald-200`}>
          {CLASS_SOURCE[selected.kind].join('\n')}
        </pre>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-slate-400">shapes =</span>
        {OBJECTS.map((o) => (
          <button
            key={o.id}
            type="button"
            data-shape={o.kind}
            onClick={() => {
              setSelectedId(o.id);
              setRan(false);
            }}
            aria-pressed={o.id === selectedId}
            className={`px-2 py-0.5 rounded border cursor-pointer ${
              o.id === selectedId ? 'bg-indigo-600/50 border-indigo-300 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            {o.ctor}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRan(true)}
          className="ml-auto px-2.5 py-0.5 rounded bg-emerald-600/60 border border-emerald-300 text-white font-bold cursor-pointer"
        >
          ▶ Run s.area()
        </button>
      </div>

      <div data-testid="dispatch-trace" className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-200 leading-relaxed">
        {ran ? (
          <>
            <div>declared type: <span className="text-cyan-300">Shape</span> · runtime type: <span className="text-emerald-300">{selected.kind}</span></div>
            <div>dispatch → <span className="text-emerald-300">{selected.kind}.area()</span> = {selected.formula} = <b className="text-white">{Number(result.toFixed(2))}</b></div>
          </>
        ) : (
          <div className="text-slate-400">Select an object, predict which area() runs, then press Run.</div>
        )}
        {focus === 'extension' && (
          <div className="mt-1 text-amber-200">
            totalArea(shapes) = {Number(total.toFixed(2))}. Adding a new class that implements Shape needs no change to totalArea().
          </div>
        )}
      </div>
    </div>
  );
};

export default PolymorphismDispatchRenderer;
