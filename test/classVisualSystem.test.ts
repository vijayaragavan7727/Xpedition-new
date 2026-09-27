/**
 * CLASS VISUAL SYSTEM — regression tests for the Class visual rebuild.
 *
 * Encodes what the rebuild must keep true:
 *   - Buddy is the app's robot asset (/robot.png) standing in the room, not the
 *     procedural 3D "drone ball" and not a second floating companion
 *   - the classroom is real DOM/SVG; the flattened reference screenshot is never
 *     used, and the reused interior render is only an ambient layer
 *   - Buddy's body language follows his lesson mood
 *   - Notes / Formula / Flashcards open inside the Class (download is an explicit
 *     action inside the tool), in classroom-toned sheets
 *   - flashcards never print the answer on the front
 *   - wrong-answer feedback and the common-mistake note never give away the
 *     correct option (they are shown BEFORE the retry)
 *   - the class result is built from evidence (no XP, no invented mastery)
 *
 * Run: npx tsx test/classVisualSystem.test.ts
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { resolveClassLesson } from '../lib/concepts/lessonResolver';
import { buddyPoseFor } from '../components/classroom/BuddyTeacherStage';

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
];

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

console.log('CLASS VISUAL SYSTEM');

test('1. Buddy is the robot asset on a pedestal; the Class renders no 3D drone / BuddyScene', () => {
  const buddy = read('components/classroom/BuddyTeacherStage.tsx');
  assert.ok(buddy.includes('src="/robot.png"'), 'Buddy uses the app robot asset');
  assert.ok(fs.existsSync(path.join(ROOT, 'public/robot.png')));
  assert.ok(buddy.includes('buddy-pedestal'), 'Buddy stands on a pedestal');
  assert.ok(!buddy.includes('BuddyScene'), 'no procedural 3D drone in the Class');
  const layout = read('components/classroom/ClassroomLayout.tsx');
  assert.ok(!/BuddyScene|BuddyPresence/.test(layout), 'no second (floating) Buddy');
  // Exactly one Buddy per breakpoint: the stage (desktop) and the strip (phones) live in one column.
  assert.strictEqual((layout.match(/<BuddyTeacherStage/g) || []).length, 2);
  assert.ok(layout.includes('variant="stage" className="hidden lg:flex"'));
  assert.ok(layout.includes('variant="compact" className="lg:hidden"'));
});

test('2. The classroom is DOM/SVG; the reference screenshot is never used as UI', () => {
  const files = [
    'components/classroom/ClassroomLayout.tsx',
    'components/classroom/ClassroomEnvironment.tsx',
    'components/classroom/BuddyTeacherStage.tsx',
    'components/classroom/SmartBoard.tsx',
  ];
  for (const f of files) {
    const src = read(f);
    assert.ok(!src.includes('classroom-master-reference'), `${f} must not use the flattened reference screenshot`);
    assert.ok(!src.includes('smartboard-complete.png'), `${f} must not use the baked DC-motor board image`);
  }
  const env = read('components/classroom/ClassroomEnvironment.tsx');
  assert.ok(env.includes('classroom-interior-clean.png'), 'reuses the repository interior render');
  assert.ok(/opacity-\[0\.1\d\]/.test(env), 'the low-resolution render is only an ambient layer');
  assert.ok(env.includes('<svg'), 'window/city are real SVG');
});

test('3. Buddy body language follows his lesson mood', () => {
  assert.strictEqual(buddyPoseFor('EXPLAINING'), 'teach');
  assert.strictEqual(buddyPoseFor('INTRODUCING'), 'teach');
  assert.strictEqual(buddyPoseFor('THINKING'), 'think');
  assert.strictEqual(buddyPoseFor('INCORRECT'), 'support');
  assert.strictEqual(buddyPoseFor('HINTING'), 'support');
  assert.strictEqual(buddyPoseFor('CORRECT'), 'cheer');
  assert.strictEqual(buddyPoseFor('COMPLETE'), 'cheer');
  const css = read('app/globals.css');
  for (const pose of ['teach', 'think', 'cheer', 'support', 'rest']) {
    assert.ok(css.includes(`.xp-buddy-pose[data-pose='${pose}']`), `pose ${pose} has a style`);
  }
});

test('4. Tools open inside the Class; downloads are explicit actions inside the tool', () => {
  const layout = read('components/classroom/ClassroomLayout.tsx');
  const open = layout.slice(layout.indexOf('const handleOpenTool'), layout.indexOf('const handleDownload'));
  assert.ok(open.includes('setActiveTool(tool)'));
  assert.ok(!/download/i.test(open), 'opening a tool never downloads');
  const modal = read('components/classroom/tools/ClassroomToolsModal.tsx');
  for (const kind of ['notes', 'formula', 'flashcards']) {
    assert.ok(modal.includes(`data-testid="tool-download-${kind}"`), `${kind} offers a download inside the tool`);
  }
  assert.ok(modal.includes('tone="classroom"'), 'tools use classroom-toned sheets');
  assert.ok(!modal.includes('Verified Reference') && !modal.includes("'Verified Sources'"), 'no unearned "verified" claims');
  assert.ok(!modal.includes('will never decrease your mastery score'), 'no claim about a mastery score the Class does not keep');
  assert.ok(!modal.includes('Consider the physical laws'), 'no physics fallback hint on non-physics lessons');
});

test('5. Flashcards never print the answer on the front', () => {
  const card = read('components/learning-objects/LearningFlashcard.tsx');
  assert.ok(!card.includes('card.front.answerPreview || card.back.answer'));
  const modal = read('components/classroom/tools/ClassroomToolsModal.tsx');
  assert.ok(!modal.includes('answerPreview: currentCard.back'));
});

test('6. Wrong-answer feedback and the common-mistake note never give away the correct option', () => {
  const stop = new Set(['the', 'and', 'with', 'only', 'alone', 'that', 'from', 'this', 'into', 'each']);
  const leaks: string[] = [];
  for (const c of CONCEPTS) {
    const r = resolveClassLesson(c);
    assert.strictEqual(r.status, 'resolved');
    if (r.status !== 'resolved') continue;
    for (const s of r.lesson.steps) {
      if (!s.checkQuestion) continue;
      const correct = s.checkQuestion.options.find((o) => o.isCorrect)!;
      const words = correct.text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stop.has(w));
      const shownBeforeRetry: Record<string, string> = { commonMistake: s.commonMistake ?? '' };
      for (const o of s.checkQuestion.options) if (!o.isCorrect) shownBeforeRetry[`feedback ${o.id}`] = o.feedback;
      for (const [where, text] of Object.entries(shownBeforeRetry)) {
        const hits = words.filter((w) => text.toLowerCase().includes(w));
        if (words.length && hits.length >= Math.min(2, words.length)) leaks.push(`${c}/${s.id} ${where}: ${hits.join(',')}`);
      }
    }
  }
  assert.deepStrictEqual(leaks, []);
});

test('7. The class result is evidence-based: no XP, no invented mastery', () => {
  const board = read('components/classroom/SmartBoard.tsx');
  const panel = board.slice(board.indexOf('const CompletionPanel'), board.indexOf('export const SmartBoard'));
  assert.ok(panel.includes('summary.firstTryCorrect') && panel.includes('summary.review'));
  assert.ok(!/\bXP\b|mastered|Mastery/i.test(panel), 'no XP or mastery claims in the result');
  assert.ok(panel.includes('/learn') || board.includes('nextHref'), 'offers the next concept');
});

test('8. Stage-aware room: the board frame and room accent follow the teaching stage', () => {
  const layout = read('components/classroom/ClassroomLayout.tsx');
  assert.ok(layout.includes('STAGE_ACCENT[stage]'));
  assert.ok(layout.includes('<ClassroomEnvironment accent={accent} />'));
  assert.ok(layout.includes('data-class-stage='));
});

test('9. The forbidden example formula appears nowhere in the Class', () => {
  const files = [
    'components/classroom/ClassroomLayout.tsx',
    'components/classroom/ClassroomEnvironment.tsx',
    'components/classroom/BuddyTeacherStage.tsx',
    'components/classroom/SmartBoard.tsx',
    'components/classroom/tools/ClassroomToolsModal.tsx',
    'docs/class-visual-assets.md',
  ];
  const forbidden = new RegExp(['\\(a\\s*\\+\\s*b\\)', '(\\^|²|\\*\\*)\\s*2'].join(''));
  for (const f of files) assert.ok(!forbidden.test(read(f)), f);
});

console.log(`CLASS VISUAL SYSTEM SUMMARY: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
