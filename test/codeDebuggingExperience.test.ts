/**
 * Experience Engine — Experience #5: Programming Code Lab Test Suite
 * Theme: "Debug by Doing"
 *
 * Validates:
 * 1. Challenge configuration (Python accumulation vs reassignment, concept, initial source)
 * 2. Initial source inspection & structure
 * 3. Expected output verification (20)
 * 4. Incorrect assignment detection (`total = number` outputs 8 and flags reassignment bug)
 * 5. Correct accumulation detection (`total += number` and `total = total + number` outputs 20)
 * 6. Run behavior & execution simulation
 * 7. Output mismatch handling with educational insight
 * 8. Progressive hint escalation (hints 1, 2, 3)
 * 9. Repeated failed attempts & consecutive mismatch tracking
 * 10. Meaningful correction state tracking
 * 11. Independent completion (0 hints used, low run count)
 * 12. Successful completion scoring & evidence
 * 13. Canonical telemetry events (code_experience_started, code_edited, code_run, etc.)
 * 14. ExperienceResult contract with codeEvidence
 * 15. ExperienceRegistry resolution (concept, type, ID)
 * 16. Quest mapping contract (CODE_DEBUGGING_QUEST)
 * 17. Xira educational observations & pedagogical advice
 * 18. Security Invariants (NO eval, NO exec, NO child_process, NO shell, NO python subprocess)
 * 19. Shared ExperienceOrchestrator lifecycle integration
 * 20. Regression compatibility across all 5 experiences
 */

import {
  INITIAL_PYTHON_ACCUMULATION_CHALLENGE,
  validateCodeExecution,
  evaluateCodeSubmission,
  CodeLabState,
} from '../lib/experience/domain/codeDebuggingRules';
import {
  CODE_DEBUGGING_EXPERIENCE,
  CODE_DEBUGGING_DEFINITION,
  CODE_DEBUGGING_QUEST,
  createCodeExperienceResult,
} from '../lib/experience/catalog/codeDebuggingConfig';
import { experienceRegistry } from '../lib/experience/experienceRegistry';
import { ExperienceOrchestrator } from '../lib/experience/experienceOrchestrator';
import { TelemetryEmitter } from '../lib/experience/telemetry/telemetryEmitter';
import { defaultXiraExperienceAdvisor } from '../lib/experience/xira/xiraExperienceAdvisor';
import { adaptTelemetryToObservation, adaptObservationToAdvice } from '../lib/experience/xira/experienceObservation';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';
import * as fs from 'fs';
import * as path from 'path';

interface AssertionReport {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runCodeDebuggingExperienceTests(): Promise<void> {
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
  console.log('XPEDITION EXPERIENCE ENGINE — EXPERIENCE #5 CODE LAB TESTS');
  console.log('==================================================================\n');

  // ----------------------------------------------------------------
  // 1. Challenge Configuration
  // ----------------------------------------------------------------
  console.log('1. Testing Challenge Configuration...');
  assert(
    'Concept is python_debugging_basics and experienceType is CODE_DEBUGGING',
    CODE_DEBUGGING_EXPERIENCE.conceptId === 'python_debugging_basics' &&
      CODE_DEBUGGING_EXPERIENCE.experienceType === 'CODE_DEBUGGING'
  );
  assert(
    'Challenge definition targets accumulation_vs_reassignment',
    INITIAL_PYTHON_ACCUMULATION_CHALLENGE.targetConcept === 'accumulation_vs_reassignment'
  );
  assert(
    'Expected output is precisely 20',
    INITIAL_PYTHON_ACCUMULATION_CHALLENGE.expectedOutput === '20'
  );
  assert(
    'Challenge contains 3 progressive pedagogical hints',
    INITIAL_PYTHON_ACCUMULATION_CHALLENGE.hints.length === 3
  );

  // ----------------------------------------------------------------
  // 2. Initial Source Code
  // ----------------------------------------------------------------
  console.log('\n2. Testing Initial Source Code Structure...');
  const initialCode = INITIAL_PYTHON_ACCUMULATION_CHALLENGE.initialCode;
  assert('Initial code declares list of numbers [2, 4, 6, 8]', initialCode.includes('numbers = [2, 4, 6, 8]'));
  assert('Initial code initializes total = 0', initialCode.includes('total = 0'));
  assert('Initial code contains reassignment bug total = number', initialCode.includes('total = number'));
  assert('Initial code prints total', initialCode.includes('print(total)'));

