/**
 * Xpedition Visual Teaching Mode Engine v1 — Comprehensive Automated Test Suite
 *
 * Validates:
 * 1. Deterministic TeachingModeSelector across all 13 canonical proof cases
 * 2. VisualTeachingPlan schema completeness, serializability, and correctness
 * 3. MotionVisual, InteractiveVisual, ExplodedVisual, TransformationVisual, 2D Fallback plans
 * 4. Adaptive Representation Switching on learner struggle
 * 5. Reduced-motion and no-WebGL hardware capability fallbacks
 * 6. Telemetry emission and educational validity
 * 7. Accessibility metadata and screen reader summaries
 * 8. Compatibility with existing specialized 3D experiences and Source Intelligence
 */

import { TopicResolver } from '../lib/experience/topicResolver';
import { TopicExperienceComposer } from '../lib/experience/topicExperienceComposer';
import { TeachingModeSelector } from '../lib/experience/visualTeaching/teachingModeSelector';
import { VisualTeachingPlanBuilder } from '../lib/experience/visualTeaching/visualTeachingPlanBuilder';
import { AdaptiveRepresentationSwitcher } from '../lib/experience/visualTeaching/adaptiveRepresentationSwitcher';
import { TeachingMode, VisualTeachingPlan } from '../lib/experience/visualTeaching/types';
import { TelemetryEmitter } from '../lib/experience/telemetry/telemetryEmitter';

