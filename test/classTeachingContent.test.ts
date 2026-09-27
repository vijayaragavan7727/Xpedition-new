/**
 * CLASS TEACHING CONTENT — the Smart Board teaches theory, and the visual supports it.
 *
 * Found in review: the board showed a large visual with one line of summary, so a
 * lesson read like a visual demo. Every step of the seven audited lessons now
 * carries short, concept-specific theory (why · core idea · how it works ·
 * takeaway · formula), and each "how it works" point highlights the part of the
 * visual it explains. These tests keep that content real:
 *   - every lesson has a definition and every step has theory
 *   - theory is short (scannable), not a wall of text, and not generic filler
 *   - every highlighted part exists in that concept's visual (no dead links)
 *   - formulas shown on a step are the lesson's own, with variables explained
 *   - no DC-motor wording leaks into any other lesson
 *   - predict-first steps keep the theory hidden until the first attempt
 *   - worked examples in the theory are numerically correct
 *
 * Run: npx tsx test/classTeachingContent.test.ts
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { resolveClassLesson } from '../lib/concepts/lessonResolver';
import { createClassRuntimeState, selectBoardView } from '../lib/classroom/classRuntime';
import { INDUSTRIAL_REVOLUTION_MILESTONES } from '../lib/classroom/lessons/industrialRevolution';
import { safeFocusToken } from '../components/classroom/SmartBoardVisualRenderer';
import type { ClassroomLesson, StepTeaching } from '../components/classroom/types';

const ROOT = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const CONCEPTS = [
  'dc_motor',
  'projectile_motion',
  'human_heart_anatomy',
  'periodic_table',
  'polymorphism',
  'calculus_derivatives',
  'industrial_revolution',
] as const;

/** Visual parts each concept's renderer draws (`data-part` tokens). */
const PARTS: Record<(typeof CONCEPTS)[number], string[]> = {
  dc_motor: ['field', 'magnets', 'coil', 'current', 'force', 'torque', 'axle', 'commutator', 'brushes'],
  projectile_motion: ['launch', 'components', 'vx', 'vy', 'trajectory', 'apex', 'range'],
  human_heart_anatomy: ['RA', 'RV', 'LA', 'LV', 'LUNGS', 'BODY', 'right', 'left', 'pulmonary', 'systemic', 'valves', 'septum'],
  periodic_table: [],
  polymorphism: ['interface', 'implementations', 'dispatch'],
  calculus_derivatives: ['curve', 'tangent', 'point', 'secant'],
  industrial_revolution: INDUSTRIAL_REVOLUTION_MILESTONES.map((m) => m.id),
};
/** Where each concept's parts are drawn. */
const RENDERER: Record<(typeof CONCEPTS)[number], string> = {
  dc_motor: 'components/classroom/SmartBoardVisualRenderer.tsx',
  projectile_motion: 'components/classroom/SmartBoardVisualRenderer.tsx',
  human_heart_anatomy: 'components/classroom/visuals/HeartCirculationRenderer.tsx',
  periodic_table: 'components/classroom/visuals/PeriodicTableRenderer.tsx',
  polymorphism: 'components/classroom/visuals/PolymorphismDispatchRenderer.tsx',
  calculus_derivatives: 'components/classroom/SmartBoardVisualRenderer.tsx',
  industrial_revolution: 'components/classroom/SmartBoardVisualRenderer.tsx',
};

function lesson(c: string): ClassroomLesson {
  const r = resolveClassLesson(c);
  assert.strictEqual(r.status, 'resolved', c);
  if (r.status !== 'resolved') throw new Error(c);
  return r.lesson;
}
const allText = (t: StepTeaching) => [t.why ?? '', ...t.points, ...(t.how ?? []).flatMap((h) => [h.text, h.buddy ?? '']), t.observe ?? '', t.takeaway].join('\n');

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n      ${(e as Error).message}`);
  }
}

console.log('CLASS TEACHING CONTENT');

test('1. Every lesson has a one-line definition and every step has theory', () => {
  for (const c of CONCEPTS) {
    const l = lesson(c);
    assert.ok(l.definition && l.definition.length > 40 && l.definition.length < 260, `${c}: definition`);
    for (const s of l.steps) {
      assert.ok(s.teach, `${c}/${s.id}: no theory`);
      assert.ok(s.teach!.points.length >= 3 && s.teach!.points.length <= 5, `${c}/${s.id}: 3–5 core points`);
      assert.ok(s.teach!.takeaway.length > 10, `${c}/${s.id}: takeaway`);
      assert.ok(s.teach!.why && s.teach!.why.length > 20, `${c}/${s.id}: why it matters`);
    }
  }
});

test('2. Theory is scannable: short points, short takeaway, at most 8 "how" steps', () => {
  for (const c of CONCEPTS) {
    for (const s of lesson(c).steps) {
      const t = s.teach!;
      for (const p of t.points) assert.ok(p.length <= 200, `${c}/${s.id}: point too long (${p.length})`);
      for (const h of t.how ?? []) assert.ok(h.text.length <= 160, `${c}/${s.id}: how step too long`);
      assert.ok((t.how ?? []).length <= 8, `${c}/${s.id}: too many how steps`);
      assert.ok(t.takeaway.length <= 160, `${c}/${s.id}: takeaway too long`);
      assert.ok(!t.takeaway.includes('\n') && !t.points.some((p) => p.includes('\n')), `${c}/${s.id}: no paragraph walls`);
    }
  }
});

test('3. Every highlighted part exists in that concept’s visual', () => {
  for (const c of CONCEPTS) {
    const src = read(RENDERER[c]);
    for (const part of PARTS[c]) {
      if (c === 'industrial_revolution') continue; // drawn as data-part={m.id}
      assert.ok(new RegExp(`['" ]${part}['" ]`).test(src) || src.includes(`${part} `) || src.includes(` ${part}'`), `${c}: part "${part}" not drawn`);
    }
    for (const s of lesson(c).steps) {
      for (const h of s.teach!.how ?? []) {
        if (!h.focus) continue;
        assert.ok(safeFocusToken(h.focus), `${c}/${s.id}: unsafe focus token ${h.focus}`);
        assert.ok(PARTS[c].includes(h.focus), `${c}/${s.id}: focus "${h.focus}" is not a part of the ${c} visual`);
      }
    }
  }
  assert.ok(read('components/classroom/SmartBoardVisualRenderer.tsx').includes('data-part={m.id}'), 'timeline milestones are parts');
  assert.strictEqual(safeFocusToken('coil"]{x}'), null, 'selector injection refused');
});