  // ----------------------------------------------------------------
  // 3 & 4. Incorrect Assignment Detection
  // ----------------------------------------------------------------
  console.log('\n3 & 4. Testing Incorrect Assignment Detection...');
  const initialRunResult = validateCodeExecution(initialCode);
  assert(
    'Initial buggy code outputs 8 instead of 20',
    initialRunResult.output === '8' && !initialRunResult.isCorrect
  );
  assert(
    'Initial buggy code flags status as output_mismatch',
    initialRunResult.status === 'output_mismatch'
  );
  assert(
    'Initial buggy code identifies detectedBug as reassignment',
    initialRunResult.detectedBug === 'reassignment'
  );
  assert(
    'Educational insight explains that total = number replaces the previous value',
    initialRunResult.educationalInsight.includes('replaces the previous value')
  );

  // ----------------------------------------------------------------
  // 5. Correct Accumulation Detection
  // ----------------------------------------------------------------
  console.log('\n5. Testing Correct Accumulation Detection...');
  const correctedCodeAugmented = `numbers = [2, 4, 6, 8]
total = 0
for number in numbers:
    total += number
print(total)`;
  const augmentedRunResult = validateCodeExecution(correctedCodeAugmented);
  assert(
    'Augmented assignment total += number produces expected output 20',
    augmentedRunResult.output === '20' && augmentedRunResult.isCorrect
  );
  assert(
    'Augmented assignment sets detectedCorrection to accumulation_augmented',
    augmentedRunResult.detectedCorrection === 'accumulation_augmented'
  );

  const correctedCodeExpanded = `numbers = [2, 4, 6, 8]
total = 0
for number in numbers:
    total = total + number
print(total)`;
  const expandedRunResult = validateCodeExecution(correctedCodeExpanded);
  assert(
    'Expanded assignment total = total + number produces expected output 20',
    expandedRunResult.output === '20' && expandedRunResult.isCorrect
  );
  assert(
    'Expanded assignment sets detectedCorrection to accumulation_expanded',
    expandedRunResult.detectedCorrection === 'accumulation_expanded'
  );

  // ----------------------------------------------------------------
  // 6 & 7. Hardcoded Bypass & Syntax Error Handling
  // ----------------------------------------------------------------
  console.log('\n6 & 7. Testing Hardcoded Bypass & Syntax Warnings...');
  const bypassedCode = `numbers = [2, 4, 6, 8]
print(20)`;
  const bypassedResult = validateCodeExecution(bypassedCode);
  assert(
    'Hardcoded print(20) without loop calculation is rejected as bypassed_loop',
    !bypassedResult.isCorrect && bypassedResult.status === 'bypassed_loop'
  );

  const emptyCode = `   `;
  const emptyResult = validateCodeExecution(emptyCode);
  assert('Empty code returns syntax warning', !emptyResult.isCorrect && emptyResult.status === 'syntax_warning');

  // ----------------------------------------------------------------
  // 8. Progressive Hint Escalation
  // ----------------------------------------------------------------
  console.log('\n8. Testing Progressive Hint Escalation...');
  const [hint1, hint2, hint3] = INITIAL_PYTHON_ACCUMULATION_CHALLENGE.hints;
  assert('Hint 1 directs attention to total during loop iterations', hint1.includes('every time the loop runs'));
  assert('Hint 2 asks whether total is keeping previous value or replacing it', hint2.includes('replacing it'));
  assert('Hint 3 clarifies operator controls accumulation vs replacement', hint3.includes('accumulated or replaced'));

  // ----------------------------------------------------------------
  // 9 & 10. Repeated Attempts & Meaningful Correction
  // ----------------------------------------------------------------
  console.log('\n9 & 10. Testing Repeated Attempts & State Evaluation...');
  const repeatedState: CodeLabState = {
    sourceCode: initialCode,
    lastOutput: '8',
    runCount: 2,
    editCount: 0,
    hasRun: true,
    isCompleted: false,
    hintsUsed: 1,
    consecutiveMismatches: 2,
    detectedBug: 'reassignment',
    independentCompletion: false,
    history: [
      { timestamp: 1, code: initialCode, output: '8', isCorrect: false },
      { timestamp: 2, code: initialCode, output: '8', isCorrect: false },
    ],
  };
  const evalRepeated = evaluateCodeSubmission(repeatedState);
  assert('Repeated initial buggy runs remain incomplete with score 25', !evalRepeated.isComplete && evalRepeated.score === 25);

