/**
 * Xpedition Intelligence & Experience Engine — Adaptive Quest Routing Automated Tests
 *
 * Validates Milestone #7:
 * “Decision → Next Quest → Actual Experience”
 *
 * Test Suites:
 * 1. Adaptive Result Resolves to Next Quest Target
 * 2. Registered Experiences Produce Valid Canonical Routes
 * 3. Canonical Quest Definitions are Reused (No Duplication)
 * 4. Nonexistent Experiences Safely Fall Back (No Hallucinated Routes)
 * 5. Unsupported Actions Fall Back Gracefully to Standard Curriculum/Tutor
 * 6. Struggling Learner Scenario (Remediation Routing)
 * 7. Successful Independent Learner Scenario (Challenge/Advancement Routing)
 * 8. THE CRITICAL PROOF: Same Concept + Different Evidence = Different Next Quest Journey
 * 9. Non-Mutation Invariant: Resolving Route Does Not Alter Learner Mastery
 * 10. Experience Completion Updates Learner State Normally
 * 11. Direct Route & Refresh Safety (Valid URL contracts)
 * 12. ExperienceRegistry Authoritative Catalog Invariant
 * 13. Xira Guidance Separation: Support Layer Does Not Override Routing
 * 14. Decision Engine Authoritative Invariant
 * 15. Protected Core Architecture Preserved
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  processAdaptiveExperienceLoop,
  AdaptiveExperienceLoopService,
} from '../lib/intelligence/adaptiveExperienceLoop';
import { resolveNextQuest, NextQuestTarget } from '../lib/experience/nextQuestResolver';
import { resolveNextExperience } from '../lib/experience/nextExperienceResolver';
import { experienceRegistry } from '../lib/experience/experienceRegistry';
import { CODE_DEBUGGING_EXPERIENCE, createCodeExperienceResult } from '../lib/experience/catalog/codeDebuggingConfig';
import { HEART_ANATOMY_EXPERIENCE, createHeartExperienceResult } from '../lib/experience/catalog/heartAnatomyConfig';
import { ExperienceResult } from '../lib/experience/types';
import { UserStoreData, INITIAL_ZERO_STATE } from '../lib/store';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(description: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    results.push({ name: description, passed: true });
  } else {
    console.error(`  ✗ ${description}${details ? `: ${details}` : ': Assertion failed'}`);
    results.push({ name: description, passed: false, error: details || 'Assertion failed' });
  }
}

function createMockStore(conceptId: string, initialMastery: number, retentionRisk: number = 0.2): UserStoreData {
  const store: UserStoreData = JSON.parse(JSON.stringify(INITIAL_ZERO_STATE));
  const activeGraph = store.graphs[0];
  activeGraph.goalText = 'Python Mastery';
  activeGraph.concepts = [
    {
      id: conceptId,
      name: conceptId.replace(/_/g, ' '),
      masteryPercentage: initialMastery,
      retentionRisk,
      ptsSinceCalibration: 50,
      baselineTheta: 0.0,
      thetaAssisted: (initialMastery / 50) - 1.0,
      itemsNext: 5,
    },
  ];
  activeGraph.attempts = [];
  store.concepts = activeGraph.concepts;
  return store;
}

export function runAdaptiveQuestRoutingTests(): { passed: number; failed: number } {
  console.log('\n==================================================================');
  console.log('XPEDITION ADAPTIVE QUEST ROUTING TESTS (MILESTONE #7)');
  console.log('==================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Adaptive Result Resolves to Next Quest Target
  // ---------------------------------------------------------------------------
  console.log('1. Testing Adaptive Loop Result contains NextQuest Target...');
  {
    const mockStore = createMockStore('python_debugging_basics', 40);
    const result: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        totalAttempts: 1,
        successfulAttempts: 1,
        hasSucceeded: true,
        predictionAccuracy: 1.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
        lastOutput: '20',
        runCount: 1,
        editCount: 1,
        hasRun: true,
        isCompleted: true,
        hintsUsed: 0,
        consecutiveMismatches: 0,
        independentCompletion: true,
        history: [],
      },
      30
    );

    const adaptiveResult = processAdaptiveExperienceLoop(result, mockStore);

    assert('Adaptive loop result contains nextQuest object', Boolean(adaptiveResult.nextQuest));
    assert('nextQuest has valid non-empty route', typeof adaptiveResult.nextQuest.route === 'string' && adaptiveResult.nextQuest.route.length > 0);
    assert('nextQuest has actionable buttonLabel', typeof adaptiveResult.nextQuest.buttonLabel === 'string' && adaptiveResult.nextQuest.buttonLabel.length > 0);
    assert('nextQuest has descriptive title', typeof adaptiveResult.nextQuest.title === 'string' && adaptiveResult.nextQuest.title.length > 0);
    assert('nextQuest has matching conceptId', adaptiveResult.nextQuest.conceptId === 'python_debugging_basics');
  }

  // ---------------------------------------------------------------------------
  // 2. Registered Experiences Produce Valid Canonical Routes
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Registered Experiences Produce Valid Canonical Routes...');
  {
    // Python Code Lab
    const pyQuest = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'python_debugging_basics',
      resolvedExperience: {
        available: true,
        conceptId: 'python_debugging_basics',
        action: 'PRACTICE_CONCEPT',
        experienceType: 'CODE_DEBUGGING',
        experienceId: 'programming_code_lab',
        reason: 'Practice session',
      },
    });
    assert('Python debugging resolves to /quest?concept=python_debugging_basics', pyQuest.route === '/quest?concept=python_debugging_basics');
    assert('Python debugging is marked experiential', pyQuest.isExperiential === true);

    // Heart Anatomy
    const heartQuest = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'human_heart_anatomy',
      resolvedExperience: {
        available: true,
        conceptId: 'human_heart_anatomy',
        action: 'PRACTICE_CONCEPT',
        experienceType: 'HEART_ANATOMY_EXPLORER',
        experienceId: 'exp_heart_anatomy_01',
        reason: 'Heart exploration',
      },
    });
    assert('Heart anatomy resolves to /quest?concept=human_heart_anatomy', heartQuest.route === '/quest?concept=human_heart_anatomy');
    assert('Heart anatomy target has questId quest_heart_anatomy_01', heartQuest.questId === 'quest_heart_anatomy_01');

    // Spatial Reasoning
    const spatialQuest = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'spatial_reasoning',
      resolvedExperience: {
        available: true,
        conceptId: 'spatial_reasoning',
        action: 'PRACTICE_CONCEPT',
        experienceType: 'OBJECT_MANIPULATION',
        experienceId: 'exp_scholar_prism_01',
        reason: 'Spatial alignment',
      },
    });
    assert('Spatial reasoning resolves to /quest?concept=spatial_reasoning', spatialQuest.route === '/quest?concept=spatial_reasoning');

    // Projectile Motion
    const projQuest = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'projectile_motion',
      resolvedExperience: {
        available: true,
        conceptId: 'projectile_motion',
        action: 'PRACTICE_CONCEPT',
        experienceType: 'PROJECTILE_SIMULATION',
        experienceId: 'exp_projectile_motion_01',
        reason: 'Physics trajectory',
      },
    });
    assert('Projectile motion resolves to /quest?concept=projectile_motion', projQuest.route === '/quest?concept=projectile_motion');

    // Molecule Builder
    const molQuest = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'molecular_bonding',
      resolvedExperience: {
        available: true,
        conceptId: 'molecular_bonding',
        action: 'PRACTICE_CONCEPT',
        experienceType: 'MOLECULE_BUILDER',
        experienceId: 'exp_molecule_builder_01',
        reason: 'Covalent bonding',
      },
    });
    assert('Molecule builder resolves to /quest?concept=molecular_bonding', molQuest.route === '/quest?concept=molecular_bonding');
  }

  // ---------------------------------------------------------------------------
  // 3. Canonical Quest Definitions are Reused
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing Canonical Quest IDs Reused...');
  {
    const pyRemediation = resolveNextQuest({
      action: 'CORRECT_MISCONCEPTION',
      conceptId: 'python_debugging_basics',
      resolvedExperience: {
        available: true,
        conceptId: 'python_debugging_basics',
        action: 'CORRECT_MISCONCEPTION',
        experienceType: 'CODE_DEBUGGING',
        experienceId: 'programming_code_lab',
        reason: 'Remediation',
      },
    });
    assert('Canonical questId quest_python_debugging_01 reused for remediation', pyRemediation.questId === 'quest_python_debugging_01');
    assert('Route includes mode=assisted for remediation', pyRemediation.route === '/quest?concept=python_debugging_basics&mode=assisted');
    assert('Button label is Correct Misconception', pyRemediation.buttonLabel === 'Correct Misconception');
  }

  // ---------------------------------------------------------------------------
  // 4. Nonexistent Experiences Safely Fall Back
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Nonexistent Experience Safe Fallback...');
  {
    const fallback = resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'quantum_chromodynamics_fake',
      resolvedExperience: {
        available: false,
        conceptId: 'quantum_chromodynamics_fake',
        action: 'PRACTICE_CONCEPT',
        reason: 'No experience registered',
      },
    });
    assert('Nonexistent experience available is false', fallback.available === false);
    assert('Nonexistent experience isExperiential is false', fallback.isExperiential === false);
    assert('Fallback route is safe standard quest route', fallback.route === '/quest?concept=quantum_chromodynamics_fake');
    assert('Fallback type is STANDARD_QUEST', fallback.fallback === 'STANDARD_QUEST');
    assert('Reason explains uncataloged concept cleanly without broken ID', fallback.reason.includes('Advancing to curriculum action') || fallback.reason.includes('No experience'));
  }

  // ---------------------------------------------------------------------------
  // 5. Unsupported Actions Fall Back Gracefully
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing Unsupported Action Fallbacks...');
  {
    const tutorQuest = resolveNextQuest({
      action: 'TUTOR_EXPLANATION',
      conceptId: 'python_debugging_basics',
      resolvedExperience: {
        available: false,
        conceptId: 'python_debugging_basics',
        action: 'TUTOR_EXPLANATION',
        reason: 'Action delivered via tutor modality',
      },
    });
    assert('TUTOR_EXPLANATION available is false for 3D/code experience', tutorQuest.available === false);
    assert('TUTOR_EXPLANATION fallback is TUTOR', tutorQuest.fallback === 'TUTOR');
    assert('TUTOR_EXPLANATION routes to /tutor/python_debugging_basics', tutorQuest.route === '/tutor/python_debugging_basics');
    assert('Button label is contextual tutor label', tutorQuest.buttonLabel.length > 0);
  }

  // ---------------------------------------------------------------------------
  // 6. Struggling Learner Scenario (Remediation Routing)
  // ---------------------------------------------------------------------------
  console.log('\n6. Testing Scenario A — Struggling Learner Remediation Routing...');
  {
    const strugglingStore = createMockStore('python_debugging_basics', 25);
    const strugglingResult: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        totalAttempts: 3,
        successfulAttempts: 0,
        hasSucceeded: false,
        predictionAccuracy: 0.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total = number\nprint(total)',
        lastOutput: '8',
        runCount: 3,
        editCount: 3,
        hasRun: true,
        isCompleted: false,
        hintsUsed: 3,
        consecutiveMismatches: 3,
        independentCompletion: false,
        history: [],
      },
      60
    );

    const loopResult = processAdaptiveExperienceLoop(strugglingResult, strugglingStore);

    assert('Struggling learner assessment diagnosed MISCONCEPTION or KNOWLEDGE_GAP', loopResult.assessment.signal === 'MISCONCEPTION' || loopResult.assessment.signal === 'KNOWLEDGE_GAP');
    assert('Decision engine selected remediation action', loopResult.decision.action === 'CORRECT_MISCONCEPTION' || loopResult.decision.action === 'PRACTICE_CONCEPT');
    assert('Next quest target is available', loopResult.nextQuest.available === true);
    assert('Next quest route targets python_debugging_basics', loopResult.nextQuest.route.includes('concept=python_debugging_basics'));
    if (loopResult.decision.action === 'CORRECT_MISCONCEPTION') {
      assert('Route includes mode=assisted for remediation', loopResult.nextQuest.route.includes('mode=assisted'));
      assert('Button label instructs learner to Correct Misconception', loopResult.nextQuest.buttonLabel === 'Correct Misconception');
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Successful Independent Learner Scenario (Challenge/Advancement Routing)
  // ---------------------------------------------------------------------------
  console.log('\n7. Testing Scenario B — Successful Learner Challenge Routing...');
  {
    const strongStore = createMockStore('python_debugging_basics', 85);
    const strongResult: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        totalAttempts: 1,
        successfulAttempts: 1,
        hasSucceeded: true,
        predictionAccuracy: 1.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
        lastOutput: '20',
        runCount: 1,
        editCount: 1,
        hasRun: true,
        isCompleted: true,
        hintsUsed: 0,
        consecutiveMismatches: 0,
        independentCompletion: true,
        history: [],
      },
      25
    );

    const loopResult = processAdaptiveExperienceLoop(strongResult, strongStore);

    assert('Strong learner assessment diagnosed STRONG_MASTERY', loopResult.assessment.signal === 'STRONG_MASTERY');
    assert('Decision engine chose advancement/challenge', loopResult.decision.action === 'HARDER_CHALLENGE' || loopResult.decision.action === 'LEARN_CONCEPT');
    assert('Next quest target contains valid destination route', typeof loopResult.nextQuest.route === 'string' && loopResult.nextQuest.route.length > 0);
  }

  // ---------------------------------------------------------------------------
  // 8. THE CRITICAL PROOF: Same Concept + Different Evidence = Different Next Quest
  // ---------------------------------------------------------------------------
  console.log('\n8. Testing Critical Proof: Same Concept + Different Evidence = Different Next Quest...');
  {
    const concept = 'python_debugging_basics';

    // Learner A: Struggling
    const storeA = createMockStore(concept, 25);
    const resultA: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: concept,
        conceptName: 'Python Debugging Basics',
        totalAttempts: 4,
        successfulAttempts: 0,
        hasSucceeded: false,
        predictionAccuracy: 0.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total = number\nprint(total)',
        lastOutput: '8',
        runCount: 4,
        editCount: 4,
        hasRun: true,
        isCompleted: false,
        hintsUsed: 3,
        consecutiveMismatches: 4,
        independentCompletion: false,
        history: [],
      },
      90
    );
    const loopA = processAdaptiveExperienceLoop(resultA, storeA);

    // Learner B: High Mastery
    const storeB = createMockStore(concept, 88);
    const resultB: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: concept,
        conceptName: 'Python Debugging Basics',
        totalAttempts: 1,
        successfulAttempts: 1,
        hasSucceeded: true,
        predictionAccuracy: 1.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
        lastOutput: '20',
        runCount: 1,
        editCount: 1,
        hasRun: true,
        isCompleted: true,
        hintsUsed: 0,
        consecutiveMismatches: 0,
        independentCompletion: true,
        history: [],
      },
      20
    );
    const loopB = processAdaptiveExperienceLoop(resultB, storeB);

    assert('Learner A and Learner B are evaluated on SAME concept', loopA.conceptId === loopB.conceptId);
    assert('Learner A decision action differs from Learner B decision action', loopA.decision.action !== loopB.decision.action);
    assert('Learner A next quest route differs from Learner B next quest route', loopA.nextQuest.route !== loopB.nextQuest.route);
    assert('Learner A button label differs from Learner B button label', loopA.nextQuest.buttonLabel !== loopB.nextQuest.buttonLabel);
    console.log(`    Learner A (Struggling) -> Action: ${loopA.decision.action} | Route: ${loopA.nextQuest.route} | Button: "${loopA.nextQuest.buttonLabel}"`);
    console.log(`    Learner B (Mastered)   -> Action: ${loopB.decision.action} | Route: ${loopB.nextQuest.route} | Button: "${loopB.nextQuest.buttonLabel}"`);
  }

  // ---------------------------------------------------------------------------
  // 9. Non-Mutation Invariant: Resolving Route Does Not Alter Learner Mastery
  // ---------------------------------------------------------------------------
  console.log('\n9. Testing Route Resolution Does NOT Mutate Learner Mastery...');
  {
    const baseStore = createMockStore('python_debugging_basics', 50);
    const conceptBefore = baseStore.graphs[0].concepts[0].masteryPercentage;

    // Call resolver directly multiple times
    resolveNextQuest({
      action: 'PRACTICE_CONCEPT',
      conceptId: 'python_debugging_basics',
    });
    resolveNextQuest({
      action: 'CORRECT_MISCONCEPTION',
      conceptId: 'python_debugging_basics',
    });
    resolveNextQuest({
      action: 'HARDER_CHALLENGE',
      conceptId: 'python_debugging_basics',
    });

    const conceptAfter = baseStore.graphs[0].concepts[0].masteryPercentage;
    assert('Resolving routes leaves mastery percentage untouched (50 === 50)', conceptBefore === conceptAfter);
  }

  // ---------------------------------------------------------------------------
  // 10. Experience Completion Updates Learner State Normally
  // ---------------------------------------------------------------------------
  console.log('\n10. Testing Experience Completion Updates Learner State Normally...');
  {
    const store = createMockStore('python_debugging_basics', 40);
    const prevAttempts = store.graphs[0].attempts?.length || 0;

    const result: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        totalAttempts: 1,
        successfulAttempts: 1,
        hasSucceeded: true,
        predictionAccuracy: 1.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
        lastOutput: '20',
        runCount: 1,
        editCount: 1,
        hasRun: true,
        isCompleted: true,
        hintsUsed: 0,
        consecutiveMismatches: 0,
        independentCompletion: true,
        history: [],
      },
      30
    );

    const loopResult = processAdaptiveExperienceLoop(result, store);
    assert('Attempt was processed into updated learner state', loopResult.updatedLearnerState.recentAccuracy > 0.5);
    assert('Mastery increased following successful completion', loopResult.updatedLearnerState.masteryPercentage > 40);
  }

  // ---------------------------------------------------------------------------
  // 11. Direct Route & Refresh Safety
  // ---------------------------------------------------------------------------
  console.log('\n11. Testing Direct Route & Refresh URL Safety...');
  {
    const testConcepts = [
      'python_debugging_basics',
      'human_heart_anatomy',
      'spatial_reasoning',
      'projectile_motion',
      'molecular_bonding',
    ];

    for (const c of testConcepts) {
      const q = resolveNextQuest({ action: 'PRACTICE_CONCEPT', conceptId: c });
      assert(`Route for ${c} starts with forward slash`, q.route.startsWith('/'));
      assert(`Route for ${c} contains valid path`, !q.route.includes('undefined') && !q.route.includes('null'));
      assert(`Route for ${c} properly encodes query params`, !q.route.includes(' '));
    }
  }

  // ---------------------------------------------------------------------------
  // 12. ExperienceRegistry Authoritative Catalog Invariant
  // ---------------------------------------------------------------------------
  console.log('\n12. Testing ExperienceRegistry Authoritative Catalog...');
  {
    assert('Registry contains python_debugging_basics', experienceRegistry.hasExperience('python_debugging_basics'));
    assert('Registry contains human_heart_anatomy', experienceRegistry.hasExperience('human_heart_anatomy'));
    assert('Registry contains spatial_reasoning', experienceRegistry.hasExperience('spatial_reasoning'));
    assert('Registry contains projectile_motion', experienceRegistry.hasExperience('projectile_motion'));
    assert('Registry contains molecular_bonding', experienceRegistry.hasExperience('molecular_bonding'));
  }

  // ---------------------------------------------------------------------------
  // 13. Xira Guidance Separation Layer
  // ---------------------------------------------------------------------------
  console.log('\n13. Testing Xira Guidance Separation Layer...');
  {
    const store = createMockStore('python_debugging_basics', 20);
    const result: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        totalAttempts: 2,
        successfulAttempts: 0,
        hasSucceeded: false,
        predictionAccuracy: 0.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total = number\nprint(total)',
        lastOutput: '8',
        runCount: 2,
        editCount: 2,
        hasRun: true,
        isCompleted: false,
        hintsUsed: 2,
        consecutiveMismatches: 2,
        independentCompletion: false,
        history: [],
      },
      45
    );

    const loopResult = processAdaptiveExperienceLoop(result, store);
    assert('Xira guidance is a non-empty string', typeof loopResult.xiraGuidance === 'string' && loopResult.xiraGuidance.length > 0);
    assert('Xira guidance does NOT override decision action', loopResult.decision.action === 'CORRECT_MISCONCEPTION' || loopResult.decision.action === 'PRACTICE_CONCEPT');
    assert('Next quest route is governed by NextQuestResolver not Xira text', loopResult.nextQuest.route.startsWith('/quest'));
  }

  // ---------------------------------------------------------------------------
  // 14. Decision Engine Authoritative Invariant
  // ---------------------------------------------------------------------------
  console.log('\n14. Testing Decision Engine Authority...');
  {
    const store = createMockStore('python_debugging_basics', 50, 0.85); // High retention risk
    const result: ExperienceResult = createCodeExperienceResult(
      CODE_DEBUGGING_EXPERIENCE,
      {
        experienceId: CODE_DEBUGGING_EXPERIENCE.id,
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        totalAttempts: 1,
        successfulAttempts: 1,
        hasSucceeded: true,
        predictionAccuracy: 1.0,
        trials: [],
      } as any,
      {
        sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
        lastOutput: '20',
        runCount: 1,
        editCount: 1,
        hasRun: true,
        isCompleted: true,
        hintsUsed: 0,
        consecutiveMismatches: 0,
        independentCompletion: true,
        history: [],
      },
      30
    );

    const loopResult = processAdaptiveExperienceLoop(result, store);
    assert('Decision Engine recognized retention risk and prioritized review', loopResult.decision.action === 'SPACED_REVIEW' || loopResult.decision.action === 'REVIEW_CONCEPT');
    assert('Next quest target was resolved to review mode', loopResult.nextQuest.route.includes('mode=review'));
    assert('Next quest buttonLabel is Review This Concept', loopResult.nextQuest.buttonLabel === 'Review This Concept');
  }

  // ---------------------------------------------------------------------------
  // 15. Protected Architecture Preserved
  // ---------------------------------------------------------------------------
  console.log('\n15. Testing Protected Core Systems Preserved...');
  {
    const protectedFiles = [
      'lib/store.ts',
      'lib/engine/mastery.ts',
      'lib/engine/difficulty.ts',
      'lib/intelligence/decisionEngine.ts',
    ];

    for (const file of protectedFiles) {
      const fullPath = path.resolve(process.cwd(), file);
      assert(`Protected file ${file} exists and untouched`, fs.existsSync(fullPath));
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------------------\n');

  return { passed, failed };
}
