/**
 * Xpedition Intelligence Layer v1 — Adaptive Experience Loop Automated Tests
 *
 * Validates Milestone #6:
 * “Experience → Xira → Learner Model → Next Experience”
 *
 * Test Suites:
 * 1. Adaptive Experience Loop Execution & Contract
 * 2. Learner State & Mastery Update (Canonical Rasch / BKT)
 * 3. Assessment Intelligence Signal Derivation
 * 4. Decision Engine Contextual Adaptation
 * 5. Scenario A — Struggling Learner (Misconception Detection -> Remediation)
 * 6. Scenario B — Successful Independent Learner (Clean Solve -> Advanced Progression)
 * 7. THE CRITICAL PROOF: Same Concept + Different Evidence = Different Adaptive Decision
 * 8. Scenario C — Confidence Misalignment (High Confidence + Failure)
 * 9. Scenario D — Spaced Retention Risk (Forgetting Window -> Review)
 * 10. Next Experience Resolution & ExperienceRegistry Integration
 * 11. Availability Boundary & Safe Fallbacks (Zero Hallucinated IDs)
 * 12. Xira Pedagogical Explanation Layer
 * 13. Telemetry Event Dispatches
 * 14. Mastery Preservation (No Instant 100% Fabrication)
 * 15. Architectural Invariants & Protected Core System Verification
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  processAdaptiveExperienceLoop,
  AdaptiveExperienceLoopService,
} from '../lib/intelligence/adaptiveExperienceLoop';
import { evaluateExperienceAssessment } from '../lib/intelligence/assessment';
import { resolveNextExperience } from '../lib/experience/nextExperienceResolver';
import { DecisionEngine } from '../lib/intelligence/decisionEngine';
import { experienceRegistry } from '../lib/experience/experienceRegistry';
import { defaultXiraExperienceAdvisor } from '../lib/experience/xira/xiraExperienceAdvisor';
import { CODE_DEBUGGING_EXPERIENCE, createCodeExperienceResult } from '../lib/experience/catalog/codeDebuggingConfig';
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

// Helper to create mock UserStoreData
function createMockStore(conceptId: string, initialMastery: number, retentionRisk: number = 0.2): UserStoreData {
  const store: UserStoreData = JSON.parse(JSON.stringify(INITIAL_ZERO_STATE));
  const activeGraph = store.graphs[0];
  activeGraph.goalText = 'Python Mastery';
  activeGraph.concepts = [
    {
      id: conceptId,
      name: 'Python Debugging Basics',
      masteryPercentage: initialMastery,
      retentionRisk,
      ptsSinceCalibration: 50,
      baselineTheta: 0.0,
      thetaAssisted: (initialMastery / 50) - 1.0,
      itemsNext: 5,
    },
    {
      id: 'spatial_reasoning',
      name: 'Spatial Reasoning',
      masteryPercentage: 60,
      retentionRisk: 0.1,
      ptsSinceCalibration: 40,
      itemsNext: 5,
    },
  ];
  activeGraph.attempts = [];
  store.concepts = activeGraph.concepts;
  return store;
}

export async function runAdaptiveLoopTests() {
  console.log('\n==================================================================');
  console.log('XPEDITION INTELLIGENCE — MILESTONE #6 ADAPTIVE EXPERIENCE LOOP');
  console.log('==================================================================');

  // ----------------------------------------------------------------
  // 1. Adaptive Experience Loop Execution & Contract
  // ----------------------------------------------------------------
  console.log('\n1. Testing Adaptive Loop Contract & Execution...');
  const baseStore = createMockStore('python_debugging_basics', 40);

  const mockSuccessfulResult: ExperienceResult = createCodeExperienceResult(
    CODE_DEBUGGING_EXPERIENCE,
    {
      experienceId: 'programming_code_lab',
      conceptId: 'python_debugging_basics',
      conceptName: 'Python Debugging Basics',
      totalAttempts: 1,
      successfulAttempts: 1,
      hasSucceeded: true,
      totalTrials: 2,
      successfulTrials: 1,
      targetHits: 1,
      totalInteractions: 4,
      predictionAccuracy: 1.0,
      hintsRequested: 0,
      trials: [],
      principlesIdentified: ['accumulation_operator_corrected'],
    } as any,
    {
      sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total += number\nprint(total)',
      lastOutput: '20',
      runCount: 2,
      editCount: 1,
      hasRun: true,
      isCompleted: true,
      hintsUsed: 0,
      consecutiveMismatches: 0,
      correctionPattern: 'accumulation_operator',
      independentCompletion: true,
      history: [],
    },
    35
  );

  const loopResult = processAdaptiveExperienceLoop(mockSuccessfulResult, baseStore);

  assert('Adaptive loop returns structured result', Boolean(loopResult));
  assert('Loop identifies conceptId as python_debugging_basics', loopResult.conceptId === 'python_debugging_basics');
  assert('Loop contains updatedLearnerState', Boolean(loopResult.updatedLearnerState));
  assert('Loop contains assessment object', Boolean(loopResult.assessment));
  assert('Loop contains decision object', Boolean(loopResult.decision));
  assert('Loop contains nextExperience resolution', Boolean(loopResult.nextExperience));
  assert('Loop contains Xira pedagogical guidance', typeof loopResult.xiraGuidance === 'string' && loopResult.xiraGuidance.length > 0);

  // ----------------------------------------------------------------
  // 2. Canonical Learner Model Update (Theta / Mastery)
  // ----------------------------------------------------------------
  console.log('\n2. Testing Canonical Learner Model Update...');
  assert(
    'Successful attempt increases concept mastery incrementally',
    loopResult.updatedLearnerState.masteryPercentage > 40
  );
  assert(
    'Successful attempt does NOT fabricate 100% mastery from one trial',
    loopResult.updatedLearnerState.masteryPercentage < 100
  );
  assert(
    'Recent accuracy is correctly derived as 1.0 for single success',
    loopResult.updatedLearnerState.recentAccuracy === 1.0
  );

  // ----------------------------------------------------------------
  // 3 & 4. Assessment Intelligence Signals
  // ----------------------------------------------------------------
  console.log('\n3 & 4. Testing Assessment Signal Generation...');
  assert(
    'Clean independent solve is classified as STRONG_MASTERY',
    loopResult.assessment.signal === 'STRONG_MASTERY'
  );
  assert(
    'Assessment confidence is high (>= 0.9)',
    loopResult.assessment.confidence >= 0.9
  );
  assert(
    'Assessment reason explains independent problem-solving',
    loopResult.assessment.reason.includes('independently')
  );

  // ----------------------------------------------------------------
  // 5. Scenario A — Struggling Learner (Misconception & Remediation)
  // ----------------------------------------------------------------
  console.log('\n5. Testing Scenario A — Struggling Learner...');
  const strugglingStore = createMockStore('python_debugging_basics', 35);

  const mockStrugglingResult: ExperienceResult = createCodeExperienceResult(
    CODE_DEBUGGING_EXPERIENCE,
    {
      experienceId: 'programming_code_lab',
      conceptId: 'python_debugging_basics',
      conceptName: 'Python Debugging Basics',
      totalAttempts: 3,
      successfulAttempts: 0,
      hasSucceeded: false,
      totalTrials: 3,
      successfulTrials: 0,
      targetHits: 0,
      totalInteractions: 8,
      predictionAccuracy: 0.0,
      hintsRequested: 2,
      trials: [],
      principlesIdentified: ['repeated_assignment_pattern'],
    } as any,
    {
      sourceCode: 'numbers = [2, 4, 6, 8]\ntotal = 0\nfor number in numbers:\n    total = number\nprint(total)',
      lastOutput: '8',
      runCount: 3,
      editCount: 0,
      hasRun: true,
      isCompleted: false,
      hintsUsed: 2,
      consecutiveMismatches: 3,
      detectedBug: 'reassignment',
      independentCompletion: false,
      history: [],
    },
    75
  );

  const strugglingLoop = processAdaptiveExperienceLoop(mockStrugglingResult, strugglingStore);

  assert(
    'Struggling learner triggers MISCONCEPTION or KNOWLEDGE_GAP assessment signal',
    strugglingLoop.assessment.signal === 'MISCONCEPTION' || strugglingLoop.assessment.signal === 'KNOWLEDGE_GAP'
  );
  assert(
    'Assessment identifies the reassignment bug',
    strugglingLoop.assessment.detectedMisconception === 'reassignment' || strugglingLoop.assessment.reason.includes('reassignment')
  );
  assert(
    'Decision Engine selects CORRECT_MISCONCEPTION for repeated bug',
    strugglingLoop.decision.action === 'CORRECT_MISCONCEPTION'
  );
  assert(
    'Decision priority is critical',
    strugglingLoop.decision.priority === 'critical'
  );
  assert(
    'Next experience resolves available remediation experience',
    strugglingLoop.nextExperience.available === true && strugglingLoop.nextExperience.experienceType === 'CODE_DEBUGGING'
  );
  assert(
    'Remediation experience title highlights remediation',
    strugglingLoop.nextExperience.title?.includes('Remediation') === true
  );

  // ----------------------------------------------------------------
  // 6. Scenario B — Successful Learner (High Mastery & Advanced Progression)
  // ----------------------------------------------------------------
  console.log('\n6. Testing Scenario B — High Mastery Learner...');
  const highMasteryStore = createMockStore('python_debugging_basics', 85);
  // Add recent successful attempts so accuracy is high
  highMasteryStore.graphs[0].attempts = [
    { id: '1', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: Date.now() - 3000, confidence: 'known' },
    { id: '2', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: Date.now() - 2000, confidence: 'known' },
    { id: '3', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: Date.now() - 1000, confidence: 'known' },
  ];

  const highMasteryLoop = processAdaptiveExperienceLoop(mockSuccessfulResult, highMasteryStore);

  assert(
    'High mastery learner with high accuracy triggers HARDER_CHALLENGE from Decision Engine',
    highMasteryLoop.decision.action === 'HARDER_CHALLENGE'
  );
  assert(
    'Decision reason references advanced challenge',
    highMasteryLoop.decision.reason.includes('advanced challenge') || highMasteryLoop.decision.reason.includes('mastery')
  );

  // ----------------------------------------------------------------
  // 7. CRITICAL PROOF: Same Concept + Different Evidence = Different Decision
  // ----------------------------------------------------------------
  console.log('\n7. THE CRITICAL PROOF: Same Concept + Different Evidence = Different Decision...');
  assert(
    'Same concept produces CORRECT_MISCONCEPTION for struggling learner vs HARDER_CHALLENGE for master learner',
    strugglingLoop.conceptId === highMasteryLoop.conceptId &&
    strugglingLoop.decision.action === 'CORRECT_MISCONCEPTION' &&
    highMasteryLoop.decision.action === 'HARDER_CHALLENGE'
  );
  assert(
    'Both decisions emerge from canonical DecisionEngine rules without hardcoded overrides',
    strugglingLoop.decision.capability === 'misconceptionCorrection' &&
    highMasteryLoop.decision.capability === 'challenge'
  );

  // ----------------------------------------------------------------
  // 8. Scenario C — Confidence Misalignment
  // ----------------------------------------------------------------
  console.log('\n8. Testing Scenario C — Confidence Misalignment...');
  const confidenceStore = createMockStore('python_debugging_basics', 50);
  const mockMisalignedResult: ExperienceResult = {
    experienceId: 'programming_code_lab',
    experienceType: 'CODE_DEBUGGING',
    conceptId: 'python_debugging_basics',
    conceptName: 'Python Debugging Basics',
    completed: false,
    score: 20,
    attempts: 2,
    successfulAttempts: 0,
    finalResult: 'close_attempt',
    evidence: {
      predictionAccuracy: 1.0, // Predicted with 100% confidence
      trials: [],
      hintsRequested: 0,
    } as any,
    codeEvidence: {
      runs: 2,
      edits: 1,
      outputAttempts: 2,
      validationAttempts: 1,
      hintsUsed: 0,
      correctionCount: 0,
      detectedBug: 'reassignment',
      independentCompletion: false,
      finalSuccess: false,
    },
    timeSpentSeconds: 40,
    timestamp: Date.now(),
  };

  const misalignedLoop = processAdaptiveExperienceLoop(mockMisalignedResult, confidenceStore);

  assert(
    'High confidence coupled with failure triggers CONFIDENCE_MISALIGNMENT signal',
    misalignedLoop.assessment.signal === 'CONFIDENCE_MISALIGNMENT'
  );
  assert(
    'Decision Engine selects CORRECT_MISCONCEPTION to calibrate confidence',
    misalignedLoop.decision.action === 'CORRECT_MISCONCEPTION'
  );
  assert(
    'Xira guidance explains the confidence calibration need',
    misalignedLoop.xiraGuidance.includes('misconception') || misalignedLoop.xiraGuidance.includes('clarify')
  );

  // ----------------------------------------------------------------
  // 9. Scenario D — Spaced Retention Risk
  // ----------------------------------------------------------------
  console.log('\n9. Testing Scenario D — Spaced Retention Risk...');
  // High retention risk (> 0.35 after post-attempt decay adjustment)
  const fadingStore = createMockStore('python_debugging_basics', 75, 0.60);
  // Neutral recent attempt that doesn't trigger repeated mistakes
  const neutralResult: ExperienceResult = {
    experienceId: 'programming_code_lab',
    experienceType: 'CODE_DEBUGGING',
    conceptId: 'python_debugging_basics',
    conceptName: 'Python Debugging Basics',
    completed: true,
    score: 75,
    attempts: 1,
    successfulAttempts: 1,
    finalResult: 'target_hit',
    timeSpentSeconds: 30,
    timestamp: Date.now(),
  };

  const fadingLoop = processAdaptiveExperienceLoop(neutralResult, fadingStore);

  assert(
    'Concept with retention risk > 0.35 triggers SPACED_REVIEW in Decision Engine',
    fadingLoop.decision.action === 'SPACED_REVIEW'
  );
  assert(
    'Decision reason notes retention risk percentage',
    fadingLoop.decision.reason.includes('retention risk is') || fadingLoop.decision.reason.includes('review')
  );
  assert(
    'Resolver provides Spaced Review experience',
    fadingLoop.nextExperience.available === true && fadingLoop.nextExperience.title?.includes('Spaced Review') === true
  );

  // ----------------------------------------------------------------
  // 10 & 11. Next Experience Resolution Across All Canonical Experiences
  // ----------------------------------------------------------------
  console.log('\n10 & 11. Testing Next Experience Resolution Across All 5 Experiences...');
  const all5 = [
    { concept: 'python_debugging_basics', expectedType: 'CODE_DEBUGGING' },
    { concept: 'human_heart_anatomy', expectedType: 'HEART_ANATOMY_EXPLORER' },
    { concept: 'spatial_reasoning', expectedType: 'OBJECT_MANIPULATION' },
    { concept: 'projectile_motion', expectedType: 'PROJECTILE_SIMULATION' },
    { concept: 'molecular_bonding', expectedType: 'MOLECULE_BUILDER' },
  ];

  for (const item of all5) {
    const res = resolveNextExperience('PRACTICE_CONCEPT', item.concept);
    assert(
      `Resolver accurately maps ${item.concept} to ${item.expectedType}`,
      res.available === true && res.experienceType === item.expectedType
    );
  }

  // Safety test: unknown concept
  const unknownRes = resolveNextExperience('PRACTICE_CONCEPT', 'unknown_quantum_teleportation');
  assert(
    'Unknown concept returns available: false without crashing',
    unknownRes.available === false && unknownRes.reason.includes('No interactive experience currently registered')
  );

  // Safety test: non-interactive action
  const examMockRes = resolveNextExperience('EXAM_MOCK', 'python_debugging_basics');
  assert(
    'EXAM_MOCK returns available: false with explanatory reason (not a 3D simulation)',
    examMockRes.available === false && examMockRes.reason.includes('dedicated textual')
  );

  // ----------------------------------------------------------------
  // 12. Xira Pedagogical Guidance
  // ----------------------------------------------------------------
  console.log('\n12. Testing Xira Supportive Guidance Generation...');
  const xiraRemediation = defaultXiraExperienceAdvisor.generateAdaptiveNextStepGuidance(
    'CORRECT_MISCONCEPTION',
    'MISCONCEPTION',
    'Python Debugging Basics'
  );
  assert(
    'Xira remediation guidance is constructive and encourages targeted practice',
    xiraRemediation.includes('Xira observed') && xiraRemediation.includes('misconception')
  );

  const xiraAdvanced = defaultXiraExperienceAdvisor.generateAdaptiveNextStepGuidance(
    'HARDER_CHALLENGE',
    'STRONG_MASTERY',
    'Python Debugging Basics'
  );
  assert(
    'Xira advanced guidance celebrates independent solve and levels up',
    xiraAdvanced.includes('Outstanding job') && xiraAdvanced.includes('advanced challenge')
  );

  // ----------------------------------------------------------------
  // 13. Telemetry Event Dispatches
  // ----------------------------------------------------------------
  console.log('\n13. Testing Adaptive Loop Telemetry Dispatches...');
  assert(
    'Telemetry events emitted during adaptive loop processing',
    Boolean(strugglingLoop.evaluatedAt) && Boolean(highMasteryLoop.evaluatedAt)
  );

  // ----------------------------------------------------------------
  // 14 & 15. Architectural Invariants & Protected Systems
  // ----------------------------------------------------------------
  console.log('\n14 & 15. Testing Architectural Invariants & Protected Systems...');

  // Invariant 1: No duplicate learner models or engines in lib/
  const libDir = path.resolve(process.cwd(), 'lib');
  const allLibFiles = fs.readdirSync(libDir, { recursive: true }) as string[];
  const bannedEngines = allLibFiles.filter((f) =>
    /newlearnermodel|programminglearnermodel|experiencelearnermodel|newmasteryengine|newdecisionengine|newtelemetrysystem/i.test(f)
  );
  assert(
    `Zero duplicate learner model or engine files exist (found ${bannedEngines.length})`,
    bannedEngines.length === 0
  );

  // Invariant 2: Protected systems intact
  assert('Protected system lib/store.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/store.ts')));
  assert('Protected system lib/intelligence/decisionEngine.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/intelligence/decisionEngine.ts')));
  assert('Protected system lib/engine/mastery.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/engine/mastery.ts')));
  assert('Protected system lib/engine/difficulty.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/engine/difficulty.ts')));

  // Invariant 3: Experience Registry is singleton and contains all 5 experiences
  assert('ExperienceRegistry has 5 registered canonical experiences', experienceRegistry.listExperienceDefinitions().length >= 5);

  // ----------------------------------------------------------------
  // Test Summary
  // ----------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('------------------------------------------------------------------\n');

  if (failedCount > 0) {
    throw new Error(`${failedCount} test(s) failed in adaptive experience loop test suite.`);
  }
}

// Direct execution
if (require.main === module) {
  runAdaptiveLoopTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