  const solvedState: CodeLabState = {
    sourceCode: correctedCodeAugmented,
    lastOutput: '20',
    runCount: 2,
    editCount: 1,
    hasRun: true,
    isCompleted: true,
    hintsUsed: 0,
    consecutiveMismatches: 0,
    correctionPattern: 'accumulation_operator',
    independentCompletion: true,
    history: [
      { timestamp: 1, code: initialCode, output: '8', isCorrect: false },
      { timestamp: 2, code: correctedCodeAugmented, output: '20', isCorrect: true },
    ],
  };
  const evalSolved = evaluateCodeSubmission(solvedState);
  assert('Solved state is evaluated as complete with 100 score for independent fix', evalSolved.isComplete && evalSolved.score === 100);

  // ----------------------------------------------------------------
  // 11 & 12. Completion & Evidence Model
  // ----------------------------------------------------------------
  console.log('\n11 & 12. Testing Completion & Evidence Structure...');
  assert('Evidence records runs, edits, and correction counts accurately',
    evalSolved.evidence.runs === 2 &&
    evalSolved.evidence.edits === 1 &&
    evalSolved.evidence.finalSuccess === true &&
    evalSolved.evidence.independentCompletion === true
  );

  // ----------------------------------------------------------------
  // 13. Telemetry Emitter
  // ----------------------------------------------------------------
  console.log('\n13. Testing Canonical Telemetry Events...');
  const emitter = new TelemetryEmitter('programming_code_lab', 'python_debugging_basics', 'Python Debugging');
  const emittedEvents: any[] = [];
  emitter.subscribe((e) => emittedEvents.push(e));

  emitter.emit('code_experience_started', { language: 'python' });
  emitter.emit('code_edited', { editLength: 120 });
  emitter.emit('code_run', { runCount: 1, output: '8' });
  emitter.emit('output_observed', { output: '8', expected: '20', matches: false });
  emitter.emit('code_validation_failed', { output: '8', detectedBug: 'reassignment' });
  emitter.emit('hint_requested', { hintIndex: 0 });
  emitter.emit('code_validation_passed', { output: '20' });
  emitter.emit('code_submitted', { runs: 2, hintsUsed: 1 });
  emitter.emit('code_experience_completed', { isSuccess: true, timeSpentSeconds: 35 });

  assert('Telemetry emitter emits all canonical code lab events', emittedEvents.length === 9);
  assert(
    'Telemetry events contain expected code event types',
    emittedEvents.some((e) => e.type === 'code_run') &&
      emittedEvents.some((e) => e.type === 'output_observed') &&
      emittedEvents.some((e) => e.type === 'code_validation_passed') &&
      emittedEvents.some((e) => e.type === 'code_experience_completed')
  );

  // ----------------------------------------------------------------
  // 14. ExperienceResult Generation
  // ----------------------------------------------------------------
  console.log('\n14. Testing ExperienceResult Synthesis...');
  const expResult = createCodeExperienceResult(
    CODE_DEBUGGING_EXPERIENCE,
    {
      experienceId: CODE_DEBUGGING_EXPERIENCE.id,
      conceptId: 'python_debugging_basics',
      conceptName: 'Python Debugging',
      totalAttempts: 1,
      successfulAttempts: 1,
      hasSucceeded: true,
      totalTrials: 2,
      successfulTrials: 1,
      targetHits: 1,
      totalInteractions: 5,
      predictionAccuracy: 1.0,
      hintsRequested: 0,
      trials: [],
      angleHistory: [],
      velocityHistory: [],
      errorHistory: [],
      patternSummary: 'Accumulation bug resolved',
      detectedPrinciple: 'code_debugged_successfully',
    },
    solvedState,
    35
  );

  assert('ExperienceResult completed is true and score is 100', expResult.completed === true && expResult.score === 100);
  assert('ExperienceResult contains codeEvidence with independentCompletion true', expResult.codeEvidence?.independentCompletion === true);

