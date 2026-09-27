/**
 * Phase 4 browser verification with TWO signed-in identities (auth stub).
 *
 * Runs only under test/playwright.auth.config.ts (production build pointed at the
 * local GoTrue/PostgREST stub). The stub is not Supabase; these tests prove the
 * APP's behaviour: shared-device isolation, persistence honesty, protected
 * routes, server-side ownership checks and that server persistence is sent with
 * the learner's own JWT.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LEARNER_A, LEARNER_B, resetStubCalls, signInAs, stubCalls } from './support/stubIdentities';

test.skip(process.env.CLASS_E2E_AUTH !== 'stub', 'requires test/playwright.auth.config.ts');

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'phase4-auth');
fs.mkdirSync(path.join(ARTIFACT_DIR, 'screenshots'), { recursive: true });
const evidence: Record<string, unknown> = {};

/**
 * Expected, honest 503: /api/lesson refuses to fabricate lessons when no AI
 * provider key is configured (none exists in this environment). Recorded, not
 * failed. Every other 5xx (and every console error that is not that exact
 * refusal) fails the test.
 */
const expectedAiUnavailable: string[] = [];
function watch(page: Page) {
  const errors: string[] = [];
  let pendingAi503 = 0;
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() === 503 && new URL(r.url()).pathname === '/api/lesson') {
      pendingAi503++;
      expectedAiUnavailable.push(r.url());
      return;
    }
    if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (pendingAi503 > 0 && m.text().includes('status of 503')) {
      pendingAi503--;
      return;
    }
    errors.push(`console: ${m.text().slice(0, 200)}`);
  });
  return errors;
}

async function openClass(page: Page, concept: string, expected: 'server_session' | 'guest_ephemeral') {
  await page.goto(`/class?concept=${concept}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="smart-board"]', { timeout: 30000 });
  await expect(page.locator('[data-testid="classroom"]')).toHaveAttribute('data-persistence', expected, { timeout: 15000 });
}

/** Waits until the app's AuthIdentitySync has reconciled the device to `userId` (or guest). */
async function activeLearnerIs(page: Page, userId: string | null) {
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('xpedition_active_user_id')), { timeout: 15000 })
    .toBe(userId);
}

/**
 * Learner-local state, written with the EXACT keys the app uses for a signed-in
 * learner (store snapshot, Class sticky notes, /tutor notes, quest session,
 * feedback draft). The Class "Notes" toolbar button downloads a study card and
 * the sticky-note panel has no toolbar entry, so the state is seeded in-page; the
 * purge/visibility logic under test is the real production bundle.
 */
async function seedLearnerState(page: Page, userId: string, secret: string) {
  await page.evaluate(
    ([uid, value]) => {
      const ls = window.localStorage;
      ls.setItem(`xpedition_user_${uid}`, JSON.stringify({ handle: value, rewardsCount: 42 }));
      ls.setItem(`xpedition_notes_periodic_table__u_${uid}`, value);
      ls.setItem(`xyra_notes_periodic_table__u_${uid}`, value);
      ls.setItem(`xpedition_active_quest_session__u_${uid}`, JSON.stringify({ note: value }));
      ls.setItem(`xpedition_feedback__u_${uid}`, JSON.stringify([{ body: value }]));
    },
    [userId, secret] as const
  );
}

const storageKeys = (page: Page) => page.evaluate(() => Object.keys(window.localStorage));
const storageDump = (page: Page) => page.evaluate(() => JSON.stringify(Object.entries(window.localStorage)));

async function noOverflow(page: Page, label: string) {
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw, `${label}: horizontal overflow`).toBeLessThanOrEqual(iw);
}

for (const vp of VIEWPORTS) {
  test(`L. ${vp.name}: A creates state → logout → B signs in → A's state absent; direct switch B→A purges B`, async ({ browser, baseURL }) => {
    const context: BrowserContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const errors = watch(page);
    const secretA = `A-private-note-${vp.name}-${Date.now()}`;
    const secretB = `B-private-note-${vp.name}-${Date.now()}`;
    await resetStubCalls();

    // Unauthenticated: protected route redirects; the Class is an explicit guest.
    await page.goto('/quest', { waitUntil: 'domcontentloaded' });
    expect(new URL(page.url()).pathname).toBe('/login');

    // --- Learner A ---------------------------------------------------------
    await signInAs(context, baseURL!, LEARNER_A);
    await openClass(page, 'periodic_table', 'server_session');
    await activeLearnerIs(page, LEARNER_A.id);
    await seedLearnerState(page, LEARNER_A.id, secretA);
    await page.reload({ waitUntil: 'networkidle' });
    await activeLearnerIs(page, LEARNER_A.id);
    const keysA = await storageKeys(page);
    expect(keysA.some((k) => k.endsWith(`__u_${LEARNER_A.id}`)), keysA.join(',')).toBe(true);
    expect(await storageDump(page)).toContain(secretA);
    await noOverflow(page, `${vp.name} A class`);

    // Server persistence ran AS learner A (the stub saw A's JWT), never as anon.
    const callsA = await stubCalls();
    const sessionWrites = callsA.filter((c) => c.path === '/rest/v1/classroom_sessions' && c.method === 'POST');
    expect(sessionWrites.length, 'server wrote the class session through PostgREST').toBeGreaterThan(0);
    expect(sessionWrites.every((c) => c.bearerSub === LEARNER_A.id), JSON.stringify(sessionWrites)).toBe(true);
    expect(callsA.every((c) => c.bearerSub === LEARNER_A.id), 'no anonymous/other-identity REST call').toBe(true);

    // --- Logout (real sign-out route) → guest ---------------------------------
    await page.goto('/auth/signout', { waitUntil: 'domcontentloaded' });
    expect(new URL(page.url()).pathname).toBe('/login');
    await openClass(page, 'periodic_table', 'guest_ephemeral');
    await activeLearnerIs(page, null);
    const guestKeys = await storageKeys(page);
    expect(guestKeys.filter((k) => k.includes(LEARNER_A.id)), 'A purged at logout').toEqual([]);
    expect(await storageDump(page)).not.toContain(secretA);

    // --- Learner B -------------------------------------------------------------
    await signInAs(context, baseURL!, LEARNER_B);
    await openClass(page, 'periodic_table', 'server_session');
    await activeLearnerIs(page, LEARNER_B.id);
    expect(await storageDump(page)).not.toContain(secretA);
    for (const route of ['/learn?tab=explore', '/home']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      expect(await page.locator('body').innerText(), `${route} shows A's data to B`).not.toContain(secretA);
    }
    await noOverflow(page, `${vp.name} B home`);
    await openClass(page, 'periodic_table', 'server_session');
    await seedLearnerState(page, LEARNER_B.id, secretB);
    expect(await storageDump(page)).toContain(secretB);

    // --- Direct identity change B → A without logout (e.g. another tab) -----------
    await signInAs(context, baseURL!, LEARNER_A);
    await openClass(page, 'periodic_table', 'server_session');
    await activeLearnerIs(page, LEARNER_A.id);
    expect((await storageKeys(page)).filter((k) => k.includes(LEARNER_B.id)), 'B purged on identity change').toEqual([]);
    expect(await storageDump(page)).not.toContain(secretB);

    // Unknown concept stays unavailable for a signed-in learner too.
    await page.goto('/class?concept=research_methods', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="lesson-unavailable"]');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `learner-switch_${vp.name}.png`) });
    evidence[`switch_${vp.name}`] = { keysA: keysA.length, guestKeys, sessionWritesAsA: sessionWrites.length };
    expect(errors, errors.join('\n')).toEqual([]);
    await context.close();
  });
}

