/**
 * HOSTED SUPABASE — APPLICATION-LEVEL VERIFICATION (real browser, real users)
 *
 * Runs the real Xpedition build against the dedicated hosted Supabase TEST
 * project (docs/hosted-supabase-verification.md). Every assertion is recorded
 * in a ledger with the layer that produced it:
 *   APPLICATION_ALLOWED / APPLICATION_DENIED  → Xpedition API route / browser app
 *   DATABASE_RLS_ALLOWED / DATABASE_RLS_DENIED → direct Supabase call with a learner JWT
 *
 * Prerequisites (otherwise every test is skipped as BLOCKED, never failed):
 *   - the six variables of test/support/hostedSupabase.ts
 *   - the app built and started with the SAME variables:
 *       npm run build && MOCK_VISUAL_GENERATION=true npx next start -p 3400
 *     (XP_HOSTED_APP_URL overrides http://localhost:3400)
 *
 * Run: npm run test:e2e:hosted
 */

import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Ledger,
  authCookieNameFor,
  anonClient,
  assertMutationAffectsNothing,
  assertReadDeniedByRls,
  blockedMessage,
  missingHostedVars,
  signInLearners,
} from './support/hostedSupabase';

const missing = missingHostedVars();
const ledger = new Ledger();
const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'hosted-supabase');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test.describe.configure({ mode: 'serial' });
test.skip(missing.length > 0, blockedMessage(missing));

let appReachable: boolean | null = null;
test.beforeAll(async ({ request }) => {
  if (missing.length > 0) return;
  try {
    const r = await request.get('/login', { timeout: 15000 });
    appReachable = r.status() < 500;
  } catch {
    appReachable = false;
  }
});

function requireApp() {
  if (!appReachable) {
    ledger.blocked('app server', `not reachable at ${test.info().project.use.baseURL} (infrastructure)`);
    if (process.env.XP_REQUIRE_LIVE_SUPABASE === '1') throw new Error('BLOCKED (infrastructure): hosted app server not reachable');
    test.skip(true, 'BLOCKED (infrastructure): start the app against the hosted test project first');
  }
}

/** Real login through the app's own form (AuthCard → supabase.auth.signInWithPassword). */
async function uiLogin(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#auth-email', email);
  await page.fill('#auth-password', password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
  // Proves the app is talking to the SAME hosted project as the test.
  const cookieName = authCookieNameFor(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === cookieName || c.name.startsWith(`${cookieName}.`)), `auth cookie ${cookieName}`).toBe(true);
}

async function activeLearnerIs(page: Page, userId: string | null) {
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('xpedition_active_user_id')), { timeout: 20000 })
    .toBe(userId);
}

async function newLoggedInContext(browser: Browser, email: string, password: string, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await uiLogin(page, email, password);
  return { context, page };
}

async function openClassAndCaptureSession(page: Page): Promise<string> {
  const created = page.waitForResponse(
    (r) => r.url().endsWith('/api/classroom/session') && r.request().method() === 'POST',
    { timeout: 30000 }
  );
  await page.goto('/class?concept=periodic_table', { waitUntil: 'domcontentloaded' });
  const res = await created;
  expect(res.status(), 'session create').toBe(200);
  const body = await res.json();
  await expect(page.locator('[data-testid="classroom"]')).toHaveAttribute('data-persistence', 'server_session', { timeout: 20000 });
  return String(body.session.sessionId);
}

test.afterAll(async () => {
  if (missing.length > 0) {
    console.log(`\n${blockedMessage(missing)}`);
    console.log('  database/RLS checks: 0 | application checks: 0 | allowed: 0 | denied: 0 | blocked: all | passed: 0 | failed: 0');
    return;
  }
  const s = ledger.print('HOSTED SUPABASE — APPLICATION LEDGER');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'hosted-app-ledger.json'), JSON.stringify({ summary: s, entries: ledger.entries }, null, 2));
});