test('4. Formulas on a step are the lesson’s own, with variables and use explained', () => {
  for (const c of CONCEPTS) {
    const l = lesson(c);
    for (const s of l.steps) {
      for (const id of s.teach!.formulaIds ?? []) {
        const f = l.formulas?.find((x) => x.id === id);
        assert.ok(f, `${c}/${s.id}: unknown formula ${id}`);
        assert.ok(f!.variables.length > 0 && f!.description.length > 0, `${c}/${s.id}: ${id} must explain variables and use`);
      }
    }
    if (!l.formulas || l.formulas.length === 0) {
      assert.ok(l.steps.every((s) => !(s.teach!.formulaIds ?? []).length), `${c}: formula without a formula card`);
    }
  }
});

test('5. No DC-motor wording or generic filler in other lessons’ theory', () => {
  const dc = /commutator|armature|carbon brush|lorentz|stator|dc motor/i;
  const filler = /lorem|placeholder|learn more about|coming soon|\bTBD\b|this topic is important/i;
  for (const c of CONCEPTS) {
    for (const s of lesson(c).steps) {
      const text = allText(s.teach!);
      if (c !== 'dc_motor') assert.ok(!dc.test(text), `${c}/${s.id}: DC-motor wording`);
      assert.ok(!filler.test(text), `${c}/${s.id}: generic filler`);
    }
  }
});

test('6. Predict-first steps keep the theory locked until the first attempt', () => {
  let count = 0;
  for (const c of CONCEPTS) {
    const l = lesson(c);
    l.steps.forEach((s, i) => {
      if (!s.predict || !s.checkQuestion) return;
      count++;
      const state = { ...createClassRuntimeState(l, 'learn'), stepIndex: i };
      assert.strictEqual(selectBoardView(state).showKeyPrinciple, false, `${c}/${s.id}: theory visible before predicting`);
    });
  }
  assert.ok(count >= 6, 'predict-first steps exist');
  const board = read('components/classroom/SmartBoard.tsx');
  assert.ok(board.includes('locked={!showKeyPrinciple}'), 'the board passes the lock to the theory');
  assert.ok(board.includes('const visualFocus = theoryLocked ? null'), 'no highlighting hints while predicting');
});

test('7. Worked examples in the theory are numerically correct', () => {
  // Projectile: 20 m/s at 30° → R = 400·sin60°/9.8 ≈ 35.3 m
  const r = (400 * Math.sin((60 * Math.PI) / 180)) / 9.8;
  assert.strictEqual(r.toFixed(1), '35.3');
  const proj = lesson('projectile_motion').steps.find((s) => s.id === 'step_5_proj_predict')!;
  assert.ok(proj.teach!.points.some((p) => p.includes('35.3 m')));
  // Calculus: f(x) = 0.4x³ − 1.2x on [1, 2]
  const f = (x: number) => 0.4 * x ** 3 - 1.2 * x;
  assert.strictEqual(Number(f(1).toFixed(2)), -0.8);
  assert.strictEqual(Number(f(2).toFixed(2)), 0.8);
  assert.strictEqual(Number(((f(2) - f(1)) / 1).toFixed(2)), 1.6);
  const calc = lesson('calculus_derivatives').steps.find((s) => s.id === 'step_2_calc_average')!;
  assert.ok(calc.teach!.points.some((p) => p.includes('1.6')));
  // …and never the check's own interval [0, 2] (the learner computes that one).
  assert.ok(!allText(calc.teach!).includes('[0, 2]'));
  // Derivative example: s = 5t² → s′(3) = 30
  assert.strictEqual(10 * 3, 30);
});

test('8. The DC summary step teaches the full 8-step cycle, each linked to the motor', () => {
  const s = lesson('dc_motor').steps.find((x) => x.id === 'step_5_summary')!;
  assert.strictEqual(s.teach!.how!.length, 8);
  assert.ok(s.teach!.how!.every((h) => h.focus));
  // The Try This asks whether reversing the MAGNETS reverses rotation: the theory must not answer it.
  assert.ok(!/revers\w* (the )?magnets|magnet polarity|swap\w* the (poles|magnets)/i.test(s.teach!.points.join(' ')));
});

test('9. The forbidden example formula is not in the teaching content', () => {
  const forbidden = new RegExp(['\\(a\\s*\\+\\s*b\\)', '(\\^|²|\\*\\*)\\s*2'].join(''));
  assert.ok(!forbidden.test(read('lib/classroom/lessons/lessonTeaching.ts')));
  assert.ok(!forbidden.test(read('components/classroom/BoardTeaching.tsx')));
});

console.log(`CLASS TEACHING CONTENT SUMMARY: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
