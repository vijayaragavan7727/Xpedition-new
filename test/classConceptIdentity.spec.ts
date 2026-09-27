/**
 * Real-browser validation of Class concept identity (Phase 1/2).
 *
 * Asserts, from the RENDERED page:
 *   requested concept = resolved concept = lesson concept = stage concept = visual concept
 * plus: no cross-concept content, no overflow, no page errors, no HTTP 5xx,
 * route equivalence, journey/reload/revision/answer/switch flows, and stale
 * async responses being rejected.
 */

import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CONCEPTS = [
  'periodic_table',
  'dc_motor',
  'projectile_motion',
  'molecular_bonding',
  'human_heart_anatomy',
  'quadratic_equation',
  'binary_search',
  'linear_regression',
  'polymorphism',
  'calculus_derivatives',
  'industrial_revolution',
];

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

const EXPECTED_VISUAL: Record<string, string> = {
  periodic_table: 'periodic_table_interactive',
  dc_motor: 'dc_motor_diagram',
  projectile_motion: 'projectile_simulation',
  molecular_bonding: 'molecular_geometry',
  human_heart_anatomy: 'heart_anatomy',
  quadratic_equation: 'parabola_graph',
  binary_search: 'binary_search_trace',
  linear_regression: 'regression_graph',
  polymorphism: 'polymorphism_dispatch',
  calculus_derivatives: 'derivative_graph',
  industrial_revolution: 'history_timeline',
};

const DC_MOTOR_MARKERS = /fleming|commutat|armature|lorentz|dc motor|split-ring/i;
const GENERIC_PLACEHOLDERS = /operational dynamics|governing inputs|dynamic transform|structural mechanics/i;

const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'class-concept-identity');
fs.mkdirSync(path.join(ARTIFACT_DIR, 'screenshots'), { recursive: true });

interface Probe {
  requested: string | null;
  resolved: string | null;
  lesson: string | null;
  state: string | null;
  stage: string | null;
  stageConcept: string | null;
  intent: string | null;
  stepIndex: string | null;
  sessionConcept: string | null;
  rejected: string | null;
  boardConcept: string | null;
  boardStep: string | null;
  visualConcept: string | null;
  visualKind: string | null;
  xiraConcept: string | null;
  subjectCrumb: string;
  lessonTitle: string;
  boardTitle: string;
  stepLabel: string;
  buddyText: string;
  xiraPrompts: string[];
  tryThis: string;
  bodyText: string;
  scrollWidth: number;
  innerWidth: number;
  scrollHeight: number;
  innerHeight: number;
  visualHeight: number;
  visualWidth: number;
}

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
    const id = q('[data-testid="class-identity"]');
    const board = q('[data-testid="smart-board"]');
    const visual = q('[data-testid="smartboard-visual"]');
    const xira = q('[data-testid="xira-panel"]');
    const buddyCol = q('[data-testid="buddy-column"]');
    return {
      requested: id?.getAttribute('data-requested-concept') ?? null,
      resolved: id?.getAttribute('data-resolved-concept') ?? null,
      lesson: id?.getAttribute('data-lesson-concept') ?? null,
      state: id?.getAttribute('data-state-concept') ?? null,
      stage: id?.getAttribute('data-stage') ?? null,
      stageConcept: id?.getAttribute('data-stage-concept') ?? null,
      intent: id?.getAttribute('data-intent') ?? null,
      stepIndex: id?.getAttribute('data-step-index') ?? null,
      sessionConcept: id?.getAttribute('data-session-concept') ?? null,
      rejected: id?.getAttribute('data-rejected-count') ?? null,
      boardConcept: board?.getAttribute('data-concept-id') ?? null,
      boardStep: board?.getAttribute('data-step-id') ?? null,
      visualConcept: visual?.getAttribute('data-visual-concept') ?? null,
      visualKind: visual?.getAttribute('data-visual-kind') ?? null,
      xiraConcept: xira?.getAttribute('data-concept-id') ?? null,
      subjectCrumb: (q('[data-testid="class-breadcrumb"]')?.textContent ?? '').trim(),
      lessonTitle: (q('[data-testid="lesson-title"]')?.textContent ?? '').trim(),
      boardTitle: (q('[data-testid="board-title"]')?.textContent ?? '').trim(),
      stepLabel: (q('[data-testid="step-label"]')?.textContent ?? '').trim(),
      buddyText: (buddyCol?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
      xiraPrompts: Array.from(document.querySelectorAll('[data-xira-prompt]')).map((el) => el.getAttribute('data-xira-prompt') || ''),
      tryThis: (q('[data-testid="try-this"]')?.textContent ?? '').trim(),
      bodyText: document.body.innerText,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      visualHeight: visual?.getBoundingClientRect().height ?? 0,
      visualWidth: visual?.getBoundingClientRect().width ?? 0,
    };
  });
}