test('X. server-side cross-learner attacks: Class session, visual job status/asset, manifest', async ({ browser, baseURL }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  await signInAs(ctxA, baseURL!, LEARNER_A);
  await signInAs(ctxB, baseURL!, LEARNER_B);
  const log: Record<string, number> = {};

  // A creates a Class session.
  const created = await ctxA.request.post('/api/classroom/session', { data: { action: 'create', conceptId: 'periodic_table' } });
  expect(created.status()).toBe(200);
  const sessionId = (await created.json()).session.sessionId as string;
  // B tries to drive A's session.
  const hijack = await ctxB.request.post('/api/classroom/session', {
    data: { action: 'process', sessionId, conceptId: 'periodic_table', learnerAction: { type: 'ADVANCE_STAGE' } },
  });
  log.sessionHijackByB = hijack.status();
  expect(hijack.status()).toBe(404);
  const own = await ctxA.request.post('/api/classroom/session', {
    data: { action: 'process', sessionId, conceptId: 'periodic_table', learnerAction: { type: 'ADVANCE_STAGE' } },
  });
  log.sessionProcessByA = own.status();
  expect(own.status()).toBe(200);

  // A generates a visual (MOCK_VISUAL_GENERATION=true on this server).
  const gen = await ctxA.request.post('/api/visual-generation', { data: { conceptId: 'periodic_table', prompt: 'A private prompt about periodic trends' } });
  expect(gen.status()).toBe(200);
  const job = (await gen.json()).data;
  expect(JSON.stringify(job)).not.toContain('A private prompt');
  expect(job.assetUrl).toBe(`/api/visual-generation/${job.jobId}/asset`);
  for (const [label, url] of [
    ['jobStatusByB', `/api/visual-generation/${job.jobId}`],
    ['jobQueryByB', `/api/visual-generation?jobId=${job.jobId}`],
    ['assetByB', job.assetUrl],
  ] as const) {
    const r = await ctxB.request.get(url);
    log[label] = r.status();
    expect(r.status(), label).toBe(404);
  }
  const mine = await ctxA.request.get(job.assetUrl);
  log.assetByA = mine.status();
  expect(mine.status()).toBe(200);
  expect(mine.headers()['content-type']).toBe('image/png');
  expect(mine.headers()['cache-control']).toContain('no-store');

  // Unauthenticated
  const anonCtx = await browser.newContext();
  log.assetAnon = (await anonCtx.request.get(job.assetUrl)).status();
  expect(log.assetAnon).toBe(401);
  log.manifestAnon = (await anonCtx.request.get('/generated-visuals/assets-manifest.json')).status();
  expect(log.manifestAnon).toBe(404);

  evidence.crossLearner = log;
  evidence.expectedAiUnavailable503 = expectedAiUnavailable.length;
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'phase4-evidence.json'), JSON.stringify(evidence, null, 2));
  await Promise.all([ctxA.close(), ctxB.close(), anonCtx.close()]);
});
