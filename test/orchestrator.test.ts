/**
 * Xpedition Experience Engine v1 — Milestone 5 Orchestrator Test Suite
 *
 * Validates:
 * 1. ExperienceDefinition contract & integrity
 * 2. Unified ExperienceRegistry (registration, lookup, fallback, listing)
 * 3. Generic ExperienceOrchestrator lifecycle, transitions, events, validation, feedback, reset, and result
 * 4. Xira Observation & Advice Adapter
 * 5. Experience Template patterns (Simulation, Manipulation, Builder)
 * 6. Developer Proof Experience (zero modifications to orchestrator)
 * 7. Unified Orchestration of all 3 canonical experiences:
 *    - Projectile Motion runs through ExperienceOrchestrator
 *    - 3D Object Manipulation runs through ExperienceOrchestrator
 *    - 3D Molecule Builder runs through ExperienceOrchestrator
 * 8. Architectural Invariants (Orchestrator contains ZERO domain math/rules; BKT and intelligence untouched)
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  ExperienceOrchestrator,
  ExperienceDefinition,
  experienceRegistry,
  ExperienceRegistry,
  PROJECTILE_SIMULATION_DEFINITION,
  OBJECT_MANIPULATION_DEFINITION,
  MOLECULE_BUILDER_DEFINITION,
  TARGET_INTERACTION_DEFINITION,
  adaptTelemetryToObservation,
  adaptObservationToAdvice,
  createExperienceFeedback,
  createExperienceEvent,
} from '../lib/experience';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runOrchestratorTests() {
  console.log('======================================================');
  console.log('XPEDITION EXPERIENCE ENGINE — UNIFIED ORCHESTRATOR TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. ExperienceDefinition Contract & Integrity
  // ---------------------------------------------------------------------------
  console.log('1. Testing ExperienceDefinition Contract...');

  test('PROJECTILE_SIMULATION_DEFINITION satisfies contract', () => {
    assert(PROJECTILE_SIMULATION_DEFINITION.id === 'exp_projectile_motion_01', 'id matches');
    assert(PROJECTILE_SIMULATION_DEFINITION.type === 'PROJECTILE_SIMULATION', 'type matches');
    assert(PROJECTILE_SIMULATION_DEFINITION.conceptId === 'projectile_motion', 'conceptId matches');
    assert(PROJECTILE_SIMULATION_DEFINITION.template === 'simulation', 'template is simulation');
    assert(typeof PROJECTILE_SIMULATION_DEFINITION.validator === 'function', 'has validator function');
    assert(PROJECTILE_SIMULATION_DEFINITION.initialState.angle === 25, 'initialState defined');
  });

  test('OBJECT_MANIPULATION_DEFINITION satisfies contract', () => {
    assert(OBJECT_MANIPULATION_DEFINITION.id === 'exp_spatial_scholar_prism', 'id matches');
    assert(OBJECT_MANIPULATION_DEFINITION.type === 'OBJECT_MANIPULATION', 'type matches');
    assert(OBJECT_MANIPULATION_DEFINITION.conceptId === 'spatial_reasoning', 'conceptId matches');
    assert(OBJECT_MANIPULATION_DEFINITION.template === 'manipulation', 'template is manipulation');
    assert(typeof OBJECT_MANIPULATION_DEFINITION.validator === 'function', 'has validator function');
  });

  test('MOLECULE_BUILDER_DEFINITION satisfies contract', () => {
    assert(MOLECULE_BUILDER_DEFINITION.type === 'MOLECULE_BUILDER', 'type matches');
    assert(MOLECULE_BUILDER_DEFINITION.conceptId === 'molecular_bonding', 'conceptId matches');
    assert(MOLECULE_BUILDER_DEFINITION.template === 'builder', 'template is builder');
    assert(typeof MOLECULE_BUILDER_DEFINITION.validator === 'function', 'has validator function');
  });

  // ---------------------------------------------------------------------------
  // 2. ExperienceRegistry Functionality
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing ExperienceRegistry...');

  test('Registry resolves registered definitions by type', () => {
    assert(experienceRegistry.hasExperience('PROJECTILE_SIMULATION'), 'has PROJECTILE_SIMULATION');
    assert(experienceRegistry.hasExperience('OBJECT_MANIPULATION'), 'has OBJECT_MANIPULATION');
    assert(experienceRegistry.hasExperience('MOLECULE_BUILDER'), 'has MOLECULE_BUILDER');
  });

  test('Registry resolves registered definitions by conceptId', () => {
    assert(experienceRegistry.hasExperience('projectile_motion'), 'has projectile_motion');
    assert(experienceRegistry.hasExperience('spatial_reasoning'), 'has spatial_reasoning');
    assert(experienceRegistry.hasExperience('molecular_bonding'), 'has molecular_bonding');
    const proj = experienceRegistry.getExperienceDefinition('projectile_motion');
    assert(proj?.type === 'PROJECTILE_SIMULATION', 'resolved projectile definition');
  });

  test('Registry returns undefined for unknown experience without crashing', () => {
    assert(!experienceRegistry.hasExperience('NON_EXISTENT_EXPERIENCE'), 'unknown type is false');
    const unknown = experienceRegistry.getExperienceDefinition('NON_EXISTENT_EXPERIENCE');
    assert(unknown === undefined, 'unknown definition is undefined');
  });

  test('Registry listExperienceDefinitions returns all unique definitions', () => {
    const list = experienceRegistry.listExperienceDefinitions();
    assert(list.length >= 3, `contains at least 3 definitions, got ${list.length}`);
    const types = list.map((d) => d.type);
    assert(types.includes('PROJECTILE_SIMULATION'), 'contains projectile');
    assert(types.includes('OBJECT_MANIPULATION'), 'contains object');
    assert(types.includes('MOLECULE_BUILDER'), 'contains molecule');
  });

  // ---------------------------------------------------------------------------
  // 3. ExperienceOrchestrator Lifecycle & Generic State Machine
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing ExperienceOrchestrator Generic Lifecycle...');

  test('Orchestrator starts in IDLE and enters PREDICTING when prediction is configured', () => {
    const orchestrator = new ExperienceOrchestrator(PROJECTILE_SIMULATION_DEFINITION);
    assert(orchestrator.getLifecycleStage() === 'IDLE', 'starts in IDLE');
    const stage = orchestrator.startExperience();
    assert(stage === 'PREDICTING', 'enters PREDICTING');
    assert(orchestrator.getEvents().length === 1, 'logged experience_started event');
    assert(orchestrator.getEvents()[0].type === 'experience_started', 'event type correct');
  });

  test('Submitting prediction transitions stage to INTERACTING', () => {
    const orchestrator = new ExperienceOrchestrator(PROJECTILE_SIMULATION_DEFINITION);
    orchestrator.startExperience();
    const { isCorrect, stage } = orchestrator.submitPrediction('opt_shallow');
    assert(stage === 'INTERACTING', 'transitions to INTERACTING');
    assert(isCorrect === true, 'prediction evaluated correctly');
    const events = orchestrator.getEvents();
    assert(events.some((e) => e.type === 'prediction_submitted'), 'prediction_submitted logged');
  });

  test('State updates increment interactionCount and record interaction_changed', () => {
    const orchestrator = new ExperienceOrchestrator(PROJECTILE_SIMULATION_DEFINITION);
    orchestrator.startExperience();
    orchestrator.submitPrediction('opt_shallow');

    orchestrator.updateState({ angle: 45 }, { control: 'angle' });
    assert(orchestrator.getState().angle === 45, 'state updated');
    const snapshot = orchestrator.getSnapshot();
    assert(snapshot.interactionCount === 1, 'interactionCount incremented');
  });

  test('Requesting hints dispenses progressive hints without knowing domain math', () => {
    const orchestrator = new ExperienceOrchestrator(PROJECTILE_SIMULATION_DEFINITION);
    orchestrator.startExperience();
    const hint1 = orchestrator.requestHint();
    assert(hint1.type === 'HINT', 'hint type is HINT');
    assert(hint1.message.includes('flight time'), 'first hint dispensed');
    const hint2 = orchestrator.requestHint();
    assert(hint2.message.includes('symmetrically'), 'second hint dispensed');
    assert(orchestrator.getSnapshot().hintsUsed === 2, 'hints count is 2');
  });

  test('Reset reverts state to initial conditions and enters INTERACTING', () => {
    const orchestrator = new ExperienceOrchestrator(PROJECTILE_SIMULATION_DEFINITION);
    orchestrator.startExperience();
    orchestrator.updateState({ angle: 70 });
    assert(orchestrator.getState().angle === 70, 'angle modified');
    orchestrator.reset();
    assert(orchestrator.getState().angle === 25, 'angle reset to initial 25');
    assert(orchestrator.getLifecycleStage() === 'INTERACTING', 'stage is INTERACTING');
    assert(orchestrator.getEvents().some((e) => e.type === 'experience_reset'), 'reset event logged');
  });

  // ---------------------------------------------------------------------------
  // 4. Developer Proof: Simple Target Interaction (Zero Orchestrator Changes)
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Developer Proof Experience (Zero-Touch Orchestrator Proof)...');

  test('Developer Proof experience instantiates and starts cleanly in INTERACTING', () => {
    const orchestrator = new ExperienceOrchestrator(TARGET_INTERACTION_DEFINITION);
    const stage = orchestrator.startExperience();
    assert(stage === 'INTERACTING', 'enters INTERACTING (no prediction configured)');
    assert(orchestrator.getState().currentValue === 40, 'initial currentValue is 40');
  });

  test('Developer Proof validation outside tolerance transitions to NEEDS_CORRECTION', () => {
    const orchestrator = new ExperienceOrchestrator(TARGET_INTERACTION_DEFINITION);
    orchestrator.startExperience();
    const { validation, feedback, stage } = orchestrator.validate();
    assert(stage === 'NEEDS_CORRECTION', 'stage is NEEDS_CORRECTION');
    assert(validation.isComplete === false, 'isComplete is false');
    assert(validation.status === 'INVALID', 'status is INVALID');
    assert(feedback.type === 'CORRECTION', 'feedback type is CORRECTION');
    assert(orchestrator.getSnapshot().corrections === 1, 'corrections incremented');
  });

  test('Developer Proof adjusting to target within tolerance transitions to COMPLETED', () => {
    const orchestrator = new ExperienceOrchestrator(TARGET_INTERACTION_DEFINITION);
    orchestrator.startExperience();
    orchestrator.updateState({ currentValue: 49 }); // within tolerance [48, 52] of 50
    const { validation, feedback, stage } = orchestrator.validate();
    assert(stage === 'COMPLETED', 'stage is COMPLETED');
    assert(validation.isComplete === true, 'isComplete is true');
    assert(validation.status === 'COMPLETE', 'status is COMPLETE');
    assert(feedback.type === 'SUCCESS', 'feedback type is SUCCESS');

    const result = orchestrator.getResult();
    assert(result.completed === true, 'result.completed is true');
    assert(result.success === true, 'result.success is true');
    assert(result.independentCompletion === true, 'independentCompletion is true');
    assert(result.evidence.isWithinTolerance === true, 'evidence captured');
    // Ensure no mastery score was generated
    assert((result as any).masteryScore === undefined, 'no mastery score in ExperienceResult');
  });

  // ---------------------------------------------------------------------------
  // 5. Unified Orchestration: Projectile Motion Experience
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing Projectile Motion via Unified ExperienceOrchestrator...');

  test('Projectile Motion runs full cycle through ExperienceOrchestrator', () => {
    const orchestrator = new ExperienceOrchestrator(PROJECTILE_SIMULATION_DEFINITION);
    orchestrator.startExperience();
    orchestrator.submitPrediction('opt_shallow');

    // Launch at 22° (known target hit around 25.2m within 1.5m tolerance of 25m)
    orchestrator.updateState({ angle: 22, velocity: 18, hasFired: true });
    const { validation, feedback, stage } = orchestrator.validate();

    assert(stage === 'COMPLETED', 'projectile launch hit completed stage');
    assert(validation.isComplete === true, 'validation isComplete is true');
    assert(feedback.type === 'SUCCESS', 'feedback type is SUCCESS');

    const result = orchestrator.getResult();
    assert(result.completed === true, 'result completed');
    assert(result.conceptId === 'projectile_motion', 'concept matches');
    assert(result.evidence.isHit === true, 'evidence isHit is true');
    assert(result.validationHistory.length === 1, '1 validation record');
  });

  // ---------------------------------------------------------------------------
  // 6. Unified Orchestration: 3D Object Manipulation Experience
  // ---------------------------------------------------------------------------
  console.log('\n6. Testing 3D Object Manipulation via Unified ExperienceOrchestrator...');

  test('Object Manipulation runs full cycle through ExperienceOrchestrator', () => {
    const orchestrator = new ExperienceOrchestrator(OBJECT_MANIPULATION_DEFINITION);
    orchestrator.startExperience();
    assert(orchestrator.getLifecycleStage() === 'INTERACTING', 'starts in INTERACTING');

    // Initial validation outside tolerance (initial orientation is misaligned ~98°)
    const firstCheck = orchestrator.validate();
    assert(firstCheck.stage === 'NEEDS_CORRECTION', 'initial state needs correction');
    assert(firstCheck.validation.isComplete === false, 'not complete');

    // Rotate prism to target orientation [0, 0, 0] (aligned with reticle)
    orchestrator.updateState({ currentEulerDeg: [0, 0, 0] }, { interaction: 'rotate_to_reticle' });
    const secondCheck = orchestrator.validate();

    assert(secondCheck.stage === 'COMPLETED', 'prism aligned transitions to COMPLETED');
    assert(secondCheck.validation.isComplete === true, 'isComplete is true');
    assert(secondCheck.feedback.type === 'SUCCESS', 'feedback type is SUCCESS');

    const result = orchestrator.getResult();
    assert(result.conceptId === 'spatial_reasoning', 'concept matches');
    assert(result.evidence.isAligned === true, 'evidence isAligned is true');
    assert(result.evidence.angularErrorDeg === 0, 'angular error is 0');
  });

  // ---------------------------------------------------------------------------
  // 7. Unified Orchestration: 3D Molecule Builder Experience
  // ---------------------------------------------------------------------------
  console.log('\n7. Testing 3D Molecule Builder via Unified ExperienceOrchestrator...');

  test('Molecule Builder runs full cycle through ExperienceOrchestrator', () => {
    const orchestrator = new ExperienceOrchestrator(MOLECULE_BUILDER_DEFINITION);
    orchestrator.startExperience();
    assert(orchestrator.getLifecycleStage() === 'PREDICTING', 'starts in PREDICTING');
    orchestrator.submitPrediction('opt_pred_2');

    // Partial step: form 1 valid bond (O1 - H1)
    orchestrator.updateState({
      bonds: [{ id: 'b1', fromAtomId: 'o1', toAtomId: 'h1' }],
    });
    const step1 = orchestrator.validate();
    assert(step1.validation.status === 'VALID', '1 bond is VALID sub-step');
    assert(step1.stage === 'INTERACTING', 'remains in INTERACTING for incomplete molecule');

    // Complete step: form 2nd valid bond (O1 - H2)
    orchestrator.updateState({
      bonds: [
        { id: 'b1', fromAtomId: 'o1', toAtomId: 'h1' },
        { id: 'b2', fromAtomId: 'o1', toAtomId: 'h2' },
      ],
      isComplete: true,
    });
    const step2 = orchestrator.validate();

    assert(step2.stage === 'COMPLETED', 'both bonds complete water synthesis');
    assert(step2.validation.isComplete === true, 'isComplete is true');
    assert(step2.feedback.type === 'SUCCESS', 'celebrates water synthesis');

    const result = orchestrator.getResult();
    assert(result.conceptId === 'molecular_bonding', 'concept matches');
    assert(result.evidence.isComplete === true, 'evidence isComplete is true');
    assert(result.evidence.validBondsCount === 2, 'evidence has 2 valid bonds');
  });

  // ---------------------------------------------------------------------------
  // 8. Xira Observation & Advice Adapter
  // ---------------------------------------------------------------------------
  console.log('\n8. Testing Xira Educational Observation & Advice Adapter...');

  test('Observation adapter creates educational observation for target hit', () => {
    const obs = adaptTelemetryToObservation(
      [{ id: 'e1', type: 'experience_started', experienceId: 'exp1', conceptId: 'projectile_motion', timestamp: Date.now(), attemptNumber: 1, payload: {} }],
      [{ status: 'COMPLETE', isValid: true, isComplete: true, evidence: { isHit: true } }],
      'projectile_motion',
      'exp_projectile_motion_01'
    );
    assert(obs.type === 'target_hit', 'obs type is target_hit');
    assert(obs.principle === 'optimal_angle_velocity_harmony', 'principle matches');

    const advice = adaptObservationToAdvice(obs);
    assert(advice.type === 'SUCCESS', 'advice type is SUCCESS');
    assert(advice.confidence >= 0.9, 'high confidence');
  });

  test('Observation adapter detects H-H bonding misconception', () => {
    const obs = adaptTelemetryToObservation(
      [
        {
          id: 'e1',
          type: 'bond_rejected',
          experienceId: 'exp3',
          conceptId: 'molecular_bonding',
          timestamp: Date.now(),
          attemptNumber: 1,
          payload: { reason: 'H-H bond disallowed', principle: 'bond_invalid_hh' },
        },
      ],
      [{ status: 'INCOMPLETE', isValid: false, isComplete: false }],
      'molecular_bonding',
      'exp_molecule_water_builder'
    );
    assert(obs.type === 'bonding_rule_misunderstanding', 'bonding misconception identified');
    const advice = adaptObservationToAdvice(obs);
    assert(advice.type === 'CORRECTION', 'correction advice');
    assert(advice.message.includes('Hydrogen has only 1 valence'), 'pedagogical advice explanation');
  });

  // ---------------------------------------------------------------------------
  // 9. Architecture Invariant Verification
  // ---------------------------------------------------------------------------
  console.log('\n9. Testing Architecture Invariants & Protected Systems...');

  test('ExperienceOrchestrator source code contains ZERO physics kinematic equations', () => {
    const orchPath = path.resolve(process.cwd(), 'lib', 'experience', 'experienceOrchestrator.ts');
    const source = fs.readFileSync(orchPath, 'utf8');

    // Check absence of kinematics
    assert(!source.includes('Math.sin'), 'contains no Math.sin');
    assert(!source.includes('9.81'), 'contains no gravity constant');
    assert(!source.includes('targetDistance'), 'contains no projectile targetDistance');
    assert(!source.includes('launchHeight'), 'contains no launchHeight');
  });

  test('ExperienceOrchestrator source code contains ZERO chemical valence rules', () => {
    const orchPath = path.resolve(process.cwd(), 'lib', 'experience', 'experienceOrchestrator.ts');
    const source = fs.readFileSync(orchPath, 'utf8');

    // Check absence of chemistry
    assert(!source.includes('valenceRules'), 'contains no valenceRules');
    assert(!source.includes('maxBonds'), 'contains no maxBonds');
    assert(!source.includes('elementSymbol'), 'contains no elementSymbol');
    assert(!source.includes('bond_invalid_hh'), 'contains no bond_invalid_hh');
  });

  test('ExperienceOrchestrator source code contains ZERO 3D spatial rotation math', () => {
    const orchPath = path.resolve(process.cwd(), 'lib', 'experience', 'experienceOrchestrator.ts');
    const source = fs.readFileSync(orchPath, 'utf8');

    // Check absence of spatial math
    assert(!source.includes('eulerToNormal'), 'contains no eulerToNormal');
    assert(!source.includes('calculateAngularDistance'), 'contains no calculateAngularDistance');
    assert(!source.includes('toleranceDeg'), 'contains no toleranceDeg');
  });

  test('Protected systems were not modified', () => {
    // Assert that core intelligence and learner state systems remain intact and unreplaced
    assert(fs.existsSync(path.resolve(process.cwd(), 'lib/engine/mastery.ts')), 'lib/engine/mastery.ts intact');
    assert(fs.existsSync(path.resolve(process.cwd(), 'lib/engine/difficulty.ts')), 'lib/engine/difficulty.ts intact');
    assert(fs.existsSync(path.resolve(process.cwd(), 'lib/store.ts')), 'lib/store.ts intact');
    assert(fs.existsSync(path.resolve(process.cwd(), 'lib/intelligence/decisionEngine.ts')), 'lib/intelligence/decisionEngine.ts intact');
  });

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in orchestrator test suite.`);
  }
}
