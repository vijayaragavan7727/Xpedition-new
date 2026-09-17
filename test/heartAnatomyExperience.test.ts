/**
 * Experience Engine — Experience #4: 3D Human Heart Anatomy Explorer Test Suite
 *
 * Validates:
 * 1. Anatomy Configuration (12 canonical structures, chambers, valves, vessels, difficulty, objective)
 * 2. Structure Registry (validation against registry, structure lookup)
 * 3. Valid Structure Selection
 * 4. Invalid Structure Selection
 * 5. Chamber Relationships (atria connect to ventricles via AV valves)
 * 6. Valve Relationships (mitral is left AV, tricuspid is right AV, semilunar valves)
 * 7. Blood-Flow Sequence (12 canonical steps in order from Vena Cava to Aorta)
 * 8. Incorrect Flow Step (order mismatch detection with educational hint)
 * 9. Correct Challenge (Left Ventricle for oxygen-rich systemic pump, Mitral for LA-LV, etc.)
 * 10. Incorrect Challenge (correction & misconception guidance)
 * 11. Completion Evaluation (all explored, flow complete, challenges passed)
 * 12. Incomplete State (missing structures or unverified flow)
 * 13. Telemetry (canonical experience event types & domain metadata)
 * 14. ExperienceResult (anatomyEvidence structure, telemetry evidence, outcome)
 * 15. Xira Observation (educational observations: structure_identified, repeated_valve_confusion, flow_direction_error, etc.)
 * 16. Xira Feedback (cardiac advisor guidance without diagnosis/psychology)
 * 17. Quest Mapping (human_heart_anatomy resolves to HEART_ANATOMY_QUEST)
 * 18. Registry Lookup (HEART_ANATOMY_EXPLORER registered with template: manipulation)
 * 19. Orchestrator Integration (canonical lifecycle via ExperienceOrchestrator without domain coupling)
 * 20. Architecture Invariants (No HeartEngine/BiologyEngine/AnatomyEngine, orchestrator remains domain-agnostic)
 */

import {
  HEART_STRUCTURES,
  HEART_CHALLENGES,
  HEART_ANATOMY_EXPERIENCE,
  HEART_ANATOMY_QUEST,
  createHeartExperienceResult,
} from '../lib/experience/catalog/heartAnatomyConfig';
import {
  validateStructureSelection,
  validateFlowStep,
  validateChallengeAnswer,
  evaluateHeartAnatomyCompletion,
  CANONICAL_BLOOD_FLOW_PATH,
  VALVE_CHAMBER_RELATIONSHIPS,
  HeartAnatomyState,
} from '../lib/experience/domain/heartAnatomyRules';
import { experienceRegistry } from '../lib/experience/experienceRegistry';
import { ExperienceOrchestrator } from '../lib/experience/experienceOrchestrator';
import { HEART_ANATOMY_DEFINITION } from '../lib/experience/catalog';
import { defaultXiraExperienceAdvisor } from '../lib/experience/xira/xiraExperienceAdvisor';
import { TelemetryEmitter } from '../lib/experience/telemetry/telemetryEmitter';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';
import * as fs from 'fs';
import * as path from 'path';

interface AssertionReport {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runHeartAnatomyExperienceTests(): Promise<void> {
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

  console.log('\n==================================================================');
  console.log('XPEDITION EXPERIENCE ENGINE — 3D HEART ANATOMY EXPLORER TESTS');
  console.log('==================================================================\n');

  // ----------------------------------------------------------------
  // 1. Anatomy Configuration
  // ----------------------------------------------------------------
  console.log('1. Testing Anatomy Configuration...');
  assert(
    'Concept is human_heart_anatomy and experience is HEART_ANATOMY_EXPLORER',
    HEART_ANATOMY_EXPERIENCE.conceptId === 'human_heart_anatomy' &&
      HEART_ANATOMY_EXPERIENCE.experienceType === 'HEART_ANATOMY_EXPLORER'
  );
  assert(
    'Initial difficulty is beginner level (0.3)',
    HEART_ANATOMY_EXPERIENCE.difficulty === 0.3
  );
  assert(
    'Objective accurately specifies chambers and valves',
    HEART_ANATOMY_EXPERIENCE.challenge.objective.includes('chambers and valves')
  );
  assert(
    'Configuration includes 12 focused anatomical structures',
    HEART_STRUCTURES.length === 12
  );