// ---------------------------------------------------------------------------
// 1. Session reload
// ---------------------------------------------------------------------------
test('HA1. Session reload: A-owned session survives reload; B denied (app + RLS)', async ({ browser }) => {
  requireApp();
  const { A, B } = await signInLearners();
  const a = await newLoggedInContext(browser, process.env.XP_TEST_USER_A_EMAIL!, process.env.XP_TEST_USER_A_PASSWORD!);
  const b = await newLoggedInContext(browser, process.env.XP_TEST_USER_B_EMAIL!, process.env.XP_TEST_USER_B_PASSWORD!);
  try {
    const sessionId = await openClassAndCaptureSession(a.page);
    ledger.record('HA1.1 A opens Class → server session created', 'APPLICATION', 'ALLOWED', 'POST /api/classroom/session 200');

    // The server persisted the session THROUGH RLS as A (request-scoped JWT).
    await expect
      .poll(async () => (await A.client.from('classroom_sessions').select('user_id').eq('session_id', sessionId)).data?.[0]?.user_id ?? null, { timeout: 15000 })
      .toBe(A.id);
    ledger.record('HA1.2 session row persisted in hosted DB with user_id = A (read as A)', 'DATABASE_RLS', 'ALLOWED');

    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await expect(a.page.locator('[data-testid="classroom"]')).toHaveAttribute('data-persistence', 'server_session', { timeout: 20000 });
    await activeLearnerIs(a.page, A.id);
    const afterReload = await A.client.from('classroom_sessions').select('user_id').eq('session_id', sessionId);
    expect(afterReload.data?.[0]?.user_id).toBe(A.id);
    ledger.record('HA1.3 after reload the session is still A-owned (DB)', 'DATABASE_RLS', 'ALLOWED');
    const own = await a.context.request.post('/api/classroom/session', {
      data: { action: 'process', sessionId, conceptId: 'periodic_table', learnerAction: { type: 'ADVANCE_STAGE' } },
    });
    expect(own.status()).toBe(200);
    ledger.record('HA1.4 after reload A can still drive the session via the API', 'APPLICATION', 'ALLOWED', 'HTTP 200');

    const hijack = await b.context.request.post('/api/classroom/session', {
      data: { action: 'process', sessionId, conceptId: 'periodic_table', learnerAction: { type: 'ADVANCE_STAGE' } },
    });
    expect(hijack.status()).toBe(404);
    ledger.record('HA1.5 B uses A sessionId via the API', 'APPLICATION', 'DENIED', 'HTTP 404 from Xpedition owner check (not an RLS result)');

    await assertReadDeniedByRls(ledger, 'HA1.6 B reads A session row directly', A.client, B.client, 'classroom_sessions', 'session_id', sessionId);
    await assertMutationAffectsNothing(ledger, 'HA1.7 B updates A session row directly', () =>
      B.client.from('classroom_sessions').update({ current_stage: 'PWNED' }).eq('session_id', sessionId).select('session_id'));
    const anonSession = await anonClient().from('classroom_sessions').select('session_id').eq('session_id', sessionId);
    if (!anonSession.error && (anonSession.data?.length ?? 0) === 0) ledger.record('HA1.8 anon reads A session row', 'DATABASE_RLS', 'DENIED', '0 rows');
    else ledger.fail('HA1.8 anon reads A session row', 'DATABASE_RLS_DENIED', JSON.stringify(anonSession.error ?? anonSession.data));

    // Clean up the rows this test created.
    await A.client.from('classroom_sessions').delete().eq('user_id', A.id).like('session_id', 'sess_%');
    expect(ledger.summary().failed, 'see ledger').toBe(0);
  } finally {
    await Promise.all([a.context.close(), b.context.close()]);
  }
});

