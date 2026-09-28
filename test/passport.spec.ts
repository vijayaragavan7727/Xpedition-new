/**
 * Passport in a real browser (desktop 1440×900 / 1366×768, phones 375/390/430).
 *
 * /passport is a protected learner route: a production build without Supabase
 * correctly redirects it to /login (see classConceptIdentity.spec.ts, test H).
 * This suite therefore runs against a DEVELOPMENT server with the explicit local
 * auth bypass (NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS=1), and seeds a TEST-ONLY
 * learner record (test/fixtures/passportLearner.ts) into that browser's storage.
 *
 * Checks: every Passport asset loads, no horizontal overflow, page navigation,
 * stamp detail dialog (keyboard + above the app navigation), real values in the
 * book, the empty state for a new learner, and no console/page errors.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { passportFixture } from './fixtures/passportLearner';

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];
const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'passport');
fs.mkdirSync(path.join(ARTIFACT_DIR, 'screenshots'), { recursive: true });
/** Pre-existing: the app shell's DashBackdrop requests /art/hero-left.jpg, which is not in the repo. */
const KNOWN_SHELL_404 = /\/art\/hero-left\.jpg/;

async function seed(context: BrowserContext, withEvidence: boolean) {
  const record = passportFixture(Date.now(), withEvidence);
  await context.addInitScript((data) => {
    localStorage.setItem('xpedition_active_user_id', 'qa_passport_learner');
    localStorage.setItem('xpedition_user_qa_passport_learner', JSON.stringify(data));
  }, record);
}

function watch(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && !KNOWN_SHELL_404.test(r.url())) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/status of 404/.test(m.text())) return; // HTTP statuses are checked above (with the URL)
    errors.push(`console: ${m.text().slice(0, 200)}`);
  });
  return errors;
}

async function assertImagesLoaded(page: Page, where: string) {
  // next/image lazy-loads below the fold: load every visible Passport image, then check it.
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('[data-testid="learner-passport"] img')) as HTMLImageElement[];
    imgs.forEach((i) => (i.loading = 'eager'));
    await Promise.all(imgs.filter((i) => i.offsetParent !== null).map((i) => i.decode().catch(() => null)));
  });
  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid="learner-passport"] img'))
      .filter((i) => (i as HTMLImageElement).offsetParent !== null)
      .filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0)
      .map((i) => (i as HTMLImageElement).src)
  );
  expect(broken, `${where}: broken images`).toEqual([]);
}

for (const vp of VIEWPORTS) {
  test(`P. ${vp.name}: Passport book with real evidence`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await seed(context, true);
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto('/passport', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="passport-book"]', { timeout: 60000 });
    const wide = vp.width >= 768;

    await expect(page.getByTestId('passport-name')).toHaveText('Asha');
    await expect(page.getByTestId('passport-level')).toContainText('Level');
    await expect(page.getByTestId('passport-disclaimer')).toContainText('not an externally verified');
    await assertImagesLoaded(page, `${vp.name} page 1`);
    const ox = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ox, `${vp.name}: horizontal overflow`).toBeLessThanOrEqual(0);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `passport_p1_${vp.name}.png`) });

    // Expeditions: on the first spread (desktop) or page 2 (phones).
    if (!wide) await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.locator('[data-stamp="physics"]')).toHaveAttribute('data-stamp-state', 'mastered');
    await expect(page.locator('[data-stamp="mathematics"]')).toHaveAttribute('data-stamp-state', 'not_started');
    await expect(page.locator('[data-evidence-item="practice"]')).toContainText('14');
    await assertImagesLoaded(page, `${vp.name} expeditions`);

    // Stamp detail: opens, shows the concept evidence, sits above the app navigation, closes with Escape.
    await page.locator('[data-stamp="physics"]').click();
    const dialog = page.getByRole('dialog', { name: 'Physics' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Projectile Motion');
    await expect(dialog).toContainText('Mastered');
    const covered = await page.evaluate(() => {
      const d = document.querySelector('[data-testid="stamp-detail"]')!.getBoundingClientRect();
      const hit = document.elementFromPoint(d.left + d.width / 2, Math.min(window.innerHeight - 8, d.bottom - 8));
      return !document.querySelector('[data-testid="stamp-detail"]')!.contains(hit);
    });
    expect(covered, `${vp.name}: stamp dialog covered by other UI`).toBe(false);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // Remaining pages.
    const turns = 1;
    for (let i = 0; i < turns; i++) await page.getByRole('button', { name: 'Next page' }).click();
    if (!wide) {
      await expect(page.getByTestId('passport-evidence')).toBeVisible();
      await page.getByRole('button', { name: 'Next page' }).click();
    }
    await expect(page.getByTestId('passport-milestones')).toBeVisible();
    await expect(page.locator('[data-milestone="first_expedition"]')).toHaveAttribute('data-earned', 'true');
    await expect(page.locator('[data-evidence-concept="my_custom_topic"]')).toContainText('No mastery estimate');
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await assertImagesLoaded(page, `${vp.name} last page`);
    const ox2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ox2, `${vp.name}: horizontal overflow (last page)`).toBeLessThanOrEqual(0);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `passport_last_${vp.name}.png`) });

    // Share keeps working.
    if (!wide) {
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Previous page' }).click();
    } else {
      await page.getByRole('button', { name: 'Previous page' }).click();
    }
    await page.getByRole('button', { name: 'Share Passport' }).click();
    const share = page.getByRole('dialog', { name: 'Download Skill Passport' });
    await expect(share).toBeVisible();
    await expect(share).toContainText('not an externally verified');
    await share.getByRole('button', { name: 'Close share dialog' }).click();
    await expect(share).toHaveCount(0);

    expect(errors, errors.join('\n')).toEqual([]);
    await context.close();
  });
}

test('P-E. New learner: honest empty passport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await seed(context, false);
  const page = await context.newPage();
  const errors = watch(page);
  await page.goto('/passport', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="passport-book"]', { timeout: 60000 });
  await expect(page.getByTestId('passport-xp')).toHaveText('0 XP');
  await expect(page.getByTestId('passport-empty')).toBeVisible();
  const states = await page.locator('[data-stamp]').evaluateAll((els) => els.map((e) => e.getAttribute('data-stamp-state')));
  expect(new Set(states)).toEqual(new Set(['not_started']));
  const text = await page.getByTestId('learner-passport').innerText();
  expect(/1,?240|Level 4|68%/.test(text), 'no sample figures').toBe(false);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', 'passport_empty_1440x900.png') });
  expect(errors, errors.join('\n')).toEqual([]);
  await context.close();
});