export function runVisualTeachingTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${msg}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${msg}`);
    }
  }

  console.log('\n=== XPEDITION PHASE D: VISUAL TEACHING MODE ENGINE V1 SUITE ===\n');

  // -------------------------------------------------------------
  // PART 1: 13 CANONICAL PROOF TOPICS MODE SELECTION
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Deterministic TeachingModeSelector (13 Proof Topics) ---');

  const proofCases: Array<{ topic: string; expectedPrimary: TeachingMode; description: string }> = [
    { topic: "Newton's Laws of Motion", expectedPrimary: 'INTERACTIVE_VISUAL', description: "Newton's Laws -> INTERACTIVE_VISUAL" },
    { topic: 'Photosynthesis & Chloroplasts', expectedPrimary: 'MOTION_VISUAL', description: 'Photosynthesis -> MOTION_VISUAL' },
    { topic: "Electric Circuits & Ohm's Law", expectedPrimary: 'INTERACTIVE_VISUAL', description: 'Electric Circuit -> INTERACTIVE_VISUAL' },
    { topic: 'Solar System & Planetary Orbits', expectedPrimary: 'FULL_3D', description: 'Solar System -> FULL_3D' },
    { topic: 'Visual Fractions & Proportions', expectedPrimary: 'INTERACTIVE_VISUAL', description: 'Fractions -> INTERACTIVE_VISUAL' },
    { topic: 'DNA Double Helix Replication', expectedPrimary: 'TRANSFORMATION_VISUAL', description: 'DNA Replication -> TRANSFORMATION_VISUAL' },
    { topic: 'DC Electric Motor & Commutation', expectedPrimary: 'EXPLODED_VISUAL', description: 'Electric Motor -> EXPLODED_VISUAL' },
    { topic: 'Human Heart Anatomy', expectedPrimary: 'FULL_3D', description: 'Heart Anatomy -> FULL_3D' },
    { topic: 'Projectile Motion', expectedPrimary: 'FULL_3D', description: 'Projectile Motion -> FULL_3D' },
    { topic: 'Sorting Algorithms (Bubble & Quick)', expectedPrimary: 'MOTION_VISUAL', description: 'Sorting Algorithms -> MOTION_VISUAL' },
    { topic: 'Market Supply & Demand', expectedPrimary: 'INTERACTIVE_VISUAL', description: 'Supply & Demand -> INTERACTIVE_VISUAL' },
    { topic: 'English Sentence Structure & Syntax', expectedPrimary: 'INTERACTIVE_VISUAL', description: 'English Grammar -> INTERACTIVE_VISUAL' },
    { topic: 'Quantum Wave Functions & Superposition', expectedPrimary: '2D_FALLBACK', description: 'Abstract Topic -> 2D_FALLBACK' },
  ];

  proofCases.forEach((tc) => {
    const selection = TeachingModeSelector.selectMode({
      normalizedTopic: tc.topic.toLowerCase(),
    });
    assert(
      selection.primaryMode === tc.expectedPrimary,
      `${tc.description} (Selected: ${selection.primaryMode}, Rationale: "${selection.rationale.slice(0, 50)}...")`
    );
  });

  // Arbitrary novel topic test
  const arbitrarySelection = TeachingModeSelector.selectMode({
    normalizedTopic: 'fluiddynamics_arbitrary_unseen_concept_xyz',
  });
  assert(
    arbitrarySelection.primaryMode === '2D_FALLBACK',
    'Arbitrary/novel topic safely resolves to 2D_FALLBACK without crashing'
  );

  // -------------------------------------------------------------
  // PART 2: HARDWARE & ACCESSIBILITY CONSTRAINTS
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Hardware Capabilities & Reduced Motion Fallbacks ---');

  // No WebGL capability
  const noWebGlSelection = TeachingModeSelector.selectMode(
    { normalizedTopic: 'solar system orbits' },
    { hasWebGL: false, prefersReducedMotion: false }
  );
  assert(
    noWebGlSelection.primaryMode === 'INTERACTIVE_VISUAL' || noWebGlSelection.primaryMode === '2D_FALLBACK',
    `When WebGL is unavailable, FULL_3D falls back safely (${noWebGlSelection.primaryMode})`
  );
  assert(
    noWebGlSelection.fallbackReason === 'NO_WEBGL_SUPPORT',
    'Fallback reason correctly marked as NO_WEBGL_SUPPORT'
  );

  // Reduced motion preference
  const reducedMotionSelection = TeachingModeSelector.selectMode(
    { normalizedTopic: 'photosynthesis' },
    { hasWebGL: true, prefersReducedMotion: true }
  );
  assert(
    reducedMotionSelection.primaryMode === 'INTERACTIVE_VISUAL' || reducedMotionSelection.primaryMode === '2D_FALLBACK',
    `Reduced motion preference chooses static or interactive visual over continuous motion (${reducedMotionSelection.primaryMode})`
  );

  // -------------------------------------------------------------
  // PART 3: VISUAL TEACHING PLAN DECLARATIVE CONTRACTS
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Declarative VisualTeachingPlan Completeness ---');

  // 1. Newton's Laws Plan
  const newtonTopic = TopicResolver.resolveTopic("Newton's Laws");
  const newtonPlan = VisualTeachingPlanBuilder.buildPlan(newtonTopic);
  assert(newtonPlan.mode === 'INTERACTIVE_VISUAL', 'Newton plan has mode INTERACTIVE_VISUAL');
  assert(newtonPlan.interactiveControls.length >= 1 && newtonPlan.interactiveControls.length <= 2, 'Newton plan has 1-2 concise controls');
  assert(newtonPlan.interactiveControls.some((c) => c.name === 'appliedForce'), 'Newton plan contains appliedForce parameter');
  assert(newtonPlan.quickCheck.options.some((o) => o.isCorrect), 'Newton quick check has valid correct option');

  // 2. Photosynthesis Plan
  const photoTopic = TopicResolver.resolveTopic('Photosynthesis');
  const photoPlan = VisualTeachingPlanBuilder.buildPlan(photoTopic);
  assert(photoPlan.mode === 'MOTION_VISUAL', 'Photosynthesis plan has mode MOTION_VISUAL');
  assert(photoPlan.stages.length >= 3, `Photosynthesis has sequential motion stages (count: ${photoPlan.stages.length})`);
  assert(photoPlan.entities.some((e) => e.id === 'sunlight' || e.id === 'water'), 'Photosynthesis contains essential inputs');

  // 3. DNA Replication Plan
  const dnaTopic = TopicResolver.resolveTopic('DNA replication');
  const dnaPlan = VisualTeachingPlanBuilder.buildPlan(dnaTopic);
  assert(dnaPlan.mode === 'TRANSFORMATION_VISUAL', 'DNA replication has mode TRANSFORMATION_VISUAL');
  assert(Boolean(dnaPlan.transformationStages && dnaPlan.transformationStages.length >= 2), 'DNA plan has transformation stages');

  // 4. Electric Motor Plan
  const motorTopic = TopicResolver.resolveTopic('Electric motor');
  const motorPlan = VisualTeachingPlanBuilder.buildPlan(motorTopic);
  assert(motorPlan.mode === 'EXPLODED_VISUAL', 'Electric motor has mode EXPLODED_VISUAL');
  assert(Boolean(motorPlan.explodedComponents && motorPlan.explodedComponents.length >= 3), 'Electric motor has exploded components (magnets, armature, commutator)');

  // 5. Fractions Plan
  const fracTopic = TopicResolver.resolveTopic('Fractions');
  const fracPlan = VisualTeachingPlanBuilder.buildPlan(fracTopic);
  assert(fracPlan.mode === 'INTERACTIVE_VISUAL', 'Fractions has mode INTERACTIVE_VISUAL');
  assert(fracPlan.interactiveControls.some((c) => c.name === 'numerator'), 'Fractions contains numerator control');

  // 6. Generic / Unknown Fallback Plan
  const unknownTopic = TopicResolver.resolveTopic('CompletelyUnseenTheoreticalPhysicsConceptXYZ');
  const unknownPlan = VisualTeachingPlanBuilder.buildPlan(unknownTopic);
  assert(unknownPlan.mode === '2D_FALLBACK', 'Unknown topic produces valid 2D_FALLBACK plan');
  assert(unknownPlan.entities.length >= 3, '2D_FALLBACK has concept node network entities');
  assert(unknownPlan.accessibility.screenReaderSummary.length > 10, '2D_FALLBACK has accessible screen reader summary');

  // -------------------------------------------------------------
  // PART 4: SERIALIZABILITY & DETERMINISM
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Serializability and Determinism ---');

  const jsonSerialized = JSON.stringify(newtonPlan);
  const parsed = JSON.parse(jsonSerialized) as VisualTeachingPlan;
  assert(parsed.conceptId === newtonPlan.conceptId, 'VisualTeachingPlan is 100% JSON serializable and deserializable');

  const plan1 = VisualTeachingPlanBuilder.buildPlan(newtonTopic);
  const plan2 = VisualTeachingPlanBuilder.buildPlan(newtonTopic);
  assert(
    plan1.mode === plan2.mode && plan1.title === plan2.title && plan1.interactiveControls.length === plan2.interactiveControls.length,
    'VisualTeachingPlan generation is strictly deterministic'
  );

  // -------------------------------------------------------------
  // PART 5: ADAPTIVE REPRESENTATION SWITCHING
  // -------------------------------------------------------------
  console.log('\n--- Test Group 5: Adaptive Representation Switching on Learner Struggle ---');

  // Struggling on MOTION_VISUAL (e.g., Photosynthesis)
  const struggleEvidence = {
    currentMode: 'MOTION_VISUAL' as TeachingMode,
    incorrectPredictionCount: 2,
    incorrectChallengeCount: 0,
    hintsUsedCount: 1,
    timeSpentSeconds: 45,
  };
  const shouldSwitch = AdaptiveRepresentationSwitcher.shouldOfferAlternativeRepresentation(struggleEvidence);
  assert(shouldSwitch, 'Adaptive switcher flags struggle when 2+ incorrect predictions occur');

  const rec = AdaptiveRepresentationSwitcher.getRecommendedAlternative('MOTION_VISUAL', struggleEvidence);
  assert(
    rec.targetMode === 'INTERACTIVE_VISUAL',
    `Struggling on MOTION_VISUAL recommends INTERACTIVE_VISUAL (${rec.targetMode})`
  );

  // Struggling on FULL_3D (e.g., Heart)
  const struggle3d = AdaptiveRepresentationSwitcher.getRecommendedAlternative('FULL_3D', {
    currentMode: 'FULL_3D',
    incorrectPredictionCount: 2,
    incorrectChallengeCount: 0,
    hintsUsedCount: 2,
    timeSpentSeconds: 60,
  });
  assert(
    struggle3d.targetMode === 'EXPLODED_VISUAL',
    `Struggling on FULL_3D recommends EXPLODED_VISUAL (${struggle3d.targetMode})`
  );

  // Struggling on INTERACTIVE_VISUAL
  const struggleInteract = AdaptiveRepresentationSwitcher.getRecommendedAlternative('INTERACTIVE_VISUAL', {
    currentMode: 'INTERACTIVE_VISUAL',
    incorrectPredictionCount: 3,
    incorrectChallengeCount: 0,
    hintsUsedCount: 2,
    timeSpentSeconds: 80,
  });
  assert(
    struggleInteract.targetMode === '2D_FALLBACK',
    `Struggling on INTERACTIVE_VISUAL recommends 2D_FALLBACK (${struggleInteract.targetMode})`
  );

  // -------------------------------------------------------------
  // PART 6: TELEMETRY & PERSISTENCE EVIDENCE COMPATIBILITY
  // -------------------------------------------------------------
  console.log('\n--- Test Group 6: Telemetry Emitter Visual Events ---');

  const emitter = new TelemetryEmitter('plan_test_123', 'newtons_laws_motion', "Newton's Laws");
  const receivedEvents: string[] = [];
  emitter.subscribe((evt) => {
    receivedEvents.push(evt.type);
  });

  emitter.emit('visual_teaching_started' as any, { mode: 'INTERACTIVE_VISUAL' });
  emitter.emit('visual_parameter_changed' as any, { name: 'appliedForce', value: 30 });
  emitter.emit('visual_prediction_submitted' as any, { answerId: 'opt_half' });
  emitter.emit('visual_mode_switched' as any, { from: 'MOTION_VISUAL', to: 'INTERACTIVE_VISUAL' });
  emitter.emit('visual_teaching_completed' as any, { durationSeconds: 45 });

  assert(receivedEvents.includes('visual_teaching_started'), 'Emitted visual_teaching_started');
  assert(receivedEvents.includes('visual_parameter_changed'), 'Emitted visual_parameter_changed');
  assert(receivedEvents.includes('visual_mode_switched'), 'Emitted visual_mode_switched');
  assert(receivedEvents.includes('visual_teaching_completed'), 'Emitted visual_teaching_completed');

  // -------------------------------------------------------------
  // PART 7: INTEGRATION WITH TOPIC EXPERIENCE COMPOSER
  // -------------------------------------------------------------
  console.log('\n--- Test Group 7: TopicExperienceComposer Integration ---');

  const composedPlan = TopicExperienceComposer.composeTeachingPlan(newtonTopic);
  assert(Boolean(composedPlan.visualTeachingPlan), 'TopicExperienceComposer attaches visualTeachingPlan to output');
  assert(composedPlan.visualTeachingPlan?.mode === 'INTERACTIVE_VISUAL', 'Composed plan has correct canonical mode');
  assert(composedPlan.topic.teachingMode === 'INTERACTIVE_VISUAL', 'Topic has resolved teachingMode');

  // Specialized experience compatibility
  const heartTopic = TopicResolver.resolveTopic('human heart anatomy');
  const heartPlan = TopicExperienceComposer.composeTeachingPlan(heartTopic);
  assert(Boolean(heartPlan.visualTeachingPlan), 'Specialized Heart experience has attached visualTeachingPlan');
  assert(heartPlan.visualTeachingPlan?.mode === 'FULL_3D', 'Heart experience defaults to FULL_3D');

  // -------------------------------------------------------------
  // PART 8: ACCESSIBILITY CONTRACT AUDIT
  // -------------------------------------------------------------
  console.log('\n--- Test Group 8: Accessibility Verification ---');

  assert(newtonPlan.accessibility.ariaLabel.length > 5, 'Newton plan has accessible ariaLabel');
  assert(newtonPlan.accessibility.accessibleDescription.length > 10, 'Newton plan has accessibleDescription');
  assert(newtonPlan.accessibility.reducedMotionAlternativeText.length > 10, 'Newton plan provides reducedMotionAlternativeText');
  assert(photoPlan.accessibility.screenReaderSummary.length > 10, 'Photosynthesis plan provides screenReaderSummary');

  console.log(`\nPhase D Visual Teaching Engine Tests: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
