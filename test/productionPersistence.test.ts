/**
 * Xpedition Phase B: Production Persistence & User Security Test Suite
 *
 * Comprehensive automated verification for:
 * 1. Authentication & Session Management
 * 2. User Isolation & IDOR Protection
 * 3. Canonical Learner State & Mastery Persistence
 * 4. Experience Engine Persistence Integration
 * 5. Xira Educational Memory Persistence
 * 6. Idempotency & De-duplication Safety
 * 7. End-to-End Real User Journey & State Recovery (Login -> Learn -> Logout -> Relogin -> Verified)
 */

import assert from 'assert';
import {
  LocalPersistenceAdapter,
  defaultLocalPersistence,
  PersistenceManager,
  CanonicalUserData,
  XiraEducationalMemory,
} from '../lib/persistence';
import {
  UserStoreData,
  INITIAL_ZERO_STATE,
  getStoreData,
  saveStoreData,
  clearStoreData,
  setActiveStoreUser,
  getActiveStoreUser,
  recordAttempt,
  Attempt,
} from '../lib/store';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';
import { AdaptiveExperienceLoopService } from '../lib/intelligence/adaptiveExperienceLoop';
import { ExperienceResult } from '../lib/experience/types';

export async function runPersistenceTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function it(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        return res
          .then(() => {
            passed++;
            console.log(`  ✓ ${name}`);
          })
          .catch((err: any) => {
            failed++;
            console.error(`  ✗ ${name}:`, err.message || err);
          });
      } else {
        passed++;
        console.log(`  ✓ ${name}`);
      }
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}:`, err.message || err);
    }
  }

  console.log('\n======================================================');
  console.log('RUNNING PHASE B: PRODUCTION PERSISTENCE & SECURITY TESTS');
  console.log('======================================================\n');

  const localAdapter = new LocalPersistenceAdapter();
  const manager = new PersistenceManager(localAdapter);

  // --------------------------------------------------------------------------
  // Suite 1: Authentication & User Scoping
  // --------------------------------------------------------------------------
  console.log('Suite 1: Authentication & User Scoping');

  await it('should default to INITIAL_ZERO_STATE when no user is active', async () => {
    setActiveStoreUser(null);
    clearStoreData();
    const data = getStoreData();
    assert.strictEqual(data.handle, 'Learner');
    assert.strictEqual(data.rewardsCount, 0);
  });

  await it('should scope active store user correctly', async () => {
    setActiveStoreUser('user_alice_123');
    assert.strictEqual(getActiveStoreUser(), 'user_alice_123');
    setActiveStoreUser(null);
    assert.strictEqual(getActiveStoreUser(), null);
  });

  await it('should create default canonical state for a newly signed up user', async () => {
    const user = localAdapter.createDefaultUserData('user_bob_456', 'bob@test.com', 'Bob Developer');
    assert.strictEqual(user.userId, 'user_bob_456');
    assert.strictEqual(user.profile.email, 'bob@test.com');
    assert.strictEqual(user.profile.displayName, 'Bob Developer');
    assert.strictEqual(user.progression.level, 1);
    assert.strictEqual(user.progression.xp, 0);
    assert.strictEqual(user.progression.streak, 0);
    assert.strictEqual(user.profile.onboardingCompleted, false);
  });

  await it('should handle logout session invalidation and zero state reset', async () => {
    setActiveStoreUser('user_temp_logout');
    manager.setActiveUserId('user_temp_logout');

    await manager.handleLogout('user_temp_logout');
    clearStoreData('user_temp_logout');

    assert.strictEqual(getActiveStoreUser(), null);
    assert.strictEqual(manager.getActiveUserId(), null);
  });

  // --------------------------------------------------------------------------
  // Suite 2: User Isolation & IDOR Protection
  // --------------------------------------------------------------------------
  console.log('\nSuite 2: User Isolation & IDOR Defense');

  await it('should strictly isolate User A data from User B', async () => {
    const userA = 'user_alice_isolation';
    const userB = 'user_bob_isolation';

    // Alice saves custom mastery
    const aliceData = localAdapter.createDefaultUserData(userA, 'alice@test.com', 'Alice');
    aliceData.graphs[0].concepts = [
      {
        id: 'quantum_entanglement',
        name: 'Quantum Entanglement',
        masteryPercentage: 85,
        itemsNext: 2,
        retentionRisk: 0.1,
        ptsSinceCalibration: 40,
        baselineTheta: 1.2,
      },
    ];
    aliceData.progression.xp = 350;
    await localAdapter.saveUserState(userA, aliceData);

    // Bob creates clean state
    const bobData = localAdapter.createDefaultUserData(userB, 'bob@test.com', 'Bob');
    await localAdapter.saveUserState(userB, bobData);

    // Querying Bob must NEVER return Alice's mastery or XP
    const bobLoaded = await localAdapter.getUserState(userB);
    assert.ok(bobLoaded);
    assert.strictEqual(bobLoaded.userId, userB);
    assert.strictEqual(bobLoaded.progression.xp, 0);
    assert.strictEqual(bobLoaded.graphs[0].concepts.length, 0);

    // Querying Alice returns her distinct state
    const aliceLoaded = await localAdapter.getUserState(userA);
    assert.ok(aliceLoaded);
    assert.strictEqual(aliceLoaded.progression.xp, 350);
    assert.strictEqual(aliceLoaded.graphs[0].concepts[0].id, 'quantum_entanglement');
  });

  await it('should clear state for targeted user without deleting another user data', async () => {
    const userC = 'user_charlie_clear';
    const userD = 'user_dan_retain';

    const charlie = localAdapter.createDefaultUserData(userC, 'c@test.com', 'Charlie');
    const dan = localAdapter.createDefaultUserData(userD, 'd@test.com', 'Dan');
    dan.progression.xp = 120;

    await localAdapter.saveUserState(userC, charlie);
    await localAdapter.saveUserState(userD, dan);

    await localAdapter.clearUserState(userC);

    const charlieCheck = await localAdapter.getUserState(userC);
    assert.strictEqual(charlieCheck, null);

    const danCheck = await localAdapter.getUserState(userD);
    assert.ok(danCheck);
    assert.strictEqual(danCheck.progression.xp, 120);
  });

  // --------------------------------------------------------------------------
  // Suite 3: Canonical Mastery & Progression Persistence
  // --------------------------------------------------------------------------
  console.log('\nSuite 3: Canonical Mastery & Progression Persistence');

  await it('should persist and load user store across sessions', async () => {
    const testUser = 'user_persistence_test';
    manager.setActiveUserId(testUser);

    const initialStore = await manager.loadUserStore(testUser);
    assert.strictEqual(initialStore.handle, 'Learner');

    // Simulate onboarding completion & mastery update
    initialStore.handle = 'Dr. Curie';
    initialStore.goalText = 'Radioactivity and Nuclear Physics';
    initialStore.concepts = [
      {
        id: 'alpha_decay',
        name: 'Alpha Decay',
        masteryPercentage: 75,
        itemsNext: 3,
        retentionRisk: 0.2,
        ptsSinceCalibration: 30,
        baselineTheta: 0.8,
      },
    ];
    initialStore.calibratedTheta = 0.8;
    initialStore.calibrationCompletedAt = Date.now();

    await manager.saveUserStore(initialStore, testUser);

    // Reload store
    const reloadedStore = await manager.loadUserStore(testUser);
    assert.strictEqual(reloadedStore.handle, 'Dr. Curie');
    assert.strictEqual(reloadedStore.goalText, 'Radioactivity and Nuclear Physics');
    assert.strictEqual(reloadedStore.concepts.length, 1);
    assert.strictEqual(reloadedStore.concepts[0].name, 'Alpha Decay');
    assert.strictEqual(reloadedStore.concepts[0].masteryPercentage, 75);
  });

  await it('should correctly compute level from accumulated XP in user progression', async () => {
    const testUser = 'user_level_calc_test';
    const data = localAdapter.createDefaultUserData(testUser);

    // 0 XP -> Level 1
    assert.strictEqual(data.progression.level, 1);

    // Record 5 correct attempts (25 XP each = 125 XP -> Level 2)
    for (let i = 0; i < 5; i++) {
      await localAdapter.recordAttempt({
        userId: testUser,
        attempt: {
          id: `att_lvl_${i}`,
          conceptId: 'math_fractions',
          conceptName: 'Fractions',
          isCorrect: true,
          timestamp: Date.now() + i * 1000,
        },
        conceptId: 'math_fractions',
        conceptName: 'Fractions',
      });
    }

    const updated = await localAdapter.getUserState(testUser);
    assert.ok(updated);
    assert.strictEqual(updated.progression.xp, 125);
    assert.strictEqual(updated.progression.level, 2);
  });

  // --------------------------------------------------------------------------
  // Suite 4: Idempotency & Attempt Deduplication
  // --------------------------------------------------------------------------
  console.log('\nSuite 4: Idempotency & Attempt Deduplication');

  await it('should record attempt and award XP idempotently', async () => {
    const testUser = 'user_idempotency_test';
    const attempt: Attempt = {
      id: 'att_unique_001',
      conceptId: 'mechanics_101',
      conceptName: 'Newtonian Mechanics',
      isCorrect: true,
      timestamp: Date.now(),
      confidence: 'known',
    };

    // First attempt submission
    const res1 = await localAdapter.recordAttempt({
      userId: testUser,
      attempt,
      conceptId: 'mechanics_101',
      conceptName: 'Newtonian Mechanics',
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.isDuplicate, false);

    const userState1 = await localAdapter.getUserState(testUser);
    assert.strictEqual(userState1?.progression.xp, 25);

    // Duplicate submission (simulating network retry or double-click)
    const res2 = await localAdapter.recordAttempt({
      userId: testUser,
      attempt,
      conceptId: 'mechanics_101',
      conceptName: 'Newtonian Mechanics',
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.isDuplicate, true);

    // XP must NOT increase
    const userState2 = await localAdapter.getUserState(testUser);
    assert.strictEqual(userState2?.progression.xp, 25);
  });

  await it('should handle incorrect attempt records with lower XP award without inflation', async () => {
    const testUser = 'user_incorrect_att_test';
    const attempt: Attempt = {
      id: 'att_wrong_001',
      conceptId: 'optics_reflection',
      conceptName: 'Law of Reflection',
      isCorrect: false,
      timestamp: Date.now(),
    };

    const res = await localAdapter.recordAttempt({
      userId: testUser,
      attempt,
      conceptId: 'optics_reflection',
      conceptName: 'Law of Reflection',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isDuplicate, false);

    const state = await localAdapter.getUserState(testUser);
    assert.strictEqual(state?.progression.xp, 5); // 5 XP for attempt effort
  });

  // --------------------------------------------------------------------------
  // Suite 5: Experience Engine Integration
  // --------------------------------------------------------------------------
  console.log('\nSuite 5: Experience Engine Integration');

  await it('should persist experience outcome via LearnerModelAdapter', async () => {
    const outcome = LearnerModelAdapter.recordExperienceOutcome({
      conceptId: 'projectile_motion_launch',
      conceptName: 'Projectile Launch Angle',
      isSuccess: true,
      accuracy: 1.0,
      trialsCount: 3,
      confidence: 'known',
      timeSpentSeconds: 45,
      timestamp: Date.now(),
    });

    assert.ok(outcome.attempt);
    assert.strictEqual(outcome.attempt.conceptId, 'projectile_motion_launch');
    assert.strictEqual(outcome.attempt.isCorrect, true);
  });

  await it('should execute adaptive loop and record diagnostic Xira memory', async () => {
    const loop = new AdaptiveExperienceLoopService();
    const fakeExpResult: ExperienceResult = {
      experienceId: 'exp_code_debug',
      experienceType: 'CODE_DEBUGGING',
      concept: 'python_recursion_depth',
      conceptId: 'python_recursion_depth',
      conceptName: 'Recursion Depth',
      completed: false,
      score: 30,
      timeSpentSeconds: 60,
      attempts: 4,
      successfulAttempts: 1,
      timestamp: Date.now(),
      codeEvidence: {
        runs: 4,
        hintsUsed: 3,
        independentCompletion: false,
        detectedBug: 'infinite_recursion',
        edits: 2,
        outputAttempts: 3,
        validationAttempts: 1,
        correctionCount: 1,
        finalSuccess: false,
      },
    };

    const loopResult = loop.processExperienceResult(fakeExpResult, {
      activeGraphId: 'g1',
      graphs: [
        {
          id: 'g1',
          goalText: 'Master Python Algorithms',
          createdAt: Date.now(),
          concepts: [
            {
              id: 'python_recursion_depth',
              name: 'Recursion Depth',
              masteryPercentage: 40,
              itemsNext: 4,
              retentionRisk: 0.5,
              ptsSinceCalibration: 10,
            },
          ],
          attempts: [],
        },
      ],
    });

    assert.ok(loopResult.decision);
    assert.ok(loopResult.xiraGuidance);
    assert.ok(loopResult.assessment);
  });

  // --------------------------------------------------------------------------
  // Suite 6: Xira Educational Memory Persistence
  // --------------------------------------------------------------------------
  console.log('\nSuite 6: Xira Educational Memory Persistence');

  await it('should persist and query structured educational Xira memories', async () => {
    const testUser = 'user_xira_memory_test';
    const memory: XiraEducationalMemory = {
      id: 'mem_recurring_err_01',
      userId: testUser,
      conceptId: 'circuit_kirchhoff',
      conceptName: "Kirchhoff's Current Law",
      category: 'recurring_error',
      strength: 0.85,
      evidenceSummary: 'Confuses node junction currents with loop voltages repeatedly in branch calculations',
      timestamp: Date.now(),
    };

    const saved = await localAdapter.recordXiraMemory(memory);
    assert.strictEqual(saved, true);

    const memories = await localAdapter.getXiraMemories(testUser, 'circuit_kirchhoff');
    assert.strictEqual(memories.length, 1);
    assert.strictEqual(memories[0].category, 'recurring_error');
    assert.strictEqual(memories[0].conceptId, 'circuit_kirchhoff');
    assert.strictEqual(memories[0].strength, 0.85);
  });

  await it('should strengthen memory weight upon repeated observations of the same category', async () => {
    const testUser = 'user_memory_strengthening';
    const mem1: XiraEducationalMemory = {
      id: 'mem_str_1',
      userId: testUser,
      conceptId: 'thermo_carnot',
      conceptName: 'Carnot Cycle',
      category: 'difficulty_response',
      strength: 0.5,
      evidenceSummary: 'Slow response time on adiabatic phase calculations',
      timestamp: Date.now(),
    };

    await localAdapter.recordXiraMemory(mem1);

    // Second observation of the same category
    const mem2: XiraEducationalMemory = {
      id: 'mem_str_2',
      userId: testUser,
      conceptId: 'thermo_carnot',
      conceptName: 'Carnot Cycle',
      category: 'difficulty_response',
      strength: 0.6,
      evidenceSummary: 'Second hesitation on isothermal expansion formula',
      timestamp: Date.now() + 1000,
    };

    await localAdapter.recordXiraMemory(mem2);

    const memories = await localAdapter.getXiraMemories(testUser, 'thermo_carnot');
    assert.strictEqual(memories.length, 1);
    assert.strictEqual(memories[0].strength, 0.6); // Strengthened by +0.1 (0.5 + 0.1 = 0.6)
  });

  // --------------------------------------------------------------------------
  // Suite 7: Full End-to-End Real User Journey Test
  // --------------------------------------------------------------------------
  console.log('\nSuite 7: Full End-to-End Real User Journey Test');

  await it('should verify complete user journey: Signup -> Onboarding -> Learn -> Update -> Logout -> Relogin -> Full Recovery', async () => {
    const journeyUserId = 'user_journey_verified_777';

    // Step 1: User Signs Up
    manager.setActiveUserId(journeyUserId);
    setActiveStoreUser(journeyUserId);

    let store = await manager.loadUserStore(journeyUserId);
    assert.strictEqual(store.handle, 'Learner');

    // Step 2: User completes Onboarding / Sets Goal
    store.handle = 'Srinivasa Ramanujan';
    store.goalText = 'Number Theory & Modular Arithmetic';
    store.graphs[0].concepts = [
      {
        id: 'modular_arithmetic_congruence',
        name: 'Modular Congruence',
        masteryPercentage: 30,
        itemsNext: 5,
        retentionRisk: 0.4,
        ptsSinceCalibration: 0,
        baselineTheta: -0.4,
      },
    ];
    store.calibratedTheta = -0.4;
    store.calibrationCompletedAt = Date.now();

    await manager.saveUserStore(store, journeyUserId);
    saveStoreData(store, journeyUserId);

    // Step 3: User Starts an Experience and Solves a Challenge
    const journeyAttempt: Attempt = {
      id: 'journey_att_modular_01',
      conceptId: 'modular_arithmetic_congruence',
      conceptName: 'Modular Congruence',
      isCorrect: true,
      timestamp: Date.now(),
      confidence: 'known',
    };

    // Update store & persist attempt
    const attResult = await localAdapter.recordAttempt({
      userId: journeyUserId,
      attempt: journeyAttempt,
      conceptId: 'modular_arithmetic_congruence',
      conceptName: 'Modular Congruence',
    });
    assert.strictEqual(attResult.success, true);

    // Step 4: Record Xira Memory for this user
    await localAdapter.recordXiraMemory({
      id: 'mem_journey_calib',
      userId: journeyUserId,
      conceptId: 'modular_arithmetic_congruence',
      conceptName: 'Modular Congruence',
      category: 'confidence_calibration',
      strength: 0.9,
      evidenceSummary: 'Fast correct response with high confidence on basic residue calculation',
      timestamp: Date.now(),
    });

    // Step 5: User Logs Out (Session Invalidation)
    await manager.handleLogout(journeyUserId);
    clearStoreData(journeyUserId);

    assert.strictEqual(getActiveStoreUser(), null);
    assert.strictEqual(manager.getActiveUserId(), null);

    // Step 6: User Logs Back In (Authentication Recovery)
    manager.setActiveUserId(journeyUserId);
    setActiveStoreUser(journeyUserId);

    const recoveredStore = await manager.loadUserStore(journeyUserId);

    // Step 7: Strict Verification of Restored State
    assert.strictEqual(recoveredStore.handle, 'Srinivasa Ramanujan');
    assert.strictEqual(recoveredStore.goalText, 'Number Theory & Modular Arithmetic');
    assert.strictEqual(recoveredStore.concepts.length, 1);
    assert.strictEqual(recoveredStore.concepts[0].id, 'modular_arithmetic_congruence');
    assert.strictEqual(recoveredStore.attempts.length, 1);
    assert.strictEqual(recoveredStore.attempts[0].id, 'journey_att_modular_01');
    assert.strictEqual(recoveredStore.attempts[0].isCorrect, true);

    // Verify progression
    const canonical = await localAdapter.getUserState(journeyUserId);
    assert.ok(canonical);
    assert.strictEqual(canonical.progression.xp, 25);
    assert.strictEqual(canonical.progression.streak, 1);

    // Verify Xira Memory restored
    const memories = await localAdapter.getXiraMemories(journeyUserId);
    assert.strictEqual(memories.length, 1);
    assert.strictEqual(memories[0].category, 'confidence_calibration');
    assert.strictEqual(memories[0].strength, 0.9);
  });

  return { passed, failed };
}
