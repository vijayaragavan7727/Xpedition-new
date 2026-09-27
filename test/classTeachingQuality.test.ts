/**
 * CLASS TEACHING QUALITY — behavioural tests for the learner audit fixes.
 *
 * Every test encodes a failure found by walking the real Class as a learner:
 *   - a wrong answer revealed the correct option immediately (retry = copying)
 *   - Buddy said one generic lesson-wide line for every wrong answer, sometimes
 *     about a different sub-topic than the question
 *   - Next skipped every check; the lesson "completed" with mastery praise and
 *     XP = step × 25 without a single answer
 *   - Xira never changed after wrong answers (misconception tags were never sent)
 *     and said "Mastery Confirmed" after ONE correct answer
 *   - 16 of 18 correct options were option A
 *   - several checks were answerable by copying text already on screen
 *   - Xira "Try in Class" / "Practice this" linked to Projectile Motion from any concept
 *   - the heart visual was one static box diagram with no valves and no tracing
 *
 * Run: npx tsx test/classTeachingQuality.test.ts
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { resolveClassLesson } from '../lib/concepts/lessonResolver';
import {
  classRuntimeReducer,
  createClassRuntimeState,
  isStepResolved,
  maxReachableStep,
  REVEAL_AFTER_ATTEMPTS,
  selectBoardView,
  selectBuddy,
  selectEvidenceSummary,
  selectXiraObservation,
  stepActivityKind,
  type ClassRuntimeState,
} from '../lib/classroom/classRuntime';
import { orderOptions } from '../lib/classroom/optionOrder';
import { TRACE_SEQUENCE, WHY_NEXT } from '../components/classroom/visuals/HeartCirculationRenderer';
import { pickNext, yearOf, chronological } from '../lib/classroom/timelineOrder';
import { INDUSTRIAL_REVOLUTION_MILESTONES } from '../lib/classroom/lessons/industrialRevolution';
import type { ClassroomLesson } from '../components/classroom/types';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const CONCEPTS = ['dc_motor', 'projectile_motion', 'human_heart_anatomy', 'periodic_table', 'polymorphism', 'calculus_derivatives', 'industrial_revolution'];

let passed = 0;
let failed = 0;
const failures: string[] = [];
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    failures.push(`${name}: ${msg}`);
    console.log(`  ✗ ${name}\n      ${msg}`);
  }
}

function lessonOf(id: string): ClassroomLesson {
  const r = resolveClassLesson(id);
  if (r.status !== 'resolved') throw new Error(`${id} unresolved`);
  return r.lesson;
}

function select(s: ClassRuntimeState, correct: boolean, skip: string[] = []): ClassRuntimeState {
  const step = s.lesson.steps[s.stepIndex];
  const option = step.checkQuestion!.options.find((o) => o.isCorrect === correct && !skip.includes(o.id))!;
  s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: option.id });
  return classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
}

function toFirstCheck(lesson: ClassroomLesson): ClassRuntimeState {
  const qi = lesson.steps.findIndex((s) => s.checkQuestion);
  let s = createClassRuntimeState(lesson, 'learn');
  s = classRuntimeReducer(s, { type: 'GO_TO_STEP', index: qi });
  assert.strictEqual(s.stepIndex, qi);
  return s;
}

const PRAISE = /^(brilliant|outstanding|well done|great|excellent|spot on|awesome|perfect|fantastic)\b/i;

async function main() {
  console.log('==========================================================');
  console.log('CLASS TEACHING QUALITY (learner audit)');
  console.log('==========================================================');

  console.log('\n1. Answering, feedback and retry');
  await test('1.1 A wrong answer never reveals the correct option; Buddy explains THIS wrong choice', () => {
    for (const id of CONCEPTS) {
      const lesson = lessonOf(id);
      let s = toFirstCheck(lesson);
      const step = lesson.steps[s.stepIndex];
      const wrong = step.checkQuestion!.options.find((o) => !o.isCorrect)!;
      s = select(s, false);
      assert.strictEqual(s.answer.isCorrect, false);
      assert.notStrictEqual(s.answer.revealed, true, `${id}: wrong answer must not reveal`);
      assert.strictEqual(s.answer.selectedOptionId, wrong.id, `${id}: only the learner's own choice is marked`);
      assert.strictEqual(selectBuddy(s).dialogue, wrong.feedback, `${id}: feedback is the chosen option's own explanation`);
      const correct = step.checkQuestion!.options.find((o) => o.isCorrect)!;
      assert.ok(!selectBuddy(s).dialogue.includes(correct.text) || correct.text.length < 4, `${id}: Buddy does not name the answer`);
    }
  });

  await test('1.2 Buddy feedback differs per wrong option (not one generic lesson-wide line)', () => {
    for (const id of CONCEPTS) {
      const lesson = lessonOf(id);
      const s0 = toFirstCheck(lesson);
      const step = lesson.steps[s0.stepIndex];
      const wrongs = step.checkQuestion!.options.filter((o) => !o.isCorrect);
      if (wrongs.length < 2) continue;
      const lines = new Set(
        wrongs.map((w) => {
          let s = classRuntimeReducer(s0, { type: 'SELECT_OPTION', stepId: step.id, optionId: w.id });
          s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
          return selectBuddy(s).dialogue;
        })
      );
      assert.strictEqual(lines.size, wrongs.length, `${id}: each wrong option gets its own explanation`);
    }
  });

  await test('1.3 Retry is allowed only after a wrong answer; the second wrong attempt adds the step hint', () => {
    const lesson = lessonOf('periodic_table');
    let s = toFirstCheck(lesson);
    const step = lesson.steps[s.stepIndex];
    const [w1, w2] = step.checkQuestion!.options.filter((o) => !o.isCorrect);
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: w1.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    assert.ok(!selectBuddy(s).dialogue.includes('Hint:'), 'first wrong attempt: explanation only');
    s = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
    assert.strictEqual(s.answer.submitted, false);
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: w2.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    assert.ok(selectBuddy(s).dialogue.includes(`Hint: ${step.hintText}`), 'second wrong attempt adds the hint');
    s = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
    s = select(s, true);
    assert.strictEqual(s.answer.isCorrect, true);
    const afterCorrect = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
    assert.strictEqual(afterCorrect, s, 'no retry after a correct answer');
  });

  await test(`1.4 "Show answer" only after ${REVEAL_AFTER_ATTEMPTS} wrong attempts, and it is never counted as correct`, () => {
    const lesson = lessonOf('human_heart_anatomy');
    let s = toFirstCheck(lesson);
    const step = lesson.steps[s.stepIndex];
    assert.strictEqual(classRuntimeReducer(s, { type: 'REVEAL_ANSWER', stepId: step.id }), s, 'no reveal before any attempt');
    const [w1, w2] = step.checkQuestion!.options.filter((o) => !o.isCorrect);
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: w1.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    assert.strictEqual(classRuntimeReducer(s, { type: 'REVEAL_ANSWER', stepId: step.id }), s, 'no reveal after one attempt');
    s = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: w2.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    s = classRuntimeReducer(s, { type: 'REVEAL_ANSWER', stepId: step.id });
    const correct = step.checkQuestion!.options.find((o) => o.isCorrect)!;
    assert.strictEqual(s.answer.revealed, true);
    assert.strictEqual(s.evidence[step.id].resolution, 'revealed');
    assert.ok(selectBuddy(s).dialogue.startsWith(`The answer is “${correct.text}”.`));
    assert.ok(!/^The answer is “[^”]+”\. Correct/.test(selectBuddy(s).dialogue), 'no "Correct" prefix on a shown answer');
    const summary = selectEvidenceSummary(s);
    assert.strictEqual(summary.revealed, 1);
    assert.strictEqual(summary.firstTryCorrect, 0);
  });

  console.log('\n2. Learning by doing: checks cannot be skipped');
  await test('2.1 Next and step jumps are blocked until the active check is resolved (all 7 concepts)', () => {
    for (const id of CONCEPTS) {
      const lesson = lessonOf(id);
      let s = createClassRuntimeState(lesson, 'learn');
      for (let guard = 0; guard < 20 && !s.completed; guard++) {
        const step = lesson.steps[s.stepIndex];
        if (step.checkQuestion) {
          assert.strictEqual(classRuntimeReducer(s, { type: 'NEXT_STEP' }).stepIndex, s.stepIndex, `${id} ${step.id}: Next blocked`);
          assert.strictEqual(classRuntimeReducer(s, { type: 'GO_TO_STEP', index: lesson.steps.length - 1 }).stepIndex, s.stepIndex, `${id}: cannot jump past an unanswered check`);
          assert.strictEqual(maxReachableStep(s), s.stepIndex);
          s = select(s, true);
          assert.ok(isStepResolved(s, s.stepIndex));
        }
        s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
      }
      assert.strictEqual(s.completed, true, `${id} can be completed`);
    }
  });

  await test('2.2 Completion is evidence-based: praise only when every check was right first time', () => {
    for (const id of CONCEPTS) {
      const lesson = lessonOf(id);
      // Path 1: every check right first time and every board activity done → the lesson's completion line.
      let s = createClassRuntimeState(lesson, 'learn');
      while (!s.completed) {
        const st = lesson.steps[s.stepIndex];
        if (st.checkQuestion) s = select(s, true);
        if (stepActivityKind(st)) s = classRuntimeReducer(s, { type: 'BOARD_ACTIVITY', stepId: st.id, completed: true, wrong: 0 });
        s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
      }
      assert.strictEqual(selectBuddy(s).dialogue, lesson.buddyScript!.completion);
      // Path 2: first check wrong then right → honest summary, no mastery claim.
      s = createClassRuntimeState(lesson, 'learn');
      let first = true;
      while (!s.completed) {
        const step = lesson.steps[s.stepIndex];
        if (stepActivityKind(step)) s = classRuntimeReducer(s, { type: 'BOARD_ACTIVITY', stepId: step.id, completed: true, wrong: 0 });
        if (step.checkQuestion) {
          if (first) {
            s = select(s, false);
            s = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
            first = false;
          }
          s = select(s, true);
        }
        s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
      }
      const line = selectBuddy(s).dialogue;
      const total = lesson.steps.filter((x) => x.checkQuestion).length;
      assert.ok(line.includes(`First-try correct: ${total - 1} of ${total} checks.`), `${id}: ${line}`);
      assert.ok(line.includes('Review:'), `${id}: lists what to review`);
      assert.notStrictEqual(line, lesson.buddyScript!.completion);
      const obs = selectXiraObservation(s)!;
      assert.strictEqual(obs.kind, 'summary');
      assert.strictEqual(obs.revisit!.length, 1);
    }
  });

  await test('2.3 No step-based XP: the Class shows first-try evidence, not points for clicking Next', () => {
    const layout = read('components/classroom/ClassroomLayout.tsx');
    assert.ok(!/\(state\.stepIndex \+ 1\) \* 25/.test(layout), 'XP = step × 25 removed');
    assert.ok(layout.includes('checksFirstTry={evidenceSummary.firstTryCorrect}'));
    assert.ok(!/\{currentXp\} XP/.test(read('components/classroom/ClassroomToolbar.tsx')));
  });

  await test('2.4 Board activities are evidence: skipping the periodic challenge means no praise and a review item', () => {
    const lesson = lessonOf('periodic_table');
    const kinds = lesson.steps.map((x) => stepActivityKind(x));
    assert.deepStrictEqual(kinds.filter(Boolean), ['challenge']);
    let s = createClassRuntimeState(lesson, 'learn');
    while (!s.completed) {
      if (lesson.steps[s.stepIndex].checkQuestion) s = select(s, true);
      s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
    }
    const sum = selectEvidenceSummary(s);
    assert.deepStrictEqual([sum.activitiesTotal, sum.activitiesCompleted], [1, 0]);
    assert.ok(sum.review.some((r) => r.outcome === 'activity_skipped'));
    assert.notStrictEqual(selectBuddy(s).dialogue, lesson.buddyScript!.completion);
    assert.ok(selectBuddy(s).dialogue.includes('Board activities completed: 0 of 1.'));
    // A board event for another step is ignored.
    const before = s;
    assert.strictEqual(classRuntimeReducer(s, { type: 'BOARD_ACTIVITY', stepId: 'step_1_pt_intro', completed: true, wrong: 0 }), before);
    // Heart and history lessons carry their own activities.
    assert.deepStrictEqual(lessonOf('human_heart_anatomy').steps.map((x) => stepActivityKind(x)).filter(Boolean), ['trace']);
    assert.deepStrictEqual(lessonOf('industrial_revolution').steps.map((x) => stepActivityKind(x)).filter(Boolean), ['order']);
  });

  console.log('\n3. Questions test understanding, not copying');
  await test('3.1 Correct option is not systematically first (display order independent of authoring)', () => {
    const positions: number[] = [];
    for (const id of CONCEPTS) {
      for (const step of lessonOf(id).steps) {
        if (!step.checkQuestion) continue;
        const ordered = orderOptions(step.checkQuestion.id || step.id, step.checkQuestion.options);
        assert.deepStrictEqual(orderOptions(step.checkQuestion.id || step.id, step.checkQuestion.options), ordered, 'deterministic');
        positions.push(ordered.findIndex((o) => o.isCorrect));
      }
    }
    const first = positions.filter((p) => p === 0).length;
    assert.ok(first <= Math.ceil(positions.length / 3), `correct option shown first in ${first}/${positions.length}`);
  });

  await test('3.2 Predict-first steps hide the key idea and the revealing text until the first attempt', () => {
    const expected: Record<string, string[]> = {
      dc_motor: ['step_2_components'],
      projectile_motion: ['step_2_proj_range'],
      human_heart_anatomy: ['step_3_heart_valves', 'step_4_heart_pathway'],
      polymorphism: ['step_3_poly_implementations'],
      industrial_revolution: ['step_2_ir_why_britain', 'step_5_ir_effects'],
    };
    for (const [id, stepIds] of Object.entries(expected)) {
      const lesson = lessonOf(id);
      for (const stepId of stepIds) {
        const idx = lesson.steps.findIndex((x) => x.id === stepId);
        const step = lesson.steps[idx];
        assert.ok(step.predict, `${id}/${stepId} is predict-first`);
        let s = createClassRuntimeState(lesson, 'learn');
        while (s.stepIndex < idx) {
          if (lesson.steps[s.stepIndex].checkQuestion) s = select(s, true);
          s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
        }
        const before = selectBoardView(s);
        assert.strictEqual(before.predicting, true);
        assert.strictEqual(before.showKeyPrinciple, false);
        const correct = step.checkQuestion!.options.find((o) => o.isCorrect)!;
        const visible = `${selectBuddy(s).dialogue} ${before.summary} ${before.title} ${step.title}`.toLowerCase();
        assert.ok(!visible.includes(correct.text.toLowerCase()), `${id}/${stepId}: answer "${correct.text}" not on screen before answering`);
        if (stepId === 'step_4_heart_pathway') assert.ok(!/lungs/i.test(before.title), 'heart trace title does not give the route away');
        s = select(s, false);
        assert.strictEqual(selectBoardView(s).showKeyPrinciple, true, 'explanation appears after the first attempt');
      }
    }
  });

  await test('3.3 Audit leaks stay fixed (worked example ≠ check; challenge example ≠ challenge; title ≠ answer)', () => {
    const calc = lessonOf('calculus_derivatives').steps.find((x) => x.id === 'step_2_calc_average')!;
    assert.ok(!/\[0, 2\]/.test(calc.keyPrinciple ?? ''), 'worked example uses a different interval than the check');
    const pt = lessonOf('periodic_table').steps.find((x) => x.id === 'step_6_pt_challenge')!;
    assert.ok(!/chlorine/i.test(pt.boardSummary), 'challenge example is not challenge #1');
    const proj = lessonOf('projectile_motion').steps.find((x) => x.id === 'step_2_proj_range')!;
    assert.ok(!/45/.test(proj.title), 'step title does not contain the answer');
    for (const id of CONCEPTS) {
      for (const step of lessonOf(id).steps) {
        if (!step.checkQuestion) continue;
        const correct = step.checkQuestion.options.find((o) => o.isCorrect)!;
        for (const o of step.checkQuestion.options) {
          if (o.isCorrect || correct.text.length < 4) continue;
          assert.ok(!o.feedback.toLowerCase().includes(correct.text.toLowerCase()), `${id}/${step.id}: wrong feedback "${o.feedback}" names the answer`);
        }
      }
    }
  });

  await test('3.4 No unearned praise before the learner has done anything (step dialogue of all 7 lessons)', () => {
    for (const id of CONCEPTS) {
      for (const step of lessonOf(id).steps) {
        assert.ok(!PRAISE.test(step.buddyDialogue.trim()), `${id}/${step.id}: "${step.buddyDialogue.slice(0, 40)}…"`);
        if (step.predict) assert.ok(!PRAISE.test(step.predict.dialogue.trim()));
        assert.notStrictEqual(step.buddyState, 'CELEBRATING', `${id}/${step.id}: no celebration mood before evidence`);
      }
    }
  });

  console.log('\n4. Xira adapts to the learner\'s real answers');
  await test('4.1 Wrong → likely misconception (lesson-authored); hint on request; 2 wrong → new route + reveal option', () => {
    const lesson = lessonOf('calculus_derivatives');
    let s = toFirstCheck(lesson);
    const step = lesson.steps[s.stepIndex];
    assert.strictEqual(selectXiraObservation(s), null, 'nothing to observe before an attempt');
    const [w1, w2] = step.checkQuestion!.options.filter((o) => !o.isCorrect);
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: w1.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    let obs = selectXiraObservation(s)!;
    assert.strictEqual(obs.kind, 'misconception');
    assert.strictEqual(obs.message, step.commonMistake);
    assert.strictEqual(obs.action?.kind, 'hint');
    s = classRuntimeReducer(s, { type: 'REVEAL_HINT' });
    obs = selectXiraObservation(s)!;
    assert.strictEqual(obs.detail, `Hint: ${step.hintText}`);
    assert.strictEqual(obs.action, undefined, 'hint shown, not offered twice');
    s = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: w2.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    obs = selectXiraObservation(s)!;
    assert.strictEqual(obs.kind, 'scaffold');
    assert.ok(obs.message.includes(step.tryThis!), 'recommends the board activity as another representation');
    assert.strictEqual(obs.action?.kind, 'reveal_answer');
    assert.strictEqual(s.evidence[step.id].hintsUsed, 1);
  });

  await test('4.2 Correct first time → on track; "ready" only after ≥2 first-try checks; never claims mastery', () => {
    const lesson = lessonOf('calculus_derivatives');
    let s = createClassRuntimeState(lesson, 'learn');
    const seen: string[] = [];
    while (!s.completed) {
      if (lesson.steps[s.stepIndex].checkQuestion) {
        s = select(s, true);
        const obs = selectXiraObservation(s)!;
        assert.strictEqual(obs.kind, 'on_track');
        seen.push(obs.message);
      }
      s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
    }
    assert.ok(!/ready/i.test(seen[0]), 'one correct answer is not readiness');
    assert.ok(/ready for the next, harder step/.test(seen[1]));
    for (const m of seen) assert.ok(!/master/i.test(m), 'no mastery claim from a few answers');
  });

  await test('4.3 The Class no longer surfaces the generic service directives ("Mastery Confirmed", fixed quotes)', () => {
    const layout = read('components/classroom/ClassroomLayout.tsx');
    assert.ok(!/SET_DIRECTIVE/.test(layout));
    assert.ok(layout.includes('observation={xiraObservation}'));
    const runtime = read('lib/classroom/classRuntime.ts');
    assert.ok(!/buddyDirective/.test(runtime.slice(runtime.indexOf('export function selectBuddy'))), 'Buddy is not overridden by generic directive quotes');
  });

  await test('4.4 Xira actions never link to another concept (no projectile_motion default)', () => {
    const bar = read('components/xira/XiraActionBar.tsx');
    assert.ok(!/conceptId = 'projectile_motion'/.test(bar));
    assert.ok(!/'projectile_motion'/.test(read('components/xira/XiraResponse.tsx')));
    assert.ok(read('components/classroom/ClassroomXiraAssistant.tsx').includes('topicTitle), conceptId }'));
  });

  console.log('\n5. Smart Board teaches (heart)');
  await test('5.1 Heart steps use the right view: chambers → valves → learner trace → both circuits', () => {
    const lesson = lessonOf('human_heart_anatomy');
    const modes = lesson.steps.map((s) => (s.visualData as { mode?: string } | undefined)?.mode);
    assert.deepStrictEqual(modes, ['circuits', 'chambers', 'valves', 'trace', 'circuits']);
    const src = read('components/classroom/visuals/HeartCirculationRenderer.tsx');
    for (const valve of ['tricuspid', 'mitral', 'pulmonary', 'aortic']) assert.ok(src.includes(`>${valve}<`), `${valve} valve drawn`);
    assert.ok(!/3x Thick/i.test(src + read('components/classroom/SmartBoardVisualRenderer.tsx')), 'no unsupported "3x" claim');
  });

  await test('5.2 Trace order is anatomically correct and every wrong turn explains the correct next structure', () => {
    assert.deepStrictEqual(TRACE_SEQUENCE, ['RA', 'RV', 'LUNGS', 'LA', 'LV', 'BODY']);
    assert.ok(/tricuspid/i.test(WHY_NEXT.RV));
    assert.ok(/pulmonary valve/i.test(WHY_NEXT.LUNGS) && /septum/i.test(WHY_NEXT.LUNGS));
    assert.ok(/pulmonary veins/i.test(WHY_NEXT.LA));
    assert.ok(/mitral/i.test(WHY_NEXT.LV));
    assert.ok(/aortic valve/i.test(WHY_NEXT.BODY) && /aorta/i.test(WHY_NEXT.BODY));
  });

  console.log('\n6. Smart Board teaches (history chronology)');
  await test('6.1 Industrial Revolution interact step asks the learner to order steam events before dates are shown', () => {
    const step = lessonOf('industrial_revolution').steps.find((x) => x.id === 'step_4_ir_transport')!;
    const order = (step.visualData as { order?: string[] }).order!;
    assert.deepStrictEqual(order, ['newcomen', 'watt', 'stockton', 'lmr']);
    const events = order.map((id) => INDUSTRIAL_REVOLUTION_MILESTONES.find((m) => m.id === id)!);
    assert.deepStrictEqual(chronological(events).map((e) => e.id), ['newcomen', 'watt', 'stockton', 'lmr']);
    assert.strictEqual(yearOf('c. 1764'), 1764);
  });

  await test('6.2 A wrong pick is rejected and explained; the correct sequence completes', () => {
    const events = ['newcomen', 'watt', 'stockton', 'lmr'].map((id) => INDUSTRIAL_REVOLUTION_MILESTONES.find((m) => m.id === id)!);
    const wrong = pickNext(events, [], 'lmr');
    assert.strictEqual(wrong.ok, false);
    if (!wrong.ok) {
      assert.strictEqual(wrong.expected.id, 'newcomen');
      assert.ok(wrong.message.includes('came later'));
      assert.ok(!/\d{4}/.test(wrong.message), 'feedback does not leak dates');
    }
    let placed: string[] = [];
    for (const id of ['newcomen', 'watt', 'stockton', 'lmr']) {
      const r = pickNext(events, placed, id);
      assert.ok(r.ok);
      placed = r.placed;
      if (id === 'lmr') assert.strictEqual(r.ok && r.done, true);
    }
  });

  console.log('\n==========================================================');
  console.log(`CLASS TEACHING QUALITY SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==========================================================');
  if (failed > 0) {
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }
}

main();
