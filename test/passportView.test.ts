/**
 * PASSPORT VIEW — the Passport shows only what the learner's record supports.
 *
 *   - XP / level / streak use the same real formula as Home (never Home's sample
 *     figures for brand-new learners: 1240 XP, level 4, 68%)
 *   - subject stamps come from canonical concept subjects; unknown ids stay apart
 *   - "mastered" follows the documented evidence thresholds
 *   - milestones are earned only from recorded activity
 *   - a brand-new learner sees zeros and "not started", never invented progress
 *   - the Passport UI copy makes no unsupported credential claims
 *   - the prepared Passport assets exist, with their sample data removed
 *
 * Run: npx tsx test/passportView.test.ts
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { buildPassportView, PASSPORT_SUBJECTS } from '../lib/passport/passportView';
import { findUnsupportedClaims } from '../lib/passport/trustLanguage';
import { passportFixture } from './fixtures/passportLearner';
import type { UserStoreData } from '../lib/store';

const ROOT = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Streaks are counted up to the real "today", so the record is built relative to now.
const NOW = Date.now();

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

const full = passportFixture(NOW) as unknown as UserStoreData;
const empty = passportFixture(NOW, false) as unknown as UserStoreData;

console.log('PASSPORT VIEW');

test('1. XP, level and streak come from the recorded answers (Home’s real formula)', () => {
  const v = buildPassportView(full, NOW);
  const answers = full.attempts.length; // 14
  const correct = full.attempts.filter((a) => a.isCorrect).length; // 9
  const masteredForXp = full.concepts.filter((c) => c.masteryPercentage >= 80).length; // 1
  assert.strictEqual(v.xp, correct * 25 + answers * 10 + masteredForXp * 100);
  assert.strictEqual(v.level, Math.floor(v.xp / 300) + 1);
  assert.strictEqual(v.xpToNextLevel, 300 - (v.xp % 300));
  assert.strictEqual(v.streak, 4, 'answers on 4 consecutive days up to today');
});

test('2. A brand-new learner sees zeros and "not started", never sample progress', () => {
  const v = buildPassportView(empty, NOW);
  assert.strictEqual(v.xp, 0);
  assert.strictEqual(v.level, 1);
  assert.strictEqual(v.streak, 0);
  assert.strictEqual(v.isNewLearner, true);
  assert.ok(v.subjects.every((s) => s.state === 'not_started' && s.bestMastery === null));
  assert.ok(v.milestones.every((m) => !m.earned && m.detail === null));
  assert.deepStrictEqual(v.totals, { conceptsLearned: 0, interactive: 0, practice: 0, assessment: 0, mastered: 0 });
  assert.notStrictEqual(v.xp, 1240);
});

test('3. Subject stamps follow canonical subjects; unknown concepts are never re-labelled', () => {
  const v = buildPassportView(full, NOW);
  assert.deepStrictEqual(v.subjects.map((s) => s.subject), PASSPORT_SUBJECTS.map((s) => s.subject));
  const by = Object.fromEntries(v.subjects.map((s) => [s.subject, s]));
  assert.strictEqual(by.Physics.state, 'mastered'); // projectile motion: 86%, 4 solo attempts
  assert.strictEqual(by.Biology.state, 'in_progress'); // heart: practised, no solo
  assert.strictEqual(by.Chemistry.state, 'in_progress'); // periodic table
  assert.strictEqual(by.Mathematics.state, 'not_started');
  assert.deepStrictEqual(v.otherConcepts.map((c) => c.conceptId), ['my_custom_topic']);
  for (const s of v.subjects) assert.ok(fs.existsSync(path.join(ROOT, 'public', s.stampSrc)), s.stampSrc);
});

test('4. Evidence totals add up from the record', () => {
  const v = buildPassportView(full, NOW);
  assert.strictEqual(v.totals.practice, full.attempts.length);
  assert.strictEqual(v.totals.assessment, full.attempts.filter((a) => a.isSolo).length);
  // hands-on labs: projectile motion (6) + heart explorer (4)
  assert.strictEqual(v.totals.interactive, 10);
  assert.strictEqual(v.totals.conceptsLearned, 4);
  assert.strictEqual(v.totals.mastered, 1);
});

test('5. Milestones are earned only from recorded activity', () => {
  const v = buildPassportView(full, NOW);
  const m = Object.fromEntries(v.milestones.map((x) => [x.id, x]));
  assert.strictEqual(m.first_expedition.earned, true);
  assert.strictEqual(m.first_mastery.earned, true);
  assert.ok(m.first_mastery.detail!.includes('Projectile Motion'));
  assert.strictEqual(m.level_up.earned, v.level >= 2);
  assert.strictEqual(m.level_up.detail, `Level ${v.level}`);
  assert.strictEqual(m.streak.earned, true);
  assert.strictEqual(m.streak.detail, '4-day streak');
  const view2 = buildPassportView({ ...full, attempts: full.attempts.slice(0, 1), graphs: [{ ...full.graphs[0], attempts: full.attempts.slice(0, 1) }] } as UserStoreData, NOW);
  assert.strictEqual(view2.milestones.find((x) => x.id === 'streak')!.earned, false);
});

test('6. Passport UI copy makes no unsupported credential claims', () => {
  for (const f of ['components/passport/PassportBook.tsx', 'app/(app)/passport/page.tsx', 'lib/passport/passportView.ts']) {
    const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.deepStrictEqual(findUnsupportedClaims(src), [], f);
    assert.ok(!/verified by|industry certified|official certification|top performer/i.test(src), `${f}: unsupported claim`);
  }
  const book = read('components/passport/PassportBook.tsx');
  assert.ok(book.includes('PASSPORT_DISCLAIMER'), 'disclaimer shown');
});

test('7. Prepared Passport assets are used, with their sample data removed', () => {
  const dir = path.join(ROOT, 'public/images/passport');
  for (const f of ['cover-front.png', 'texture.png', 'milestone-first-expedition.png', 'milestone-level-up.png', 'milestone-streak.png', 'milestone-explorer.png', 'milestone-future-explorer.png', 'icon-concept-learned.png', 'icon-interactive.png', 'icon-practice.png', 'icon-assessment.png', 'icon-mastery.png', 'icon-xp.png', 'icon-challenge.png']) {
    assert.ok(fs.existsSync(path.join(dir, f)), f);
  }
  const readme = read('public/images/passport/README.md');
  assert.ok(/sample data was \*\*removed\*\*/i.test(readme));
  assert.ok(!fs.existsSync(path.join(dir, 'milestone-top-performer.png')), 'no ranking claim asset');
  const book = read('components/passport/PassportBook.tsx');
  for (const used of ['/images/passport/texture.png', '/images/passport/icon-', '/images/passport/milestone-future-explorer.png']) assert.ok(book.includes(used), used);
});

test('8. The Passport does not reuse Home’s sample figures', () => {
  const src = read('lib/passport/passportView.ts') + read('components/passport/PassportBook.tsx') + read('app/(app)/passport/page.tsx');
  assert.ok(!/1240|\b68%|Level 4\b/.test(src));
});

console.log(`PASSPORT VIEW SUMMARY: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
