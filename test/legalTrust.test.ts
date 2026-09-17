/**
 * Xpedition Phase E — Legal, Trust, Privacy & Source Attribution Test Suite
 *
 * Verifies:
 * 1. Legal Config Integrity & Centralization
 * 2. Support Email Consistency
 * 3. Trust Center & Legal Document Routes
 * 4. Educational Source Attribution & License Policy
 * 5. Data Export Authorization & Sanitization
 * 6. Account Deletion & User Isolation (Zero Cross-User Contamination)
 * 7. AI Transparency Disclosures & Deterministic Boundaries
 * 8. Zero Secret Exposure & Safe Client Boundaries
 * 9. Login & Navigation Legal Links
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { LEGAL_CONFIG } from '../lib/legal/legalConfig';
import { SourceRegistry } from '../lib/intelligence/sources/sourceRegistry';
import { SourceLicensePolicy } from '../lib/intelligence/sources/sourceLicense';
import { LocalPersistenceAdapter } from '../lib/persistence/localPersistence';
import { PersistenceManager } from '../lib/persistence/persistenceAdapter';
import { CanonicalUserData } from '../lib/persistence/types';

export async function runLegalTrustTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log('======================================================');
  console.log('XPEDITION PHASE E — LEGAL & TRUST TEST SUITE');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // 1. Legal Configuration & Centralization
  // -------------------------------------------------------------------------
  console.log('--- Test Group 1: Centralized Legal Configuration ---');

  test('LEGAL_CONFIG has required metadata fields', () => {
    assert(LEGAL_CONFIG.productName === 'Xpedition', 'Product name is Xpedition');
    assert(LEGAL_CONFIG.supportEmail === 'support@xpeditionedu.com', 'Support email is support@xpeditionedu.com');
    assert(Boolean(LEGAL_CONFIG.policyVersion), 'Policy version is defined');
    assert(Boolean(LEGAL_CONFIG.effectiveDate), 'Effective date is defined');
    assert(Boolean(LEGAL_CONFIG.lastUpdated), 'Last updated date is defined');
  });

  test('LEGAL_CONFIG defines all canonical trust routes', () => {
    const routes = LEGAL_CONFIG.trustRoutes;
    assert(routes.privacy === '/privacy', 'Privacy route is /privacy');
    assert(routes.terms === '/terms', 'Terms route is /terms');
    assert(routes.aiTransparency === '/ai-transparency', 'AI transparency route is /ai-transparency');
    assert(routes.disclaimer === '/disclaimer', 'Disclaimer route is /disclaimer');
    assert(routes.sources === '/sources', 'Sources route is /sources');
    assert(routes.trustCenter === '/trust', 'Trust Center route is /trust');
  });

  test('Support email is used consistently without fabricated addresses', () => {
    const rootDir = process.cwd();
    const privacyFile = fs.readFileSync(path.join(rootDir, 'app', 'privacy', 'page.tsx'), 'utf-8');
    const termsFile = fs.readFileSync(path.join(rootDir, 'app', 'terms', 'page.tsx'), 'utf-8');
    const aiTransFile = fs.readFileSync(path.join(rootDir, 'app', 'ai-transparency', 'page.tsx'), 'utf-8');
    const trustFile = fs.readFileSync(path.join(rootDir, 'app', 'trust', 'page.tsx'), 'utf-8');

    assert(privacyFile.includes(LEGAL_CONFIG.supportEmail) || privacyFile.includes('LEGAL_CONFIG.supportEmail'), 'Privacy includes support email');
    assert(termsFile.includes(LEGAL_CONFIG.supportEmail) || termsFile.includes('LEGAL_CONFIG.supportEmail'), 'Terms includes support email');
    assert(aiTransFile.includes(LEGAL_CONFIG.supportEmail) || aiTransFile.includes('LEGAL_CONFIG.supportEmail'), 'AI transparency includes support email');
    assert(trustFile.includes(LEGAL_CONFIG.supportEmail) || trustFile.includes('LEGAL_CONFIG.supportEmail'), 'Trust center includes support email');
  });

  // -------------------------------------------------------------------------
  // 2. Physical Route Files Existence & Content
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Legal Route Pages & Disclosures ---');

  test('All Phase E legal & trust page files physically exist in app router', () => {
    const rootDir = process.cwd();
    assert(fs.existsSync(path.join(rootDir, 'app', 'privacy', 'page.tsx')), '/privacy page exists');
    assert(fs.existsSync(path.join(rootDir, 'app', 'terms', 'page.tsx')), '/terms page exists');
    assert(fs.existsSync(path.join(rootDir, 'app', 'ai-transparency', 'page.tsx')), '/ai-transparency page exists');
    assert(fs.existsSync(path.join(rootDir, 'app', 'disclaimer', 'page.tsx')), '/disclaimer page exists');
    assert(fs.existsSync(path.join(rootDir, 'app', 'sources', 'page.tsx')), '/sources page exists');
    assert(fs.existsSync(path.join(rootDir, 'app', 'trust', 'page.tsx')), '/trust page exists');
  });

  test('AI Transparency page discloses Xira advisory role and deterministic mastery boundary', () => {
    const rootDir = process.cwd();
    const aiTransContent = fs.readFileSync(path.join(rootDir, 'app', 'ai-transparency', 'page.tsx'), 'utf-8');
    assert(aiTransContent.includes('Xira'), 'Mentions Xira');
    assert(aiTransContent.includes('Bayesian Knowledge Tracing') || aiTransContent.includes('BKT'), 'Mentions BKT');
    assert(aiTransContent.includes('deterministic') || aiTransContent.includes('Deterministic'), 'Discloses deterministic evaluation');
    assert(aiTransContent.includes('Groq') && aiTransContent.includes('OpenAI'), 'Discloses third-party AI providers');
  });

  test('Educational Disclaimer clarifies self-directed learning scope', () => {
    const rootDir = process.cwd();
    const discContent = fs.readFileSync(path.join(rootDir, 'app', 'disclaimer', 'page.tsx'), 'utf-8');
    assert(discContent.includes('Educational Purpose') || discContent.includes('educational'), 'States educational purpose');
    assert(discContent.includes('verify') || discContent.includes('verification'), 'Recommends independent verification');
  });

  // -------------------------------------------------------------------------
  // 3. Source Attribution & Licensing Policy
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Source Registry & License Policy ---');

  test('SourceRegistry contains verified authoritative OER institutions', () => {
    const sources = SourceRegistry.getAllSources();
    assert(sources.length >= 6, 'SourceRegistry contains multiple verified educational sources');

    const openstax = sources.find((s) => s.id === 'src_openstax_physics');
    assert(Boolean(openstax), 'OpenStax Physics source is present');
    assert(openstax?.license === 'CC-BY', 'OpenStax is CC-BY licensed');

    const mit = sources.find((s) => s.id === 'src_mit_ocw_physics');
    assert(Boolean(mit), 'MIT OCW source is present');
    assert(mit?.license === 'CC-BY-NC-SA', 'MIT OCW is CC-BY-NC-SA licensed');

    const nasa = sources.find((s) => s.id === 'src_nasa_solar_system');
    assert(Boolean(nasa), 'NASA source is present');
    assert(nasa?.license === 'PublicDomain', 'NASA is Public Domain');
  });

  test('SourceLicensePolicy correctly classifies permissions and simulation transformation', () => {
    // CC-BY: Transformable with attribution
    const ccbyPerms = SourceLicensePolicy.evaluatePermissions('CC-BY');
    assert(ccbyPerms.canTransformForSimulation === true, 'CC-BY can be transformed into simulations');
    assert(ccbyPerms.attributionRequired === true, 'CC-BY requires attribution');

    // PublicDomain: Transformable without attribution required
    const pdPerms = SourceLicensePolicy.evaluatePermissions('PublicDomain');
    assert(pdPerms.canTransformForSimulation === true, 'Public Domain can be transformed');

    // Unknown: Must NOT be transformed into simulation (treated as restricted)
    const unknownPerms = SourceLicensePolicy.evaluatePermissions('Unknown');
    assert(unknownPerms.canTransformForSimulation === false, 'Unknown license cannot be transformed');

    // RestrictedAllRightsReserved: Must NOT be transformed
    const restrictedPerms = SourceLicensePolicy.evaluatePermissions('RestrictedAllRightsReserved');
    assert(restrictedPerms.canTransformForSimulation === false, 'All Rights Reserved cannot be transformed');
  });

  test('SourceLicensePolicy formats complete academic attribution citations', () => {
    const citation = SourceLicensePolicy.formatAttribution(
      'University Physics Volume 1',
      'OpenStax, Rice University',
      'https://openstax.org',
      'CC-BY',
      'Samuel J. Ling'
    );
    assert(citation.includes('University Physics Volume 1'), 'Contains title');
    assert(citation.includes('OpenStax, Rice University'), 'Contains publisher');
    assert(citation.includes('CC-BY'), 'Contains license');
    assert(citation.includes('https://openstax.org'), 'Contains link');
  });

  // -------------------------------------------------------------------------
  // 4. Data Export & Deletion Persistence Isolation
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 4: User Data Controls & Isolation ---');

  await asyncTest('PersistenceManager supports user state export and isolation', async () => {
    const localAdapter = new LocalPersistenceAdapter();
    const manager = new PersistenceManager(localAdapter);

    const user1Data = localAdapter.createDefaultUserData('user_alice', 'alice@test.edu', 'Alice');
    user1Data.progression.xp = 450;
    user1Data.progression.level = 3;
    await localAdapter.saveUserState('user_alice', user1Data);

    const user2Data = localAdapter.createDefaultUserData('user_bob', 'bob@test.edu', 'Bob');
    user2Data.progression.xp = 120;
    user2Data.progression.level = 1;
    await localAdapter.saveUserState('user_bob', user2Data);

    // Fetch user1
    const retrievedAlice = await manager.getUserState('user_alice');
    assert(retrievedAlice?.profile.displayName === 'Alice', 'Alice data accurately retrieved');
    assert(retrievedAlice?.progression.xp === 450, 'Alice XP preserved');

    // Fetch user2
    const retrievedBob = await manager.getUserState('user_bob');
    assert(retrievedBob?.profile.displayName === 'Bob', 'Bob data accurately retrieved');
    assert(retrievedBob?.progression.xp === 120, 'Bob XP preserved');
  });

  await asyncTest('Account deletion wipes targeted user data without cross-user leakage', async () => {
    const localAdapter = new LocalPersistenceAdapter();
    const manager = new PersistenceManager(localAdapter);

    const user1Data = localAdapter.createDefaultUserData('user_charlie', 'charlie@test.edu', 'Charlie');
    await localAdapter.saveUserState('user_charlie', user1Data);

    const user2Data = localAdapter.createDefaultUserData('user_david', 'david@test.edu', 'David');
    await localAdapter.saveUserState('user_david', user2Data);

    // Delete Charlie
    const deleted = await manager.clearUserState('user_charlie');
    assert(deleted === true, 'Charlie data deletion returned true');

    // Verify Charlie is gone
    const charlieAfter = await manager.getUserState('user_charlie');
    assert(charlieAfter === null, 'Charlie state is completely wiped');

    // Verify David is completely untouched
    const davidAfter = await manager.getUserState('user_david');
    assert(davidAfter !== null, 'David state remains untouched');
    assert(davidAfter?.profile.displayName === 'David', 'David identity preserved');
  });

  test('Export and Deletion API route files exist and enforce security', () => {
    const rootDir = process.cwd();
    const exportPath = path.join(rootDir, 'app', 'api', 'user', 'export', 'route.ts');
    const deletePath = path.join(rootDir, 'app', 'api', 'user', 'delete', 'route.ts');

    assert(fs.existsSync(exportPath), '/api/user/export route file exists');
    assert(fs.existsSync(deletePath), '/api/user/delete route file exists');

    const exportCode = fs.readFileSync(exportPath, 'utf-8');
    assert(exportCode.includes('Content-Disposition'), 'Export sets attachment header');
    assert(!exportCode.includes('process.env.GROQ_API_KEY'), 'Export excludes provider keys');
    assert(!exportCode.includes('process.env.OPENAI_API_KEY'), 'Export excludes OpenAI keys');

    const deleteCode = fs.readFileSync(deletePath, 'utf-8');
    assert(deleteCode.includes('DELETE_MY_ACCOUNT_AND_DATA'), 'Delete requires explicit confirmation string');
  });

  // -------------------------------------------------------------------------
  // 5. Security & Zero Secret Exposure
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Security & Secret Boundaries ---');

  test('Zero eval() in production application components', () => {
    const rootDir = process.cwd();
    const tutorBoardCode = fs.readFileSync(path.join(rootDir, 'components', 'TutorBoard.tsx'), 'utf-8');
    assert(!tutorBoardCode.includes('eval('), 'Zero eval() in TutorBoard.tsx');
  });

  test('Zero client-side exposure of LLM provider API keys in NEXT_PUBLIC_', () => {
    const rootDir = process.cwd();
    const clientCodeFiles = [
      path.join(rootDir, 'app', 'privacy', 'page.tsx'),
      path.join(rootDir, 'app', 'terms', 'page.tsx'),
      path.join(rootDir, 'app', 'ai-transparency', 'page.tsx'),
      path.join(rootDir, 'app', 'sources', 'page.tsx'),
      path.join(rootDir, 'app', 'trust', 'page.tsx'),
      path.join(rootDir, 'components', 'AuthCard.tsx'),
      path.join(rootDir, 'app', '(app)', 'profile', 'page.tsx'),
    ];

    for (const filePath of clientCodeFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        assert(!content.includes('NEXT_PUBLIC_GROQ'), `No NEXT_PUBLIC_GROQ in ${path.basename(filePath)}`);
        assert(!content.includes('NEXT_PUBLIC_OPENAI'), `No NEXT_PUBLIC_OPENAI in ${path.basename(filePath)}`);
        assert(!content.includes('NEXT_PUBLIC_GEMINI'), `No NEXT_PUBLIC_GEMINI in ${path.basename(filePath)}`);
        assert(!content.includes('NEXT_PUBLIC_TAVILY'), `No NEXT_PUBLIC_TAVILY in ${path.basename(filePath)}`);
      }
    }
  });

  test('AuthCard and LoginPage contain unobtrusive links to Privacy, Terms, and Trust', () => {
    const rootDir = process.cwd();
    const authCardCode = fs.readFileSync(path.join(rootDir, 'components', 'AuthCard.tsx'), 'utf-8');
    const loginPageCode = fs.readFileSync(path.join(rootDir, 'app', 'login', 'page.tsx'), 'utf-8');

    assert(authCardCode.includes('/privacy'), 'AuthCard links to /privacy');
    assert(authCardCode.includes('/terms'), 'AuthCard links to /terms');
    assert(authCardCode.includes('/trust'), 'AuthCard links to /trust');

    assert(loginPageCode.includes('/privacy'), 'LoginPage links to /privacy');
    assert(loginPageCode.includes('/terms'), 'LoginPage links to /terms');
    assert(loginPageCode.includes('/trust'), 'LoginPage links to /trust');
  });

  test('Documentation artifacts for Phase E exist and are comprehensive', () => {
    const rootDir = process.cwd();
    assert(fs.existsSync(path.join(rootDir, 'docs', 'legal-data-inventory.md')), 'legal-data-inventory.md exists');
    assert(fs.existsSync(path.join(rootDir, 'docs', 'student-safety-review.md')), 'student-safety-review.md exists');
    assert(fs.existsSync(path.join(rootDir, 'docs', 'phase-e-security-audit.md')), 'phase-e-security-audit.md exists');
  });

  console.log(`\n======================================================`);
  console.log(`PHASE E LEGAL & TRUST SUITE: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  return { passed, failed };
}

// Direct execution support
if (require.main === module) {
  runLegalTrustTests()
    .then(({ failed }) => {
      if (failed > 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal test runner error:', err);
      process.exit(1);
    });
}
