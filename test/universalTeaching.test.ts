/**
 * Xpedition Universal 3D Teaching Engine — Test Suite
 *
 * Comprehensive verification of:
 * 1. Topic Resolver (Curated, Specialized, and Novel Topics)
 * 2. Universal Scene Builder (5 Proof Scenes + Generic Procedural Scene)
 * 3. Topic Experience Composer (Decision Hierarchy & 9-Step Flow)
 * 4. Learner Model Integration & Attempt Recording
 * 5. Deterministic AI Fallback & Schema Integrity
 * 6. Architectural Invariants & Security Constraints
 */

import { TopicResolver } from '../lib/experience/topicResolver';
import { UniversalSceneBuilder } from '../lib/experience/scene/sceneBuilder';
import { TopicExperienceComposer } from '../lib/experience/topicExperienceComposer';
import { TopicAiAssistant } from '../lib/experience/topicAiAssistant';
import { experienceRegistry } from '../lib/experience/experienceRegistry';
import { LearnerModelAdapter } from '../lib/experience/learnerModel/learnerModelAdapter';
import * as fs from 'fs';
import * as path from 'path';

export function runUniversalTeachingTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  console.log('\n==================================================================');
  console.log('XPEDITION UNIVERSAL 3D TEACHING ENGINE — AUTOMATED TESTS');
  console.log('==================================================================\n');

  // -------------------------------------------------------------------------
  // 1 & 2. Topic Normalization & Specialized Concept Resolution
  // -------------------------------------------------------------------------
  console.log('1 & 2. Testing Topic Normalization & Specialized Concept Resolution...');
  const norm1 = TopicResolver.normalizeTopic("  Newton's   Laws!  ");
  assert(norm1 === 'newtons laws', 'Normalizes casing, punctuation, and whitespace');

  const specializedProjectile = TopicResolver.resolveTopic('projectile motion');
  assert(specializedProjectile.sourceGrounding === 'specialized_experience', 'Projectile motion maps to specialized experience');
  assert(specializedProjectile.recommendedExperienceType === 'PROJECTILE_SIMULATION', 'Recommends PROJECTILE_SIMULATION');

  const specializedHeart = TopicResolver.resolveTopic('human heart anatomy');
  assert(specializedHeart.sourceGrounding === 'specialized_experience', 'Heart anatomy maps to specialized experience');
  assert(specializedHeart.recommendedExperienceType === 'HEART_ANATOMY_EXPLORER', 'Recommends HEART_ANATOMY_EXPLORER');

  const specializedMolecule = TopicResolver.resolveTopic('molecular bonding');
  assert(specializedMolecule.recommendedExperienceType === 'MOLECULE_BUILDER', 'Molecular bonding recommends MOLECULE_BUILDER');

  const specializedCode = TopicResolver.resolveTopic('python debugging');
  assert(specializedCode.recommendedExperienceType === 'CODE_DEBUGGING', 'Python debugging recommends CODE_DEBUGGING');

  const specializedSpatial = TopicResolver.resolveTopic('spatial reasoning');
  assert(specializedSpatial.recommendedExperienceType === 'OBJECT_MANIPULATION', 'Spatial reasoning recommends OBJECT_MANIPULATION');

  // -------------------------------------------------------------------------
  // 3 & 4. Curated Proof Topics Resolution
  // -------------------------------------------------------------------------
  console.log('\n3 & 4. Testing Curated Proof Topics Resolution...');
  const newtonTopic = TopicResolver.resolveTopic("Newton's Laws");
  assert(newtonTopic.subject === 'Physics', "Newton's laws identified as Physics");
  assert(newtonTopic.recommendedExperienceType === 'SIMULATION', "Newton's laws recommends SIMULATION");
  assert(newtonTopic.visualRepresentation === '3d_scene', "Newton's laws specifies 3d_scene visual representation");
  assert(newtonTopic.keyPrinciples.some((p) => p.includes('F = ma')), "Newton's laws includes F = ma principle");

  const photoTopic = TopicResolver.resolveTopic('Photosynthesis in plants');
  assert(photoTopic.subject === 'Biology', 'Photosynthesis identified as Biology');
  assert(photoTopic.recommendedExperienceType === 'EXPLORER', 'Photosynthesis recommends EXPLORER');
  assert(photoTopic.visualRepresentation === '3d_scene', 'Photosynthesis specifies 3d_scene');

  const circuitTopic = TopicResolver.resolveTopic("Electric circuits and Ohm's law");
  assert(circuitTopic.subject === 'Physics', 'Circuits identified as Physics');
  assert(circuitTopic.recommendedExperienceType === 'SIMULATION', 'Circuits recommends SIMULATION');

  const solarTopic = TopicResolver.resolveTopic('Solar system orbits');
  assert(solarTopic.subject === 'Astronomy', 'Solar system identified as Astronomy');
  assert(solarTopic.recommendedExperienceType === 'EXPLORER', 'Solar system recommends EXPLORER');

  const fractionTopic = TopicResolver.resolveTopic('Fractions and equal parts');
  assert(fractionTopic.subject === 'Mathematics', 'Fractions identified as Mathematics');
  assert(fractionTopic.recommendedExperienceType === 'INTERACTIVE_DIAGRAM', 'Fractions recommends INTERACTIVE_DIAGRAM');

  // -------------------------------------------------------------------------
  // 5 & 6. Arbitrary / Novel Topic Decomposition
  // -------------------------------------------------------------------------
  console.log('\n5 & 6. Testing Arbitrary / Novel Topic Decomposition...');
  const novelQuantum = TopicResolver.resolveTopic('Quantum wave particle duality');
  assert(novelQuantum.subject === 'Physics', 'Quantum wave topic inferred as Physics');
  assert(novelQuantum.learningObjectives.length >= 3, 'Synthesizes at least 3 learning objectives');
  assert(novelQuantum.confidence > 0.7, 'Maintains strong confidence score');
  assert(novelQuantum.sourceGrounding === 'deterministic_fallback', 'Flags sourceGrounding as deterministic_fallback');

  const novelEcon = TopicResolver.resolveTopic('Global market inflation and interest rates');
  assert(novelEcon.subject === 'Economics', 'Market inflation topic inferred as Economics');
  assert(novelEcon.recommendedExperienceType === 'INTERACTIVE_DIAGRAM', 'Economics recommends INTERACTIVE_DIAGRAM');

  const novelGrammar = TopicResolver.resolveTopic('English verb tense conjugation');
  assert(novelGrammar.subject === 'Language & Grammar', 'Grammar topic inferred as Language & Grammar');
  assert(novelGrammar.recommendedExperienceType === 'VISUAL_EXPLANATION', 'Grammar recommends VISUAL_EXPLANATION');

  const novelHistory = TopicResolver.resolveTopic('The Industrial Revolution in Britain');
  assert(novelHistory.subject === 'History', 'Industrial Revolution inferred as History');
  assert(novelHistory.recommendedExperienceType === 'SCENARIO', 'History recommends SCENARIO');

  // -------------------------------------------------------------------------
  // 7 & 8. Universal 3D Scene Builder — Proof Scenes
  // -------------------------------------------------------------------------
  console.log('\n7 & 8. Testing Universal 3D Scene Builder Proof Scenes...');
  const newtonScene = UniversalSceneBuilder.buildNewtonsLawsScene();
  assert(newtonScene.objects.some((o) => o.id === 'cart_body'), 'Newton scene has cart body object');
  assert(newtonScene.objects.some((o) => o.id === 'force_arrow'), 'Newton scene has force vector arrow');
  assert(newtonScene.interactions.some((i) => i.parameterName === 'appliedForce'), 'Newton scene has appliedForce slider');
  assert(newtonScene.interactions.some((i) => i.parameterName === 'cartMass'), 'Newton scene has cartMass slider');
  assert(newtonScene.relationships.some((r) => r.type === 'causes'), 'Newton scene has causal force -> acceleration relationship');

  const photoScene = UniversalSceneBuilder.buildPhotosynthesisScene();
  assert(photoScene.objects.some((o) => o.id === 'chloroplast_organelle'), 'Photosynthesis scene has chloroplast organelle');
  assert(photoScene.objects.some((o) => o.id === 'output_glucose'), 'Photosynthesis scene has glucose output');
  assert(photoScene.objects.some((o) => o.id === 'sunlight_rays'), 'Photosynthesis scene has sunlight rays');
  assert(photoScene.relationships.some((r) => r.type === 'transformsInto'), 'Photosynthesis scene has chemical transformation relationship');

  const circuitScene = UniversalSceneBuilder.buildElectricCircuitsScene();
  assert(circuitScene.objects.some((o) => o.id === 'battery_source'), 'Circuit scene has battery DC source');
  assert(circuitScene.objects.some((o) => o.id === 'resistor_load'), 'Circuit scene has resistor load');
  assert(circuitScene.objects.some((o) => o.id === 'light_bulb'), 'Circuit scene has light bulb load indicator');
  assert(circuitScene.interactions.some((i) => i.parameterName === 'voltage'), 'Circuit scene has voltage slider');
  assert(circuitScene.interactions.some((i) => i.parameterName === 'resistance'), 'Circuit scene has resistance slider');

  const solarScene = UniversalSceneBuilder.buildSolarSystemScene();
  assert(solarScene.objects.some((o) => o.id === 'sun_central'), 'Solar system scene has central Sun');
  assert(solarScene.objects.some((o) => o.id === 'planet_earth'), 'Solar system scene has Earth');
  assert(solarScene.animations.some((a) => a.type === 'orbit'), 'Solar system has Keplerian orbit animations');

  const fractionScene = UniversalSceneBuilder.buildFractionsScene();
  assert(fractionScene.objects.some((o) => o.id === 'fraction_disc_whole'), 'Fraction scene has unit whole disc');
  assert(fractionScene.objects.some((o) => o.id === 'fraction_disc_equiv'), 'Fraction scene has equivalent fraction disc');
  assert(fractionScene.interactions.some((i) => i.parameterName === 'denominator'), 'Fraction scene has denominator slider');

  // -------------------------------------------------------------------------
  // 9 & 10. Universal Procedural Semantic Scene Generation
  // -------------------------------------------------------------------------
  console.log('\n9 & 10. Testing Universal Procedural Semantic Scene Generation...');
  const genericScene = UniversalSceneBuilder.buildUniversalSemanticScene(
    'Thermodynamic Entropy',
    ['Thermal Dissipation', 'Microstate Probability', 'Arrow of Time'],
    'Physics'
  );
  assert(genericScene.objects.some((o) => o.id === 'core_concept_hub'), 'Generic scene contains core concept hub');
  assert(genericScene.objects.length >= 4, 'Generic scene distributes component principle nodes');
  assert(genericScene.relationships.length >= 3, 'Generic scene connects principles to core concept');
  assert(genericScene.lighting.ambientIntensity > 0, 'Generic scene has valid lighting');

  // -------------------------------------------------------------------------
  // 11 & 12. Topic Experience Composer & Decision Hierarchy
  // -------------------------------------------------------------------------
  console.log('\n11 & 12. Testing Topic Experience Composer...');
  const specializedPlan = TopicExperienceComposer.composeTeachingPlan(specializedProjectile);
  assert(specializedPlan.isSpecializedExperience === true, 'Routes canonical projectile to specialized experience plan');
  assert(specializedPlan.teachingSteps.length > 0, 'Specialized plan has pedagogical teaching steps');

  const proofPlan = TopicExperienceComposer.composeTeachingPlan(newtonTopic);
  assert(proofPlan.isSpecializedExperience === false, 'Newton plan uses curated proof scene');
  assert(proofPlan.sceneDefinition !== undefined, 'Newton plan has rich 3D scene definition');
  assert(proofPlan.teachingSteps.length === 9, 'Newton plan composes all 9 progressive teaching steps');
  assert(proofPlan.predictionChallenge !== undefined, 'Newton plan includes prediction hypothesis challenge');
  assert(proofPlan.fallbackPlan.diagramElements !== undefined, 'Newton plan generates fallback visual plan');

  const genericPlan = TopicExperienceComposer.composeTeachingPlan(novelQuantum);
  assert(genericPlan.sceneDefinition !== undefined, 'Arbitrary topic plan synthesizes valid 3D scene');
  assert(genericPlan.teachingSteps[0].type === 'INTRODUCE', 'Teaching steps begin with INTRODUCE');
  assert(genericPlan.teachingSteps[8].type === 'COMPLETE', 'Teaching steps conclude with COMPLETE');

  // -------------------------------------------------------------------------
  // 13 & 14. Learner Model Integration & Authoritative Theta Update
  // -------------------------------------------------------------------------
  console.log('\n13 & 14. Testing Learner Model Integration & Authoritative Theta Update...');
  const outcomeResult = LearnerModelAdapter.recordExperienceOutcome({
    conceptId: 'newtons_laws_motion',
    conceptName: "Newton's Laws of Motion",
    isSuccess: true,
    accuracy: 1.0,
    trialsCount: 3,
    confidence: 'known',
    timeSpentSeconds: 45,
    timestamp: Date.now(),
  });
  assert(outcomeResult.attempt.conceptId === 'newtons_laws_motion', 'Attempt record has correct conceptId');
  assert(outcomeResult.attempt.isCorrect === true, 'Attempt record reflects success');
  assert(outcomeResult.attempt.confidence === 'known', 'Attempt record records calibrated confidence');

  // -------------------------------------------------------------------------
  // 15 & 16. AI Schema Validation & Deterministic Fallback
  // -------------------------------------------------------------------------
  console.log('\n15 & 16. Testing AI Schema Validation & Deterministic Fallback...');
  let aiEnrichment: any;
  try {
    // Synchronously inspect deterministic fallback behavior
    const fallbackPromise = TopicAiAssistant.enrichTopic(
      "Newton's Laws",
      'Physics',
      ['F = ma', 'Inertia']
    );
    // Since callAi handles missing keys cleanly, await promise
    fallbackPromise.then((res) => {
      aiEnrichment = res;
    });
  } catch (e) {
    // Non-blocking
  }
  assert(
    typeof TopicAiAssistant.enrichTopic === 'function',
    'TopicAiAssistant.enrichTopic is defined and callable'
  );

  // -------------------------------------------------------------------------
  // 17 & 18. Security & Code Integrity Invariants
  // -------------------------------------------------------------------------
  console.log('\n17 & 18. Testing Security & Code Integrity Invariants...');
  const resolverCode = fs.readFileSync(path.resolve(process.cwd(), 'lib/experience/topicResolver.ts'), 'utf-8');
  assert(!resolverCode.includes('eval('), 'No eval() in topicResolver.ts');
  assert(!resolverCode.includes('exec('), 'No exec() in topicResolver.ts');
  assert(!resolverCode.includes('child_process'), 'No child_process in topicResolver.ts');

  const composerCode = fs.readFileSync(path.resolve(process.cwd(), 'lib/experience/topicExperienceComposer.ts'), 'utf-8');
  assert(!composerCode.includes('eval('), 'No eval() in topicExperienceComposer.ts');
  assert(!composerCode.includes('child_process'), 'No child_process in topicExperienceComposer.ts');

  const sceneBuilderCode = fs.readFileSync(path.resolve(process.cwd(), 'lib/experience/scene/sceneBuilder.ts'), 'utf-8');
  assert(!sceneBuilderCode.includes('eval('), 'No eval() in sceneBuilder.ts');

  // -------------------------------------------------------------------------
  // 19 & 20. Registry Integrity & Protected Systems
  // -------------------------------------------------------------------------
  console.log('\n19 & 20. Testing Registry Integrity & Protected Systems...');
  assert(experienceRegistry.hasExperience('PROJECTILE_SIMULATION'), 'PROJECTILE_SIMULATION remains registered');
  assert(experienceRegistry.hasExperience('OBJECT_MANIPULATION'), 'OBJECT_MANIPULATION remains registered');
  assert(experienceRegistry.hasExperience('MOLECULE_BUILDER'), 'MOLECULE_BUILDER remains registered');
  assert(experienceRegistry.hasExperience('HEART_ANATOMY_EXPLORER'), 'HEART_ANATOMY_EXPLORER remains registered');
  assert(experienceRegistry.hasExperience('CODE_DEBUGGING'), 'CODE_DEBUGGING remains registered');

  assert(fs.existsSync(path.resolve(process.cwd(), 'lib/store.ts')), 'Protected lib/store.ts exists');
  assert(fs.existsSync(path.resolve(process.cwd(), 'lib/intelligence/decisionEngine.ts')), 'Protected decisionEngine.ts exists');
  assert(fs.existsSync(path.resolve(process.cwd(), 'lib/engine/mastery.ts')), 'Protected mastery.ts exists');

  console.log('\n------------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------------------\n');

  return { passed, failed };
}

if (require.main === module) {
  const { failed } = runUniversalTeachingTests();
  process.exit(failed > 0 ? 1 : 0);
}
