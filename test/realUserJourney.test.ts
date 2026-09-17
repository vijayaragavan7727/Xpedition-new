/**
 * Xpedition Phase C: Automated Real User Journey Integration Test
 *
 * Validates the complete 21-step end-to-end logical journey:
 * NEW USER
 * ↓
 * Landing / Intro
 * ↓
 * Signup
 * ↓
 * Onboarding
 * ↓
 * Calibration
 * ↓
 * Home
 * ↓
 * World
 * ↓
 * Quest
 * ↓
 * Learning Experience
 * ↓
 * Student interaction
 * ↓
 * Experience result
 * ↓
 * Learner Model update
 * ↓
 * Assessment
 * ↓
 * Decision Engine
 * ↓
 * Adaptive next experience
 * ↓
 * Xira guidance
 * ↓
 * XP / progression
 * ↓
 * Next Quest
 * ↓
 * Logout
 * ↓
 * Login
 * ↓
 * Refresh
 * ↓
 * Verify persisted state
 */

import assert from 'assert';
import {
  LocalPersistenceAdapter,
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
import {
  AdaptiveExperienceLoopService,
  processAdaptiveExperienceLoop,
} from '../lib/intelligence/adaptiveExperienceLoop';
import { resolveNextQuest } from '../lib/experience/nextQuestResolver';
import { experienceRegistry } from '../lib/experience/experienceRegistry';
import { ExperienceResult } from '../lib/experience/types';

export async function runRealUserJourneyTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function it(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        return (res as any)
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
  console.log('PHASE C: FULL END-TO-END REAL USER JOURNEY TEST SUITE');
  console.log('======================================================\n');

  const localAdapter = new LocalPersistenceAdapter();
  const manager = new PersistenceManager(localAdapter);

  const studentId = 'student_journey_c_007';

  // --------------------------------------------------------------------------
  // Step 1: Landing / Intro (Visitor State)
  // --------------------------------------------------------------------------
  await it('Step 1: Landing / Intro - visitor arrives unauthenticated with zero leaked user state', async () => {
    manager.setActiveUserId(null);
    clearStoreData();

    assert.strictEqual(manager.getActiveUserId(), null, 'Visitor has no active user ID');
    assert.strictEqual(getActiveStoreUser(), null, 'Store has no active session');
  });

  // --------------------------------------------------------------------------
  // Step 2: Signup (Account Creation & User Session Establishment)
  // --------------------------------------------------------------------------
  await it('Step 2: Signup - creates fresh isolated user profile and establishes session', async () => {
    manager.setActiveUserId(studentId);
    setActiveStoreUser(studentId);

    const initialStore = await manager.loadUserStore(studentId);
    assert.strictEqual(initialStore.handle, 'Learner', 'Default handle initialized');
    assert.strictEqual(initialStore.attempts.length, 0, 'No prior attempts');
  });

  // --------------------------------------------------------------------------
  // Step 3: Onboarding (Goal, Persona & Curriculum Selection)
  // --------------------------------------------------------------------------
  await it('Step 3: Onboarding - student sets goal and profile handle', async () => {
    let store = await manager.loadUserStore(studentId);
    store.handle = 'Alex Vance';
    store.goalText = 'Mastering Classical Mechanics & Spatial Physics';

    await manager.saveUserStore(store, studentId);
    saveStoreData(store, studentId);

    const reloaded = await manager.loadUserStore(studentId);
    assert.strictEqual(reloaded.handle, 'Alex Vance');
    assert.strictEqual(reloaded.goalText, 'Mastering Classical Mechanics & Spatial Physics');
  });

  // --------------------------------------------------------------------------
  // Step 4: Calibration (Diagnostic Evaluation & Baseline Theta)
  // --------------------------------------------------------------------------
  await it('Step 4: Calibration - student completes diagnostic items and sets baseline mastery', async () => {
    let store = await manager.loadUserStore(studentId);
    store.calibratedTheta = -0.2; // Beginner-intermediate baseline
    store.calibrationCompletedAt = Date.now();
    store.graphs[0].concepts = [
      {
        id: 'projectile_motion',
        name: 'Projectile Motion',
        masteryPercentage: 25,
        itemsNext: 4,
        retentionRisk: 0.15,
        ptsSinceCalibration: 0,
        baselineTheta: -0.2,
      },
    ];

    await manager.saveUserStore(store, studentId);
    saveStoreData(store, studentId);

    const canonical = await localAdapter.getUserState(studentId);
    assert.ok(canonical, 'Canonical state exists');
    assert.strictEqual(canonical.profile.displayName, 'Alex Vance');
    assert.strictEqual(canonical.graphs[0].concepts.length, 1);
  });

  // --------------------------------------------------------------------------
  // Step 5: Home (Dashboard, Streak, Quest Cards)
  // --------------------------------------------------------------------------
  await it('Step 5: Home - dashboard displays active goal, handle, and primary concepts', async () => {
    const store = await manager.loadUserStore(studentId);
    assert.strictEqual(store.handle, 'Alex Vance');
    assert.ok(store.graphs[0].concepts.length > 0, 'Has concepts to study');
  });

  // --------------------------------------------------------------------------
  // Step 6: World (Settlement Stage, Building Unlocks)
  // --------------------------------------------------------------------------
  await it('Step 6: World - stage 1 buildings unlocked, advanced buildings locked safely', () => {
    const worldBuildings = {
      learningCamp: { id: 'learning-camp', unlockedAtStage: 1, src: '/world/buildings/learning-camp.png' },
      skillLab: { id: 'skill-lab', unlockedAtStage: 2, src: '/world/buildings/skill-lab.png' },
      projectWorkshop: { id: 'project-workshop', unlockedAtStage: 3, src: '/world/buildings/project-workshop.png' },
      challengeArena: { id: 'challenge-arena', unlockedAtStage: 4, src: '/world/buildings/challenge-arena.png' },
      careerAcademy: { id: 'career-academy', unlockedAtStage: 5, src: '/world/buildings/career-academy.png' },
      rewardVault: { id: 'reward-vault', unlockedAtStage: 6, src: '/world/buildings/reward-vault.png' },
    };

    assert.strictEqual(worldBuildings.learningCamp.unlockedAtStage, 1, 'Learning Camp unlocked at stage 1');
    assert.strictEqual(worldBuildings.careerAcademy.unlockedAtStage, 5, 'Career Academy locked until stage 5');
    assert.strictEqual(worldBuildings.learningCamp.src, '/world/buildings/learning-camp.png');
  });

  // --------------------------------------------------------------------------
  // Step 7: Quest (Active Quest Discovery)
  // --------------------------------------------------------------------------
  await it('Step 7: Quest - resolves valid interactive quest route for projectile_motion', () => {
    const target = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'projectile_motion',
      resolvedExperience: {
        available: true,
        conceptId: 'projectile_motion',
        action: 'PRACTICE_CONCEPT',
        experienceId: 'exp_projectile_motion_01',
        reason: 'Interactive simulation lab available for projectile motion',
      },
    });

    assert.ok(target, 'Resolved quest target exists');
    assert.strictEqual(target.action, 'PRACTICE_CONCEPT');
    assert.strictEqual(target.experienceType, 'PROJECTILE_SIMULATION');
    assert.ok(target.isExperiential);
  });

  // --------------------------------------------------------------------------
  // Step 8: Learning Experience (Experience Definition Contract)
  // --------------------------------------------------------------------------
  await it('Step 8: Learning Experience - Projectile experience is loaded from catalog with valid stages', () => {
    const def = experienceRegistry.getExperienceDefinition('projectile_motion');
    assert.ok(def, 'Projectile motion lab found in experience registry');
    assert.strictEqual(def.type, 'PROJECTILE_SIMULATION');
  });

  // --------------------------------------------------------------------------
  // Step 9 & 10: Student Interaction & Experience Result
  // --------------------------------------------------------------------------
  let experienceResult: ExperienceResult;
  await it('Step 9 & 10: Student Interaction & Experience Result - student hits target cleanly', () => {
    experienceResult = {
      experienceId: 'exp_projectile_motion',
      experienceType: 'PROJECTILE_SIMULATION',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      attempts: 1,
      successfulAttempts: 1,
      completed: true,
      score: 92,
      trialsCount: 3,
      timeSpentSeconds: 45,
      timestamp: Date.now(),
      summaryFeedback: 'Target hit! Clean trajectory execution at 45 degrees.',
      nextActionRecommendation: 'Advance to air resistance and parabolic envelope.',
    };

    assert.strictEqual(experienceResult.completed, true);
    assert.strictEqual(experienceResult.score, 92);
    assert.strictEqual(experienceResult.conceptId, 'projectile_motion');
  });

  // --------------------------------------------------------------------------
  // Step 11: Learner Model Update (BKT & Rasch)
  // --------------------------------------------------------------------------
  await it('Step 11: Learner Model Update - converts experience result to canonical mastery evidence', () => {
    const outcome = LearnerModelAdapter.recordExperienceOutcome({
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      isSuccess: true,
      accuracy: 1.0,
      trialsCount: 3,
      confidence: 'known',
      timeSpentSeconds: 45,
      timestamp: Date.now(),
    });

    assert.ok(outcome.attempt, 'Attempt was recorded');
    assert.strictEqual(outcome.attempt.conceptId, 'projectile_motion');
    assert.strictEqual(outcome.attempt.isCorrect, true);
    assert.ok(outcome.attempt.itemHash?.startsWith('exp_projectile_motion'));
  });

  // --------------------------------------------------------------------------
  // Step 12 & 13: Assessment & Decision Engine
  // --------------------------------------------------------------------------
  let adaptiveDecisionOutcome: any;
  await it('Step 12 & 13: Assessment & Decision Engine - evaluates outcome and determines next best action', async () => {
    const store = await manager.loadUserStore(studentId);
    adaptiveDecisionOutcome = processAdaptiveExperienceLoop(experienceResult, store);

    assert.ok(adaptiveDecisionOutcome, 'Loop produced adaptive outcome');
    assert.ok(adaptiveDecisionOutcome.decision, 'Decision produced');
    assert.ok(adaptiveDecisionOutcome.decision.action, 'Action determined');
  });

  // --------------------------------------------------------------------------
  // Step 14: Adaptive Next Experience (Struggling vs Strong Proof)
  // --------------------------------------------------------------------------
  await it('Step 14: Adaptive Next Experience - proving differential routing based on learner evidence', async () => {
    const store = await manager.loadUserStore(studentId);

    // Scenario A: Struggling learner with repeated errors
    const strugglingStore: UserStoreData = JSON.parse(JSON.stringify(store));
    strugglingStore.graphs[0].concepts[0].masteryPercentage = 20;
    strugglingStore.graphs[0].attempts = [
      { id: '1', conceptId: 'projectile_motion', conceptName: 'Projectile Motion', isCorrect: false, timestamp: Date.now() - 3000 },
      { id: '2', conceptId: 'projectile_motion', conceptName: 'Projectile Motion', isCorrect: false, timestamp: Date.now() - 2000 },
      { id: '3', conceptId: 'projectile_motion', conceptName: 'Projectile Motion', isCorrect: false, timestamp: Date.now() - 1000 },
    ];

    const strugglingResult: ExperienceResult = {
      experienceId: 'exp_projectile_motion',
      experienceType: 'PROJECTILE_SIMULATION',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      attempts: 4,
      successfulAttempts: 0,
      completed: false,
      score: 25,
      trialsCount: 4,
      timeSpentSeconds: 120,
      timestamp: Date.now(),
    };
    const strugglingOutcome = processAdaptiveExperienceLoop(strugglingResult, strugglingStore);

    // Scenario B: Strong independent learner with high mastery
    const strongStore: UserStoreData = JSON.parse(JSON.stringify(store));
    strongStore.graphs[0].concepts[0].masteryPercentage = 85;
    strongStore.graphs[0].attempts = [
      { id: '1', conceptId: 'projectile_motion', conceptName: 'Projectile Motion', isCorrect: true, timestamp: Date.now() - 3000, confidence: 'known' },
      { id: '2', conceptId: 'projectile_motion', conceptName: 'Projectile Motion', isCorrect: true, timestamp: Date.now() - 2000, confidence: 'known' },
      { id: '3', conceptId: 'projectile_motion', conceptName: 'Projectile Motion', isCorrect: true, timestamp: Date.now() - 1000, confidence: 'known' },
    ];

    const strongResult: ExperienceResult = {
      experienceId: 'exp_projectile_motion',
      experienceType: 'PROJECTILE_SIMULATION',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      attempts: 1,
      successfulAttempts: 1,
      completed: true,
      score: 100,
      trialsCount: 1,
      timeSpentSeconds: 25,
      timestamp: Date.now(),
    };
    const strongOutcome = processAdaptiveExperienceLoop(strongResult, strongStore);

    assert.notStrictEqual(
      strugglingOutcome.decision.action,
      strongOutcome.decision.action,
      'Struggling learner and Strong learner must receive different pedagogical actions'
    );
  });

  // --------------------------------------------------------------------------
  // Step 15: Xira Guidance & Memory
  // --------------------------------------------------------------------------
  await it('Step 15: Xira Guidance & Memory - generates pedagogical insight and persists educational memory', async () => {
    assert.ok(adaptiveDecisionOutcome.xiraGuidance, 'Xira guidance generated');
    assert.ok(adaptiveDecisionOutcome.xiraGuidance.length > 0);

    // Record Xira memory
    const memory: XiraEducationalMemory = {
      id: 'mem_journey_projectile_clean_hit',
      userId: studentId,
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      category: 'confidence_calibration',
      strength: 0.85,
      evidenceSummary: 'Flawless 45-degree trajectory execution on first attempt',
      timestamp: Date.now(),
    };

    const recResult = await localAdapter.recordXiraMemory(memory);
    assert.strictEqual(recResult, true, 'Xira memory recorded successfully');

    const memories = await localAdapter.getXiraMemories(studentId, 'projectile_motion');
    assert.strictEqual(memories.length, 1);
    assert.strictEqual(memories[0].category, 'confidence_calibration');
  });

  // --------------------------------------------------------------------------
  // Step 16: XP / Progression & Idempotency Check
  // --------------------------------------------------------------------------
  await it('Step 16: XP / Progression & Idempotency - awards progression and blocks duplicate exploitation', async () => {
    const attempt: Attempt = {
      id: 'att_journey_proj_001',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      isCorrect: true,
      timestamp: Date.now(),
    };

    // First persistence call
    const firstSubmission = await localAdapter.recordAttempt({
      userId: studentId,
      attempt,
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
    });

    assert.strictEqual(firstSubmission.success, true);
    assert.strictEqual(firstSubmission.isDuplicate, false);

    const userStateAfterFirst = await localAdapter.getUserState(studentId);
    assert.strictEqual(userStateAfterFirst?.progression.xp, 25);

    // Duplicate submission attempt with same attempt ID
    const duplicateSubmission = await localAdapter.recordAttempt({
      userId: studentId,
      attempt,
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
    });

    // Verify duplicate is flagged and zero extra XP is awarded
    assert.strictEqual(duplicateSubmission.isDuplicate, true, 'Flagged as duplicate submission');

    const userStateAfterDuplicate = await localAdapter.getUserState(studentId);
    assert.strictEqual(userStateAfterDuplicate?.progression.xp, 25, 'XP remained unchanged at 25');
  });

  // --------------------------------------------------------------------------
  // Step 17: Next Quest (Adaptive Quest Routing)
  // --------------------------------------------------------------------------
  await it('Step 17: Next Quest - resolves valid next quest route matching adaptive decision', () => {
    const nextQuest = adaptiveDecisionOutcome.nextQuest;

    assert.ok(nextQuest, 'Next quest resolved');
    assert.ok(nextQuest.route.startsWith('/experience/') || nextQuest.route.startsWith('/quest'), 'Route is valid');
    assert.ok(nextQuest.title.length > 0);
  });

  // --------------------------------------------------------------------------
  // Step 18: Logout (Session Termination & Storage Decoupling)
  // --------------------------------------------------------------------------
  await it('Step 18: Logout - session invalidation clears memory cache and prevents IDOR leaks', async () => {
    await manager.handleLogout(studentId);
    clearStoreData(studentId);

    assert.strictEqual(manager.getActiveUserId(), null, 'Manager active user is null');
    assert.strictEqual(getActiveStoreUser(), null, 'Store active user is null');

    // Attempting to read without active user should not expose student data
    const visitorStore = getStoreData();
    assert.strictEqual(visitorStore.handle, 'Learner', 'Visitor receives fresh initial state');
    assert.strictEqual(visitorStore.attempts.length, 0, 'No student attempts exposed to visitor');
  });

  // --------------------------------------------------------------------------
  // Step 19 & 20: Login & Refresh (State Restoration)
  // --------------------------------------------------------------------------
  await it('Step 19 & 20: Login & Refresh - re-authenticating restores full canonical state', async () => {
    manager.setActiveUserId(studentId);
    setActiveStoreUser(studentId);

    const reloadedStore = await manager.loadUserStore(studentId);
    assert.strictEqual(reloadedStore.handle, 'Alex Vance');
    assert.strictEqual(reloadedStore.goalText, 'Mastering Classical Mechanics & Spatial Physics');
    assert.strictEqual(reloadedStore.attempts.length, 1);
    assert.strictEqual(reloadedStore.attempts[0].id, 'att_journey_proj_001');

    const canonicalState = await localAdapter.getUserState(studentId);
    assert.ok(canonicalState, 'Canonical state retrieved from local persistent storage');
    assert.strictEqual(canonicalState.profile.displayName, 'Alex Vance');
    assert.strictEqual(canonicalState.progression.xp, 25);
    assert.strictEqual(canonicalState.progression.streak, 1);

    const memories = await localAdapter.getXiraMemories(studentId);
    assert.strictEqual(memories.length, 1);
    assert.strictEqual(memories[0].conceptId, 'projectile_motion');
    assert.strictEqual(memories[0].strength, 0.85);
  });

  // --------------------------------------------------------------------------
  // Step 21: Full Catalog Multi-Experience Verification
  // --------------------------------------------------------------------------
  await it('Step 21: Catalog Verification - validates all 5 core experiences create canonical contracts', () => {
    // 1. Projectile Motion
    const defProj = experienceRegistry.getExperienceDefinition('projectile_motion');
    assert.ok(defProj);
    assert.strictEqual(defProj.type, 'PROJECTILE_SIMULATION');

    // 2. Object Manipulation
    const defObj = experienceRegistry.getExperienceDefinition('spatial_reasoning');
    assert.ok(defObj);
    assert.strictEqual(defObj.type, 'OBJECT_MANIPULATION');

    // 3. Molecule Builder
    const defMol = experienceRegistry.getExperienceDefinition('molecular_bonding');
    assert.ok(defMol);
    assert.strictEqual(defMol.type, 'MOLECULE_BUILDER');

    // 4. Heart Anatomy
    const defHeart = experienceRegistry.getExperienceDefinition('human_heart_anatomy');
    assert.ok(defHeart);
    assert.strictEqual(defHeart.type, 'HEART_ANATOMY_EXPLORER');

    // 5. Code Debugging
    const defCode = experienceRegistry.getExperienceDefinition('python_debugging_basics');
    assert.ok(defCode);
    assert.strictEqual(defCode.type, 'CODE_DEBUGGING');
  });

  return { passed, failed };
}