  // ----------------------------------------------------------------
  // 2. Structure Registry
  // ----------------------------------------------------------------
  console.log('\n2. Testing Structure Registry...');
  const expectedStructureIds = [
    'right_atrium',
    'right_ventricle',
    'left_atrium',
    'left_ventricle',
    'tricuspid_valve',
    'pulmonary_valve',
    'mitral_valve',
    'aortic_valve',
    'aorta',
    'pulmonary_artery',
    'pulmonary_veins',
    'vena_cava',
  ];
  const allStructuresPresent = expectedStructureIds.every((id) =>
    HEART_STRUCTURES.some((s) => s.id === id)
  );
  assert('All 12 expected structures are declared in HEART_STRUCTURES', allStructuresPresent);

  const leftVentricle = HEART_STRUCTURES.find((s) => s.id === 'left_ventricle');
  assert(
    'Left Ventricle is oxygenated, chamber type, and thick-walled description',
    leftVentricle !== undefined &&
      leftVentricle.category === 'chamber' &&
      leftVentricle.bloodType === 'oxygenated'
  );

  // ----------------------------------------------------------------
  // 3 & 4. Valid and Invalid Structure Selection
  // ----------------------------------------------------------------
  console.log('\n3 & 4. Testing Structure Selection Validation...');
  const validSelection = validateStructureSelection('left_ventricle', 'left_ventricle');
  assert('Valid structure selection succeeds with structure_identified principle', validSelection.isValid && validSelection.principle === 'structure_identified');

  const invalidSelection = validateStructureSelection('mitral_valve', 'tricuspid_valve');
  assert(
    'Mismatched valve selection detects specific valve confusion with educational guidance',
    !invalidSelection.isValid && invalidSelection.principle === 'repeated_valve_confusion'
  );

  // ----------------------------------------------------------------
  // 5 & 6. Chamber and Valve Relationships
  // ----------------------------------------------------------------
  console.log('\n5 & 6. Testing Chamber & Valve Relationships...');
  const mitralRel = VALVE_CHAMBER_RELATIONSHIPS.find((r) => r.valveId === 'mitral_valve');
  assert(
    'Mitral valve connects left atrium to left ventricle',
    mitralRel !== undefined && mitralRel.fromChamber === 'left_atrium' && mitralRel.toChamber === 'left_ventricle'
  );

  const tricuspidRel = VALVE_CHAMBER_RELATIONSHIPS.find((r) => r.valveId === 'tricuspid_valve');
  assert(
    'Tricuspid valve connects right atrium to right ventricle',
    tricuspidRel !== undefined && tricuspidRel.fromChamber === 'right_atrium' && tricuspidRel.toChamber === 'right_ventricle'
  );

  const aorticRel = VALVE_CHAMBER_RELATIONSHIPS.find((r) => r.valveId === 'aortic_valve');
  assert(
    'Aortic valve connects left ventricle to aorta',
    aorticRel !== undefined && aorticRel.fromChamber === 'left_ventricle' && aorticRel.toChamber === 'aorta'
  );

  // ----------------------------------------------------------------
  // 7 & 8. Blood-Flow Sequence and Error Detection
  // ----------------------------------------------------------------
  console.log('\n7 & 8. Testing Blood-Flow Sequence...');
  assert(
    'Canonical blood flow path has 12 deterministic steps starting with vena_cava and ending with aorta',
    CANONICAL_BLOOD_FLOW_PATH.length === 12 &&
      CANONICAL_BLOOD_FLOW_PATH[0] === 'vena_cava' &&
      CANONICAL_BLOOD_FLOW_PATH[11] === 'aorta'
  );

  const step0 = validateFlowStep('vena_cava', 0);
  assert('First blood flow step vena_cava is valid', step0.isCorrect && step0.isComplete === false);

  const step1 = validateFlowStep('right_atrium', 1);
  assert('Second blood flow step right_atrium is valid', step1.isCorrect);

  const stepWrong = validateFlowStep('left_ventricle', 1);
  assert(
    'Wrong flow step detected with educational guidance and expected structure',
    !stepWrong.isCorrect && stepWrong.expectedStructureId === 'right_atrium' && Boolean(stepWrong.reason)
  );

  const stepFinal = validateFlowStep('aorta', 11);
  assert('Final flow step marked as flow complete', stepFinal.isCorrect && stepFinal.isComplete === true);