function assertIdentityChain(p: Probe, concept: string) {
  expect(p.requested, 'requested').toBe(concept);
  expect(p.resolved, 'resolved').toBe(concept);
  expect(p.lesson, 'lesson').toBe(concept);
  expect(p.state, 'runtime state').toBe(concept);
  expect(p.stageConcept, 'active stage concept').toBe(concept);
  expect(p.boardConcept, 'smart board').toBe(concept);
  expect(p.visualConcept, 'visual').toBe(concept);
  expect(p.xiraConcept, 'xira').toBe(concept);
  expect(p.visualKind, 'visual kind').toBe(EXPECTED_VISUAL[concept]);
}

function assertNoContamination(p: Probe, concept: string) {
  if (concept !== 'dc_motor') {
    expect(DC_MOTOR_MARKERS.test(p.bodyText), `${concept}: DC-motor wording on page`).toBe(false);
  }
  expect(GENERIC_PLACEHOLDERS.test(p.bodyText), `${concept}: generic placeholder on page`).toBe(false);
  expect(/•\s*Mechanics/.test(p.subjectCrumb), `${concept}: stray "Mechanics" breadcrumb`).toBe(false);
}

/** 429s from the (intentional) API rate limiter under automated load are recorded, not failed. */
export const rateLimited: string[] = [];
/**
 * Phase 3: with no Supabase configuration, learner-scoped APIs FAIL CLOSED with
 * 503. The Class probes the (auth-gated) integration status endpoint once per
 * page load and falls back to deterministic visuals. Only that exact endpoint +
 * status is expected; any other 5xx is still a failure.
 */
export const failClosed: string[] = [];
const FAIL_CLOSED_ENDPOINTS = [/\/api\/classroom\/integrations$/];

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() === 429) rateLimited.push(r.url());
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (text.includes('status of 429')) return; // rate limiter; tracked above
    if (text.includes('status of 503')) return; // HTTP-level check below decides whether it was expected
    errors.push(`console: ${text.slice(0, 200)}`);
  });
  page.on('response', (r) => {
    if (r.status() === 503 && FAIL_CLOSED_ENDPOINTS.some((re) => re.test(new URL(r.url()).pathname))) {
      failClosed.push(`${r.request().method()} ${new URL(r.url()).pathname}`);
      return;
    }
    if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return errors;
}

async function openClass(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="smart-board"]', { timeout: 30000 });
}

async function clientNavigate(page: Page, url: string) {
  // App Router listens to history changes; this is a client-side (no reload) navigation.
  await page.evaluate((u) => window.history.pushState(null, '', u), url);
  await page.waitForFunction(
    (c) => document.querySelector('[data-testid="class-identity"]')?.getAttribute('data-state-concept') === c,
    new URL(url, 'http://x').searchParams.get('concept'),
    { timeout: 15000 }
  );
}

test('A. concept × viewport matrix: identity chain, content, layout', async ({ page }) => {
  const errors = watchErrors(page);
  const records: Array<Record<string, unknown>> = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const concept of CONCEPTS) {
      await openClass(page, `/class?concept=${concept}`);
      const p = await probe(page);
      assertIdentityChain(p, concept);
      assertNoContamination(p, concept);
      expect(p.stepIndex).toBe('0');
      expect(p.scrollWidth, `${vp.name} ${concept}: horizontal overflow`).toBeLessThanOrEqual(p.innerWidth);
      expect(p.scrollHeight, `${vp.name} ${concept}: page-level vertical overflow`).toBeLessThanOrEqual(p.innerHeight + 1);
      // The teaching visual must actually be visible, not collapsed to a header.
      expect(p.visualHeight, `${vp.name} ${concept}: Smart Board visual collapsed`).toBeGreaterThanOrEqual(200);
      expect(p.visualWidth, `${vp.name} ${concept}: Smart Board visual too narrow`).toBeGreaterThanOrEqual(280);
      records.push({
        viewport: vp.name,
        urlConcept: concept,
        resolvedConcept: p.resolved,
        subject: p.subjectCrumb,
        lessonTitle: p.lessonTitle,
        activeStep: p.stepLabel,
        stage: p.stage,
        smartBoardTitle: p.boardTitle,
        visualType: p.visualKind,
        visualSize: `${Math.round(p.visualWidth)}x${Math.round(p.visualHeight)}`,
        visualConcept: p.visualConcept,
        buddyText: p.buddyText,
        xiraContext: { concept: p.xiraConcept, prompts: p.xiraPrompts },
        tryThis: p.tryThis,
      });
      if (vp.name === '1440x900' || vp.name === '390x844') {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `${concept}_${vp.name}.png`) });
      }
    }
  }
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'matrix.json'), JSON.stringify(records, null, 2));
  expect(errors, errors.join('\n')).toEqual([]);
});

