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

async function runPhase4ClassIntegrationTests() {
  console.log('===========================================================');
  console.log('XPEDITION PHASE 4: XIRA + CLASSROOM INTEGRATION TEST SUITE');
  console.log('===========================================================\n');

  const {
    ClassroomStageController,
    classroomStageController,
  } = require('../lib/classroom/classroomStageController');

  const {
    ClassroomTelemetryService,
    classroomTelemetry,
  } = require('../lib/classroom/classroomTelemetry');

  const {
    XiraClassroomOrchestrator,
    xiraClassroomOrchestrator,
  } = require('../lib/classroom/XiraClassroomOrchestrator');

  const {
    CLASSROOM_STAGE_SEQUENCE,
    mapClassroomStageToVisualStage,
  } = require('../lib/classroom/classroomSessionTypes');

  const {
    CANONICAL_CLASSROOM_LESSONS,
    getClassroomLesson,
  } = require('../lib/classroom/classroomCatalog');

  // ---------------------------------------------------------------------------
  // TEST GROUP A: Classroom Stage State (8 tests)
  // ---------------------------------------------------------------------------
  console.log('A. Testing Classroom Stage State');
  const session = await xiraClassroomOrchestrator.createSession('dc_motor', 'INTRODUCE');

  assert(session.conceptId === 'dc_motor', 'Session initializes with correct conceptId');
  assert(session.currentStage === 'INTRODUCE', 'Session starts at INTRODUCE stage');
  assert(session.stageIndex === 0, 'Stage index starts at 0');
  assert(typeof session.sessionId === 'string' && session.sessionId.startsWith('sess_'), 'Session ID is generated with prefix');
  assert(typeof session.stageStartedAt === 'number' && session.stageStartedAt > 0, 'Stage started timestamp is recorded');
  assert(session.masteryState === 'NOT_STARTED', 'Initial mastery state is NOT_STARTED');
  assert(session.interactionState.hasInteracted === false, 'Initial interactionState hasInteracted is false');
  assert(Array.isArray(session.completedStages) && session.completedStages.length === 0, 'Completed stages starts empty');

  // ---------------------------------------------------------------------------
  // TEST GROUP B: Stage Transitions (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nB. Testing Stage Transitions');
  const ctrl = new ClassroomStageController();

  assert(ctrl.getNextStage('INTRODUCE') === 'EXPLAIN', 'INTRODUCE progresses to EXPLAIN');
  assert(ctrl.getNextStage('EXPLAIN') === 'DEMONSTRATE', 'EXPLAIN progresses to DEMONSTRATE');
  assert(ctrl.getNextStage('DEMONSTRATE') === 'INTERACT', 'DEMONSTRATE progresses to INTERACT');
  assert(ctrl.getNextStage('INTERACT') === 'QUESTION', 'INTERACT progresses to QUESTION');
  assert(ctrl.getNextStage('QUESTION', { questionAnsweredCorrectly: false }) === 'FEEDBACK', 'Incorrect answer in QUESTION routes to FEEDBACK');
  assert(ctrl.getNextStage('QUESTION', { questionAnsweredCorrectly: true }) === 'PRACTICE', 'Correct answer in QUESTION routes to PRACTICE');
  assert(ctrl.getNextStage('FEEDBACK', { retryRequested: true }) === 'QUESTION', 'Retry in FEEDBACK returns to QUESTION');
  assert(ctrl.getPreviousStage('EXPLAIN') === 'INTRODUCE', 'Previous from EXPLAIN is INTRODUCE');

  // ---------------------------------------------------------------------------
  // TEST GROUP C: Xira Orchestration (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nC. Testing Xira Classroom Orchestrator');
  const orch = new XiraClassroomOrchestrator();
  const testSess = await orch.createSession('dc_motor');

  assert(testSess.topicTitle.includes('DC') || testSess.topicTitle.includes('Motor'), 'Orchestrator grounds topic title from catalog');
  assert(testSess.subject === 'Physics', 'Orchestrator grounds subject from catalog');
  assert(typeof testSess.buddyDialogue === 'string' && testSess.buddyDialogue.length > 10, 'Buddy dialogue is initialized');
  assert(testSess.buddyState === 'INTRODUCING', 'Buddy state is INTRODUCING');

  const advancedSess = await orch.processLearnerAction(testSess.sessionId, { type: 'ADVANCE_STAGE' });
  assert(advancedSess.currentStage === 'EXPLAIN', 'Advancing stage moves orchestrator to EXPLAIN');
  assert(advancedSess.stageIndex === 1, 'Stage index advances to 1');
  assert(advancedSess.completedStages.includes('INTRODUCE'), 'Completed stages records INTRODUCE');
  assert(advancedSess.buddyState === 'EXPLAINING', 'Buddy state transitions to EXPLAINING');

  // ---------------------------------------------------------------------------
  // TEST GROUP D: Visual Intelligence Integration (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nD. Testing Visual Intelligence Integration');
  assert(advancedSess.currentVisualRequirement !== undefined, 'Visual requirement is generated on stage transition');
  assert(advancedSess.currentVisualRequirement.visualNeeded === true, 'Visual need evaluates to true for DC Motor');
  assert(advancedSess.currentVisualRequirement.conceptId === 'dc_motor', 'Visual requirement conceptId matches');
  assert(mapClassroomStageToVisualStage('INTRODUCE') === 'introduce', 'INTRODUCE maps to visual stage "introduce"');
  assert(mapClassroomStageToVisualStage('INTERACT') === 'interact', 'INTERACT maps to visual stage "interact"');
  assert(mapClassroomStageToVisualStage('QUESTION') === 'question', 'QUESTION maps to visual stage "question"');
  assert(mapClassroomStageToVisualStage('CHALLENGE') === 'challenge', 'CHALLENGE maps to visual stage "challenge"');
  assert(advancedSess.currentVisualRequirement.pedagogicalPurpose !== undefined, 'Visual requirement contains pedagogicalPurpose');

  // ---------------------------------------------------------------------------
  // TEST GROUP E: Smart Board Payload Integration (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nE. Testing Smart Board Payload Integration');
  const payload = advancedSess.currentVisualPayload;

  assert(payload !== undefined, 'Smart Board payload is populated in session state');
  assert(payload.type === 'visual_requirement', 'Payload type is "visual_requirement"');
  assert(payload.visualType === 'scientific_diagram', 'DC motor explain visualType is scientific_diagram');
  assert(typeof payload.title === 'string' && payload.title.length > 0, 'Payload title is present');
  assert(typeof payload.purpose === 'string' && payload.purpose.length > 0, 'Payload purpose is present');
  assert(typeof payload.assetUrl === 'string' && payload.assetUrl.startsWith('/'), 'Asset URL is a clean web-accessible relative path');
  assert(!payload.assetUrl.includes('C:'), 'Asset URL strictly excludes server disk paths');
  assert(!payload.assetUrl.includes('8188'), 'Asset URL strictly excludes ComfyUI port 8188');

  // ---------------------------------------------------------------------------
  // TEST GROUP F: Buddy Stage Behavior (6 tests)
  // ---------------------------------------------------------------------------
  console.log('\nF. Testing Buddy Stage Behavior');
  const demoSess = await orch.processLearnerAction(testSess.sessionId, { type: 'ADVANCE_STAGE' }); // -> DEMONSTRATE
  assert(demoSess.buddyState === 'EXPLAINING', 'DEMONSTRATE stage keeps Buddy in EXPLAINING state');

  const interactSess = await orch.processLearnerAction(testSess.sessionId, { type: 'ADVANCE_STAGE' }); // -> INTERACT
  assert(interactSess.buddyState === 'ENCOURAGING', 'INTERACT stage sets Buddy to ENCOURAGING state');
  assert(interactSess.buddyDialogue.includes('turn') || interactSess.buddyDialogue.includes('inspect'), 'Dialogue prompts student interaction');

  const questionSess = await orch.processLearnerAction(testSess.sessionId, { type: 'ADVANCE_STAGE' }); // -> QUESTION
  assert(questionSess.buddyState === 'THINKING', 'QUESTION stage sets Buddy to THINKING state');
  assert(questionSess.buddyDialogue.includes('Predict') || questionSess.buddyDialogue.includes('which component'), 'Dialogue asks the question');

  // ---------------------------------------------------------------------------
  // TEST GROUP G: Classroom Telemetry (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nG. Testing Classroom Telemetry');
  const tService = new ClassroomTelemetryService();
  const testId = `test_tele_${Date.now()}`;

  const evt1 = tService.recordEvent({
    sessionId: testId,
    conceptId: 'dc_motor',
    stage: 'INTRODUCE',
    type: 'CLASS_STARTED',
    data: { testVal: 123 },
  });
  assert(evt1.type === 'CLASS_STARTED', 'Telemetry records CLASS_STARTED event');
  assert(evt1.conceptId === 'dc_motor', 'Telemetry event records conceptId');
  assert(typeof evt1.timestamp === 'number' && evt1.timestamp > 0, 'Telemetry event records timestamp');

  // Sanitization check
  const evt2 = tService.recordEvent({
    sessionId: testId,
    conceptId: 'dc_motor',
    stage: 'INTRODUCE',
    type: 'VISUAL_SHOWN',
    data: { token: 'secret_123', password: 'xyz', publicField: 'safe' },
  });
  assert(evt2.data.token === undefined, 'Telemetry sanitizes sensitive token field');
  assert(evt2.data.password === undefined, 'Telemetry sanitizes sensitive password field');
  assert(evt2.data.publicField === 'safe', 'Telemetry retains safe public fields');

  const allEvents = tService.getSessionEvents(testId);
  assert(allEvents.length === 2, 'Session events are queryable by sessionId');
  tService.clearSession(testId);
  assert(tService.getSessionEvents(testId).length === 0, 'ClearSession wipes session buffer');

  // ---------------------------------------------------------------------------
  // TEST GROUP H: Mastery Updates (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nH. Testing Mastery Updates');
  const masterySess = await orch.createSession('dc_motor');
  const initialMastery = masterySess.masteryScore;

  // Visual interaction increases mastery
  const interactedSess = await orch.processLearnerAction(masterySess.sessionId, {
    type: 'INTERACT_VISUAL',
    interactionType: 'toggle_rotation',
  });
  assert(interactedSess.masteryScore > initialMastery, 'Interacting with visual increases mastery score');
  assert(interactedSess.interactionState.hasInteracted === true, 'InteractionState reflects interaction');

  // Challenge completion contributes significant mastery
  const challengedSess = await orch.processLearnerAction(masterySess.sessionId, {
    type: 'COMPLETE_CHALLENGE',
    outcome: 'success',
  });
  assert(challengedSess.masteryScore >= 35, 'Challenge completion increases mastery score significantly');
  assert(challengedSess.currentStage === 'ASSESS', 'Challenge completion routes to ASSESS');

  // Assessment completion
  const assessedSess = await orch.processLearnerAction(masterySess.sessionId, {
    type: 'COMPLETE_ASSESSMENT',
    isCorrect: true,
  });
  assert(assessedSess.masteryScore >= 55, 'Assessment completion increases mastery score');
  assert(assessedSess.currentStage === 'REWARD', 'Assessment completion routes to REWARD');

  // Claim reward
  const rewardedSess = await orch.processLearnerAction(masterySess.sessionId, {
    type: 'CLAIM_REWARD',
  });
  assert(rewardedSess.currentStage === 'NEXT', 'Claim reward routes to NEXT');
  assert(rewardedSess.masteryState !== 'NOT_STARTED', 'Mastery state is updated from NOT_STARTED');

  // ---------------------------------------------------------------------------
  // TEST GROUP I: Adaptive Behavior & Misconceptions (8 tests)
  // ---------------------------------------------------------------------------
  console.log('\nI. Testing Adaptive Behavior & Misconceptions');
  const adaptSess = await orch.createSession('dc_motor', 'QUESTION');

  // Incorrect answer with known misconception (opt_4 is brushes alone)
  const wrongAnswerSess = await orch.processLearnerAction(adaptSess.sessionId, {
    type: 'ANSWER_QUESTION',
    optionId: 'opt_4',
  });
  assert(wrongAnswerSess.questionState.isCorrect === false, 'Wrong answer marked as isCorrect: false');
  assert(wrongAnswerSess.currentStage === 'FEEDBACK', 'Wrong answer routes to FEEDBACK stage');
  assert(wrongAnswerSess.xiraIntervention !== undefined, 'Xira surfaces an intervention on mistake');
  assert(wrongAnswerSess.xiraIntervention.type === 'misconception', 'Intervention type is "misconception"');
  assert(wrongAnswerSess.xiraIntervention.message.includes('brushes') || wrongAnswerSess.xiraIntervention.message.includes('commutator'), 'Intervention clarifies distinction');

  // Retry question
  const retrySess = await orch.processLearnerAction(adaptSess.sessionId, {
    type: 'RETRY_QUESTION',
  });
  assert(retrySess.currentStage === 'QUESTION', 'Retry action returns to QUESTION stage');
  assert(retrySess.questionState.isSubmitted === false, 'Submission state is reset for retry');

  // Correct answer (opt_2 is split-ring commutator)
  const correctAnswerSess = await orch.processLearnerAction(adaptSess.sessionId, {
    type: 'ANSWER_QUESTION',
    optionId: 'opt_2',
  });
  assert(correctAnswerSess.questionState.isCorrect === true, 'Correct answer marked as isCorrect: true');
  assert(correctAnswerSess.xiraIntervention.type === 'praise', 'Xira surfaces praise on correct answer');

  // ---------------------------------------------------------------------------
  // TEST GROUP J: API Validation & Security (6 tests)
  // ---------------------------------------------------------------------------
  console.log('\nJ. Testing API Validation & Security');
  const apiRoutePath = path.join(rootDir, 'app/api/classroom/session/route.ts');
  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');

  assert(apiContent.includes('requireServerAuth'), 'Classroom session API enforces requireServerAuth');
  assert(apiContent.includes('conceptId.trim().length === 0'), 'API validates conceptId non-empty');
  assert(apiContent.includes('conceptId.length > 100'), 'API bounds conceptId maximum length');
  assert(!apiContent.includes('127.0.0.1:8188'), 'API does not expose ComfyUI local port');
  assert(!apiContent.includes('process.env.COMFYUI_BASE_URL'), 'API does not leak ComfyUI base URL');
  assert(!apiContent.includes('filePath'), 'API does not leak internal server filePath');

  // ---------------------------------------------------------------------------
  // TEST GROUP K: Visual Failure Fallback (5 tests)
  // ---------------------------------------------------------------------------
  console.log('\nK. Testing Visual Failure Fallback');
  // Unknown concept creates safe fallback
  const fallbackSess = await orch.createSession('completely_unknown_concept_9999');
  assert(fallbackSess.currentVisualPayload !== undefined, 'Fallback session provides a valid Smart Board payload');
  assert(fallbackSess.currentVisualPayload.type === 'visual_requirement', 'Fallback payload has type "visual_requirement"');
  assert(typeof fallbackSess.currentVisualPayload.title === 'string', 'Fallback payload has valid title');
  assert(typeof fallbackSess.currentVisualPayload.purpose === 'string', 'Fallback payload has valid purpose');
  assert(fallbackSess.currentStage === 'INTRODUCE', 'Fallback session successfully initializes at INTRODUCE');

  // ---------------------------------------------------------------------------
  // TEST GROUP L: Regression Protection (6 tests)
  // ---------------------------------------------------------------------------
  console.log('\nL. Testing Regression Protection');
  assert(CANONICAL_CLASSROOM_LESSONS['dc_motor'] !== undefined, 'Canonical dc_motor lesson preserved');
  assert(CANONICAL_CLASSROOM_LESSONS['projectile_motion'] !== undefined, 'Canonical projectile_motion lesson preserved');
  assert(CANONICAL_CLASSROOM_LESSONS['human_heart_anatomy'] !== undefined, 'Canonical human_heart_anatomy lesson preserved');
  assert(getClassroomLesson('electric_motor').conceptId === 'dc_motor', 'Synonym electric_motor resolves to dc_motor');
  assert(getClassroomLesson('kinematics').conceptId === 'projectile_motion', 'Synonym kinematics resolves to projectile_motion');
  assert(getClassroomLesson('cardiac').conceptId === 'human_heart_anatomy', 'Synonym cardiac resolves to human_heart_anatomy');

  // ---------------------------------------------------------------------------
  // END-TO-END DC MOTOR INTEGRATION SCENARIO (Step 21)
  // ---------------------------------------------------------------------------
  console.log('\n===========================================================');
  console.log('M. END-TO-END DC MOTOR & COMMUTATION SCENARIO');
  console.log('===========================================================');

  // 1. START -> INTRODUCE
  let e2e = await orch.createSession('dc_motor', 'INTRODUCE');
  assert(e2e.currentStage === 'INTRODUCE', 'E2E Step 1: Lesson starts at INTRODUCE');
  assert(e2e.buddyState === 'INTRODUCING', 'E2E Step 1: Buddy welcomes student');

  // 2. ADVANCE -> EXPLAIN
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'ADVANCE_STAGE' });
  assert(e2e.currentStage === 'EXPLAIN', 'E2E Step 2: Advanced to EXPLAIN');
  assert(e2e.currentVisualPayload.visualType === 'scientific_diagram', 'E2E Step 2: Smart Board renders scientific diagram');

  // 3. ADVANCE -> DEMONSTRATE
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'ADVANCE_STAGE' });
  assert(e2e.currentStage === 'DEMONSTRATE', 'E2E Step 3: Advanced to DEMONSTRATE');

  // 4. ADVANCE -> INTERACT
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'ADVANCE_STAGE' });
  assert(e2e.currentStage === 'INTERACT', 'E2E Step 4: Advanced to INTERACT');
  assert(e2e.buddyState === 'ENCOURAGING', 'E2E Step 4: Buddy prompts student interaction');

  // 5. INTERACT with Visual
  e2e = await orch.processLearnerAction(e2e.sessionId, {
    type: 'INTERACT_VISUAL',
    interactionType: 'toggle_rotation',
  });
  assert(e2e.interactionState.hasInteracted === true, 'E2E Step 5: Interaction recorded');

  // 6. ADVANCE -> QUESTION
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'ADVANCE_STAGE' });
  assert(e2e.currentStage === 'QUESTION', 'E2E Step 6: Advanced to QUESTION');

  // 7. ANSWER INCORRECT
  e2e = await orch.processLearnerAction(e2e.sessionId, {
    type: 'ANSWER_QUESTION',
    optionId: 'opt_4', // Incorrect (brushes alone)
  });
  assert(e2e.currentStage === 'FEEDBACK', 'E2E Step 7: Incorrect answer routes to FEEDBACK');
  assert(e2e.questionState.isCorrect === false, 'E2E Step 7: Answer marked incorrect');
  assert(e2e.xiraIntervention.type === 'misconception', 'E2E Step 7: Xira surfaces misconception clarification');

  // 8. RETRY QUESTION
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'RETRY_QUESTION' });
  assert(e2e.currentStage === 'QUESTION', 'E2E Step 8: Retry returns to QUESTION');

  // 9. ANSWER CORRECT
  e2e = await orch.processLearnerAction(e2e.sessionId, {
    type: 'ANSWER_QUESTION',
    optionId: 'opt_2', // Correct (split-ring commutator)
  });
  assert(e2e.currentStage === 'FEEDBACK', 'E2E Step 9: Correct answer routes to FEEDBACK');
  assert(e2e.questionState.isCorrect === true, 'E2E Step 9: Answer marked correct');

  // 10. ADVANCE -> PRACTICE
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'ADVANCE_STAGE' });
  assert(e2e.currentStage === 'PRACTICE', 'E2E Step 10: Advanced to PRACTICE');

  // 11. ADVANCE -> CHALLENGE
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'ADVANCE_STAGE' });
  assert(e2e.currentStage === 'CHALLENGE', 'E2E Step 11: Advanced to CHALLENGE');

  // 12. COMPLETE CHALLENGE
  e2e = await orch.processLearnerAction(e2e.sessionId, {
    type: 'COMPLETE_CHALLENGE',
    outcome: 'success',
  });
  assert(e2e.currentStage === 'ASSESS', 'E2E Step 12: Challenge completed -> routes to ASSESS');

  // 13. COMPLETE ASSESSMENT
  e2e = await orch.processLearnerAction(e2e.sessionId, {
    type: 'COMPLETE_ASSESSMENT',
    isCorrect: true,
  });
  assert(e2e.currentStage === 'REWARD', 'E2E Step 13: Assessment completed -> routes to REWARD');

  // 14. CLAIM REWARD
  e2e = await orch.processLearnerAction(e2e.sessionId, { type: 'CLAIM_REWARD' });
  assert(e2e.currentStage === 'NEXT', 'E2E Step 14: Reward claimed -> routes to NEXT');

  // 15. SELECT NEXT CONCEPT
  assert(e2e.nextRecommendedConceptId === 'projectile_motion', 'E2E Step 15: Next concept recommended safely (projectile_motion)');

  // Final count
  console.log('\n===========================================================');
  console.log(`PHASE 4 CLASSROOM INTEGRATION SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('===========================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase4ClassIntegrationTests().catch((err) => {
  console.error('Fatal error during Phase 4 Classroom Integration test execution:', err);
  process.exit(1);
});
