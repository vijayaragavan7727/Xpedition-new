/**
 * Experience Engine Milestone 3: 3D Object Manipulation Test Suite
 *
 * Validates:
 * 1. Spatial Math Engine (Euler to normal, angular distance, tolerance alignment, trajectory analysis)
 * 2. Object Manipulation Declarative Config & ExperienceResult Contract
 * 3. Spatial Telemetry Flow (rotation, alignment check, completion)
 * 4. Xira Spatial Advisor (pedagogical guidance, fine-tuning, overshoot detection, celebration)
 * 5. Learner Model Integration (evidence pipeline, decision engine compatibility)
 * 6. Quest Definition & Canonical Loop Mapping
 */

import {
  calculateAngularDistance,
  eulerToNormal,
  isOrientationAligned,
  analyzeRotationTrajectory,
} from '../lib/experience/simulation/spatialMath';
import {
  OBJECT_MANIPULATION_CONFIG,
  OBJECT_MANIPULATION_EXPERIENCE,
  OBJECT_MANIPULATION_QUEST,
  createSpatialExperienceResult,
} from '../lib/experience/catalog/objectManipulationConfig';
import { TelemetryEmitter } from '../lib/experience/telemetry/telemetryEmitter';
import { defaultXiraExperienceAdvisor } from '../lib/experience/xira/xiraExperienceAdvisor';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';

