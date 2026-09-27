/**
 * App entry + first-click routing (auth stub run: test/playwright.auth.config.ts).
 *
 * Regression for two live bugs:
 *   1. The root URL showed a separate legacy landing page ("Get Started" /
 *      "I already have an account") before the real sign-in screen.
 *   2. For a learner without a goal or calibration, the first click on Passport
 *      was redirected to /onboarding or /calibrate (a different screen with an
 *      "Exit" button); only the second click opened the Passport.
 *
 * Signed-in identities come from the local auth stub (no real credentials).
 */

import { test, expect, type Page } from '@playwright/test';
import { LEARNER_A, signInAs } from './support/stubIdentities';

test.skip(process.env.CLASS_E2E_AUTH !== 'stub', 'requires test/playwright.auth.config.ts');

const VIEWPORTS = [
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844 },
];

/** Every URL the tab visits, so an intermediate detour (even a brief one) is caught. */
function recordNavigations(page: Page) {
  const visited: string[] = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) visited.push(new URL(f.url()).pathname);
  });
  return visited;
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    const p = new URL(r.url()).pathname;
    if (r.status() === 503 && p === '/api/lesson') return; // honest "no AI provider configured" refusal
    if (r.status() >= 400 && !p.startsWith('/__stub')) errors.push(`HTTP ${r.status()} ${p}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error' && !/status of 503/.test(m.text())) errors.push(`console: ${m.text().slice(0, 160)}`);
  });
  return errors;
}

test('R1. Signed out: the root URL opens the current sign-in directly (no landing page)', async ({ page, request }) => {
  // Server-side redirect: no HTML of any other page is ever sent for "/".
  const root = await request.get('/', { maxRedirects: 0 });
  expect(root.status()).toBe(307);
  expect(new URL(root.headers()['location'], 'http://x').pathname).toBe('/login');

  const visited = recordNavigations(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(new URL(page.url()).pathname).toBe('/login');
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await expect(page.getByText('I already have an account')).toHaveCount(0);
  await expect(page.getByText('Learn by Doing')).toHaveCount(0);
  expect(visited).not.toContain('/');

  // Sign-up is on the same screen.
  await expect(page.getByRole('button', { name: /sign up/i }).first()).toBeVisible();

  // Protected pages send signed-out visitors to the same sign-in, remembering where they were going.
  await page.goto('/passport', { waitUntil: 'networkidle' });
  const url = new URL(page.url());
  expect(url.pathname).toBe('/login');
  expect(url.searchParams.get('next')).toBe('/passport');
});

for (const vp of VIEWPORTS) {
  test(`R2. ${vp.name}: signed in, a new learner opens Passport on the FIRST click; back/forward/refresh hold`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await signInAs(context, baseURL!, LEARNER_A);
    const page = await context.newPage();
    const errors = watchErrors(page);

    // Root → Home for a signed-in learner.
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(new URL(page.url()).pathname).toBe('/home');

    // LEARNER_A is brand new (no goal, no calibration): exactly the state that used to detour.
    const visited = recordNavigations(page);
    await page.locator('a[href="/passport"]:visible').first().click();
    await page.waitForURL('**/passport');
    await expect(page.getByTestId('learner-passport')).toBeVisible();
    await expect(page.getByTestId('passport-empty')).toHaveCount(1); // honest empty state (page 2 on phones)
    await page.waitForTimeout(1500); // a late client redirect would land here
    expect(new URL(page.url()).pathname).toBe('/passport');
    expect(visited.filter((p) => p === '/onboarding' || p === '/calibrate')).toEqual([]);

    // Browser history and refresh keep the right page.
    await page.goBack();
    await page.waitForURL('**/home');
    await page.goForward();
    await page.waitForURL('**/passport');
    await expect(page.getByTestId('learner-passport')).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    expect(new URL(page.url()).pathname).toBe('/passport');
    await expect(page.getByTestId('learner-passport')).toBeVisible();

    // Every primary destination opens on the first click, from the Passport page itself.
    for (const [href, marker] of [
      ['/profile', 'Profile'],
      ['/world', null],
      ['/learn', 'Learning Journey'],
      ['/home', null],
    ] as const) {
      await page.locator(`a[href="${href}"]:visible`).first().click();
      await page.waitForURL(`**${href}`);
      await page.waitForTimeout(800);
      expect(new URL(page.url()).pathname, `first click on ${href}`).toBe(href);
      if (marker) await expect(page.locator(`text=${marker} >> visible=true`).first()).toBeVisible();
    }

    // Direct URL.
    await page.goto('/passport', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('learner-passport')).toBeVisible();

    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(sw, 'horizontal overflow').toBeLessThanOrEqual(iw);
    expect(errors, errors.join('\n')).toEqual([]);
    await context.close();
  });
}

test('R3. Sign out returns to the sign-in; signing back in returns to Home', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await signInAs(context, baseURL!, LEARNER_A);
  const page = await context.newPage();
  await page.goto('/profile', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/login**');
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(new URL(page.url()).pathname).toBe('/login');

  await signInAs(context, baseURL!, LEARNER_A);
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(new URL(page.url()).pathname).toBe('/home');
  await context.close();
});
