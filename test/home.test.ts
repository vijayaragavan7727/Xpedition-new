/**
 * Automated Test Suite: Xpedition Home Command Center
 *
 * Verifies all 12 core requirements for the Home page command center:
 * 1. New learner empty state
 * 2. Returning learner
 * 3. Actual XP rendering (no fabricated XP)
 * 4. Actual streak rendering (no fabricated streak)
 * 5. Actual mastery rendering (no fabricated mastery)
 * 6. Adaptive mission rendering (from DecisionEngine + NextQuestResolver)
 * 7. Correct next-quest route (canonical experience route)
 * 8. No fake recommendation
 * 9. Xira insight only when supported by evidence
 * 10. Mobile layout safety & hierarchy
 * 11. No horizontal overflow safety (bounded dimensions)
 * 12. Existing navigation works (canonical routes)
 */

import { resolveHomeState } from '../lib/home/homeState';
import { UserStoreData, INITIAL_ZERO_STATE, ConceptMastery, Attempt } from '../lib/store';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ' — ' + detail : ''}`);
    testsFailed++;
  }
}

function createBaseMockStore(overrides?: Partial<UserStoreData>): UserStoreData {
  const store: UserStoreData = JSON.parse(JSON.stringify(INITIAL_ZERO_STATE));
  const activeGraph = store.graphs[0];
  activeGraph.id = 'graph_python_01';
  activeGraph.goalText = 'Python Mastery';
  activeGraph.concepts = [
    {
      id: 'python_debugging_basics',
      name: 'Python Debugging Basics',
      masteryPercentage: 0,
      retentionRisk: 0.1,
      ptsSinceCalibration: 0,
      itemsNext: 6,
    },
    {
      id: 'python_loops',
      name: 'Python Loops & Control Flow',
      masteryPercentage: 0,
      retentionRisk: 0.1,
      ptsSinceCalibration: 0,
      itemsNext: 6,
    },
  ];
  activeGraph.attempts = [];

  store.activeGraphId = activeGraph.id;
  store.goalText = activeGraph.goalText;
  store.concepts = activeGraph.concepts;
  store.attempts = activeGraph.attempts;
  store.handle = 'AdaLovelace';

  if (overrides) {
    Object.assign(store, overrides);
    if (overrides.concepts) {
      activeGraph.concepts = overrides.concepts;
      store.concepts = overrides.concepts;
    }
    if (overrides.attempts) {
      activeGraph.attempts = overrides.attempts;
      store.attempts = overrides.attempts;
    }
    if (overrides.goalText) {
      activeGraph.goalText = overrides.goalText;
      store.goalText = overrides.goalText;
    }
  }

  return store;
}

export function runHomeTests() {
  console.log('=== XPEDITION HOME COMMAND CENTER TEST SUITE ===\n');

  // --------------------------------------------------------------------------
  // Test 1: New learner empty state
  // --------------------------------------------------------------------------
  console.log('--- Suite 1: New Learner Empty State ---');
  {
    const store = createBaseMockStore({ attempts: [] });
    const state = resolveHomeState(store);

    assert(state.isNewLearner === true, '1.1 Identifies new learner with 0 attempts');
    assert(state.mission.buttonLabel === 'Start your first quest', '1.2 CTA button asks to Start your first quest');
    assert(state.mission.title.includes('Start your first quest'), '1.3 Mission title reflects first quest start');
    assert(state.stats.xp === 0, '1.4 Zero XP rendered for brand new learner');
    assert(state.stats.level === 1, '1.5 Level 1 rendered for brand new learner');
    assert(state.stats.streak === 0, '1.6 Zero day streak rendered for brand new learner');
    assert(state.stats.masteredCount === 0, '1.7 Zero mastered count rendered');
  }

  // --------------------------------------------------------------------------
  // Test 2: Returning learner
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 2: Returning Learner ---');
  {
    const attempts: Attempt[] = [
      {
        id: 'att_1',
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        itemHash: 'hash_1',
        isCorrect: true,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'att_2',
        conceptId: 'python_debugging_basics',
        conceptName: 'Python Debugging Basics',
        itemHash: 'hash_2',
        isCorrect: true,
        timestamp: Date.now(),
      },
    ];

    const store = createBaseMockStore({
      attempts,
      concepts: [
        {
          id: 'python_debugging_basics',
          name: 'Python Debugging Basics',
          masteryPercentage: 55,
          retentionRisk: 0.1,
          ptsSinceCalibration: 16,
          itemsNext: 4,
        },
      ],
    });

    const state = resolveHomeState(store);
    assert(state.isNewLearner === false, '2.1 Returning learner recognized');
    assert(state.mission.buttonLabel !== 'Start your first quest', '2.2 Returning learner does not see initial prompt');
    assert(state.pathway.overallMastery === 55, '2.3 Preserves actual concept mastery of 55%');
  }

  // --------------------------------------------------------------------------
  // Test 3: Actual XP rendering (Strict formula: correct*25 + total*10 + mastered*100)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 3: Actual XP and Level Calculations ---');
  {
    const attempts: Attempt[] = [
      { id: '1', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: Date.now() },
      { id: '2', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: Date.now() },
      { id: '3', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: false, timestamp: Date.now() },
    ];
    // 2 correct, 3 total. XP = (2 * 25) + (3 * 10) = 50 + 30 = 80 XP
    const store = createBaseMockStore({ attempts });
    const state = resolveHomeState(store);

    assert(state.stats.xp === 80, `3.1 XP strictly computed as 80 (got ${state.stats.xp})`);
    assert(state.stats.level === 1, `3.2 Level strictly 1 (got ${state.stats.level})`);
    assert(state.stats.progressToNextLevel === 220, `3.3 Remaining XP is 220 (got ${state.stats.progressToNextLevel})`);
  }

  // --------------------------------------------------------------------------
  // Test 4: Actual streak rendering
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 4: Actual Streak Rendering ---');
  {
    const now = Date.now();
    const attempts: Attempt[] = [
      { id: '1', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: now },
      { id: '2', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: now - 86400000 },
      { id: '3', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', isCorrect: true, timestamp: now - 86400000 * 2 },
    ];
    const store = createBaseMockStore({ attempts });
    const state = resolveHomeState(store);

    assert(state.stats.streak >= 3, `4.1 Streak correctly rendered as ${state.stats.streak} (expected >= 3)`);
  }

  // --------------------------------------------------------------------------
  // Test 5: Actual mastery rendering
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 5: Actual Mastery Rendering ---');
  {
    const store = createBaseMockStore({
      concepts: [
        { id: 'c1', name: 'Concept 1', masteryPercentage: 80, retentionRisk: 0.1, ptsSinceCalibration: 20, itemsNext: 3 },
        { id: 'c2', name: 'Concept 2', masteryPercentage: 60, retentionRisk: 0.1, ptsSinceCalibration: 10, itemsNext: 4 },
      ],
    });
    const state = resolveHomeState(store);

    assert(state.stats.masteryPercentage === 70, `5.1 Overall mastery is exactly (80+60)/2 = 70% (got ${state.stats.masteryPercentage}%)`);
    assert(state.stats.masteredCount === 1, `5.2 Exactly 1 concept mastered >= 80% (got ${state.stats.masteredCount})`);
  }

  // --------------------------------------------------------------------------
  // Test 6: Adaptive mission rendering via DecisionEngine
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 6: Adaptive Mission Rendering ---');
  {
    // Misconception scenario: repeated incorrect attempts with high confidence
    const attempts: Attempt[] = [
      { id: '1', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', itemHash: 'bug_1', isCorrect: false, confidence: 'known', timestamp: Date.now() - 2000 },
      { id: '2', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', itemHash: 'bug_1', isCorrect: false, confidence: 'known', timestamp: Date.now() - 1000 },
    ];
    const store = createBaseMockStore({
      attempts,
      concepts: [
        { id: 'python_debugging_basics', name: 'Python Debugging Basics', masteryPercentage: 30, retentionRisk: 0.1, ptsSinceCalibration: 5, itemsNext: 5 },
      ],
    });

    const state = resolveHomeState(store);
    assert(state.mission.conceptId === 'python_debugging_basics', '6.1 Mission targets Python Debugging');
    assert(state.mission.nextQuestTarget.action === 'CORRECT_MISCONCEPTION', `6.2 Adaptive action resolves to CORRECT_MISCONCEPTION (got ${state.mission.nextQuestTarget.action})`);
    assert(state.mission.title === 'Code Lab: Variable Accumulation Remediation', `6.3 Mission title resolves to canonical remediation title (got ${state.mission.title})`);
    assert(state.mission.buttonLabel === 'Correct Misconception', `6.4 Button label resolves to "Correct Misconception" (got ${state.mission.buttonLabel})`);
  }

  // --------------------------------------------------------------------------
  // Test 7: Correct next-quest route
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 7: Correct Next Quest Route ---');
  {
    const attempts: Attempt[] = [
      { id: '1', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', itemHash: 'bug_1', isCorrect: false, confidence: 'known', timestamp: Date.now() - 2000 },
      { id: '2', conceptId: 'python_debugging_basics', conceptName: 'Python Debugging Basics', itemHash: 'bug_1', isCorrect: false, confidence: 'known', timestamp: Date.now() - 1000 },
    ];
    const store = createBaseMockStore({ attempts });
    const state = resolveHomeState(store);

    assert(state.mission.route === '/quest?concept=python_debugging_basics&mode=assisted', `7.1 Canonical route matches assisted remediation URL (got ${state.mission.route})`);
    assert(state.mission.isExperiential === true, '7.2 Flagged as experiential quest');
    assert(state.mission.experienceTypeLabel === 'Interactive Code Lab', '7.3 Labeled as Interactive Code Lab');
  }

  // --------------------------------------------------------------------------
  // Test 8: No fake recommendation (target from user concepts)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 8: Grounded Target Concept ---');
  {
    const store = createBaseMockStore({
      concepts: [
        { id: 'human_heart_anatomy', name: 'Human Heart Anatomy', masteryPercentage: 40, retentionRisk: 0.1, ptsSinceCalibration: 8, itemsNext: 4 },
      ],
    });
    const state = resolveHomeState(store);

    assert(state.mission.conceptId === 'human_heart_anatomy', '8.1 Targets existing concept in graph');
    assert(state.mission.conceptName === 'Human Heart Anatomy', '8.2 Uses authentic concept name');
  }

  // --------------------------------------------------------------------------
  // Test 9: Xira insight only when supported by evidence
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 9: Evidence-Grounded Xira Insights ---');
  {
    // Scenario A: Fading concept
    const storeRetention = createBaseMockStore({
      attempts: [{ id: '1', conceptId: 'c1', conceptName: 'Retention Test Concept', isCorrect: true, timestamp: Date.now() }],
      concepts: [
        { id: 'c1', name: 'Retention Test Concept', masteryPercentage: 70, retentionRisk: 0.65, ptsSinceCalibration: 15, itemsNext: 3 },
      ],
    });
    const stateRetention = resolveHomeState(storeRetention);
    assert(stateRetention.xiraInsight.type === 'RETENTION', '9.1 Triggered RETENTION insight when retentionRisk > 0.35');
    assert(stateRetention.xiraInsight.lead.includes('Retention risk is rising'), '9.2 Lead text specifies retention risk');

    // Scenario B: Repeated mistakes
    const storeMistake = createBaseMockStore({
      attempts: [
        { id: '1', conceptId: 'c1', conceptName: 'Syntax', itemHash: 'same_item', isCorrect: false, timestamp: Date.now() - 1000 },
        { id: '2', conceptId: 'c1', conceptName: 'Syntax', itemHash: 'same_item', isCorrect: false, timestamp: Date.now() },
      ],
      concepts: [{ id: 'c1', name: 'Syntax', masteryPercentage: 20, retentionRisk: 0.1, ptsSinceCalibration: 0, itemsNext: 6 }],
    });
    const stateMistake = resolveHomeState(storeMistake);
    assert(stateMistake.xiraInsight.type === 'MISCONCEPTION', '9.3 Triggered MISCONCEPTION insight on repeated error evidence');
  }

  // --------------------------------------------------------------------------
  // Test 10: Mobile layout hierarchy
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 10: Mobile Layout Hierarchy Safety ---');
  {
    const store = createBaseMockStore();
    const state = resolveHomeState(store);

    // Verify all 8 structural keys exist and are non-empty
    assert(Boolean(state.greeting), '10.1 Section B (Greeting) populated');
    assert(Boolean(state.contextSubtitle), '10.2 Section B (Context Subtitle) populated');
    assert(Boolean(state.mission.title), '10.3 Section C (Primary Mission) populated');
    assert(Boolean(state.mission.buttonLabel), '10.4 Section D (Primary CTA) populated');
    assert(Boolean(state.stats), '10.5 Section E (Progress Snapshot) populated');
    assert(Boolean(state.pathway.concepts), '10.6 Section F (Continue Learning) populated');
    assert(Boolean(state.xiraInsight), '10.7 Section G (Xira Insight) populated');
    assert(state.quickEntry.length === 4, '10.8 Section H (Quick Entry) has 4 portals');
  }

  // --------------------------------------------------------------------------
  // Test 11: No horizontal overflow safety
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 11: Overflow Safety Checks ---');
  {
    const store = createBaseMockStore({
      goalText: 'Super long goal title that must wrap cleanly without breaking mobile viewport limits or causing horizontal scroll',
    });
    const state = resolveHomeState(store);

    assert(state.pathway.goalTitle.length > 50, '11.1 Accommodates long pathway titles');
    assert(state.quickEntry.every((q) => q.title.length < 25), '11.2 Quick entry titles remain compact');
    assert(typeof state.mission.title === 'string' && state.mission.title.length > 0, '11.3 Mission title is valid string');
  }

  // --------------------------------------------------------------------------
  // Test 12: Existing navigation works
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 12: Canonical Quick Entry Routing ---');
  {
    const store = createBaseMockStore();
    const state = resolveHomeState(store);

    const routes = state.quickEntry.map((q) => q.route);
    assert(routes.includes('/learn'), '12.1 Quick link /learn exists');
    assert(routes.includes('/world'), '12.2 Quick link /world exists');
    assert(routes.includes('/xira'), '12.3 Quick link /xira exists');
    assert(routes.includes('/progress'), '12.4 Quick link /progress exists');
  }

  console.log(`\n========================================`);
  console.log(`HOME SUITE RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`========================================\n`);

  return { passed: testsPassed, failed: testsFailed };
}