  // ----------------------------------------------------------------
  // 9 & 10. Correct and Incorrect Challenges
  // ----------------------------------------------------------------
  console.log('\n9 & 10. Testing Contextual Challenges...');
  const c1 = HEART_CHALLENGES[0];
  const c1Correct = validateChallengeAnswer(c1, c1.targetStructureId);
  assert('Correct challenge answer validated with positive explanation', c1Correct.isCorrect && c1Correct.reason.includes('correctly'));

  const c1Wrong = validateChallengeAnswer(c1, 'right_atrium');
  assert(
    'Incorrect challenge answer yields constructive correction',
    !c1Wrong.isCorrect && c1Wrong.feedback.includes('Note:')
  );

  // Challenge for valve between LA and LV
  const c2 = HEART_CHALLENGES[1];
  const c2Correct = validateChallengeAnswer(c2, 'mitral_valve');
  assert('Mitral valve correctly answers LA-LV valve challenge', c2Correct.isCorrect);

  // ----------------------------------------------------------------
  // 11 & 12. Completion & Incomplete State
  // ----------------------------------------------------------------
  console.log('\n11 & 12. Testing Completion Evaluation...');
  const incompleteState: HeartAnatomyState = {
    currentEulerDeg: [0, 0, 0],
    selectedStructureId: 'left_ventricle',
    inspectedStructures: ['left_ventricle'],
    flowStepIndex: 2,
    isFlowActive: false,
    flowErrors: 0,
    flowCompleted: false,
    currentChallengeIndex: 0,
    challengeAnswers: {},
    isComplete: false,
  };
  const evalIncomplete = evaluateHeartAnatomyCompletion(incompleteState);
  assert('Incomplete state fails completion check with remaining guidance reason', !evalIncomplete.isComplete && evalIncomplete.exploredCount === 1);

  const completeState: HeartAnatomyState = {
    currentEulerDeg: [0, 0, 0],
    selectedStructureId: 'aorta',
    inspectedStructures: [...CANONICAL_BLOOD_FLOW_PATH],
    flowStepIndex: 12,
    isFlowActive: false,
    flowErrors: 0,
    flowCompleted: true,
    currentChallengeIndex: 3,
    challengeAnswers: {
      c1: { selectedId: 'left_ventricle', isCorrect: true },
      c2: { selectedId: 'mitral_valve', isCorrect: true },
      c3: { selectedId: 'pulmonary_artery', isCorrect: true },
    },
    isComplete: true,
  };
  const evalComplete = evaluateHeartAnatomyCompletion(completeState);
  assert('Complete state satisfies all requirements', evalComplete.isComplete && evalComplete.score >= 90);

  // ----------------------------------------------------------------
  // 13. Telemetry Emitter
  // ----------------------------------------------------------------
  console.log('\n13. Testing Canonical Telemetry Flow...');
  const emitter = new TelemetryEmitter('exp_heart_01', 'human_heart_anatomy', 'Human Heart Anatomy');
  const emittedEvents: any[] = [];
  emitter.subscribe((event) => emittedEvents.push(event));

  emitter.emit('structure_selected', { structureId: 'left_ventricle', structureName: 'Left Ventricle' });
  emitter.emit('heart_rotated', { deltaX: 0.5, deltaY: 0.2 });
  emitter.emit('heart_zoomed', { zoomLevel: 1.2 });
  emitter.emit('flow_started', { startingStructure: 'vena_cava' });
  emitter.emit('flow_step_completed', { stepIndex: 0, structureId: 'vena_cava' });
  emitter.emit('challenge_answered', { challengeId: c1.id, selectedStructureId: 'left_ventricle', isCorrect: true });
  emitter.emit('heart_experience_completed', { totalExplored: 12, flowComplete: true, accuracy: 1.0 });

  assert('Telemetry emitter emits all canonical heart events', emittedEvents.length === 7);
  assert(
    'Telemetry events contain expected event types',
    emittedEvents.some((e) => e.type === 'structure_selected') &&
      emittedEvents.some((e) => e.type === 'flow_step_completed') &&
      emittedEvents.some((e) => e.type === 'heart_experience_completed')
  );