test('B. every step of every concept stays on-concept (1440x900)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const steps: Array<Record<string, unknown>> = [];
  for (const concept of CONCEPTS) {
    await openClass(page, `/class?concept=${concept}`);
    const total = await page.evaluate(() => document.querySelectorAll('[aria-label^="Jump to step"]').length);
    for (let i = 0; i < total; i++) {
      if (i > 0) await page.getByRole('button', { name: 'Next step', exact: true }).click();
      await page.waitForFunction((idx) => document.querySelector('[data-testid="class-identity"]')?.getAttribute('data-step-index') === String(idx), i);
      const p = await probe(page);
      assertIdentityChain(p, concept);
      assertNoContamination(p, concept);
      steps.push({ concept, step: i, stage: p.stage, board: p.boardTitle, tryThis: p.tryThis, buddy: p.buddyText.slice(0, 160) });
    }
  }
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'steps.json'), JSON.stringify(steps, null, 2));
  expect(errors, errors.join('\n')).toEqual([]);
});

test('C. /class?concept=X and /class/X render the same lesson', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  for (const concept of CONCEPTS) {
    await openClass(page, `/class?concept=${concept}`);
    const a = await probe(page);
    await openClass(page, `/class/${concept}`);
    const b = await probe(page);
    assertIdentityChain(b, concept);
    expect(b.lessonTitle).toBe(a.lessonTitle);
    expect(b.boardTitle).toBe(a.boardTitle);
    expect(b.boardStep).toBe(a.boardStep);
    expect(b.visualKind).toBe(a.visualKind);
  }
});

test('D. unknown concepts show an explicit unavailable state (both routes)', async ({ page }) => {
  for (const url of ['/class?concept=research_methods', '/class/brain_anatomy', '/class?concept=', '/class']) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('lesson-unavailable')).toBeVisible();
    await expect(page.getByTestId('smart-board')).toHaveCount(0);
    const text = await page.evaluate(() => document.body.innerText);
    expect(DC_MOTOR_MARKERS.test(text)).toBe(false);
  }
});

