/**
 * Phase 1/2 — Concept Identity & Contamination behavioural tests.
 *
 * These exercise the real resolver, registry, Class runtime reducer, visual
 * identity gate and Xira classroom orchestrator. No source-text assertions.
 *
 * Run: npx tsx test/conceptIdentity.test.ts
 */

import assert from 'assert';
import { resolveClassLesson, parseClassIntent, classUrlFor } from '../lib/concepts/lessonResolver';
import { listCanonicalConcepts, getCanonicalConcept, normalizeConceptId, getNextConceptId } from '../lib/concepts/conceptRegistry';
import { CANONICAL_CLASSROOM_LESSONS, getClassroomLesson } from '../lib/classroom/classroomCatalog';
import { getClassData } from '../lib/class/classCatalog';
import {
  classRuntimeReducer,
  createClassRuntimeState,
  selectBuddy,
  selectXiraContext,
  selectVisualToken,
  type ClassRuntimeState,
} from '../lib/classroom/classRuntime';
import { acceptVisualPayload, buildStepVisualPayload } from '../lib/classroom/visualIdentity';
import { matchSubjectRule, topicHasKeyword } from '../lib/visualIntelligence/rules/SubjectVisualRules';
import { XiraClassroomOrchestrator, SessionNotFoundError, ConceptUnavailableError } from '../lib/classroom/XiraClassroomOrchestrator';
import { MemorySessionStore } from '../lib/classroom/ClassroomSessionStore';
import type { ClassroomLesson } from '../components/classroom/types';
import type { SmartBoardVisualPayload } from '../lib/visualIntelligence/types';

const REQUIRED = [
  'dc_motor',
  'projectile_motion',
  'molecular_bonding',
  'human_heart_anatomy',
  'quadratic_equation',
  'binary_search',
  'linear_regression',
  'periodic_table',
  'polymorphism',
  'calculus_derivatives',
  'industrial_revolution',
];

const EXPECTED_SUBJECT: Record<string, string> = {
  dc_motor: 'Physics',
  projectile_motion: 'Physics',
  molecular_bonding: 'Chemistry',
  human_heart_anatomy: 'Biology',
  quadratic_equation: 'Mathematics',
  binary_search: 'Programming',
  linear_regression: 'Data Science',
  periodic_table: 'Chemistry',
  polymorphism: 'Programming',
  calculus_derivatives: 'Mathematics',
  industrial_revolution: 'History',
};