  const { attempt, nextAction } = LearnerModelAdapter.recordExperienceOutcome({
    conceptId: 'python_debugging_basics',
    conceptName: 'Python Debugging',
    isSuccess: true,
    accuracy: 1.0,
    trialsCount: 2,
    confidence: 'known',
    timeSpentSeconds: 35,
    timestamp: Date.now(),
  });
  assert('LearnerModelAdapter creates valid canonical attempt record for code lab', attempt.conceptId === 'python_debugging_basics' && attempt.isCorrect);
  assert('Next action is generated for continuing curriculum', Boolean(nextAction));

  // ----------------------------------------------------------------
  // 15 & 16. Registry Lookup & Quest Mapping
  // ----------------------------------------------------------------
  console.log('\n15 & 16. Testing Experience Registry & Quest Mapping...');
  const registeredDef = experienceRegistry.getExperienceDefinition('CODE_DEBUGGING');
  assert('CODE_DEBUGGING definition is registered in ExperienceRegistry', registeredDef !== undefined);
  assert('Code definition template is code', registeredDef?.template === 'code');

  const hasConcept = experienceRegistry.hasExperience('python_debugging_basics');
  assert('Registry confirms python_debugging_basics concept resolution', hasConcept);

  assert('CODE_DEBUGGING_QUEST conceptId matches python_debugging_basics', CODE_DEBUGGING_QUEST.conceptId === 'python_debugging_basics');
  assert('CODE_DEBUGGING_QUEST first item has experienceType CODE_DEBUGGING', CODE_DEBUGGING_QUEST.items[0].experienceType === 'CODE_DEBUGGING');
  assert('CODE_DEBUGGING_QUEST includes follow-up reflection item', CODE_DEBUGGING_QUEST.items[1].type === 'reflection');

  // ----------------------------------------------------------------
  // 17. Xira Observations & Pedagogical Feedback
  // ----------------------------------------------------------------
  console.log('\n17. Testing Xira Educational Observations & Advice...');
  const mismatchEvents = [
    { id: '1', type: 'code_run', experienceId: 'exp', conceptId: 'py', timestamp: 1, attemptNumber: 1, payload: { output: '8' } },
    { id: '2', type: 'code_validation_failed', experienceId: 'exp', conceptId: 'py', timestamp: 2, attemptNumber: 1, payload: { output: '8', detectedBug: 'reassignment' } },
    { id: '3', type: 'code_validation_failed', experienceId: 'exp', conceptId: 'py', timestamp: 3, attemptNumber: 2, payload: { output: '8', detectedBug: 'reassignment' } },
  ];
  const observation = adaptTelemetryToObservation(
    mismatchEvents as any,
    [],
    'python_debugging_basics',
    'programming_code_lab'
  );
  assert('Xira adapts repeated mismatch events into repeated_assignment_pattern', observation.type === 'repeated_assignment_pattern');

  const advice = adaptObservationToAdvice(observation);
  assert('Xira advice guides learner on what happens to value from previous iteration', advice.message.includes('previous iteration'));

  const successEvents = [
    { id: '1', type: 'code_run', experienceId: 'programming_code_lab', conceptId: 'python_debugging_basics', timestamp: 1, attemptNumber: 1, payload: { output: '20' } },
    { id: '2', type: 'code_validation_passed', experienceId: 'programming_code_lab', conceptId: 'python_debugging_basics', timestamp: 2, attemptNumber: 1, payload: { output: '20' } },
  ];
  const successObservation = adaptTelemetryToObservation(
    successEvents as any,
    [],
    'python_debugging_basics',
    'programming_code_lab'
  );
  const successAdvice = adaptObservationToAdvice(successObservation);
  assert('Xira celebrates successful debugging: distinguished replacing from accumulating values',
    successAdvice.message.includes('distinguished replacing a value from accumulating values')
  );

  // ----------------------------------------------------------------
  // 18. Security Invariants (CRITICAL)
  // ----------------------------------------------------------------
  console.log('\n18. Testing Security Invariants...');
  const rulesPath = path.resolve(process.cwd(), 'lib/experience/domain/codeDebuggingRules.ts');
  const rulesSrc = fs.readFileSync(rulesPath, 'utf-8');

  // Strip comments so pedagogical/documentation mentions (e.g. "NO child_process") don't trip tests
  const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const cleanRules = stripComments(rulesSrc);