test('E. journey: navigate, reload, revision, next/prev, answer, switch', async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const log: Array<Record<string, unknown>> = [];

  await openClass(page, '/class?concept=periodic_table');
  for (const concept of ['dc_motor', 'polymorphism', 'industrial_revolution', 'periodic_table']) {
    // Move deeper first so a stale step would be visible after the switch.
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await clientNavigate(page, `/class?concept=${concept}`);
    const p = await probe(page);
    assertIdentityChain(p, concept);
    assertNoContamination(p, concept);
    expect(p.stepIndex, `${concept}: step reset after switch`).toBe('0');
    log.push({ phase: 'switch', concept, board: p.boardTitle, step: p.stepLabel });
  }

  // Reload
  await page.reload({ waitUntil: 'networkidle' });
  let p = await probe(page);
  assertIdentityChain(p, 'periodic_table');
  expect(p.stepIndex).toBe('0');

  // Revision mode
  await openClass(page, '/class?concept=periodic_table&intent=revision');
  p = await probe(page);
  assertIdentityChain(p, 'periodic_table');
  expect(p.intent).toBe('revision');
  await expect(page.getByTestId('intent-badge')).toHaveText('Revision');
  expect(p.buddyText.toLowerCase()).toContain('revision');
  log.push({ phase: 'revision', concept: 'periodic_table', buddy: p.buddyText.slice(0, 160) });

  // Next / previous
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Previous step' }).click();
  p = await probe(page);
  expect(p.stepIndex).toBe('1');
  assertIdentityChain(p, 'periodic_table');

  // Answer the step-2 question (Z = 11)
  await page.locator('[data-option-id="pt_a3"]').click(); // wrong: Magnesium
  await page.getByRole('button', { name: 'Submit Answer' }).click();
  await expect(page.getByTestId('answer-feedback')).toContainText('Magnesium has 12 protons');
  p = await probe(page);
  expect(p.buddyText).toContain('periods are rows');
  await page.getByRole('button', { name: 'Try Again' }).click();
  await page.locator('[data-option-id="pt_a1"]').click();
  await page.getByRole('button', { name: 'Submit Answer' }).click();
  await expect(page.getByTestId('answer-feedback')).toContainText('sodium');

  // Next step must present a fresh question state
  await page.getByRole('button', { name: 'Next step', exact: true }).click(); // step 3 (no question)
  await page.getByRole('button', { name: 'Next step', exact: true }).click(); // step 4 (question)
  await expect(page.getByTestId('check-question')).toHaveAttribute('data-question-step', 'step_4_pt_classes');
  await expect(page.getByRole('button', { name: 'Submit Answer' })).toBeVisible();
  await expect(page.getByTestId('answer-feedback')).toHaveCount(0);

  // Switch concept after answering: nothing leaks
  await clientNavigate(page, '/class?concept=polymorphism');
  p = await probe(page);
  assertIdentityChain(p, 'polymorphism');
  expect(p.stepIndex).toBe('0');
  expect(p.intent).toBe('learn');
  await expect(page.getByTestId('answer-feedback')).toHaveCount(0);
  expect(/sodium|magnesium|element/i.test(p.buddyText)).toBe(false);

  // Periodic table interaction works deterministically
  await clientNavigate(page, '/class?concept=periodic_table');
  await page.locator('[data-element="Cl"]').click();
  await expect(page.getByTestId('element-inspector')).toContainText('Chlorine');
  await expect(page.getByTestId('element-inspector')).toContainText('Group 17');
  await expect(page.getByTestId('element-inspector')).toContainText('Period 3');

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'journey.json'), JSON.stringify(log, null, 2));
  expect(errors, errors.join('\n')).toEqual([]);
});

test('F. stale async responses are rejected (delayed scene + session for a previous concept)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let staleSceneRequests = 0;
  // Delay every integration scene response by 2.5s and tag it with dc_motor + an artwork URL.
  await page.route('**/api/classroom/integrations', async (route) => {
    if (route.request().method() === 'GET') {
      // Pretend OpenMAIC is configured so the Class issues scene requests.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, providers: [{ id: 'openmaic', status: 'configured' }] }),
      });
      return;
    }
    const reqBody = route.request().postDataJSON() as { context?: { conceptId?: string } };
    if (reqBody?.context?.conceptId === 'dc_motor') staleSceneRequests++;
    await new Promise((r) => setTimeout(r, 2500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        scene: {
          payload: {
            xpeditionVisualPayload: {
              type: 'visual_requirement',
              visualType: 'scientific_diagram',
              title: 'DC motor artwork',
              purpose: 'stale',
              assetUrl: '/images/classroom/dc-motor-diagram-clean.png',
              metadata: { conceptId: 'dc_motor', subject: 'Physics', stepIndex: 1 },
            },
          },
        },
      }),
    });
  });
  // Delay session creation so it resolves after the concept switch.
  await page.route('**/api/classroom/session', async (route) => {
    const body = route.request().postDataJSON() as { conceptId?: string };
    await new Promise((r) => setTimeout(r, body.conceptId === 'dc_motor' ? 2000 : 0));
    await route.continue();
  });

  await openClass(page, '/class?concept=dc_motor');
  const scenePosted = page.waitForRequest((r) => r.url().includes('/api/classroom/integrations') && r.method() === 'POST', { timeout: 20000 });
  // dc_motor step 2 is a question step (no scene); step 3 is a "show" step → scene request.
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await scenePosted; // the dc_motor request is now in flight (response delayed 2.5 s)
  await clientNavigate(page, '/class?concept=periodic_table');

  const timings = [0, 250, 500, 1000, 2000, 3000];
  const snapshots: Array<Record<string, unknown>> = [];
  let prev = 0;
  for (const t of timings) {
    await page.waitForTimeout(t - prev);
    prev = t;
    const p = await probe(page);
    assertIdentityChain(p, 'periodic_table');
    assertNoContamination(p, 'periodic_table');
    const aiToggle = await page.getByText('AI Render').count();
    expect(aiToggle, 'stale dc_motor artwork must not appear').toBe(0);
    snapshots.push({ t, board: p.boardTitle, visual: p.visualKind, rejected: p.rejected, session: p.sessionConcept });
  }
  // Prove the stale path was exercised: a dc_motor scene request was in flight at switch time.
  expect(staleSceneRequests, 'a dc_motor scene request was issued before the switch').toBeGreaterThan(0);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'stale-async.json'), JSON.stringify(snapshots, null, 2));
});

