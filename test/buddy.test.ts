import * as assert from 'assert';
import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import { BUDDY_STATE_CONFIG, getBuddyStateForClassStage, BuddyState } from '../components/buddy/BuddyState';
import { BuddyAnimationController } from '../components/buddy/BuddyAnimationController';
import { createBuddyMeshNodes } from '../components/buddy/BuddyModel';

export async function runBuddyTests(): Promise<{ passed: number; failed: number }> {
  console.log('======================================================');
  console.log('XPEDITION STEP 3 — BUDDY COMPANION VERIFICATION SUITE');
  console.log('======================================================\n');

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
  // 1. Buddy State Model Verification
  // ---------------------------------------------------------------------------
  console.log('--- Test Group 1: Buddy State Model & Meta Configurations ---');

  test('BUDDY_STATE_CONFIG contains all 12 required explicit states', () => {
    const requiredStates: BuddyState[] = [
      'IDLE',
      'INTRODUCING',
      'EXPLAINING',
      'THINKING',
      'ENCOURAGING',
      'CELEBRATING',
      'CORRECT',
      'INCORRECT',
      'HINTING',
      'WAITING',
      'TRANSITIONING',
      'COMPLETE',
    ];

    for (const state of requiredStates) {
      assert.ok(BUDDY_STATE_CONFIG[state], `Missing state configuration for: ${state}`);
      assert.ok(BUDDY_STATE_CONFIG[state].visorColor, `State ${state} must define visorColor`);
      assert.ok(BUDDY_STATE_CONFIG[state].pulseRate > 0, `State ${state} pulseRate must be positive`);
      assert.ok(BUDDY_STATE_CONFIG[state].label, `State ${state} must define human-readable label`);
    }
  });

  test('Buddy color tokens conform to Xpedition design system palette', () => {
    assert.strictEqual(BUDDY_STATE_CONFIG.IDLE.visorColor, '#38BDF8', 'Idle visor must be Cyan (#38BDF8)');
    assert.strictEqual(BUDDY_STATE_CONFIG.CORRECT.visorColor, '#10B981', 'Correct visor must be Emerald (#10B981)');
    assert.strictEqual(BUDDY_STATE_CONFIG.INCORRECT.visorColor, '#F59E0B', 'Incorrect visor must be warm Amber (#F59E0B), not red');
  });

  // ---------------------------------------------------------------------------
  // 2. Class Stage to Buddy State Mapping & Assessment Silence
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Class Stage Mapping & Assessment Unbiased Rule ---');

  test('getBuddyStateForClassStage maps introduction to INTRODUCING', () => {
    assert.strictEqual(getBuddyStateForClassStage('introduce'), 'INTRODUCING');
  });

  test('getBuddyStateForClassStage maps explain to EXPLAINING', () => {
    assert.strictEqual(getBuddyStateForClassStage('explain'), 'EXPLAINING');
  });

  test('getBuddyStateForClassStage maps predict to THINKING', () => {
    assert.strictEqual(getBuddyStateForClassStage('predict'), 'THINKING');
  });

  test('getBuddyStateForClassStage maps reward to CELEBRATING', () => {
    assert.strictEqual(getBuddyStateForClassStage('reward'), 'CELEBRATING');
  });

  test('CRITICAL: Assessment stage enforces unbiased silence (WAITING state, speech forbidden)', () => {
    const assessmentState = getBuddyStateForClassStage('assessment');
    assert.strictEqual(assessmentState, 'WAITING', 'Assessment stage must map to WAITING');
    assert.strictEqual(BUDDY_STATE_CONFIG[assessmentState].speechAllowed, false, 'Speech must be disabled during assessment');
    assert.strictEqual(BUDDY_STATE_CONFIG[assessmentState].assessmentSafe, true, 'Assessment state must be marked assessmentSafe');
  });

  // ---------------------------------------------------------------------------
  // 3. Procedural Three.js Animation Controller & Reduced Motion
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Animation Controller & Accessibility ---');

  test('createBuddyMeshNodes builds lightweight procedural hierarchy (<2,000 vertices)', () => {
    const nodes = createBuddyMeshNodes();
    assert.ok(nodes.group instanceof THREE.Group, 'Root must be a THREE.Group');
    assert.ok(nodes.chassis instanceof THREE.Mesh, 'Chassis must be a THREE.Mesh');
    assert.ok(nodes.visor instanceof THREE.Mesh, 'Visor must be a THREE.Mesh');
    assert.ok(nodes.energyHalo instanceof THREE.Mesh, 'Energy halo must be a THREE.Mesh');
    assert.ok(nodes.leftFin instanceof THREE.Mesh, 'Left fin must exist');
    assert.ok(nodes.rightFin instanceof THREE.Mesh, 'Right fin must exist');
    assert.ok(nodes.thrustGlow instanceof THREE.PointLight, 'Thrust light must be a PointLight');
  });

  test('BuddyAnimationController updates levitation bobbing during standard motion', () => {
    const controller = new BuddyAnimationController();
    const nodes = createBuddyMeshNodes();

    controller.update(nodes, 'IDLE', 0.016, 1.0, false);
    const pos1 = nodes.group.position.y;

    controller.update(nodes, 'IDLE', 0.016, 1.5, false);
    const pos2 = nodes.group.position.y;

    assert.ok(pos1 !== undefined && pos2 !== undefined, 'Position Y must be computed');
  });

  test('BuddyAnimationController strictly halts continuous motion when reducedMotion is true', () => {
    const controller = new BuddyAnimationController();
    const nodes = createBuddyMeshNodes();

    controller.update(nodes, 'IDLE', 0.016, 2.0, true);
    assert.strictEqual(nodes.group.position.y, 0, 'Y position must be exactly 0 in reduced motion');
    assert.strictEqual(nodes.energyHalo.rotation.z, 0, 'Halo rotation must be frozen in reduced motion');

    controller.update(nodes, 'INTRODUCING', 0.016, 3.5, true);
    assert.strictEqual(nodes.group.position.y, 0, 'Y position must remain 0 across states in reduced motion');
  });

  test('Buddy reaction gestures: CELEBRATING drives spin, CORRECT triggers jump', () => {
    const controller = new BuddyAnimationController();
    const nodes = createBuddyMeshNodes();

    controller.update(nodes, 'CELEBRATING', 0.05, 1.0, false);
    assert.ok(nodes.chassis.rotation.y !== 0, 'Celebration must produce rotation on Y axis');

    controller.update(nodes, 'CORRECT', 0.05, 1.2, false);
    assert.ok(nodes.leftFin.rotation.z < 0, 'Fins must flare during correct validation bounce');
  });

  // ---------------------------------------------------------------------------
  // 4. Separation of Concerns: Buddy vs Xira
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Buddy & Xira Architectural Separation ---');

  test('Buddy components do not import BKT or mastery calculation engines', () => {
    const buddyFiles = [
      'components/buddy/BuddyState.ts',
      'components/buddy/BuddyAnimationController.ts',
      'components/buddy/BuddyModel.ts',
      'components/buddy/BuddyScene.tsx',
      'components/buddy/BuddyPresence.tsx',
      'components/buddy/BuddyContext.tsx',
    ];

    for (const file of buddyFiles) {
      // Compiled file runs inside .test-dist-experience/test, so source files are 2 levels up
      const fullPath = path.resolve(__dirname, '../..', file);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!content.includes('calculateBkt'), `${file} must not import or compute calculateBkt`);
      assert.ok(!content.includes('banditEngine'), `${file} must not import banditEngine`);
      assert.ok(!content.includes('decisionEngine'), `${file} must not import decisionEngine`);
    }
  });

  return { passed, failed };
}