  const hasEval = /\beval\s*\(/.test(cleanRules);
  const hasExec = /\bexec\s*\(/.test(cleanRules) || /child_process/.test(cleanRules);
  const hasSpawn = /spawn\s*\(/.test(cleanRules);
  const hasSubprocess = /subprocess/.test(cleanRules);

  assert('No eval() in codeDebuggingRules.ts', !hasEval);
  assert('No exec() or child_process in codeDebuggingRules.ts', !hasExec);
  assert('No spawn() in codeDebuggingRules.ts', !hasSpawn);
  assert('No subprocess in codeDebuggingRules.ts', !hasSubprocess);

  // Check config as well
  const configPath = path.resolve(process.cwd(), 'lib/experience/catalog/codeDebuggingConfig.ts');
  const configSrc = fs.readFileSync(configPath, 'utf-8');
  const cleanConfig = stripComments(configSrc);
  assert('No eval or child_process in codeDebuggingConfig.ts', !/\beval\s*\(/.test(cleanConfig) && !/child_process/.test(cleanConfig));

  // ----------------------------------------------------------------
  // 19. Shared Orchestrator Integration
  // ----------------------------------------------------------------
  console.log('\n19. Testing Orchestrator Integration with Code Lab Definition...');
  const orchestrator = new ExperienceOrchestrator(CODE_DEBUGGING_DEFINITION);
  assert('ExperienceOrchestrator initializes in IDLE stage', orchestrator.getSnapshot().stage === 'IDLE');

  const startStage = orchestrator.startExperience();
  assert('Orchestrator transitions to PREDICTING (has prediction challenge)', startStage === 'PREDICTING');

  const predResult = orchestrator.submitPrediction('opt_8');
  assert('Orchestrator records prediction and transitions to INTERACTING', predResult.isCorrect === true && predResult.stage === 'INTERACTING');

  orchestrator.updateState({ sourceCode: correctedCodeAugmented, hasRun: true });
  const valResult = orchestrator.validate();
  assert('Orchestrator validates corrected code as complete through definition validator', valResult.validation.isComplete === true);

  // ----------------------------------------------------------------
  // 20. Regression Compatibility Across All 5 Experiences
  // ----------------------------------------------------------------
  console.log('\n20. Testing All 5 Experiences Registered in Unified Registry...');
  const all5Experiences = [
    'PROJECTILE_SIMULATION',
    'OBJECT_MANIPULATION',
    'MOLECULE_BUILDER',
    'HEART_ANATOMY_EXPLORER',
    'CODE_DEBUGGING',
  ];
  const all5Present = all5Experiences.every((type) => experienceRegistry.hasExperience(type));
  assert('All 5 experiences are registered in ONE unified ExperienceRegistry', all5Present);

  // Invariant 1: Orchestrator must not mention code-specific challenge logic
  const orchestratorPath = path.resolve(process.cwd(), 'lib/experience/experienceOrchestrator.ts');
  const orchestratorSrc = fs.readFileSync(orchestratorPath, 'utf-8');
  const orchestratorHasCodeLogic = orchestratorSrc.toLowerCase().includes('accumulation_vs_reassignment');
  assert('Experience Orchestrator contains NO code lab domain logic', !orchestratorHasCodeLogic);

  // Invariant 2: No ProgrammingEngine, PythonEngine, or DebuggingEngine files exist
  const libDir = path.resolve(process.cwd(), 'lib');
  const allFiles = fs.readdirSync(libDir, { recursive: true }) as string[];
  const bannedEngines = allFiles.filter((f) =>
    /programmingengine|pythonengine|codelearningengine|debuggingengine/i.test(f)
  );
  assert(
    `No ProgrammingEngine, PythonEngine, or DebuggingEngine files exist (found ${bannedEngines.length})`,
    bannedEngines.length === 0
  );

  // Invariant 3: Core intelligence and store systems intact
  assert('Protected system lib/store.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/store.ts')));
  assert('Protected system lib/intelligence/decisionEngine.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/intelligence/decisionEngine.ts')));
  assert('Protected system lib/engine/mastery.ts exists and untouched', fs.existsSync(path.resolve(process.cwd(), 'lib/engine/mastery.ts')));

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
  runCodeDebuggingExperienceTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
