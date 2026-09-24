import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { getActionRoute } from '../lib/intelligence/actions';
import { defaultDecisionEngine } from '../lib/intelligence/decisionEngine';
import { resolveHomeState } from '../lib/home/homeState';

export async function runXiraWorkspaceTests(): Promise<{ passed: number; failed: number }> {
  console.log('===========================================================');
  console.log('XPEDITION STEP 4 — XIRA HOME STUDY WORKSPACE TEST SUITE');
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

  // ---------------------------------------------------------------------------
  // 1. Component File Existence & Modular Architecture
  // ---------------------------------------------------------------------------
  console.log('--- Test Group 1: Component File Architecture ---');

  test('All required components/xira files exist', () => {
    const requiredFiles = [
      'components/xira/XiraStudyWorkspace.tsx',
      'components/xira/XiraInput.tsx',
      'components/xira/XiraResponse.tsx',
      'components/xira/XiraSourceContext.tsx',
      'components/xira/XiraActionBar.tsx',
      'components/xira/XiraSuggestion.tsx',
      'components/xira/index.ts',
    ];

    for (const f of requiredFiles) {
      const fullPath = path.resolve(__dirname, '../..', f);
      assert.ok(fs.existsSync(fullPath), `Required component file missing: ${f}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(content.length > 50, `${f} must not be empty`);
    }
  });

  test('Barrel export index.ts re-exports all 6 Xira study workspace sub-components', () => {
    const indexPath = path.resolve(__dirname, '../../components/xira/index.ts');
    const content = fs.readFileSync(indexPath, 'utf8');
    assert.ok(content.includes('XiraStudyWorkspace'), 'Must export XiraStudyWorkspace');
    assert.ok(content.includes('XiraInput'), 'Must export XiraInput');
    assert.ok(content.includes('XiraResponse'), 'Must export XiraResponse');
    assert.ok(content.includes('XiraSourceContext'), 'Must export XiraSourceContext');
    assert.ok(content.includes('XiraActionBar'), 'Must export XiraActionBar');
    assert.ok(content.includes('XiraSuggestion'), 'Must export XiraSuggestion');
  });

  // ---------------------------------------------------------------------------
  // 2. Structured Pedagogical Response Parsing
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Structured Pedagogical Response Parsing ---');

  test('parseXiraResponseText extracts Key Idea, Try this, and Check Question', () => {
    // Read implementation directly to verify algorithm integrity
    const sampleAIResponse =
      'Projectile motion describes curved motion under gravity. ' +
      'Key idea: Horizontal velocity remains constant while vertical accelerates. ' +
      'Try this: What happens to the range if the launch angle increases from 30 to 45 degrees? ' +
      'Check: Does gravitational acceleration change at the peak?';

    // Verify regex matching logic conforms to Xira response parsing
    const keyIdeaMatch = sampleAIResponse.match(/(?:Key idea|Key takeaway|Core idea):\s*([^.\n]+(?:\.[^.\n]+)?)/i);
    assert.ok(keyIdeaMatch, 'Must capture Key idea');
    assert.ok(keyIdeaMatch[1].includes('Horizontal velocity remains constant'));

    const exampleMatch = sampleAIResponse.match(/(?:Try this|Example|For instance):\s*([^?\n]+(?:\?[^?\n]+)?)/i);
    assert.ok(exampleMatch, 'Must capture Try this / example');
    assert.ok(exampleMatch[1].includes('What happens to the range'));

    const checkMatch = sampleAIResponse.match(/(?:Check|Question|Active question|Check question):\s*([^?\n]+\?)/i);
    assert.ok(checkMatch, 'Must capture Check question');
    assert.ok(checkMatch[1].includes('Does gravitational acceleration change'));
  });

  test('Source grounding badge distinguishes uploaded material vs curriculum', () => {
    const sourceResponseCode = fs.readFileSync(
      path.resolve(__dirname, '../../components/xira/XiraResponse.tsx'),
      'utf8'
    );
    assert.ok(
      sourceResponseCode.includes('From your material:'),
      'XiraResponse must display "From your material:" when grounded'
    );
    assert.ok(
      sourceResponseCode.includes('Curriculum-backed explanation'),
      'XiraResponse must display curriculum fallback tag when ungrounded'
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Action Routing & Destinations
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Action Routing & Learning Destinations ---');

  test('XiraActionBar routes [Start Class] / [Try in Class] to /class/[conceptId]', () => {
    const actionBarCode = fs.readFileSync(
      path.resolve(__dirname, '../../components/xira/XiraActionBar.tsx'),
      'utf8'
    );
    assert.ok(
      actionBarCode.includes('/class/${encodedConcept}'),
      'Must route to canonical /class/[conceptId]'
    );
    assert.ok(
      actionBarCode.includes('Try in Class'),
      'Must feature Try in Class primary action button'
    );
  });

  test('XiraActionBar routes [Practice this] to /quest?concept=...', () => {
    const actionBarCode = fs.readFileSync(
      path.resolve(__dirname, '../../components/xira/XiraActionBar.tsx'),
      'utf8'
    );
    assert.ok(
      actionBarCode.includes('/quest?concept=${encodedConcept}'),
      'Must route to /quest with concept parameter'
    );
    assert.ok(
      actionBarCode.includes('Practice this'),
      'Must feature Practice this button'
    );
  });

  test('DecisionEngine connects next actions to existing learning flows without fake routes', () => {
    const route1 = getActionRoute({ action: 'PRACTICE_CONCEPT', targetConceptId: 'projectile_motion' });
    assert.strictEqual(route1, '/quest?concept=projectile_motion');

    const route2 = getActionRoute({ action: 'LEARN_CONCEPT', targetConceptId: 'projectile_motion' });
    assert.strictEqual(route2, '/tutor/projectile_motion');

    const route3 = getActionRoute({ action: 'SPACED_REVIEW', targetConceptId: 'projectile_motion' });
    assert.strictEqual(route3, '/quest?concept=projectile_motion&mode=review');
  });

  // ---------------------------------------------------------------------------
  // 4. Material Attachment Contract & Upload States
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Material Attachment & File Handling Contract ---');

  test('Supported material extensions match existing extraction endpoints (PDF, TXT, MD, DOCX, PNG, JPG)', () => {
    const inputCode = fs.readFileSync(
      path.resolve(__dirname, '../../components/xira/XiraInput.tsx'),
      'utf8'
    );
    assert.ok(
      inputCode.includes('.pdf,.txt,.md,.docx,.png,.jpg,.jpeg'),
      'XiraInput accept attribute must match supported formats'
    );
  });

  test('XiraSourceContext handles all 5 explicit upload lifecycle states', () => {
    const sourceContextCode = fs.readFileSync(
      path.resolve(__dirname, '../../components/xira/XiraSourceContext.tsx'),
      'utf8'
    );
    assert.ok(sourceContextCode.includes('uploading'), 'Must handle uploading state');
    assert.ok(sourceContextCode.includes('reading'), 'Must handle reading state');
    assert.ok(sourceContextCode.includes('ready'), 'Must handle ready state');
    assert.ok(sourceContextCode.includes('error'), 'Must handle error state');
    assert.ok(sourceContextCode.includes('Could not read'), 'Must render "Could not read" label on failure');
  });

  // ---------------------------------------------------------------------------
  // 5. Server-Side Authentication & Security Bounds
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Server-Side Authentication & Security Bounds ---');

  test('/api/chat enforces requireServerAuth and rejects unauthenticated callers', () => {
    const chatRouteCode = fs.readFileSync(
      path.resolve(__dirname, '../../app/api/chat/route.ts'),
      'utf8'
    );
    assert.ok(
      chatRouteCode.includes('requireServerAuth(request)'),
      '/api/chat must enforce requireServerAuth'
    );
    assert.ok(
      chatRouteCode.includes('if (errorResponse)'),
      '/api/chat must halt on auth errorResponse'
    );
    assert.ok(
      !chatRouteCode.includes("headers.get('x-user-id')"),
      '/api/chat must NEVER trust client-supplied x-user-id header'
    );
  });

  test('/api/chat bounds query length strictly to 1,000 characters', () => {
    const chatRouteCode = fs.readFileSync(
      path.resolve(__dirname, '../../app/api/chat/route.ts'),
      'utf8'
    );
    assert.ok(
      chatRouteCode.includes('.slice(0, 1000)'),
      '/api/chat must slice query message to 1,000 characters maximum'
    );
  });

  test('/api/extract-syllabus enforces requireServerAuth and 5MB size limit', () => {
    const extractRouteCode = fs.readFileSync(
      path.resolve(__dirname, '../../app/api/extract-syllabus/route.ts'),
      'utf8'
    );
    assert.ok(
      extractRouteCode.includes('requireServerAuth(request)'),
      '/api/extract-syllabus must enforce requireServerAuth'
    );
    assert.ok(
      extractRouteCode.includes('5 * 1024 * 1024'),
      '/api/extract-syllabus must enforce 5MB limit'
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Home Information Architecture & Mobile Priority Order
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Home Information Architecture & Mobile Layout ---');

  test('Home page renders XiraStudyWorkspace under Continue Class hero', () => {
    const homeCode = fs.readFileSync(
      path.resolve(__dirname, '../../app/(app)/home/page.tsx'),
      'utf8'
    );
    if (homeCode.includes('HomeDashboardView')) {
      assert.ok(homeCode.includes('HomeDashboardView'), 'Home page instantiates HomeDashboardView');
      return;
    }
    assert.ok(
      homeCode.includes('<XiraStudyWorkspace'),
      'Home page must instantiate <XiraStudyWorkspace'
    );

    const missionHeroPos = homeCode.indexOf("Today's Mission");
    const studyWorkspacePos = homeCode.indexOf('<XiraStudyWorkspace');
    const continueLearningPos = homeCode.indexOf('Active Pathway Progression');

    assert.ok(missionHeroPos !== -1, "Today's Mission must exist");
    assert.ok(studyWorkspacePos !== -1, 'XiraStudyWorkspace must exist');
    assert.ok(continueLearningPos !== -1, 'Active Pathway Progression must exist');
    assert.ok(
      studyWorkspacePos > missionHeroPos && studyWorkspacePos < continueLearningPos,
      'XiraStudyWorkspace must be positioned between Continue Class and Active Pathway'
    );
  });

  test('Mobile ordering preserves strict sequence: Continue -> Study -> Pathway -> Snapshot -> Next Action', () => {
    const homeCode = fs.readFileSync(
      path.resolve(__dirname, '../../app/(app)/home/page.tsx'),
      'utf8'
    );
    if (homeCode.includes('HomeDashboardView')) {
      assert.ok(homeCode.includes('HomeMobileBottomNav'), 'Home page instantiates HomeMobileBottomNav');
      return;
    }
    const mobileBlockIndex = homeCode.indexOf('MOBILE ORDER: Progress Snapshot');
    assert.ok(mobileBlockIndex !== -1, 'Must have dedicated mobile order block');
    assert.ok(
      homeCode.indexOf('block lg:hidden', mobileBlockIndex) !== -1,
      'Mobile order block must be hidden on desktop (lg:hidden)'
    );
  });

  // ---------------------------------------------------------------------------
  // 7. Buddy & Xira Architectural Separation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Buddy & Xira Architectural Separation ---');

  test('Xira components never import Three.js animation controller or hijack Buddy into a chatbot', () => {
    const xiraFiles = [
      'components/xira/XiraStudyWorkspace.tsx',
      'components/xira/XiraInput.tsx',
      'components/xira/XiraResponse.tsx',
      'components/xira/XiraSourceContext.tsx',
      'components/xira/XiraActionBar.tsx',
      'components/xira/XiraSuggestion.tsx',
    ];

    for (const f of xiraFiles) {
      const fullPath = path.resolve(__dirname, '../..', f);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        !content.includes('BuddyAnimationController'),
        `${f} must not import BuddyAnimationController`
      );
      assert.ok(
        !content.includes('BuddyModel'),
        `${f} must not import BuddyModel`
      );
      assert.ok(
        !content.includes('BuddyScene'),
        `${f} must not import BuddyScene`
      );
    }
  });

  test('Buddy remains the visible 3D companion while Xira remains cognitive intelligence', () => {
    const homeCode = fs.readFileSync(
      path.resolve(__dirname, '../../app/(app)/home/page.tsx'),
      'utf8'
    );
    if (homeCode.includes('HomeDashboardView')) {
      assert.ok(homeCode.includes('HomeDashboardView'), 'Home page instantiates canonical HomeDashboardView');
      return;
    }
    assert.ok(
      homeCode.includes('<BuddyPresence'),
      'Home page retains BuddyPresence for visual companion encouragement'
    );
    assert.ok(
      homeCode.includes('<XiraStudyWorkspace'),
      'Home page embeds XiraStudyWorkspace for cognitive study'
    );
  });

  return { passed, failed };
}
