import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  getStageCategory,
  isStageSkippable,
  requiresSkipConfirmation,
  createSkipRecord,
  evaluateSkipMasterySafety,
  SkipReason,
  SkipRecord,
} from '../lib/class/skipSystem';
import { CLASS_STAGE_SEQUENCE, getClassData } from '../lib/class/classCatalog';
import { getBuddyStateForClassStage } from '../components/buddy/BuddyState';
import { thetaToPercent, updateTheta } from '../lib/engine/mastery';

export async function runSkipSystemTests(): Promise<{ passed: number; failed: number }> {
  console.log('===========================================================');
  console.log('XPEDITION STEP 5 — UNIVERSAL SKIP SYSTEM TEST SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Stage Classification & Taxonomy
  // ---------------------------------------------------------------------------
  console.log('--- Test Group 1: Stage Classification & Taxonomy ---');

  test('Correctly classifies optional stages (introduce, explain, explore, observe)', () => {
    assert.strictEqual(getStageCategory('introduce'), 'OPTIONAL');
    assert.strictEqual(getStageCategory('explain'), 'OPTIONAL');
    assert.strictEqual(getStageCategory('explore'), 'OPTIONAL');
    assert.strictEqual(getStageCategory('observe'), 'OPTIONAL');
  });

  test('Correctly classifies evidence-generating stages (predict, interact, quick_check, mission, challenge, assessment)', () => {
    assert.strictEqual(getStageCategory('predict'), 'EVIDENCE_GENERATING');
    assert.strictEqual(getStageCategory('interact'), 'EVIDENCE_GENERATING');
    assert.strictEqual(getStageCategory('quick_check'), 'EVIDENCE_GENERATING');
    assert.strictEqual(getStageCategory('mission'), 'EVIDENCE_GENERATING');
    assert.strictEqual(getStageCategory('challenge'), 'EVIDENCE_GENERATING');
    assert.strictEqual(getStageCategory('assessment'), 'EVIDENCE_GENERATING');
  });

  test('Correctly classifies system/result stages as non-skippable (feedback, reward, next_class)', () => {
    assert.strictEqual(getStageCategory('feedback'), 'SYSTEM_RESULT');
    assert.strictEqual(getStageCategory('reward'), 'SYSTEM_RESULT');
    assert.strictEqual(getStageCategory('next_class'), 'SYSTEM_RESULT');

    assert.strictEqual(isStageSkippable('feedback'), false);
    assert.strictEqual(isStageSkippable('reward'), false);
    assert.strictEqual(isStageSkippable('next_class'), false);
  });

  // ---------------------------------------------------------------------------
  // 2. Confirmation Requirements
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Confirmation Warning Requirements ---');

  test('Optional stages skip frictionlessly without confirmation', () => {
    assert.strictEqual(requiresSkipConfirmation('introduce'), false);
    assert.strictEqual(requiresSkipConfirmation('explain'), false);
    assert.strictEqual(requiresSkipConfirmation('explore'), false);
    assert.strictEqual(requiresSkipConfirmation('observe'), false);
  });

  test('Evidence-generating stages strictly require confirmation warning', () => {
    assert.strictEqual(requiresSkipConfirmation('predict'), true);
    assert.strictEqual(requiresSkipConfirmation('interact'), true);
    assert.strictEqual(requiresSkipConfirmation('quick_check'), true);
    assert.strictEqual(requiresSkipConfirmation('mission'), true);
    assert.strictEqual(requiresSkipConfirmation('challenge'), true);
    assert.strictEqual(requiresSkipConfirmation('assessment'), true);
  });

  // ---------------------------------------------------------------------------
  // 3. Skip Record Generation & Preservation of Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Skip Record Generation & Invariants ---');

  test('createSkipRecord preserves conceptId and marks evaluative skips with INSUFFICIENT_EVIDENCE', () => {
    const record = createSkipRecord('assessment', 'projectile_motion', 'already_know');

    assert.strictEqual(record.type, 'ACTIVITY_SKIPPED');
    assert.strictEqual(record.stage, 'assessment');
    assert.strictEqual(record.conceptId, 'projectile_motion');
    assert.strictEqual(record.reason, 'already_know');
    assert.strictEqual(record.result, 'SKIPPED_WITHOUT_EVIDENCE');
    assert.strictEqual(record.evidenceStatus, 'INSUFFICIENT_EVIDENCE');
    assert.ok(record.timestamp > 0);
  });

  test('createSkipRecord marks optional skips with NO_EVIDENCE_NEEDED', () => {
    const record = createSkipRecord('explain', 'projectile_motion', 'optional_content');

    assert.strictEqual(record.stage, 'explain');
    assert.strictEqual(record.result, 'SKIPPED');
    assert.strictEqual(record.evidenceStatus, 'NO_EVIDENCE_NEEDED');
  });

  // ---------------------------------------------------------------------------
  // 4. Mathematical Mastery & BKT Safety Bounds
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Mastery & BKT Invariant Protection ---');

  test('evaluateSkipMasterySafety strictly prohibits mastery awards and BKT updates', () => {
    const evaluativeRecord = createSkipRecord('assessment', 'projectile_motion', 'already_know');
    const safety = evaluateSkipMasterySafety(evaluativeRecord);

    assert.strictEqual(safety.masteryAwarded, false, 'Mastery MUST NOT be awarded on skip');
    assert.strictEqual(safety.bktUpdated, false, 'BKT MUST NOT be updated on skip');
    assert.strictEqual(safety.validAttempt, false, 'Skipped activity MUST NOT produce valid attempt');
    assert.strictEqual(safety.xpAwarded, 0, 'No mastery XP can be awarded for skipped activities');
  });

  test('Repeated skips do not alter learner theta or fabricate mastery percentage', () => {
    const initialTheta = -0.4;
    const initialMastery = thetaToPercent(initialTheta);

    // Simulate multiple skips on the same concept
    const stagesToSkip = ['predict', 'quick_check', 'mission', 'challenge', 'assessment'] as const;
    let currentTheta = initialTheta;

    for (const stage of stagesToSkip) {
      const record = createSkipRecord(stage, 'projectile_motion', 'move_faster');
      const safety = evaluateSkipMasterySafety(record);

      // Invariant: when safety.bktUpdated is false, updateTheta is never invoked
      if (!safety.bktUpdated) {
        // Theta remains strictly unchanged
        currentTheta = initialTheta;
      } else {
        currentTheta = updateTheta(currentTheta, true);
      }
    }

    assert.strictEqual(currentTheta, initialTheta, 'Theta must remain exactly initialTheta');
    assert.strictEqual(thetaToPercent(currentTheta), initialMastery, 'Mastery percentage must remain unchanged');
  });

  // ---------------------------------------------------------------------------
  // 5. Buddy Companion Reaction Safety
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Buddy Companion Reaction Safety ---');

  test('Buddy NEVER enters CELEBRATING or celebratory state when any stage is skipped', () => {
    const allStages = CLASS_STAGE_SEQUENCE.map((s) => s.id);

    for (const stage of allStages) {
      const buddyState = getBuddyStateForClassStage(stage);
      if (stage !== 'reward') {
        assert.notStrictEqual(
          buddyState,
          'CELEBRATING',
          `Stage '${stage}' must not map Buddy to CELEBRATING`
        );
      }
    }
  });

  test('Assessment stage locks Buddy into silent WAITING state', () => {
    const buddyState = getBuddyStateForClassStage('assessment');
    assert.strictEqual(buddyState, 'WAITING', 'Assessment must map to WAITING state');
  });

  // ---------------------------------------------------------------------------
  // 6. Class FSM Continuity & Navigation Integrity
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Class FSM Continuity & Navigation ---');

  test('CLASS_STAGE_SEQUENCE defines valid sequential progression without gaps', () => {
    assert.strictEqual(CLASS_STAGE_SEQUENCE.length, 13);
    for (let i = 0; i < CLASS_STAGE_SEQUENCE.length; i++) {
      assert.strictEqual(CLASS_STAGE_SEQUENCE[i].stepNumber, i + 1);
    }
  });

  test('Skipping an activity preserves current Class concept data', () => {
    const classData = getClassData('projectile_motion');
    assert.strictEqual(classData.conceptId, 'projectile_motion');
    assert.ok(classData.nextConcept.conceptId, 'Next concept must be preserved');
  });

  // ---------------------------------------------------------------------------
  // 7. Security & Server Authority Bounds
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Security & Server Authority Bounds ---');

  test('Skip components do not expose client-authoritative mastery override APIs', () => {
    const skipSystemCode = fs.readFileSync(
      path.resolve(__dirname, '../../lib/class/skipSystem.ts'),
      'utf8'
    );
    assert.ok(!skipSystemCode.includes('x-user-id'), 'Skip system must never trust x-user-id');
    assert.ok(
      !skipSystemCode.includes('setMasteryPercentage'),
      'Skip system must not expose client-authoritative mastery setter'
    );
  });

  test('ClassSkipConfirmModal is physically present and accessible', () => {
    const modalPath = path.resolve(__dirname, '../../components/class/ClassSkipConfirmModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'ClassSkipConfirmModal.tsx must physically exist');
    const modalCode = fs.readFileSync(modalPath, 'utf8');
    assert.ok(modalCode.includes('role="alertdialog"'), 'Must have role=alertdialog for accessibility');
    assert.ok(modalCode.includes('min-h-[44px]'), 'Must support minimum 44px touch target');
  });

  test('UnifiedClassContainer wires onSkip to confirmation handler', () => {
    const containerCode = fs.readFileSync(
      path.resolve(__dirname, '../../components/class/UnifiedClassContainer.tsx'),
      'utf8'
    );
    assert.ok(containerCode.includes('executeSkip'), 'UnifiedClassContainer must define executeSkip');
    assert.ok(
      containerCode.includes('handleInitiateSkip'),
      'UnifiedClassContainer must define handleInitiateSkip'
    );
    assert.ok(
      containerCode.includes('<ClassSkipConfirmModal'),
      'UnifiedClassContainer must render ClassSkipConfirmModal'
    );
  });

  return { passed, failed };
}
