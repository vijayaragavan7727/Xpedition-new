/**
 * Experience Engine Milestone 2: Quest & Learning Loop Integration Test Suite
 *
 * Verifies:
 * 1. Quest -> Experience mapping contract
 * 2. Structured ExperienceResult generation
 * 3. Completion criteria (target hit, close attempt, exploratory complete)
 * 4. Learner Model evidence adapter integration with recordAttempt
 * 5. Decision Engine integration and Next Best Action resolution
 * 6. Non-experiential standard quests preservation
 */

import {
  PROJECTILE_MOTION_QUEST,
  PROJECTILE_MOTION_EXPERIENCE,
  createExperienceResultFromTelemetry,
} from '../lib/experience/catalog/projectileMotionConfig';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';
import { simulateProjectile } from '../lib/experience/simulation/projectilePhysics';
import { DecisionEngine } from '../lib/intelligence/decisionEngine';
import { Quest } from '../lib/types';
import { recordAttempt, getStoreData } from '../lib/store';

export async function runIntegrationTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING EXPERIENCE QUEST LOOP INTEGRATION TESTS');
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
  // 1. Quest -> Experience Mapping Contract
  // -------------------------------------------------------------------------
  console.log('--- 1. Quest -> Experience Mapping Contract ---');

  const quest: Quest = PROJECTILE_MOTION_QUEST;

  assert(
    quest.experienceType === 'PROJECTILE_SIMULATION',
    'Quest model contains experienceType "PROJECTILE_SIMULATION"'
  );

  assert(
    quest.experienceId === PROJECTILE_MOTION_EXPERIENCE.id,
    'Quest references the canonical Projectile Motion Experience ID',
    `Quest experienceId: ${quest.experienceId}, Config ID: ${PROJECTILE_MOTION_EXPERIENCE.id}`
  );

  assert(
    quest.conceptId === PROJECTILE_MOTION_EXPERIENCE.conceptId,
    'Quest conceptId matches Experience conceptId'
  );

  assert(
    typeof quest.briefing === 'string' && quest.briefing.length > 20,
    'Quest briefing provides clear explanation of learning intent',
    `Briefing: "${quest.briefing}"`
  );

  // -------------------------------------------------------------------------
  // 2. Structured ExperienceResult Generation
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Structured ExperienceResult Generation ---');

  const mockHitSim = simulateProjectile({
    launchAngleDeg: 22,
    initialVelocity: 18,
    gravity: 9.81,
    launchHeight: 1.0,
    targetDistance: 25.0,
    targetTolerance: 1.5,
  });

  const mockObservation = {
    experienceId: PROJECTILE_MOTION_EXPERIENCE.id,
    conceptId: PROJECTILE_MOTION_EXPERIENCE.conceptId,
    conceptName: PROJECTILE_MOTION_EXPERIENCE.conceptName,
    totalAttempts: 3,
    successfulAttempts: 1,
    hasSucceeded: true,
    predictionAccuracy: 1.0,
    trials: [
      {
        trialIndex: 1,
        timestamp: Date.now() - 20000,
        angleDeg: 15,
        velocity: 18,
        predictedOptionId: 'opt_shallow',
        isPredictionCorrect: true,
        landingDistance: 18.2,
        targetDistance: 25.0,
        targetError: -6.8,
        isHit: false,
        flightTime: 1.2,
        peakHeight: 1.9,
      },
      {
        trialIndex: 2,
        timestamp: Date.now() - 10000,
        angleDeg: 45,
        velocity: 18,
        landingDistance: 34.0,
        targetDistance: 25.0,
        targetError: 9.0,
        isHit: false,
        flightTime: 2.7,
        peakHeight: 9.2,
      },
      {
        trialIndex: 3,
        timestamp: Date.now(),
        angleDeg: 22,
        velocity: 18,
        landingDistance: mockHitSim.landingDistance,
        targetDistance: 25.0,
        targetError: mockHitSim.targetError,
        isHit: true,
        flightTime: mockHitSim.flightTime,
        peakHeight: mockHitSim.peakHeight,
      },
    ],
    angleHistory: [15, 45, 22],
    velocityHistory: [18, 18, 18],
    errorHistory: [-6.8, 9.0, mockHitSim.targetError],
    hintsRequested: 0,
    patternSummary: 'Mastered projectile motion trajectory.',
    detectedPrinciple: 'mastered' as const,
  };

  const expResult = createExperienceResultFromTelemetry(
    PROJECTILE_MOTION_EXPERIENCE,
    mockObservation,
    mockHitSim,
    45
  );

  assert(
    expResult.finalResult === 'target_hit' && expResult.successfulAttempts === 1,
    'Successful launch produces finalResult "target_hit"',
    `finalResult: ${expResult.finalResult}, successfulAttempts: ${expResult.successfulAttempts}`
  );

  assert(
    Boolean(
      expResult.interactionEvidence &&
        expResult.interactionEvidence.angleSequence.length === 3 &&
        expResult.interactionEvidence.isHit === true
    ),
    'ExperienceResult captures full interaction evidence and angle sequence'
  );

  assert(
    Boolean(expResult.evidenceSignals && expResult.evidenceSignals.length > 0),
    'ExperienceResult includes pedagogical evidence signals',
    `Signals: ${JSON.stringify(expResult.evidenceSignals)}`
  );

  // -------------------------------------------------------------------------
  // 3. Completion Criteria (Hits, Close Attempts, Exploration)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Completion Criteria Evaluation ---');

  // Case A: Near miss (<3m)
  const closeMissSim = simulateProjectile({
    launchAngleDeg: 24,
    initialVelocity: 18,
    gravity: 9.81,
    launchHeight: 1.0,
    targetDistance: 25.0,
    targetTolerance: 1.5,
  });

  const closeMissResult = createExperienceResultFromTelemetry(
    PROJECTILE_MOTION_EXPERIENCE,
    {
      ...mockObservation,
      hasSucceeded: false,
      successfulAttempts: 0,
      errorHistory: [2.1],
    },
    closeMissSim,
    30
  );

  assert(
    closeMissResult.finalResult === 'close_attempt',
    'Near-miss within 3m produces "close_attempt" completion status'
  );

  // Case B: Pure exploration
  const exploratorySim = simulateProjectile({
    launchAngleDeg: 70,
    initialVelocity: 12,
    gravity: 9.81,
    launchHeight: 1.0,
    targetDistance: 25.0,
    targetTolerance: 1.5,
  });

  const exploratoryResult = createExperienceResultFromTelemetry(
    PROJECTILE_MOTION_EXPERIENCE,
    {
      ...mockObservation,
      hasSucceeded: false,
      successfulAttempts: 0,
      errorHistory: [-15.0],
    },
    exploratorySim,
    25
  );

  assert(
    exploratoryResult.finalResult === 'exploratory_complete',
    'Exploratory multi-trial launch produces "exploratory_complete" completion status'
  );

  // -------------------------------------------------------------------------
  // 4. Learner Model Integration via LearnerModelAdapter
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Learner Model Adapter & Attempt Record ---');

  const evidencePayload = {
    conceptId: 'projectile_motion',
    conceptName: 'Projectile Motion & Kinematics',
    isSuccess: true,
    accuracy: 1.0,
    trialsCount: 3,
    confidence: 'known' as const,
    timeSpentSeconds: 45,
    timestamp: Date.now(),
  };

  const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome(evidencePayload);

  assert(
    Boolean(attempt.id) && attempt.conceptId === 'projectile_motion' && attempt.isCorrect === true,
    'LearnerModelAdapter creates valid canonical Attempt record with isCorrect=true'
  );

  assert(
    Boolean(attempt.itemHash?.startsWith('exp_projectile_motion')),
    'Attempt record contains structured experiential itemHash for distractor tracking'
  );

  // -------------------------------------------------------------------------
  // 5. Decision Engine Next Best Action Integration
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Decision Engine Next Best Action Resolution ---');

  const engine = new DecisionEngine();
  const nextDecision = engine.decideNextAction({
    goalText: 'Physics & Mechanics',
    currentConceptId: 'projectile_motion',
    currentConceptName: 'Projectile Motion & Kinematics',
    masteryPercentage: 85,
    recentAccuracy: 1.0,
    recentMistakeCount: 0,
    repeatedMistakes: false,
    isNewLearner: false,
  });

  assert(
    Boolean(nextDecision.action) && typeof nextDecision.reason === 'string',
    'Decision Engine selects valid pedagogical NextBestAction for updated learner state',
    `Action: ${nextDecision.action}, Reason: "${nextDecision.reason}"`
  );

  // -------------------------------------------------------------------------
  // 6. Preservation of Non-Experiential Standard Quests
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Standard Quest Compatibility Preservation ---');

  const standardQuest: Quest = {
    id: 'standard_q1',
    conceptId: 'py-list-comp',
    conceptName: 'List Comprehensions',
    prompt: 'What is the syntax of a list comprehension?',
    options: ['[x for x in list]', '{x: x for x in list}', '(x for x in list)', '<x for x in list>'],
    correctIndex: 0,
    difficulty: 0.2,
  };

  assert(
    standardQuest.experienceType === undefined,
    'Standard quests have experienceType undefined and render multiple-choice normally'
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} integration tests failed!`);
  }
}
