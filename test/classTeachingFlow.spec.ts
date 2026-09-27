/**
 * Real-browser learner walk-through of the Class teaching flow (learner audit).
 *
 * For all seven audited concepts at all five target viewports, a learner:
 *   - meets every check and cannot skip it with Next
 *   - answers WRONG first: only their own choice is marked, the correct option is
 *     not revealed, Buddy explains that specific choice, Xira observes it
 *   - retries and answers correctly
 *   - finishes the lesson and sees an evidence-based summary (not step XP)
 * Plus: the heart pathway is traced on the Smart Board by clicking structures.
 *
 * Checks every page for console errors, page errors, HTTP 5xx and overflow.
 */

import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CONCEPTS = [
  'dc_motor',
  'projectile_motion',
  'human_heart_anatomy',
  'periodic_table',
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
const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'class-teaching-flow');
fs.mkdirSync(path.join(ARTIFACT_DIR, 'screenshots'), { recursive: true });

function watch(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('status of 429')) errors.push(`console: ${m.text().slice(0, 200)}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return errors;
}

async function overflow(page: Page) {
  return page.evaluate(() => ({
    x: document.documentElement.scrollWidth - window.innerWidth,
    y: document.documentElement.scrollHeight - window.innerHeight,
  }));
}

const buddyText = (page: Page) =>
  page.evaluate(() => (document.querySelector('[data-testid="buddy-column"]') as HTMLElement | null)?.innerText.replace(/\s+/g, ' ') ?? '');

for (const vp of VIEWPORTS) {
  test(`T. ${vp.name}: learn-by-doing flow for all seven concepts`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const log: Array<Record<string, unknown>> = [];
    for (const concept of CONCEPTS) {
      await page.goto(`/class?concept=${concept}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="smart-board"]');
      const total = await page.evaluate(() => document.querySelectorAll('[aria-label^="Jump to step"]').length);
      let checks = 0;
      for (let i = 0; i < total; i++) {
        await page.waitForFunction(
          (idx) => document.querySelector('[data-testid="class-identity"]')?.getAttribute('data-step-index') === String(idx),
          i
        );
        const o = await overflow(page);
        expect(o.x, `${vp.name} ${concept} step ${i + 1}: horizontal overflow`).toBeLessThanOrEqual(0);
        expect(o.y, `${vp.name} ${concept} step ${i + 1}: page vertical overflow`).toBeLessThanOrEqual(1);

        // The visual must not overlap the key idea / check (it did on phones: the
        // periodic table was painted over the answer options).
        const overlap = await page.evaluate(() => {
          const col = document.querySelector('[data-testid="smartboard-visual-column"]')?.getBoundingClientRect();
          const check = document.querySelector('[data-testid="check-question"]')?.getBoundingClientRect();
          return col && check ? Math.max(0, col.bottom - check.top) : 0;
        });
        expect(overlap, `${vp.name} ${concept} step ${i + 1}: visual overlaps the check`).toBeLessThanOrEqual(0);

        const q = page.locator('[data-testid="check-question"]');
        if ((await q.count()) > 0) {
          checks++;
          // Next cannot skip the check.
          const next = page.getByRole('button', { name: 'Next step', exact: true });
          await expect(next).toHaveAttribute('data-blocked', 'true');
          await expect(next).toHaveAttribute('aria-disabled', 'true');
          await next.dispatchEvent('click'); // a determined click still does not skip
          await expect(page.getByTestId('class-identity')).toHaveAttribute('data-step-index', String(i));

          // Wrong answers until one is marked incorrect (the first option tried may be right).
          let firstTryCorrect = false;
          for (let guard = 0; guard < 12; guard++) {
            const state = await q.getAttribute('data-answer-state');
            if (state === 'correct') break;
            if (state === 'incorrect') {
              // Only the learner's own choice is marked; the correct option is NOT revealed.
              await expect(q.locator('button[data-option-id][class*="emerald"]')).toHaveCount(0);
              await expect(q.locator('button[data-option-id][aria-pressed="true"][class*="bg-rose-500"]')).toHaveCount(1);
              const feedback = (await page.getByTestId('answer-feedback').innerText()).trim();
              expect((await buddyText(page)).includes(feedback.slice(0, 40)), `${concept}: Buddy explains this choice`).toBe(true);
              if (vp.width >= 1024) {
                await expect(page.getByTestId('xira-observation').first()).toBeVisible();
              }
              await q.getByRole('button', { name: 'Try Again' }).click();
              continue;
            }
            await q.locator('button[data-option-id]:not([data-tried-wrong]):not([disabled])').first().click();
            await q.getByRole('button', { name: /Submit Answer|Commit Prediction/ }).click();
            if (guard === 0 && (await q.getAttribute('data-answer-state')) === 'correct') firstTryCorrect = true;
          }
          await expect(q).toHaveAttribute('data-answer-state', 'correct');
          await expect(q.locator('button[data-option-id][class*="emerald"]')).toHaveCount(1);
          log.push({ viewport: vp.name, concept, step: i + 1, firstTryCorrect });
        }

        if (concept === 'human_heart_anatomy' && (await page.locator('[data-testid="heart-trace"]').count()) > 0) {
          // A wrong turn is explained; the correct sequence completes the loop.
          await page.locator('[data-heart-node="LA"]').click();
          await expect(page.getByTestId('heart-trace')).toContainText('Not the left atrium');
          for (const node of ['RA', 'RV', 'LUNGS', 'LA', 'LV', 'BODY']) await page.locator(`[data-heart-node="${node}"]`).click();
          await expect(page.getByTestId('heart-trace')).toContainText('Loop complete');
          await expect(page.getByTestId('heart-trace')).toHaveAttribute('data-trace-wrong', '1');
        }

        if (concept === 'industrial_revolution' && (await page.locator('[data-testid="timeline-order"]').count()) > 0) {
          // Dates are hidden until the learner orders the events; a wrong pick is explained.
          await expect(page.locator('[data-milestone="lmr"]')).toContainText('?');
          await page.locator('[data-order-event="lmr"]').click();
          await expect(page.getByTestId('timeline-order-feedback')).toContainText('came later');
          for (const id of ['newcomen', 'watt', 'stockton', 'lmr']) await page.locator(`[data-order-event="${id}"]`).click();
          await expect(page.getByTestId('timeline-order')).toContainText('In order (1 wrong pick)');
          await expect(page.locator('[data-milestone="lmr"]')).toContainText('1830');
        }

        if (i === 0 && vp.name === '1440x900') {
          await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `${concept}_step1_${vp.name}.png`) });
        }
        await page.getByRole('button', { name: 'Next step', exact: true }).click();
      }
      // Completed: the badge and Buddy reflect evidence, never step XP.
      await expect(page.getByTestId('evidence-badge')).toContainText(`/${checks}`);
      await expect(page.locator('text=/\\d+ XP/')).toHaveCount(0);
      const finalBuddy = await buddyText(page);
      expect(finalBuddy.length).toBeGreaterThan(10);
      if (vp.name === '1440x900' || vp.name === '390x844') {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `${concept}_complete_${vp.name}.png`) });
      }
    }
    fs.writeFileSync(path.join(ARTIFACT_DIR, `flow_${vp.name}.json`), JSON.stringify(log, null, 2));
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('X. Xira actions stay on the active concept (no Projectile Motion links)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const concept of ['human_heart_anatomy', 'industrial_revolution']) {
    await page.goto(`/class?concept=${concept}`, { waitUntil: 'networkidle' });
    await page.locator('[data-xira-prompt]').first().click();
    await page.waitForTimeout(1500);
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[aria-label="Suggested Learning Actions"] a')).map((a) => a.getAttribute('href') || '')
    );
    for (const h of hrefs) {
      expect(h, `${concept}: ${h}`).not.toContain('projectile_motion');
      expect(h).toContain(concept);
    }
  }
});