test.afterAll(() => {
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rate-limited.json'), JSON.stringify(rateLimited, null, 2));
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'fail-closed.json'), JSON.stringify(failClosed, null, 2));
});

test('G. multi-timing stability of the deterministic visual (0–3000 ms)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const concept of ['periodic_table', 'polymorphism', 'calculus_derivatives', 'industrial_revolution', 'dc_motor']) {
    await page.goto(`/class?concept=${concept}&intent=revision`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="smart-board"]');
    const seen = new Set<string>();
    let prev = 0;
    for (const t of [0, 250, 500, 1000, 2000, 3000]) {
      await page.waitForTimeout(t - prev);
      prev = t;
      const p = await probe(page);
      assertIdentityChain(p, concept);
      seen.add(`${p.visualKind}|${p.boardTitle}`);
    }
    expect(seen.size, `${concept}: visual/board changed on its own`).toBe(1);
  }
});

// ---------------------------------------------------------------------------
// Phase 3: security + routing consolidation, observed in a real browser against
// a production build with NO Supabase configuration (auth must fail closed).
// ---------------------------------------------------------------------------
test('H. Phase 3: fail-closed auth, honest public Passport, registry-gated /learn and /tutor', async ({ page, request }) => {
  const log: Record<string, unknown> = {};

  // Protected learner routes redirect to login with an explicit auth_unavailable state.
  for (const route of ['/quest', '/home', '/passport', '/profile']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const url = new URL(page.url());
    expect(url.pathname, `${route} must not render without auth`).toBe('/login');
    expect(url.searchParams.get('error')).toBe('auth_unavailable');
    log[route] = url.pathname + url.search;
  }
  // The login page does not offer a fake local sign-in in production.
  const loginText = await page.locator('body').innerText();
  expect(/not configured|unavailable/i.test(loginText), 'login explains that auth is unavailable').toBe(true);

  // APIs fail closed (503 = auth service unavailable), never a fake learner.
  const session = await request.post('/api/classroom/session', { data: { conceptId: 'periodic_table' } });
  const integrationsGet = await request.get('/api/classroom/integrations');
  const integrationsPost = await request.post('/api/classroom/integrations', {
    data: { provider: 'canvas', operation: 'execute_action', action: { type: 'START_AI_CONVERSATION' } },
  });
  log.api = { session: session.status(), integrationsGet: integrationsGet.status(), integrationsPost: integrationsPost.status() };
  expect(session.status()).toBe(503);
  expect(integrationsGet.status()).toBe(503);
  expect(integrationsPost.status()).toBe(503);

  // Public passport share route: honest unavailable page, no learner data, no credential claims.
  await page.goto('/passport/some-learner-id', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="public-passport-unavailable"]');
  const passportText = await page.locator('body').innerText();
  expect(/cryptograph|proctored|credential id|verified passport|proof of competence/i.test(passportText)).toBe(false);

  // /learn and /tutor: unknown ids show an explicit unavailable gate, never another concept.
  for (const route of ['/learn/research_methods', '/tutor/research_methods', '/learn/definitely_unknown_concept']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="route-concept-unavailable"]', { timeout: 30000 });
    const text = await page.locator('body').innerText();
    expect(/binary search/i.test(text), `${route}: resolved to binary search`).toBe(false);
    expect(DC_MOTOR_MARKERS.test(text), `${route}: DC-motor content`).toBe(false);
    log[route] = 'route-concept-unavailable';
  }
  // Canonical ids resolve exactly on /learn.
  await page.goto('/learn/industrial_revolution', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="learn-concept-page"]', { timeout: 30000 });
  const learnText = await page.locator('body').innerText();
  expect(/industrial revolution/i.test(learnText)).toBe(true);
  expect(/\bevolution\b(?! of)/i.test(learnText.replace(/industrial revolution/gi, ''))).toBe(false);
  log['/learn/industrial_revolution'] = 'learn-concept-page';

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'phase3-security.json'), JSON.stringify(log, null, 2));
});
