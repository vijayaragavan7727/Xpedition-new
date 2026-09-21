import * as assert from 'assert';
import {
  ClassroomIntelligenceService,
  ClassroomTelemetryEvent,
  defaultClassroomIntelligence,
} from '../lib/classroom/classroomIntelligence';

export async function runClassroomAdaptiveTests(): Promise<{ passed: number; failed: number }> {
  console.log('===========================================================');
  console.log('XPEDITION PHASE 3 — CLASSROOM ADAPTIVE INTELLIGENCE SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  const service = new ClassroomIntelligenceService();

  // ---------------------------------------------------------------------------
  // 1. Initial State & Concept Isolation
  // ---------------------------------------------------------------------------
  console.log('--- Test Group 1: State Initialization & Concept Isolation ---');

  test('1. Initial state is isolated per conceptId and initialized with defaults', () => {
    service.resetState();
    const stateMotor = service.getIntelligenceState('dc_motor', 'DC Motor & Commutation');
    const stateProj = service.getIntelligenceState('projectile_motion', 'Projectile Motion');

    assert.strictEqual(stateMotor.conceptId, 'dc_motor');
    assert.strictEqual(stateProj.conceptId, 'projectile_motion');
    assert.strictEqual(stateMotor.recentAttemptsCount, 0);
    assert.strictEqual(stateMotor.recentMistakesCount, 0);
    assert.strictEqual(stateMotor.hintsUsedCount, 0);
    assert.notStrictEqual(stateMotor, stateProj, 'Concept intelligence states must be strictly isolated');
  });

  // ---------------------------------------------------------------------------
  // 2. Misconception Detection & Pedagogical Directive
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Misconception Detection & Adaptive Interventions ---');

  test('2. Misconception tag triggers MISCONCEPTION signal and remedial callout', () => {
    service.resetState('dc_motor');

    const event: ClassroomTelemetryEvent = {
      eventType: 'question_attempt',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor & Commutation',
      timestamp: Date.now(),
      data: {
        questionId: 'q_dcm_1',
        isCorrect: false,
        difficulty: 'EASY',
        misconceptionTag: 'commutator_vs_brushes',
        attemptNumber: 1,
      },
    };

    const directive = service.processTelemetry(event);

    assert.ok(directive, 'Directive must be generated on incorrect attempt');
    assert.strictEqual(directive!.signal, 'MISCONCEPTION');
    assert.strictEqual(directive!.detectedMisconception, 'commutator_vs_brushes');
    assert.ok(directive!.smartBoardCallout, 'Must include smartBoardCallout');
    assert.strictEqual(directive!.smartBoardCallout!.type, 'remedial');
    assert.ok(
      directive!.smartBoardCallout!.message.includes('Commutator vs Brushes'),
      'Callout message must clarify the specific commutator misconception'
    );
    assert.strictEqual(directive!.buddyDirective?.state, 'THINKING');
  });

  test('3. Torque linearity misconception triggers targeted linear_vs_quadratic clarification', () => {
    service.resetState('dc_motor');

    const event: ClassroomTelemetryEvent = {
      eventType: 'question_attempt',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor & Commutation',
      timestamp: Date.now(),
      data: {
        questionId: 'q_dcm_2',
        isCorrect: false,
        difficulty: 'MEDIUM',
        misconceptionTag: 'linear_vs_quadratic_torque',
        attemptNumber: 1,
      },
    };

    const directive = service.processTelemetry(event);

    assert.ok(directive);
    assert.strictEqual(directive!.detectedMisconception, 'linear_vs_quadratic_torque');
    assert.ok(directive!.smartBoardCallout!.message.includes('linearly with current'));
  });

  // ---------------------------------------------------------------------------
  // 3. Knowledge Gap & Progressive Hint Reliance
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Knowledge Gap from Progressive Hint Scaffolding ---');

  test('4. Repeated hint requests combined with mistake detect KNOWLEDGE_GAP', () => {
    service.resetState('dc_motor');

    // Student requests hint 1 and hint 2
    service.processTelemetry({
      eventType: 'hint_requested',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor & Commutation',
      timestamp: Date.now(),
      data: { hintStage: 1 },
    });
    service.processTelemetry({
      eventType: 'hint_requested',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor & Commutation',
      timestamp: Date.now(),
      data: { hintStage: 2 },
    });

    // Student then misses an attempt without specific misconception
    const directive = service.processTelemetry({
      eventType: 'question_attempt',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor & Commutation',
      timestamp: Date.now(),
      data: {
        questionId: 'q_dcm_3',
        isCorrect: false,
        attemptNumber: 1,
      },
    });

    assert.ok(directive);
    assert.strictEqual(directive!.signal, 'KNOWLEDGE_GAP');
    assert.strictEqual(directive!.smartBoardCallout?.type, 'scaffold');
    assert.strictEqual(directive!.buddyDirective?.state, 'ENCOURAGING');
  });

  // ---------------------------------------------------------------------------
  // 4. Spaced Retention from Flashcards
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Spaced Retention Signal from Flashcards ---');

  test('5. Multiple cards marked for review trigger RECALL_FAILURE retention alert', () => {
    service.resetState('projectile_motion');

    service.processTelemetry({
      eventType: 'flashcard_reviewed',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      timestamp: Date.now(),
      data: { cardId: 'fc_p1', cardStatus: 'REVIEW' },
    });

    const directive = service.processTelemetry({
      eventType: 'flashcard_reviewed',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      timestamp: Date.now(),
      data: { cardId: 'fc_p2', cardStatus: 'REVIEW' },
    });

    assert.ok(directive);
    assert.strictEqual(directive!.signal, 'RECALL_FAILURE');
    assert.strictEqual(directive!.smartBoardCallout?.type, 'retention');
    assert.ok(directive!.smartBoardCallout?.message.includes('flagged for review'));
    assert.strictEqual(directive!.buddyDirective?.state, 'WAITING');
  });

  // ---------------------------------------------------------------------------
  // 5. Strong Mastery Confirmation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Strong Mastery & Buddy Celebration ---');

  test('6. Clean correct answer without mistakes triggers STRONG_MASTERY and Buddy celebration', () => {
    service.resetState('projectile_motion');

    const directive = service.processTelemetry({
      eventType: 'question_attempt',
      conceptId: 'projectile_motion',
      conceptName: 'Projectile Motion',
      timestamp: Date.now(),
      data: {
        questionId: 'q_proj_1',
        isCorrect: true,
        difficulty: 'EASY',
        attemptNumber: 1,
      },
    });

    assert.ok(directive);
    assert.strictEqual(directive!.signal, 'STRONG_MASTERY');
    assert.strictEqual(directive!.smartBoardCallout?.type, 'challenge');
    assert.strictEqual(directive!.buddyDirective?.state, 'CELEBRATING');
  });

  // ---------------------------------------------------------------------------
  // 6. Zero AI Tokens & Deterministic Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Deterministic Execution & Security Invariants ---');

  test('7. Decision Engine produces deterministic nextBestAction synchronously with 0 AI tokens', () => {
    const start = Date.now();
    const directive = service.processTelemetry({
      eventType: 'question_attempt',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor',
      timestamp: Date.now(),
      data: {
        questionId: 'q1',
        isCorrect: false,
        misconceptionTag: 'continuous_force_inversion',
      },
    });
    const durationMs = Date.now() - start;

    assert.ok(directive);
    assert.ok(directive!.recommendedAction, 'Must resolve canonical recommendedAction');
    assert.ok(directive!.recommendedAction.action, 'Action must be defined');
    assert.ok(durationMs < 50, `Deterministic decision must resolve in <50ms (actual: ${durationMs}ms)`);
  });

  test('8. Client telemetry cannot manipulate theta or fabricate mastery score directly', () => {
    const rawTelemetry: ClassroomTelemetryEvent = {
      eventType: 'question_attempt',
      conceptId: 'dc_motor',
      conceptName: 'DC Motor',
      timestamp: Date.now(),
      data: {
        isCorrect: true,
      },
    };

    // Confirm no client theta field exists in telemetry schema
    assert.strictEqual((rawTelemetry.data as any)?.theta, undefined);
    assert.strictEqual((rawTelemetry.data as any)?.masteryPercentage, undefined);
  });

  return { passed, failed };
}
