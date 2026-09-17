/**
 * Experience Engine & Projectile Motion Physics Test Suite
 *
 * Verifies:
 * 1. Pure deterministic projectile physics calculations
 * 2. 45° maximum range kinematic principle
 * 3. Target hit/miss detection and error calculation
 * 4. Telemetry event generation and observation synthesis
 * 5. Challenge state transitions and prediction evaluation
 * 6. Xira contextual pedagogical feedback generation
 * 7. Learner model evidence adapter contract
 */

import {
  simulateProjectile,
  calculateRequiredAngles,
  calculateMaxRange,
} from '../lib/experience/simulation/projectilePhysics';
import { TelemetryEmitter } from '../lib/experience/telemetry/telemetryEmitter';
import { ChallengeEngine } from '../lib/experience/challenge/challengeEngine';
import { XiraExperienceAdvisor } from '../lib/experience/xira/xiraExperienceAdvisor';
import { PROJECTILE_MOTION_EXPERIENCE } from '../lib/experience/catalog/projectileMotionConfig';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';

export async function runExperienceTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING EXPERIENCE ENGINE AUTOMATED TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. Physics Kinematics Tests
  // -------------------------------------------------------------------------
  console.log('--- 1. Physics Kinematics Calculations ---');

  // Test 1.1: 45 degree angle produces maximum range for flat ground (y0 = 0)
  const sim45 = simulateProjectile({
    launchAngleDeg: 45,
    initialVelocity: 20,
    gravity: 9.81,
    launchHeight: 0,
    targetDistance: 40,
  });

  const sim30 = simulateProjectile({
    launchAngleDeg: 30,
    initialVelocity: 20,
    gravity: 9.81,
    launchHeight: 0,
    targetDistance: 40,
  });

  const sim60 = simulateProjectile({
    launchAngleDeg: 60,
    initialVelocity: 20,
    gravity: 9.81,
    launchHeight: 0,
    targetDistance: 40,
  });

  assert(
    sim45.landingDistance > sim30.landingDistance && sim45.landingDistance > sim60.landingDistance,
    '45° launch angle produces maximum horizontal range on flat ground',
    `45° range=${sim45.landingDistance.toFixed(2)}m, 30° range=${sim30.landingDistance.toFixed(2)}m, 60° range=${sim60.landingDistance.toFixed(2)}m`
  );

  // Test 1.2: Symmetrical angles (30° and 60°) produce equal ranges on flat ground: R = v0^2 * sin(2θ) / g
  const diff3060 = Math.abs(sim30.landingDistance - sim60.landingDistance);
  assert(
    diff3060 < 0.01,
    'Symmetric angles (30° and 60°) produce identical ranges on flat ground',
    `Difference=${diff3060.toFixed(5)}m`
  );

  // Test 1.3: Flight time increases monotonically with launch angle
  assert(
    sim60.flightTime > sim45.flightTime && sim45.flightTime > sim30.flightTime,
    'Flight time increases monotonically as launch angle steepens',
    `30°=${sim30.flightTime.toFixed(2)}s, 45°=${sim45.flightTime.toFixed(2)}s, 60°=${sim60.flightTime.toFixed(2)}s`
  );

  // Test 1.4: Peak height increases with launch angle
  assert(
    sim60.peakHeight > sim45.peakHeight && sim45.peakHeight > sim30.peakHeight,
    'Peak vertical elevation increases as launch angle steepens',
    `30°=${sim30.peakHeight.toFixed(2)}m, 45°=${sim45.peakHeight.toFixed(2)}m, 60°=${sim60.peakHeight.toFixed(2)}m`
  );

  // Test 1.5: Target hit detection within tolerance
  const hitSim = simulateProjectile({
    launchAngleDeg: 22,
    initialVelocity: 18,
    gravity: 9.81,
    launchHeight: 1.0,
    targetDistance: 25.0,
    targetTolerance: 1.5,
  });

  assert(
    hitSim.isHit === true && Math.abs(hitSim.targetError) <= 1.5,
    'Hit detection accurately registers within target tolerance radius',
    `Landing=${hitSim.landingDistance.toFixed(2)}m, Error=${hitSim.targetError.toFixed(2)}m, Hit=${hitSim.isHit}`
  );

  // Test 1.6: Overshoot and undershoot directional error
  const undershootSim = simulateProjectile({
    launchAngleDeg: 12,
    initialVelocity: 15,
    gravity: 9.81,
    launchHeight: 1.0,
    targetDistance: 25.0,
    targetTolerance: 1.5,
  });

  const overshootSim = simulateProjectile({
    launchAngleDeg: 45,
    initialVelocity: 25,
    gravity: 9.81,
    launchHeight: 1.0,
    targetDistance: 25.0,
    targetTolerance: 1.5,
  });

  assert(
    undershootSim.targetError < -1.5 && undershootSim.isHit === false,
    'Undershoot launch records negative error and isHit=false',
    `Error=${undershootSim.targetError.toFixed(2)}m`
  );

  assert(
    overshootSim.targetError > 1.5 && overshootSim.isHit === false,
    'Overshoot launch records positive error and isHit=false',
    `Error=${overshootSim.targetError.toFixed(2)}m`
  );

  // -------------------------------------------------------------------------
  // 2. Telemetry Emitter & Observation Aggregator Tests
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Telemetry & Observation Aggregation ---');

  const telemetry = new TelemetryEmitter('test_exp_01', 'projectile_motion', 'Projectile Kinematics');
  const emittedEvents: any[] = [];
  telemetry.subscribe((evt) => emittedEvents.push(evt));

  telemetry.emit('experience_started', { difficulty: 0.3 });
  telemetry.emit('control_changed', { angle: 25, velocity: 18 });

  const trial1 = telemetry.recordTrial({
    angleDeg: 15,
    velocity: 15,
    landingDistance: 14.5,
    targetDistance: 25.0,
    targetError: -10.5,
    isHit: false,
    flightTime: 1.2,
    peakHeight: 2.1,
  });

  const trial2 = telemetry.recordTrial({
    angleDeg: 25,
    velocity: 18,
    landingDistance: 25.1,
    targetDistance: 25.0,
    targetError: 0.1,
    isHit: true,
    flightTime: 2.0,
    peakHeight: 3.5,
  });

  assert(
    emittedEvents.length >= 4,
    'Telemetry records and emits events to subscribers',
    `Recorded ${emittedEvents.length} events`
  );

  const observation = telemetry.synthesizeObservation();
  assert(
    observation.totalAttempts === 2 &&
      observation.successfulAttempts === 1 &&
      observation.hasSucceeded === true &&
      observation.detectedPrinciple === 'mastered',
    'Telemetry correctly synthesizes structured Xira observation',
    `Total=${observation.totalAttempts}, Hits=${observation.successfulAttempts}, Principle=${observation.detectedPrinciple}`
  );

  // -------------------------------------------------------------------------
  // 3. Challenge Engine Lifecycle Tests
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Challenge Engine Lifecycle & State Machine ---');

  const challenge = new ChallengeEngine(PROJECTILE_MOTION_EXPERIENCE.challenge);
  const initialState = challenge.getState();

  assert(
    initialState.stage === 'PREDICTING',
    'Challenge initializes in PREDICTING stage when prediction challenge is configured'
  );

  const submitResult = challenge.submitPrediction('opt_shallow');
  assert(
    submitResult.stage === 'CONFIGURING' && challenge.getState().isPredictionSubmitted === true,
    'Submitting prediction transitions challenge to CONFIGURING stage'
  );

  challenge.startLaunch();
  assert(
    challenge.getState().stage === 'LAUNCHING',
    'startLaunch transitions challenge to LAUNCHING stage'
  );

  const evalResult = challenge.evaluateOutcome(hitSim);
  assert(
    evalResult.isHit === true && challenge.getState().stage === 'COMPLETED',
    'Hitting target marks challenge as COMPLETED'
  );

  const hint = challenge.requestHint();
  assert(
    typeof hint === 'string' && hint.length > 0,
    'Progressive hints can be requested successfully',
    `Hint: "${hint}"`
  );

  // -------------------------------------------------------------------------
  // 4. Xira Experience Advisor Tests
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Xira Experience Advisor Feedback ---');

  const advisor = new XiraExperienceAdvisor();

  // Test feedback on hit
  const hitFeedback = advisor.generateFeedback(observation, trial2);
  assert(
    hitFeedback.tone === 'celebrating' && hitFeedback.isOptimal === true,
    'Xira generates celebrating feedback when target is struck',
    `Feedback: "${hitFeedback.observation}"`
  );

  // Test feedback on undershoot
  const undershootFeedback = advisor.generateFeedback(
    {
      ...observation,
      trials: [trial1],
    },
    trial1
  );
  assert(
    undershootFeedback.tone === 'guiding' &&
      undershootFeedback.suggestedNextMove.toLowerCase().includes('angle') ||
      undershootFeedback.suggestedNextMove.toLowerCase().includes('velocity'),
    'Xira provides constructive adjustment guidance on undershoot',
    `Suggestion: "${undershootFeedback.suggestedNextMove}"`
  );

  // -------------------------------------------------------------------------
  // 5. Learner Model Evidence Adapter Tests
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Learner Model Evidence Adapter ---');

  const evidence = {
    conceptId: 'projectile_motion',
    conceptName: 'Projectile Kinematics',
    isSuccess: true,
    accuracy: 1.0,
    trialsCount: 3,
    confidence: 'known' as const,
    timeSpentSeconds: 45,
    timestamp: Date.now(),
  };

  const adapterResult = LearnerModelAdapter.recordExperienceOutcome(evidence);
  assert(
    adapterResult.attempt &&
      adapterResult.attempt.conceptId === 'projectile_motion' &&
      adapterResult.attempt.isCorrect === true,
    'LearnerModelAdapter creates valid canonical Attempt record',
    `Attempt ID: ${adapterResult.attempt.id}`
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}