// ---------------------------------------------------------------------------
// 2. Visual-job ownership (APPLICATION level: jobs live in app memory)
// ---------------------------------------------------------------------------
test('HA2. Visual job: A owns/uses job + private image; B and anon denied (APPLICATION only)', async ({ browser }) => {
  requireApp();
  const a = await newLoggedInContext(browser, process.env.XP_TEST_USER_A_EMAIL!, process.env.XP_TEST_USER_A_PASSWORD!);
  const b = await newLoggedInContext(browser, process.env.XP_TEST_USER_B_EMAIL!, process.env.XP_TEST_USER_B_PASSWORD!);
  const anon = await browser.newContext();
  try {
    const prompt = `hosted-private-prompt-${crypto.randomBytes(4).toString('hex')}`;
    const gen = await a.context.request.post('/api/visual-generation', { data: { conceptId: 'periodic_table', prompt } });
    if (gen.status() === 503) {
      ledger.blocked('HA2 visual generation', 'engine offline: start the app with MOCK_VISUAL_GENERATION=true (configuration)');
      test.skip(true, 'BLOCKED (configuration): MOCK_VISUAL_GENERATION=true not set on the app server');
    }
    expect(gen.status()).toBe(200);
    const job = (await gen.json()).data;
    expect(JSON.stringify(job)).not.toContain(prompt);
    ledger.record('HA2.1 A creates a visual job (owner = A; prompt not echoed)', 'APPLICATION', 'ALLOWED', 'in-memory job store — not a Supabase/RLS result');

    const status = await a.context.request.get(`/api/visual-generation/${job.jobId}`);
    expect(status.status()).toBe(200);
    ledger.record('HA2.2 A reads own job status', 'APPLICATION', 'ALLOWED');
    const asset = await a.context.request.get(job.assetUrl);
    expect(asset.status()).toBe(200);
    expect(asset.headers()['content-type']).toMatch(/^image\//);
    ledger.record('HA2.3 A retrieves own private image', 'APPLICATION', 'ALLOWED');

    for (const [label, url] of [
      ['HA2.4 B reads A job status', `/api/visual-generation/${job.jobId}`],
      ['HA2.5 B queries A job by id', `/api/visual-generation?jobId=${job.jobId}`],
      ['HA2.6 B retrieves A private image', job.assetUrl],
    ] as const) {
      const r = await b.context.request.get(url);
      expect(r.status(), label).toBe(404);
      ledger.record(label, 'APPLICATION', 'DENIED', 'HTTP 404 from Xpedition owner check');
    }
    const anonAsset = await anon.request.get(job.assetUrl);
    expect(anonAsset.status()).toBe(401);
    ledger.record('HA2.7 anon retrieves A private image', 'APPLICATION', 'DENIED', 'HTTP 401 (no session)');
    expect(ledger.summary().failed, 'see ledger').toBe(0);
  } finally {
    await Promise.all([a.context.close(), b.context.close(), anon.close()]);
  }
});

// ---------------------------------------------------------------------------
// 3. Logout / switch on the same browser (real hosted identities)
// ---------------------------------------------------------------------------
for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`HA3. Logout/switch ${viewport.width}x${viewport.height}: B sees none of A's session, notes, progress, learning record or local state`, async ({ browser }) => {
    requireApp();
    const { A, B } = await signInLearners();
    const secretA = `A-secret-${viewport.width}-${crypto.randomBytes(4).toString('hex')}`;
    const shareId = crypto.randomUUID();
    const context: BrowserContext = await browser.newContext({ viewport });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    try {
      // --- A signs in and establishes state ---------------------------------
      await uiLogin(page, process.env.XP_TEST_USER_A_EMAIL!, process.env.XP_TEST_USER_A_PASSWORD!);
      await activeLearnerIs(page, A.id);
      const sessionId = await openClassAndCaptureSession(page);
      // Learning record in the hosted DB (created as A through RLS).
      const snap = await A.client.from('passport_snapshots').insert({
        user_id: A.id, share_id: shareId, goal_title: secretA, skills_json: [], overall_readiness: 0.3, signature: 'unsigned-internal-learning-record',
      });
      expect(snap.error, snap.error?.message).toBeNull();
      // Learner-local state with the app's exact keys (the Class notes panel has no toolbar entry).
      await page.evaluate(([uid, value]) => {
        const ls = window.localStorage;
        ls.setItem(`xpedition_notes_periodic_table__u_${uid}`, value);
        ls.setItem(`xyra_notes_periodic_table__u_${uid}`, value);
        ls.setItem(`xpedition_active_quest_session__u_${uid}`, JSON.stringify({ note: value }));
        const store = JSON.parse(ls.getItem(`xpedition_user_${uid}`) || '{}');
        ls.setItem(`xpedition_user_${uid}`, JSON.stringify({ ...store, handle: value }));
      }, [A.id, secretA] as const);
      expect((await page.evaluate(() => Object.keys(localStorage))).some((k) => k.includes(A.id))).toBe(true);
      ledger.record('HA3.1 A signs in (real hosted login) and has session + local state', 'APPLICATION', 'ALLOWED');

      // --- A logs out -------------------------------------------------------
      await page.goto('/auth/signout', { waitUntil: 'domcontentloaded' });
      await page.goto('/class?concept=periodic_table', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-testid="classroom"]')).toHaveAttribute('data-persistence', 'guest_ephemeral', { timeout: 20000 });
      await activeLearnerIs(page, null);
      const leftover = (await page.evaluate(() => Object.keys(localStorage))).filter((k) => k.includes(A.id));
      expect(leftover, 'A local keys after logout').toEqual([]);
      ledger.record('HA3.2 after logout no A learner-local data remains; Class is guest', 'APPLICATION', 'DENIED', 'purged by the app');

      // --- B signs in on the same browser -----------------------------------
      await uiLogin(page, process.env.XP_TEST_USER_B_EMAIL!, process.env.XP_TEST_USER_B_PASSWORD!);
      await activeLearnerIs(page, B.id);
      const dump = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
      expect(dump).not.toContain(secretA);
      expect(dump).not.toContain(A.id);
      for (const route of ['/class?concept=periodic_table', '/home', '/passport', '/progress']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        const text = await page.locator('body').innerText();
        expect(text, `${route} shows A's data to B`).not.toContain(secretA);
        expect(text, `${route} shows A's email to B`).not.toContain(process.env.XP_TEST_USER_A_EMAIL!);
      }
      ledger.record('HA3.3 B (same browser) sees none of A notes/progress/learning record/local state in the UI', 'APPLICATION', 'DENIED');

      await assertReadDeniedByRls(ledger, `HA3.4 B reads A learning record (${viewport.width})`, A.client, B.client, 'passport_snapshots', 'share_id', shareId);
      await assertReadDeniedByRls(ledger, `HA3.5 B reads A class session (${viewport.width})`, A.client, B.client, 'classroom_sessions', 'session_id', sessionId);
      expect(pageErrors, pageErrors.join('\n')).toEqual([]);
      expect(ledger.summary().failed, 'see ledger').toBe(0);

      await A.client.from('passport_snapshots').delete().eq('share_id', shareId);
      await A.client.from('classroom_sessions').delete().eq('user_id', A.id).like('session_id', 'sess_%');
      await B.client.from('classroom_sessions').delete().eq('user_id', B.id).like('session_id', 'sess_%');
    } finally {
      await context.close();
    }
  });
}