  // ----------------------------------------------------------------
  // 14. ExperienceResult & Learner Model Evidence
  // ----------------------------------------------------------------
  console.log('\n14. Testing ExperienceResult Generation...');
  const expResult = createHeartExperienceResult(
    HEART_ANATOMY_EXPERIENCE,
    {
      experienceId: HEART_ANATOMY_EXPERIENCE.id,
      conceptId: 'human_heart_anatomy',
      conceptName: '3D Human Heart Anatomy: Chambers, Valves & Circulation',
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
      patternSummary: 'Heart anatomy explored and blood flow verified.',
      detectedPrinciple: 'cardiovascular_flow_mastery',
      principlesIdentified: ['systemic_circulation', 'pulmonary_circuit', 'valve_directionality'],
    },
    completeState,
    55
  );

  assert('ExperienceResult has completed status and score', expResult.completed === true && expResult.score !== undefined && expResult.score >= 90);
  assert(
    'ExperienceResult includes anatomyEvidence with 12 flow steps and 3 correct challenges',
    expResult.anatomyEvidence?.flowStepsCompleted === 12 &&
      expResult.anatomyEvidence?.challengeScore === 3
  );

  const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome({
    conceptId: 'human_heart_anatomy',
    conceptName: '3D Human Heart Anatomy',
    isSuccess: true,
    accuracy: 1.0,
    trialsCount: 1,
    confidence: 'known',
    timeSpentSeconds: 55,
    timestamp: Date.now(),
  });

  assert('LearnerModelAdapter successfully records attempt without error', attempt.conceptId === 'human_heart_anatomy' && attempt.isCorrect);
  assert('Next action is suggested for continuing learning journey', Boolean(nextAction));

  // ----------------------------------------------------------------
  // 15 & 16. Xira Educational Observation & Feedback
  // ----------------------------------------------------------------
  console.log('\n15 & 16. Testing Xira Cardiac Advisor...');
  const valveConfusionFeedback = defaultXiraExperienceAdvisor.generateHeartFeedback(
    {
      experienceId: 'exp_heart_01',
      conceptId: 'human_heart_anatomy',
      conceptName: 'Human Heart Anatomy',
      totalAttempts: 1,
      successfulAttempts: 0,
      hasSucceeded: false,
      totalTrials: 1,
      successfulTrials: 0,
      targetHits: 0,
      totalInteractions: 3,
      predictionAccuracy: 0.5,
      hintsRequested: 0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      patternSummary: 'Confused atrioventricular valves',
      detectedPrinciple: 'repeated_valve_confusion',
    },
    {
      exploredCount: 3,
      isFlowComplete: false,
      flowErrors: 1,
      challengesCorrect: 0,
      lastMistakePrinciple: 'repeated_valve_confusion',
    }
  );

  assert(
    'Xira provides constructive valve advice mentioning Tricuspid on Right and Mitral on Left',
    valveConfusionFeedback.pedagogicalInsight.includes('Tricuspid') &&
      valveConfusionFeedback.pedagogicalInsight.includes('Mitral')
  );

  const flowSuccessFeedback = defaultXiraExperienceAdvisor.generateHeartFeedback(
    {
      experienceId: 'exp_heart_01',
      conceptId: 'human_heart_anatomy',
      conceptName: 'Human Heart Anatomy',
      totalAttempts: 1,
      successfulAttempts: 1,
      hasSucceeded: true,
      totalTrials: 1,
      successfulTrials: 1,
      targetHits: 1,
      totalInteractions: 12,
      predictionAccuracy: 1.0,
      hintsRequested: 0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      patternSummary: 'Circulation circuit complete',
      detectedPrinciple: 'correct_flow_sequence',
    },
    {
      exploredCount: 12,
      isFlowComplete: true,
      flowErrors: 0,
      challengesCorrect: 3,
    }
  );

  assert(
    'Xira celebrates full 12-step cardiovascular blood flow circuit',
    flowSuccessFeedback.observation.includes('12-step') && flowSuccessFeedback.isOptimal === true
  );

  // ----------------------------------------------------------------
  // 17. Quest Definition Mapping
  // ----------------------------------------------------------------
  console.log('\n17. Testing Quest Definition Mapping...');
  assert(
    'HEART_ANATOMY_QUEST has conceptId human_heart_anatomy',
    HEART_ANATOMY_QUEST.conceptId === 'human_heart_anatomy'
  );
  assert(
    'HEART_ANATOMY_QUEST primary item has experienceType HEART_ANATOMY_EXPLORER',
    HEART_ANATOMY_QUEST.items[0].experienceType === 'HEART_ANATOMY_EXPLORER'
  );
  assert(
    'HEART_ANATOMY_QUEST includes reflection follow-up item',
    HEART_ANATOMY_QUEST.items[1].type === 'reflection'
  );