interface AssertionReport {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runObjectExperienceTests(): Promise<void> {
  const results: AssertionReport[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`  ✓ ${name}`);
    } else {
      results.push({ name, passed: false, error: message || 'Assertion failed' });
      console.error(`  ✗ ${name}: ${message || 'Assertion failed'}`);
    }
  }

  console.log('\n======================================================');
  console.log('XPEDITION EXPERIENCE ENGINE — 3D OBJECT MANIPULATION TESTS');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // SECTION 1: Spatial Math Engine
  // ----------------------------------------------------
  console.log('1. Testing Spatial Math Engine...');

  const normalZ = eulerToNormal([0, 0, 0]);
  assert(
    'eulerToNormal([0, 0, 0]) points along +Z axis [0, 0, 1]',
    Math.abs(normalZ[0]) < 1e-6 && Math.abs(normalZ[1]) < 1e-6 && Math.abs(normalZ[2] - 1.0) < 1e-6
  );

  const normalY180 = eulerToNormal([0, 180, 0]);
  assert(
    'eulerToNormal([0, 180, 0]) points along -Z axis [0, 0, -1]',
    Math.abs(normalY180[2] - (-1.0)) < 1e-6
  );

  const distZero = calculateAngularDistance([0, 0, 0], [0, 0, 0]);
  assert('calculateAngularDistance identical orientations is 0°', Math.abs(distZero) < 1e-4);

  const distOpposite = calculateAngularDistance([0, 0, 0], [0, 180, 0]);
  assert('calculateAngularDistance opposite orientations is 180°', Math.abs(distOpposite - 180) < 0.1);

  const initialError = calculateAngularDistance(
    OBJECT_MANIPULATION_CONFIG.initialEulerDeg,
    OBJECT_MANIPULATION_CONFIG.targetEulerDeg
  );
  assert(
    `Initial orientation [65, -110, 25] has significant angular error (> 60°): calculated ${initialError.toFixed(1)}°`,
    initialError > 60
  );

  assert(
    'isOrientationAligned returns true when within tolerance (12° <= 15°)',
    isOrientationAligned([0, 12, 0], [0, 0, 0], 15.0)
  );

  assert(
    'isOrientationAligned returns false when outside tolerance (22° > 15°)',
    !isOrientationAligned([0, 22, 0], [0, 0, 0], 15.0)
  );

  // Trajectory Analysis: overshoot and fine-tuning detection
  const trajectoryOvershoot: Array<[number, number, number]> = [
    [0, 50, 0],
    [0, 25, 0],
    [0, 5, 0],   // entered proximity
    [0, -20, 0], // crossed reticle to opposite side (overshot)
    [0, -5, 0],  // returning
  ];
  const overshootAnalysis = analyzeRotationTrajectory(trajectoryOvershoot, [0, 0, 0], 15.0);
  assert(
    'analyzeRotationTrajectory detects overshooting past target',
    overshootAnalysis.hasOvershot === true && overshootAnalysis.principles.includes('spatial_overshot')
  );

  const trajectoryFineTuned: Array<[number, number, number]> = [
    [0, 12, 0],
    [0, 8, 0],
    [0, 3, 0],
  ];
  const fineTunedAnalysis = analyzeRotationTrajectory(trajectoryFineTuned, [0, 0, 0], 15.0);
  assert(
    'analyzeRotationTrajectory detects fine-tuning within proximity cone',
    fineTunedAnalysis.isFineTuning === true && fineTunedAnalysis.principles.includes('spatial_finetuning')
  );

  // ----------------------------------------------------
  // SECTION 2: Declarative Config & ExperienceResult Contract
  // ----------------------------------------------------
  console.log('\n2. Testing Declarative Config & ExperienceResult Contract...');

  assert(
    'OBJECT_MANIPULATION_EXPERIENCE has experienceType OBJECT_MANIPULATION',
    OBJECT_MANIPULATION_EXPERIENCE.experienceType === 'OBJECT_MANIPULATION'
  );

  assert(
    'OBJECT_MANIPULATION_EXPERIENCE spatial config target is [0, 0, 0] with tolerance 15°',
    OBJECT_MANIPULATION_EXPERIENCE.spatial?.toleranceDeg === 15.0 &&
      OBJECT_MANIPULATION_EXPERIENCE.spatial?.targetEulerDeg[0] === 0
  );

  // Mock observation for result creation
  const mockObservation = {
    experienceId: OBJECT_MANIPULATION_EXPERIENCE.id,
    conceptId: OBJECT_MANIPULATION_EXPERIENCE.conceptId,
    conceptName: OBJECT_MANIPULATION_EXPERIENCE.title,
    totalAttempts: 1,
    successfulAttempts: 1,
    hasSucceeded: true,
    totalTrials: 1,
    successfulTrials: 1,
    targetHits: 1,
    totalInteractions: 14,
    predictionAccuracy: 1.0,
    hintsRequested: 0,
    trials: [],
    angleHistory: [],
    velocityHistory: [],
    errorHistory: [],
    patternSummary: 'Testing spatial alignment',
    detectedPrinciple: 'spatial_aligned' as const,
    principlesIdentified: ['spatial_aligned'],
  };

  const successResult = createSpatialExperienceResult(
    OBJECT_MANIPULATION_EXPERIENCE,
    mockObservation,
    6.5, // final error within 15°
    45   // seconds
  );

  assert('createSpatialExperienceResult sets completed = true when error <= 15°', successResult.completed === true);
  assert('createSpatialExperienceResult awards score >= 100 on successful alignment', (successResult.score ?? 0) >= 100);
  assert('createSpatialExperienceResult formats summaryFeedback with precision', (successResult.summaryFeedback ?? '').includes('6.5°'));

  const failureResult = createSpatialExperienceResult(
    OBJECT_MANIPULATION_EXPERIENCE,
    mockObservation,
    35.0, // outside tolerance
    20
  );
  assert('createSpatialExperienceResult sets completed = false when error > 15°', failureResult.completed === false);

  // ----------------------------------------------------
  // SECTION 3: Spatial Telemetry Emitter
  // ----------------------------------------------------
  console.log('\n3. Testing Spatial Telemetry Flow...');

  const telemetry = new TelemetryEmitter(
    OBJECT_MANIPULATION_EXPERIENCE.id,
    OBJECT_MANIPULATION_EXPERIENCE.conceptId,
    OBJECT_MANIPULATION_EXPERIENCE.title
  );

  telemetry.emit('experience_started', {
    conceptId: OBJECT_MANIPULATION_EXPERIENCE.conceptId,
    experienceType: 'OBJECT_MANIPULATION',
  });

  telemetry.emit('rotation_changed', {
    eulerDeg: [10, -15, 0],
    angularDistanceDeg: 18.0,
    isAligned: false,
  });

  telemetry.emit('target_checked', {
    eulerDeg: [0, 4, 0],
    angularDistanceDeg: 4.0,
    toleranceDeg: 15.0,
    success: true,
  });

  telemetry.emit('task_completed', {
    finalEulerDeg: [0, 4, 0],
    finalErrorDeg: 4.0,
    timeSpentSeconds: 32,
  });

  const events = telemetry.getEvents();
  assert('Telemetry records all 4 spatial lifecycle events', events.length === 4);
  assert('First event is experience_started', events[0].type === 'experience_started');
  assert('Rotation changed event preserves eulerDeg payload', (events[1].payload as any).eulerDeg[0] === 10);
  assert('Task completed event recorded', events[3].type === 'task_completed');

  const synthesized = telemetry.synthesizeObservation();
  assert('synthesizeObservation records total interactions', (synthesized.totalInteractions ?? 0) >= 4);

  // ----------------------------------------------------
  // SECTION 4: Xira Spatial Advisor Feedback
  // ----------------------------------------------------
  console.log('\n4. Testing Xira Spatial Advisor Feedback...');

  // Case A: Coarse Orientation (> 75°)
  const coarseFeedback = defaultXiraExperienceAdvisor.generateSpatialFeedback(synthesized, 85.0, 15.0);
  assert(
    'generateSpatialFeedback on coarse error (>75°) guides sweeping yaw/pitch',
    coarseFeedback.isOptimal === false && coarseFeedback.tone === 'encouraging'
  );

  // Case B: Approaching proximity cone (15° - 30°)
  const approachFeedback = defaultXiraExperienceAdvisor.generateSpatialFeedback(synthesized, 22.0, 15.0);
  assert(
    'generateSpatialFeedback on approaching proximity advises axis isolation micro-adjustments',
    approachFeedback.observation.includes('22.0°') && approachFeedback.tone === 'guiding'
  );

  // Case C: Harmonic Lock (<= 15°)
  const lockedFeedback = defaultXiraExperienceAdvisor.generateSpatialFeedback(synthesized, 7.2, 15.0);
  assert(
    'generateSpatialFeedback on alignment lock (<=15°) celebrates harmonic resonance',
    lockedFeedback.isOptimal === true && lockedFeedback.tone === 'celebrating'
  );

  // ----------------------------------------------------
  // SECTION 5: Learner Model Evidence Pipeline
  // ----------------------------------------------------
  console.log('\n5. Testing Learner Model Integration...');

  const evidencePayload = {
    conceptId: 'spatial_reasoning',
    conceptName: "Scholar's Prism: 3D Spatial Orientation",
    isSuccess: true,
    accuracy: 1.0,
    trialsCount: 8,
    confidence: 'known' as const,
    timeSpentSeconds: 45,
    timestamp: Date.now(),
  };

  const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(evidencePayload);
  assert('LearnerModelAdapter converts spatial evidence into canonical Attempt record', Boolean(attempt && attempt.id));
  assert('LearnerModelAdapter attempt conceptId matches spatial_reasoning', attempt.conceptId === 'spatial_reasoning');
  assert('LearnerModelAdapter returns nextAction recommendation', Boolean(nextAction && nextAction.reason));

  // ----------------------------------------------------
  // SECTION 6: Quest Mapping & Canonical Loop
  // ----------------------------------------------------
  console.log('\n6. Testing Quest Definition Mapping...');

  assert(
    'OBJECT_MANIPULATION_QUEST has conceptId spatial_reasoning',
    OBJECT_MANIPULATION_QUEST.conceptId === 'spatial_reasoning'
  );

  assert(
    'OBJECT_MANIPULATION_QUEST first item has experienceType OBJECT_MANIPULATION',
    OBJECT_MANIPULATION_QUEST.items[0].experienceType === 'OBJECT_MANIPULATION'
  );

  assert(
    'OBJECT_MANIPULATION_QUEST has reflection follow-up item',
    OBJECT_MANIPULATION_QUEST.items[1].type === 'reflection'
  );

  // ----------------------------------------------------
  // Test Summary
  // ----------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('------------------------------------------------------\n');

  if (failedCount > 0) {
    throw new Error(`${failedCount} tests failed.`);
  }
}

// Auto-run if executed directly via Node
if (require.main === module) {
  runObjectExperienceTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