/** Wording that belongs ONLY to the electromagnetism concepts. */
const DC_MOTOR_MARKERS = /fleming|commutat|armature|lorentz|dc motor|split-ring|carbon brush/i;
/** Concepts whose OWN curriculum legitimately uses that wording. */
const ELECTROMAGNETISM_CONCEPTS = new Set(['dc_motor', 'electromagnetic_force']);

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  ✗ ${name}\n      ${msg}`);
  }
}

function resolved(id: string, intent?: string) {
  const r = resolveClassLesson(id, intent);
  assert.strictEqual(r.status, 'resolved', `${id} should resolve`);
  if (r.status !== 'resolved') throw new Error('unreachable');
  return r;
}

function stateFor(id: string, intent = 'learn'): ClassRuntimeState {
  const r = resolved(id, intent);
  return createClassRuntimeState(r.lesson, r.intent);
}

/**
 * Phase 5 (learn by doing): a step's check must be resolved before Next works.
 * These helpers answer the active check correctly, then advance.
 */
function answerActiveCheck(s: ClassRuntimeState, correct = true): ClassRuntimeState {
  const step = s.lesson.steps[s.stepIndex];
  if (!step.checkQuestion || s.evidence[step.id]?.resolution) return s;
  const option = step.checkQuestion.options.find((o) => o.isCorrect === correct)!;
  s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: option.id });
  return classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
}

function advance(s: ClassRuntimeState): ClassRuntimeState {
  return classRuntimeReducer(answerActiveCheck(s), { type: 'NEXT_STEP' });
}

function advanceTo(s: ClassRuntimeState, index: number): ClassRuntimeState {
  while (s.stepIndex < index) s = advance(s);
  return s;
}

function firstQuestionStepIndex(lesson: ClassroomLesson): number {
  const idx = lesson.steps.findIndex((s) => s.checkQuestion);
  assert.ok(idx >= 0, `${lesson.conceptId} has a question step`);
  return idx;
}

async function main() {
  console.log('==========================================================');
  console.log('PHASE 1/2 — CONCEPT IDENTITY & CONTAMINATION TESTS');
  console.log('==========================================================\n');

  console.log('A. Registry & exact lookup');

  await test('1. Exact lookup: every required concept resolves to itself', () => {
    for (const id of REQUIRED) {
      const r = resolved(id);
      assert.strictEqual(r.conceptId, id);
      assert.strictEqual(r.concept.id, id);
      assert.strictEqual(r.lesson.conceptId, id);
      assert.strictEqual(r.matchedBy, 'exact');
      assert.strictEqual(r.concept.lessonSource, 'authored', `${id} must be an authored lesson`);
    }
  });

  await test('1b. Normalisation is formatting only (case, spaces, hyphens)', () => {
    assert.strictEqual(resolved('Periodic Table').conceptId, 'periodic_table');
    assert.strictEqual(resolved('  PERIODIC-table ').conceptId, 'periodic_table');
    assert.strictEqual(normalizeConceptId('<script>'), '');
    assert.strictEqual(normalizeConceptId('x'.repeat(101)), '');
  });

  await test('1c. Explicit aliases resolve exactly; nothing else does', () => {
    assert.strictEqual(resolved('heart_anatomy').conceptId, 'human_heart_anatomy');
    assert.strictEqual(resolved('heart_anatomy').matchedBy, 'alias');
    assert.strictEqual(resolved('derivatives').conceptId, 'calculus_derivatives');
    for (const bad of ['heart', 'cardiac', 'motor', 'electric', 'kinematics', 'anatomy', 'search', 'bond', 'french', 'regression']) {
      assert.strictEqual(resolveClassLesson(bad).status, 'unavailable', `"${bad}" must not resolve by substring`);
    }
  });

  await test('2. Unknown concept → explicit unavailable (never another lesson)', () => {
    for (const id of ['completely_unknown_xyz', 'magnetic_fields', 'brain_anatomy', 'electric_field', 'bond_markets']) {
      const r = resolveClassLesson(id);
      assert.strictEqual(r.status, 'unavailable', `${id}`);
      if (r.status === 'unavailable') assert.strictEqual(r.reason, 'unknown_concept');
      assert.strictEqual(getClassroomLesson(id), null);
    }
    assert.strictEqual(resolveClassLesson('').status, 'unavailable');
    const empty = resolveClassLesson('   ');
    assert.ok(empty.status === 'unavailable' && empty.reason === 'empty_id');
    const invalid = resolveClassLesson('../etc/passwd');
    assert.ok(invalid.status === 'unavailable' && invalid.reason === 'invalid_id');
  });

  await test('2b. Legacy getClassData no longer defaults unknown concepts to dc_motor', () => {
    assert.strictEqual(getClassData('periodic_table'), null);
    assert.strictEqual(getClassData('anything_unknown'), null);
    assert.strictEqual(getClassData('dc_motor')?.conceptId, 'dc_motor');
  });

  await test('3. industrial_revolution never matches "evolution" (Biology)', () => {
    const r = resolved('industrial_revolution');
    assert.strictEqual(r.concept.subject, 'History');
    const rule = matchSubjectRule(undefined, 'industrial_revolution');
    assert.ok(rule, 'history rule should match');
    assert.strictEqual(rule!.subject, 'History');
    assert.strictEqual(topicHasKeyword('industrial_revolution', 'evolution'), false);
    assert.strictEqual(topicHasKeyword('software_engineering', 'war'), false);
    assert.strictEqual(topicHasKeyword('business_studies', 'sine'), false);
    assert.strictEqual(topicHasKeyword('natural_selection', 'natural_selection'), true);
  });

  await test('4. research_methods never resolves to binary_search', () => {
    assert.strictEqual(resolveClassLesson('research_methods').status, 'unavailable');
    assert.strictEqual(resolveClassLesson('search_algorithms').status, 'unavailable');
  });

  await test('5. periodic_table resolves to Chemistry with the interactive periodic table visual', () => {
    const r = resolved('periodic_table');
    assert.strictEqual(r.concept.subject, 'Chemistry');
    assert.strictEqual(r.lesson.subject, 'Chemistry');
    assert.strictEqual(r.concept.visualKind, 'periodic_table_interactive');
    const text = JSON.stringify(r.lesson).toLowerCase();
    for (const term of ['atomic number', 'period', 'group', 'metalloid', 'nonmetal', 'electronegativity']) {
      assert.ok(text.includes(term), `periodic lesson teaches "${term}"`);
    }
  });

  await test('6. periodic_table never resolves to / contains dc_motor content', () => {
    for (const intent of [undefined, 'learn', 'revision', 'exam', 'bogus']) {
      const r = resolved('periodic_table', intent);
      assert.notStrictEqual(r.conceptId, 'dc_motor');
      assert.ok(!DC_MOTOR_MARKERS.test(JSON.stringify(r.lesson)), 'no DC-motor wording in periodic lesson');
      assert.ok(!/operational dynamics/i.test(JSON.stringify(r.lesson)), 'no placeholder "Operational Dynamics"');
    }
  });

  await test('6b. No lesson except dc_motor contains DC-motor wording (lessons, Buddy, Xira, flashcards, questions)', () => {
    for (const concept of listCanonicalConcepts()) {
      if (ELECTROMAGNETISM_CONCEPTS.has(concept.id) || !concept.hasClassLesson) continue;
      const r = resolved(concept.id);
      assert.ok(!DC_MOTOR_MARKERS.test(JSON.stringify(r.lesson)), `${concept.id} contains DC-motor wording`);
    }
  });

  await test('6c. Registry integrity: keys, subjects, stages, prerequisites, depth', () => {
    for (const [key, lesson] of Object.entries(CANONICAL_CLASSROOM_LESSONS)) {
      assert.strictEqual(key, lesson.conceptId, `catalog key ${key}`);
    }
    for (const id of REQUIRED) {
      const r = resolved(id);
      assert.strictEqual(r.concept.subject, EXPECTED_SUBJECT[id], `${id} subject`);
      assert.ok(r.lesson.steps.length >= 5, `${id} has a complete flow (${r.lesson.steps.length} steps)`);
      assert.ok(r.concept.availableStages.includes('introduce'), `${id} introduce stage`);
      assert.ok(r.lesson.steps.some((s) => s.checkQuestion), `${id} has at least one check question`);
      assert.ok(r.lesson.category, `${id} has a lesson-owned category`);
      assert.ok(!/mechanics/i.test(r.lesson.category || '') || id === 'projectile_motion', `${id} category is not a stray "Mechanics"`);
      for (const step of r.lesson.steps) {
        assert.ok(step.tryThis && step.tryThis.length > 10, `${id}/${step.id} has lesson-owned Try This`);
      }
    }
    for (const concept of listCanonicalConcepts()) {
      for (const pre of concept.prerequisites) {
        assert.ok(getCanonicalConcept(pre), `${concept.id} prerequisite ${pre} exists`);
      }
    }
    // Lessons are not identical copies of one template.
    const titles = new Set(REQUIRED.map((id) => resolved(id).lesson.steps[2].boardTitle));
    assert.strictEqual(titles.size, REQUIRED.length, 'step-3 board titles are all distinct');
  });

  await test('6d. Curriculum-only topics get an honest outline lesson built from their own metadata', () => {
    const r = resolved('chemical_reactions');
    assert.strictEqual(r.concept.lessonSource, 'curriculum_outline');
    assert.strictEqual(r.lesson.isOutline, true);
    assert.strictEqual(r.lesson.conceptId, 'chemical_reactions');
    assert.ok(r.lesson.steps.every((s) => !s.checkQuestion), 'outline lessons do not invent quizzes');
    assert.ok(!/operational dynamics|governing inputs/i.test(JSON.stringify(r.lesson)));
  });

  console.log('\nB. Routes & intent');

  await test('7. /class?concept=X and /class/X resolve through the same resolver to the same lesson', () => {
    // Both route pages render <ClassRoute>, which calls resolveClassLesson(raw, intent).
    // Query form passes the raw query value; path form passes the decoded path segment.
    for (const id of REQUIRED) {
      const fromQuery = resolveClassLesson(new URLSearchParams(`concept=${encodeURIComponent(id)}`).get('concept'));
      const fromPath = resolveClassLesson(decodeURIComponent(encodeURIComponent(id)));
      assert.ok(fromQuery.status === 'resolved' && fromPath.status === 'resolved');
      if (fromQuery.status === 'resolved' && fromPath.status === 'resolved') {
        assert.strictEqual(fromQuery.lesson, fromPath.lesson, `${id}: identical lesson object`);
      }
    }
    assert.strictEqual(classUrlFor('periodic_table', 'revision'), '/class?concept=periodic_table&intent=revision');
  });

  await test('8. Revision intent preserves concept identity and exposes a revision plan', () => {
    assert.strictEqual(parseClassIntent('revision'), 'revision');
    assert.strictEqual(parseClassIntent('REVISION'), 'revision');
    assert.strictEqual(parseClassIntent('drop table'), 'learn');
    assert.strictEqual(parseClassIntent(undefined), 'learn');
    for (const id of REQUIRED) {
      const learn = resolved(id, 'learn');
      const rev = resolved(id, 'revision');
      assert.strictEqual(rev.conceptId, id);
      assert.strictEqual(rev.lesson, learn.lesson, 'revision uses the same lesson');
      assert.strictEqual(rev.intent, 'revision');
      assert.ok(rev.revisionPlan && rev.revisionPlan.recap.length === rev.lesson.steps.length);
      assert.strictEqual(learn.revisionPlan, null);
      const state = createClassRuntimeState(rev.lesson, rev.intent);
      assert.strictEqual(state.conceptId, id);
      assert.strictEqual(state.intent, 'revision');
    }
    const periodic = createClassRuntimeState(resolved('periodic_table', 'revision').lesson, 'revision');
    assert.ok(/revision/i.test(selectBuddy(periodic).dialogue), 'revision opening comes from the lesson script');
  });

  console.log('\nC. Class runtime state isolation');

  await test('9. Concept switching resets step, answers, hints, feedback, directive, artwork and session', () => {
    let s = stateFor('dc_motor');
    s = advance(s);
    s = advance(s);
    s = advance(s);
    s = classRuntimeReducer(s, { type: 'REVEAL_HINT' });
    s = classRuntimeReducer(s, { type: 'SESSION_CREATED', session: { sessionId: 'sess_a', conceptId: 'dc_motor' } });
    assert.strictEqual(s.stepIndex, 3);
    const b = resolved('periodic_table', 'revision');
    s = classRuntimeReducer(s, { type: 'INIT', lesson: b.lesson, intent: b.intent });
    assert.strictEqual(s.conceptId, 'periodic_table');
    assert.strictEqual(s.stepIndex, 0);
    assert.strictEqual(s.hintsRevealed, 0);
    assert.strictEqual(s.feedback, null);
    assert.strictEqual(s.directive, null);
    assert.strictEqual(s.artwork, null);
    assert.strictEqual(s.session, null);
    assert.strictEqual(s.answer.submitted, false);
    assert.strictEqual(s.answer.stepId, b.lesson.steps[0].id);
    assert.deepStrictEqual(s.evidence, {}, 'learner evidence does not leak into another concept');
  });

  await test('9b. A → B → A returns to a clean A (lesson progress is ephemeral by design)', () => {
    let s = stateFor('periodic_table');
    s = advanceTo(s, 4);
    assert.strictEqual(s.stepIndex, 4);
    const dc = resolved('dc_motor');
    s = classRuntimeReducer(s, { type: 'INIT', lesson: dc.lesson, intent: 'learn' });
    const pt = resolved('periodic_table');
    s = classRuntimeReducer(s, { type: 'INIT', lesson: pt.lesson, intent: 'learn' });
    assert.strictEqual(s.conceptId, 'periodic_table');
    assert.strictEqual(s.stepIndex, 0);
    assert.strictEqual(s.lesson, pt.lesson);
  });

  await test('10. Question submission does not leak into the next step or the next lesson', () => {
    const r = resolved('polymorphism');
    let s = createClassRuntimeState(r.lesson, 'learn');
    const qi = firstQuestionStepIndex(r.lesson);
    s = classRuntimeReducer(s, { type: 'GO_TO_STEP', index: qi });
    const step = r.lesson.steps[qi];
    const wrong = step.checkQuestion!.options.find((o) => !o.isCorrect)!;
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: wrong.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    assert.strictEqual(s.answer.submitted, true);
    assert.strictEqual(s.feedback?.kind, 'incorrect');
    // Learn by doing: a wrong answer cannot be skipped with Next.
    assert.strictEqual(classRuntimeReducer(s, { type: 'NEXT_STEP' }).stepIndex, qi, 'Next is blocked until the check is resolved');
    s = classRuntimeReducer(s, { type: 'RETRY_ANSWER', stepId: step.id });
    s = answerActiveCheck(s);
    assert.strictEqual(s.evidence[step.id].firstTryCorrect, false, 'first-try evidence records the wrong attempt');
    // Next step: clean answer state
    s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
    assert.strictEqual(s.answer.submitted, false);
    assert.strictEqual(s.answer.selectedOptionId, null);
    assert.strictEqual(s.feedback, null);
    assert.strictEqual(s.answer.stepId, r.lesson.steps[qi + 1].id);
    // Stale actions for the previous step are ignored
    const before = s;
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: step.id, optionId: wrong.id });
    s = classRuntimeReducer(s, { type: 'SUBMIT_ANSWER', stepId: step.id });
    assert.strictEqual(s, before, 'actions for another step are no-ops');
    // Switch lesson
    const ir = resolved('industrial_revolution');
    s = classRuntimeReducer(s, { type: 'INIT', lesson: ir.lesson, intent: 'learn' });
    assert.strictEqual(s.answer.submitted, false);
    assert.strictEqual(s.feedback, null);
    // Options from another lesson cannot be selected
    const irQ = firstQuestionStepIndex(ir.lesson);
    s = classRuntimeReducer(s, { type: 'GO_TO_STEP', index: irQ });
    const unchanged = s;
    s = classRuntimeReducer(s, { type: 'SELECT_OPTION', stepId: ir.lesson.steps[irQ].id, optionId: wrong.id });
    assert.strictEqual(s, unchanged, 'foreign option id is rejected');
  });

  await test('11. Xira context follows the active concept and step', () => {
    for (const id of REQUIRED) {
      let s = stateFor(id);
      s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
      const ctx = selectXiraContext(s);
      const lesson = resolved(id).lesson;
      assert.strictEqual(ctx.conceptId, id);
      assert.strictEqual(ctx.topicTitle, lesson.topicTitle);
      assert.strictEqual(ctx.stepId, lesson.steps[1].id);
      assert.ok(ctx.keyIdea.length > 0);
      assert.ok(lesson.xiraPrompts, `${id} has lesson-owned Xira prompts`);
      if (id !== 'dc_motor' && id !== 'projectile_motion') {
        const prompts = JSON.stringify(lesson.xiraPrompts);
        assert.ok(!/magnetic|current interact|physically/i.test(prompts), `${id} Xira prompts are not physics defaults`);
      }
    }
    const pt = resolved('periodic_table').lesson.xiraPrompts!;
    assert.ok(/arranged/i.test(pt.why), 'periodic Why prompt is about arrangement');
  });

  await test('12. Buddy dialogue follows the active concept for every step and feedback', () => {
    for (const id of REQUIRED) {
      const lesson = resolved(id).lesson;
      assert.ok(lesson.buddyScript, `${id} has a Buddy script`);
      let s = createClassRuntimeState(lesson, 'learn');
      for (let i = 0; i < lesson.steps.length; i++) {
        s = advanceTo(s, i);
        const buddy = selectBuddy(s);
        // Predict-first steps open with the lesson's own predict prompt (no answer given away).
        const expected = lesson.steps[i].predict ? lesson.steps[i].predict!.dialogue : lesson.steps[i].buddyDialogue;
        assert.strictEqual(buddy.dialogue, expected, `${id} step ${i} dialogue from lesson`);
        if (id !== 'dc_motor') assert.ok(!DC_MOTOR_MARKERS.test(buddy.dialogue), `${id} Buddy has no DC-motor wording`);
        const step = lesson.steps[i];
        if (step.checkQuestion) {
          // Buddy's feedback is the chosen option's own explanation for THIS question.
          const correct = step.checkQuestion.options.find((o) => o.isCorrect)!;
          const after = answerActiveCheck(s);
          assert.strictEqual(selectBuddy(after).dialogue, correct.feedback, `${id} step ${i} feedback is question-specific`);
          if (step.predict) {
            assert.strictEqual(selectBuddy(classRuntimeReducer(after, { type: 'GO_TO_STEP', index: i })).dialogue.length > 0, true);
          }
        }
      }
      s = answerActiveCheck(s);
      // Completion praise also requires the lesson's board activities (trace / ordering / challenge).
      for (const st of lesson.steps) {
        const target = lesson.steps.indexOf(st);
        const kind = (st.visualData as { mode?: string; order?: unknown[] } | undefined) ?? {};
        if (kind.mode === 'trace' || kind.mode === 'challenge' || Array.isArray(kind.order)) {
          s = classRuntimeReducer(s, { type: 'GO_TO_STEP', index: target });
          s = classRuntimeReducer(s, { type: 'BOARD_ACTIVITY', stepId: st.id, completed: true, wrong: 0 });
        }
      }
      s = classRuntimeReducer(s, { type: 'GO_TO_STEP', index: lesson.steps.length - 1 });
      s = answerActiveCheck(s);
      s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
      assert.strictEqual(s.completed, true);
      assert.strictEqual(selectBuddy(s).dialogue, lesson.buddyScript!.completion);
    }
  });

  await test('13. Flashcards and questions belong to the active concept', () => {
    for (const id of REQUIRED) {
      const lesson = resolved(id).lesson;
      assert.ok(lesson.flashcards && lesson.flashcards.length >= 2, `${id} has flashcards`);
      for (const card of lesson.flashcards!) {
        assert.ok(!card.conceptId || card.conceptId === id, `${id} flashcard ${card.id} conceptId`);
      }
      for (const q of lesson.questions ?? []) {
        assert.strictEqual(q.conceptId, id, `${id} question ${q.id}`);
        assert.strictEqual(q.lessonId, lesson.id);
      }
    }
    const subjectTerms: Record<string, RegExp> = {
      periodic_table: /element|atomic|period|group|metal/i,
      polymorphism: /interface|dispatch|implementation|class/i,
      calculus_derivatives: /derivative|slope|tangent|rate|d\/dx/i,
      industrial_revolution: /industrial|factory|railway|britain|watt/i,
    };
    for (const [id, re] of Object.entries(subjectTerms)) {
      const lesson = resolved(id).lesson;
      for (const card of lesson.flashcards!) assert.ok(re.test(card.front + card.back), `${id} flashcard on-topic: ${card.front}`);
      for (const q of lesson.questions!) assert.ok(re.test(q.prompt + q.explanation), `${id} question on-topic: ${q.prompt}`);
    }
  });

  console.log('\nD. Visual identity & async');

  await test('14. Visual payloads: deterministic payload carries identity; wrong/missing identity is rejected', () => {
    for (const id of REQUIRED) {
      const r = resolved(id);
      r.lesson.steps.forEach((step, idx) => {
        const p = buildStepVisualPayload(r.concept, r.lesson, step, idx);
        const meta = p.metadata as Record<string, unknown>;
        assert.strictEqual(meta.conceptId, id);
        assert.strictEqual(meta.subject, r.concept.subject);
        assert.strictEqual(meta.conceptVisual, r.concept.visualKind);
        assert.ok(p.visualType);
        assert.ok(acceptVisualPayload({ conceptId: id, stepIndex: idx }, p).accepted);
      });
    }
    const pt = resolved('periodic_table');
    const good = buildStepVisualPayload(pt.concept, pt.lesson, pt.lesson.steps[0], 0);
    const dc = resolved('dc_motor');
    const foreign = buildStepVisualPayload(dc.concept, dc.lesson, dc.lesson.steps[2], 2);
    assert.deepStrictEqual(acceptVisualPayload({ conceptId: 'periodic_table' }, foreign), { accepted: false, reason: 'concept_mismatch' });
    const noId: SmartBoardVisualPayload = { ...good, metadata: { subject: 'Chemistry' } };
    assert.strictEqual(acceptVisualPayload({ conceptId: 'periodic_table' }, noId).reason, 'missing_concept_id');
    const noSubject: SmartBoardVisualPayload = { ...good, metadata: { conceptId: 'periodic_table' } };
    assert.strictEqual(acceptVisualPayload({ conceptId: 'periodic_table' }, noSubject).reason, 'missing_subject');
    assert.strictEqual(acceptVisualPayload({ conceptId: 'periodic_table', stepIndex: 3 }, good).reason, 'step_mismatch');
    assert.strictEqual(acceptVisualPayload({ conceptId: 'periodic_table' }, null).reason, 'missing_payload');
  });

  await test('15. Stale async responses cannot overwrite the active concept (visual, session, directive)', () => {
    const dc = resolved('dc_motor');
    let s = createClassRuntimeState(dc.lesson, 'learn');
    s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
    const staleToken = selectVisualToken(s); // request issued for dc_motor step 2
    const dcPayload = { ...buildStepVisualPayload(dc.concept, dc.lesson, dc.lesson.steps[1], 1), assetUrl: '/generated/dc.png' };

    // User navigates to periodic_table before the response arrives.
    const pt = resolved('periodic_table');
    s = classRuntimeReducer(s, { type: 'INIT', lesson: pt.lesson, intent: 'revision' });
    s = classRuntimeReducer(s, { type: 'EXTERNAL_VISUAL', token: staleToken, payload: dcPayload });
    assert.strictEqual(s.artwork, null, 'stale dc_motor visual rejected');
    s = classRuntimeReducer(s, { type: 'SESSION_CREATED', session: { sessionId: 'sess_old', conceptId: 'dc_motor' } });
    assert.strictEqual(s.session, null, 'stale dc_motor session rejected');
    s = classRuntimeReducer(s, { type: 'SET_DIRECTIVE', conceptId: 'dc_motor', directive: { signal: 'MISCONCEPTION' } as never });
    assert.strictEqual(s.directive, null, 'stale dc_motor directive rejected');
    assert.strictEqual(s.rejectedCount, 3);

    // Same concept but an older step generation is also rejected.
    const t0 = selectVisualToken(s);
    s = classRuntimeReducer(s, { type: 'NEXT_STEP' });
    const ptPayload0 = { ...buildStepVisualPayload(pt.concept, pt.lesson, pt.lesson.steps[0], 0), assetUrl: '/generated/pt0.png' };
    s = classRuntimeReducer(s, { type: 'EXTERNAL_VISUAL', token: t0, payload: ptPayload0 });
    assert.strictEqual(s.artwork, null, 'older step response rejected');

    // A current, correctly-identified response is accepted — as optional artwork only.
    const t1 = selectVisualToken(s);
    const ptPayload1 = { ...buildStepVisualPayload(pt.concept, pt.lesson, pt.lesson.steps[1], 1), assetUrl: '/generated/pt1.png' };
    s = classRuntimeReducer(s, { type: 'EXTERNAL_VISUAL', token: t1, payload: ptPayload1 });
    assert.deepStrictEqual(s.artwork, { conceptId: 'periodic_table', stepIndex: 1, assetUrl: '/generated/pt1.png' });

    // An unidentified external payload for the current token is still rejected.
    const anon = { type: 'visual_requirement', visualType: 'graph', title: 'x', purpose: 'y', assetUrl: '/a.png' } as SmartBoardVisualPayload;
    const before = s.rejectedCount;
    s = classRuntimeReducer(s, { type: 'EXTERNAL_VISUAL', token: selectVisualToken(s), payload: anon });
    assert.strictEqual(s.rejectedCount, before + 1);
    // Artwork never survives a step change.
    s = advance(s);
    assert.strictEqual(s.stepIndex, 2);
    assert.strictEqual(s.artwork, null);
  });

  console.log('\nE. Server orchestrator');

  await test('16. Orchestrator: exact concept, lesson-owned Buddy, no DC-motor wording, owner-scoped sessions', async () => {
    const orch = new XiraClassroomOrchestrator(undefined, undefined, new MemorySessionStore());
    await assert.rejects(() => orch.createSession('research_methods', 'INTRODUCE', { ownerId: 'learner_a' }), ConceptUnavailableError);

    const sess = await orch.createSession('periodic_table', 'INTRODUCE', { ownerId: 'learner_a', intent: 'revision' });
    assert.strictEqual(sess.conceptId, 'periodic_table');
    assert.strictEqual(sess.intent, 'revision');
    assert.ok(/^sess_[0-9a-f-]{20,}$/i.test(sess.sessionId) || sess.sessionId.length > 20, 'unguessable session id');
    assert.ok(!sess.sessionId.includes('periodic_table'), 'session id does not embed concept');
    assert.strictEqual(sess.nextRecommendedConceptId, getNextConceptId('periodic_table') ?? undefined);

    await assert.rejects(() => orch.processLearnerAction(sess.sessionId, { type: 'ADVANCE_STAGE' }, 'learner_b'), SessionNotFoundError);
    await assert.rejects(() => orch.processLearnerAction(sess.sessionId, { type: 'ADVANCE_STAGE' }, ''), SessionNotFoundError);

    const actions = [
      { type: 'ADVANCE_STAGE' },
      { type: 'ADVANCE_STAGE' },
      { type: 'ADVANCE_STAGE' },
      { type: 'ADVANCE_STAGE' },
      { type: 'REQUEST_HINT' },
      { type: 'ANSWER_QUESTION', optionId: 'nope' },
      { type: 'RETRY_QUESTION' },
      { type: 'COMPLETE_CHALLENGE', outcome: 'success' },
      { type: 'COMPLETE_ASSESSMENT', isCorrect: true },
      { type: 'CLAIM_REWARD' },
    ] as const;
    for (const action of actions) {
      const next = await orch.processLearnerAction(sess.sessionId, action as never, 'learner_a');
      assert.strictEqual(next.conceptId, 'periodic_table');
      const text = `${next.buddyDialogue} ${next.xiraIntervention?.message ?? ''} ${JSON.stringify(next.currentVisualPayload ?? {})}`;
      assert.ok(!DC_MOTOR_MARKERS.test(text), `no DC-motor wording after ${action.type}: ${text.slice(0, 160)}`);
      assert.ok(!(next.currentVisualPayload?.assetUrl || '').includes('dc-motor'), 'no DC-motor asset');
    }
  });

  console.log('\n==========================================================');
  console.log(`CONCEPT IDENTITY SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('==========================================================');
  if (failed > 0) {
    failures.forEach((f) => console.log(' - ' + f));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in concept identity tests:', err);
  process.exit(1);
});