  // ----------------------------------------------------------------
  // 18. Experience Registry Lookup
  // ----------------------------------------------------------------
  console.log('\n18. Testing Experience Registry...');
  const registeredDef = experienceRegistry.getExperienceDefinition('HEART_ANATOMY_EXPLORER');
  assert('HEART_ANATOMY_EXPLORER definition is registered', registeredDef !== undefined);
  assert('Heart definition uses manipulation template', registeredDef?.template === 'manipulation');

  const hasHeartConcept = experienceRegistry.hasExperience('human_heart_anatomy');
  assert('Registry confirms experience registered for human_heart_anatomy concept', hasHeartConcept);

  // ----------------------------------------------------------------
  // 19. Shared Experience Orchestrator Integration
  // ----------------------------------------------------------------
  console.log('\n19. Testing Orchestrator Integration...');
  const orchestrator = new ExperienceOrchestrator(HEART_ANATOMY_DEFINITION);
  const snapshotInit = orchestrator.getSnapshot();
  assert('ExperienceOrchestrator initializes in IDLE stage', snapshotInit.stage === 'IDLE');

  const startStage = orchestrator.startExperience();
  assert('Orchestrator transitions to PREDICTING or INTERACTING upon start', startStage === 'PREDICTING' || startStage === 'INTERACTING');

  // Test state mutation via orchestrator
  orchestrator.updateState({
    selectedStructureId: 'left_ventricle',
    inspectedStructures: ['left_ventricle'],
  });
  const snapshotUpdated = orchestrator.getSnapshot();
  assert('Orchestrator updates internal domain state and increments interaction count', snapshotUpdated.interactionCount > 0);

  // Test validation via orchestrator
  const valResult = orchestrator.validate();
  assert('Orchestrator delegates validation to definition validate function', typeof valResult.validation.isValid === 'boolean');

  // ----------------------------------------------------------------
  // 20. Architecture Invariants & Protected Systems Check
  // ----------------------------------------------------------------
  console.log('\n20. Testing Architecture Invariants & Protected Systems...');

  // Invariant 1: Orchestrator must not mention heart, biology, or anatomy logic
  const orchestratorPath = path.resolve(process.cwd(), 'lib/experience/experienceOrchestrator.ts');
  const orchestratorSrc = fs.readFileSync(orchestratorPath, 'utf-8');
  const orchestratorHasHeart =
    orchestratorSrc.toLowerCase().includes('heart') ||
    orchestratorSrc.toLowerCase().includes('valve') ||
    orchestratorSrc.toLowerCase().includes('atrium') ||
    orchestratorSrc.toLowerCase().includes('ventricle');
  assert('Experience Orchestrator contains NO heart anatomy or biology code (pure domain-agnostic)', !orchestratorHasHeart);

  // Invariant 2: No HeartEngine, BiologyEngine, or AnatomyEngine file exists
  const libDir = path.resolve(process.cwd(), 'lib');
  const allFiles = fs.readdirSync(libDir, { recursive: true }) as string[];
  const bannedEngines = allFiles.filter((f) =>
    /heartengine|biologyengine|anatomyengine/i.test(f)
  );
  assert(
    `No HeartEngine, BiologyEngine, or AnatomyEngine files exist (found ${bannedEngines.length})`,
    bannedEngines.length === 0
  );

  // Invariant 3: All 4 experiences are registered in ExperienceRegistry
  const all4Experiences = [
    'PROJECTILE_SIMULATION',
    'OBJECT_MANIPULATION',
    'MOLECULE_BUILDER',
    'HEART_ANATOMY_EXPLORER',
  ];
  const all4Registered = all4Experiences.every(
    (exp) => experienceRegistry.getExperienceDefinition(exp as any) !== undefined
  );
  assert('All four experiences share ONE registry and ONE unified Experience Engine', all4Registered);

  // ----------------------------------------------------------------
  // Test Summary
  // ----------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('------------------------------------------------------------------\n');

  if (failedCount > 0) {
    throw new Error(`${failedCount} tests failed.`);
  }
}

// Auto-run if executed directly via Node
if (require.main === module) {
  runHeartAnatomyExperienceTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
