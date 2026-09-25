const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
  }
}

async function runPhase3VisualIntelligenceTests() {
  console.log('===========================================================');
  console.log('XPEDITION PHASE 3: VISUAL INTELLIGENCE ENGINE TEST SUITE');
  console.log('===========================================================\n');

  const {
    RuleBasedVisualNeedEvaluator,
    VisualTypeResolver,
    VisualAssetResolver,
    PromptPlanner,
    VisualRequirementEngine,
    visualRequirementEngine,
    matchSubjectRule,
    resolveStageProfile,
  } = require('../lib/visualIntelligence');

  const { LocalAssetStore } = require('../lib/visualGeneration');

  // ---------------------------------------------------------------------------
  // TEST MATRIX A: Visual Need Evaluation
  // ---------------------------------------------------------------------------
  console.log('A. Testing Visual Need Evaluation');
  const needEvaluator = new RuleBasedVisualNeedEvaluator();

  // 1. Clearly needed spatial/physical concepts
  const motorNeed = needEvaluator.evaluate({
    conceptId: 'dc_motor',
    subject: 'Physics',
    topic: 'DC Electric Motor & Commutation',
    learningObjective: 'Lorentz force interaction on armature coil',
  });
  assert(motorNeed.needed === true, 'DC Motor evaluates as needed (needed: true)');
  assert(motorNeed.confidence >= 0.8 && motorNeed.confidence <= 1.0, 'DC Motor confidence is bounded [0.8, 1.0]');
  assert(motorNeed.reason && motorNeed.reason.length > 10, 'DC Motor provides explainable rationale');

  const projectileNeed = needEvaluator.evaluate({
    conceptId: 'projectile_motion',
    subject: 'Physics',
    topic: 'Kinematics',
    learningObjective: 'Parabolic trajectory under gravity',
  });
  assert(projectileNeed.needed === true, 'Projectile Motion evaluates as needed');

  const heartNeed = needEvaluator.evaluate({
    conceptId: 'human_heart_anatomy',
    subject: 'Biology',
    topic: 'Cardiovascular system',
    learningObjective: 'Chamber anatomy and dual circulation',
  });
  assert(heartNeed.needed === true, 'Heart Anatomy evaluates as needed');

  // 2. Not needed concepts (definitions, trivia, vocabulary)
  const defNeed = needEvaluator.evaluate({
    conceptId: 'definition_electric_current',
    subject: 'Physics',
    topic: 'Define electric current',
    learningObjective: 'Memorize the one-sentence definition of electric current',
  });
  assert(defNeed.needed === false, 'Pure vocabulary definition evaluates as not needed (needed: false)');
  assert(defNeed.reason.includes('definition') || defNeed.reason.includes('verbal'), 'Definition provides clear unneeded explanation');

  const vocabNeed = needEvaluator.evaluate({
    conceptId: 'vocabulary_spelling',
    subject: 'English',
    topic: 'Vocabulary word definition',
  });
  assert(vocabNeed.needed === false, 'Vocabulary spelling evaluates as not needed');

  // 3. Optionally useful / contextual concepts
  const historyNeed = needEvaluator.evaluate({
    conceptId: 'renaissance_era',
    subject: 'History',
    topic: 'Renaissance cultural context',
  });
  assert(historyNeed.needed === true, 'History contextual topic evaluates as useful');
  assert(historyNeed.confidence >= 0.6 && historyNeed.confidence < 0.9, 'History confidence reflects contextual nature');

  // ---------------------------------------------------------------------------
  // TEST MATRIX B: Visual Type Resolution
  // ---------------------------------------------------------------------------
  console.log('\nB. Testing Visual Type Resolution');
  const typeResolver = new VisualTypeResolver();

  // Math graph
  const mathRes = typeResolver.resolve({
    conceptId: 'quadratic_parabola',
    subject: 'Mathematics',
    topic: 'Quadratic function roots and vertex',
  });
  assert(mathRes.visualType === 'graph', 'Quadratic function resolves to "graph"');
  assert(mathRes.accuracyLevel === 'mathematical', 'Quadratic function demands "mathematical" accuracy');

  // Physics diagram
  const motorRes = typeResolver.resolve({
    conceptId: 'dc_motor',
    subject: 'Physics',
    topic: 'Electromagnetism',
    stage: 'explain',
  });
  assert(motorRes.visualType === 'scientific_diagram', 'DC Motor in explain stage resolves to "scientific_diagram"');
  assert(motorRes.accuracyLevel === 'technical', 'DC Motor demands "technical" accuracy');

  // Physics simulation
  const projRes = typeResolver.resolve({
    conceptId: 'projectile_motion',
    subject: 'Physics',
    topic: 'Kinematics',
    stage: 'interact',
  });
  assert(projRes.visualType === 'interactive_simulation', 'Projectile Motion resolves to "interactive_simulation"');
  assert(projRes.requiresInteraction === true, 'Simulation requires interaction');

  // Chemistry molecule
  const chemRes = typeResolver.resolve({
    conceptId: 'water_molecule_bonding',
    subject: 'Chemistry',
    topic: 'Covalent molecular structure H2O',
  });
  assert(chemRes.visualType === 'molecular_visual', 'Chemistry bonding resolves to "molecular_visual"');
  assert(chemRes.accuracyLevel === 'scientific', 'Chemistry demands "scientific" accuracy');

  // Biology anatomy
  const bioRes = typeResolver.resolve({
    conceptId: 'human_heart_anatomy',
    subject: 'Biology',
    topic: 'Cardiac chambers and myocardium',
  });
  assert(bioRes.visualType === 'anatomical_visual', 'Human Heart resolves to "anatomical_visual"');

  // History timeline
  const histRes = typeResolver.resolve({
    conceptId: 'french_revolution_timeline',
    subject: 'History',
    topic: 'Chronology of key events',
  });
  assert(histRes.visualType === 'timeline', 'Chronological event resolves to "timeline"');

  // Programming code visual
  const codeRes = typeResolver.resolve({
    conceptId: 'binary_search_algorithm',
    subject: 'Computer Science',
    topic: 'Algorithm execution and recursion',
  });
  assert(codeRes.visualType === 'code_visual', 'Algorithm execution resolves to "code_visual"');

  // Data science chart
  const dsRes = typeResolver.resolve({
    conceptId: 'linear_regression_scatter',
    subject: 'Data Science',
    topic: 'Correlation scatter dataset',
  });
  assert(dsRes.visualType === 'graph', 'Data science scatter dataset resolves to "graph"');

  // ---------------------------------------------------------------------------
  // TEST MATRIX C: Accuracy Levels & Priority Hierarchy
  // ---------------------------------------------------------------------------
  console.log('\nC. Testing Accuracy Levels & Priority Hierarchy');
  assert(mathRes.priorityTier <= 2, 'Mathematical graphs have top deterministic priority (tier <= 2)');
  assert(projRes.priorityTier === 1, 'Interactive simulations have tier 1 priority');
  assert(motorRes.priorityTier >= 3, 'Diagram visual types map to tier >= 3');

  // ---------------------------------------------------------------------------
  // TEST MATRIX D: Stage Awareness
  // ---------------------------------------------------------------------------
  console.log('\nD. Testing Stage Awareness');

  const introRes = typeResolver.resolve({
    conceptId: 'projectile_motion',
    subject: 'Physics',
    stage: 'introduce',
  });
  assert(introRes.visualType === 'scientific_diagram', 'Introduce stage adjusts interactive simulation to overview diagram');
  assert(introRes.requiresInteraction === false, 'Introduce stage does not force interaction');

  const interactRes = typeResolver.resolve({
    conceptId: 'dc_motor',
    subject: 'Physics',
    stage: 'interact',
  });
  assert(interactRes.visualType === 'interactive_simulation', 'Interact stage promotes motor diagram to interactive simulation');
  assert(interactRes.requiresInteraction === true, 'Interact stage flags requiresInteraction: true');

  const questionStageProfile = resolveStageProfile('question');
  assert(questionStageProfile.preferredComplexity === 'simple', 'Question stage profile prefers simple complexity');

  const challengeStageProfile = resolveStageProfile('challenge');
  assert(challengeStageProfile.preferredComplexity === 'diagnostic', 'Challenge stage profile prefers diagnostic complexity');

  // ---------------------------------------------------------------------------
  // TEST MATRIX E: Existing Asset Resolution
  // ---------------------------------------------------------------------------
  console.log('\nE. Testing Existing Asset Resolution');
  const store = LocalAssetStore.getInstance();
  const assetResolver = new VisualAssetResolver(store);

  // DC Motor existing asset check
  const existingMotor = await assetResolver.resolveExistingAsset('dc_motor');
  assert(existingMotor !== null, 'Existing dc_motor asset is successfully found in manifest/store');
  assert(existingMotor.conceptId === 'dc_motor', 'Found asset has matching conceptId');
  assert(typeof existingMotor.publicUrl === 'string', 'Found asset provides publicUrl');

  // Candidates lookup
  const candidates = await assetResolver.findCandidates('dc_motor');
  assert(candidates.length >= 1, 'FindCandidates returns at least 1 candidate for dc_motor');

  // Non-existent concept
  const unknownAsset = await assetResolver.resolveExistingAsset('non_existent_concept_999');
  assert(unknownAsset === null, 'Unknown concept resolves to null asset');

  // ---------------------------------------------------------------------------
  // TEST MATRIX F: Prompt Planner & Completeness
  // ---------------------------------------------------------------------------
  console.log('\nF. Testing Prompt Planner & Completeness');
  const promptPlanner = new PromptPlanner();

  const mockRequirement = {
    conceptId: 'dc_motor',
    subject: 'Physics',
    stage: 'explain',
    visualNeeded: true,
    confidence: 0.95,
    reason: 'Spatial electromagnetic interaction',
    visualType: 'scientific_diagram',
    accuracyLevel: 'technical',
    pedagogicalPurpose: {
      learnerNotice: ['armature', 'commutator', 'poles'],
      relationshipToEmphasize: 'Lorentz force generating torque',
      keyObjects: ['Magnets', 'Coil', 'Commutator'],
      labelsRequired: true,
    },
    contentRequirements: {
      requiredElements: ['permanent magnets', 'armature coil', 'split-ring commutator', 'carbon brushes'],
      relationships: ['current interacts with magnetic field'],
      labelsRequired: true,
    },
  };

  const plan = promptPlanner.planGeneration(mockRequirement);
  assert(plan.isIncomplete === false, 'Valid grounded requirement is marked as complete');
  assert(plan.request.prompt.includes('Lorentz force generating torque'), 'Prompt includes pedagogical relationship');
  assert(plan.request.prompt.includes('permanent magnets'), 'Prompt includes required elements');
  assert(plan.request.negativePrompt.includes('blurry'), 'Negative prompt contains anti-hallucination terms');
  assert(plan.request.width === 512 && plan.request.height === 512, 'Default dimensions are 512x512');

  // Incomplete requirement (empty concept with no curriculum facts)
  const incompleteReq = {
    conceptId: 'abstract_unknown_topic_xyz',
    stage: 'explain',
    visualNeeded: true,
    confidence: 0.5,
    reason: 'Unknown topic',
  };
  const incompletePlan = promptPlanner.planGeneration(incompleteReq);
  assert(incompletePlan.isIncomplete === true, 'Unverified concept without elements is flagged as isIncomplete: true');
  assert(incompletePlan.incompleteReason && incompletePlan.incompleteReason.includes('Insufficient verified factual elements'), 'Incomplete reason is explainable');

  // ---------------------------------------------------------------------------
  // TEST MATRIX G: End-to-End VisualRequirementEngine & SmartBoard Contract
  // ---------------------------------------------------------------------------
  console.log('\nG. Testing VisualRequirementEngine & SmartBoard Contract');

  // DC Motor evaluation
  const engineReq = await visualRequirementEngine.evaluateVisualRequirement({
    conceptId: 'dc_motor',
    subject: 'Physics',
    stage: 'explain',
  });
  assert(engineReq.visualNeeded === true, 'Engine evaluates dc_motor visualNeeded: true');
  assert(engineReq.resolvedAsset !== undefined, 'Engine resolves existing dc_motor asset');
  assert(engineReq.isFromExistingAsset === true, 'Engine flags isFromExistingAsset: true');
  assert(engineReq.pedagogicalPurpose !== undefined, 'Engine constructs pedagogicalPurpose');
  assert(engineReq.contentRequirements !== undefined, 'Engine constructs contentRequirements');

  // Smart Board Payload formatting
  const sbPayload = visualRequirementEngine.formatSmartBoardPayload(engineReq);
  assert(sbPayload.type === 'visual_requirement', 'Smart Board payload has type: "visual_requirement"');
  assert(sbPayload.visualType === 'scientific_diagram', 'Smart Board visualType matches');
  assert(sbPayload.assetUrl === engineReq.resolvedAsset.publicUrl, 'Smart Board assetUrl matches resolved asset');
  assert(sbPayload.title.includes('DC') || sbPayload.title.includes('MOTOR'), 'Smart Board title is present');
  assert(sbPayload.purpose.length > 10, 'Smart Board purpose is clearly stated');

  // Not needed concept through engine
  const unneededReq = await visualRequirementEngine.evaluateVisualRequirement({
    conceptId: 'define_newton_third_law_verbal',
    topic: 'definition of third law in words',
  });
  assert(unneededReq.visualNeeded === false, 'Engine returns visualNeeded: false for verbal definition');
  assert(unneededReq.resolvedAsset === undefined, 'No asset resolved for unneeded visual');

  // ---------------------------------------------------------------------------
  // TEST MATRIX H: Security & Server Invariants
  // ---------------------------------------------------------------------------
  console.log('\nH. Testing Security & Server Invariants');
  const routePath = path.join(rootDir, 'app/api/visual-intelligence/route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  assert(routeContent.includes('requireServerAuth'), 'API route enforces server authentication via requireServerAuth');
  assert(routeContent.includes('sanitizeForClient'), 'API route sanitizes assets using sanitizeForClient');
  assert(!routeContent.includes('127.0.0.1:8188'), 'API route never exposes raw ComfyUI port 8188');
  assert(!routeContent.includes('process.env.COMFYUI_BASE_URL'), 'API route never leaks ComfyUI base URL to clients');

  // Summary
  console.log('\n===========================================================');
  console.log(`PHASE 3 VISUAL INTELLIGENCE TEST SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('===========================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase3VisualIntelligenceTests().catch((err) => {
  console.error('Fatal error during Phase 3 Visual Intelligence test execution:', err);
  process.exit(1);
});
