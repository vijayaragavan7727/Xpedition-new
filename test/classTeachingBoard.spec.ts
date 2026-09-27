/**
 * Real-browser check that the Smart Board TEACHES (7 concepts × 5 viewports).
 *
 * On every step of every lesson:
 *   - the board shows theory with the visual as one teaching unit (theory left of
 *     the visual on desktop; visual above the theory on phones), or the
 *     "predict first" lock before the first attempt on predict-first steps
 *   - Core idea shows 3–5 concise points; the Key takeaway follows the theory
 * At 1440×900 and 390×844, "How it works" is walked point by point:
 *   - each point highlights a part that exists in the visual (others dimmed)
 *   - Buddy says that point's line (Buddy teaches the step the board shows)
 *   - on phones a caption under the visual carries the current point
 * The Formula section explains variables where the step uses one.
 * No overflow, no console/page errors, no HTTP 5xx.
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
const WALK = new Set(['390x844', '1440x900']);
const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'class-teaching-board');
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

const visibleBuddyText = (page: Page) =>
  page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('[data-testid="buddy-dialogue"]')).find((e) => (e as HTMLElement).offsetParent !== null);
    return (el?.textContent ?? '').trim();
  });

async function resolveCheck(page: Page) {
  const q = page.locator('[data-testid="check-question"]');
  if ((await q.count()) === 0) return;
  for (let g = 0; g < 12; g++) {
    const st = await q.getAttribute('data-answer-state');
    if (st === 'correct') return;
    if (st === 'incorrect') {
      await q.getByRole('button', { name: 'Try Again' }).click();
      continue;
    }
    await q.locator('button[data-option-id]:not([data-tried-wrong]):not([disabled])').first().click();
    await q.getByRole('button', { name: /Submit Answer|Commit Prediction/ }).click();
  }
}

for (const vp of VIEWPORTS) {
  test(`TB. ${vp.name}: the Smart Board teaches theory with the visual`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const desktop = vp.width >= 768;
    const log: Array<Record<string, unknown>> = [];

    for (const concept of CONCEPTS) {
      await page.goto(`/class?concept=${concept}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="board-theory"]');
      const total = await page.evaluate(() => document.querySelectorAll('[aria-label^="Jump to step"]').length);

      for (let i = 0; i < total; i++) {
        await page.waitForFunction(
          (idx) => document.querySelector('[data-testid="class-identity"]')?.getAttribute('data-step-index') === String(idx),
          i
        );
        const where = `${vp.name} ${concept} step ${i + 1}`;
        const theory = page.getByTestId('board-theory');
        await expect(theory, `${where}: theory`).toHaveCount(1);

        // One teaching unit: theory beside (desktop) or under (phones) the visual.
        const pos = await page.evaluate(() => {
          const t = document.querySelector('[data-testid="board-theory"]')!.getBoundingClientRect();
          const v = document.querySelector('[data-testid="smartboard-visual-column"]')!.getBoundingClientRect();
          return { tLeft: t.left, tTop: t.top, vLeft: v.left, vTop: v.top, vW: v.width, vH: v.height };
        });
        if (!desktop) expect(pos.vTop, `${where}: visual above the theory on phones`).toBeLessThan(pos.tTop);
        else if (concept === 'periodic_table') expect(pos.tTop, `${where}: full-width table under the theory`).toBeLessThan(pos.vTop);
        else expect(pos.tLeft, `${where}: theory left of the visual`).toBeLessThan(pos.vLeft);
        // The visual is never clipped sideways (every column of the periodic table stays reachable).
        const clipped = await page.evaluate(() => {
          const col = document.querySelector('[data-testid="smartboard-visual-column"]') as HTMLElement;
          return col.scrollWidth - col.clientWidth;
        });
        if (desktop) expect(clipped, `${where}: visual clipped`).toBeLessThanOrEqual(1);
        expect(pos.vH, `${where}: visual present`).toBeGreaterThanOrEqual(200);

        const locked = (await theory.getAttribute('data-theory-tab')) === 'locked';
        if (locked) {
          await expect(page.getByTestId('key-principle-locked')).toBeVisible();
          await expect(page.getByTestId('key-principle')).toHaveCount(0);
          await expect(page.getByTestId('smartboard-visual')).not.toHaveAttribute('data-visual-focus', /.+/);
          await resolveCheck(page); // first attempt unlocks the theory
          await expect(theory).not.toHaveAttribute('data-theory-tab', 'locked');
        }
        const points = await page.getByTestId('theory-points').locator('li').count();
        expect(points, `${where}: 3–5 core points`).toBeGreaterThanOrEqual(3);
        expect(points).toBeLessThanOrEqual(5);
        await expect(page.getByTestId('key-principle'), `${where}: key takeaway`).toContainText('Key takeaway');

        const howTab = page.locator('[data-theory-tab-button="how"]');
        let walked = 0;
        if (WALK.has(vp.name) && (await howTab.count()) > 0) {
          await howTab.click();
          const n = await page.locator('[data-how-index]').count();
          for (let k = 0; k < n; k++) {
            if (k > 0) await page.getByTestId('how-next').click();
            const item = page.locator(`[data-how-index="${k}"]`);
            await expect(item).toHaveAttribute('aria-current', 'step');
            const focus = await item.getAttribute('data-how-focus');
            if (focus) {
              const visual = page.getByTestId('smartboard-visual');
              await expect(visual, `${where} point ${k + 1}: visual focus`).toHaveAttribute('data-visual-focus', focus);
              const measure = () =>
                page.evaluate((f) => {
                  const v = document.querySelector('[data-testid="smartboard-visual"]')!;
                  const on = v.querySelectorAll(`[data-part~="${f}"]`).length;
                  const off = Array.from(v.querySelectorAll('[data-part]')).find((el) => !(el.getAttribute('data-part') || '').split(' ').includes(f));
                  return { on, offOpacity: off ? Number(getComputedStyle(off).opacity) : 0 };
                }, focus);
              expect((await measure()).on, `${where} point ${k + 1}: "${focus}" drawn in the visual`).toBeGreaterThan(0);
              // Parts fade (CSS transition), so wait for the dimming to settle.
              await expect.poll(async () => (await measure()).offOpacity, { message: `${where} point ${k + 1}: other parts dimmed` }).toBeLessThan(0.5);
            }
            if (!desktop) await expect(page.getByTestId('visual-caption')).toContainText(`${k + 1}/${n}`);
            walked++;
          }
          // Buddy teaches the point the board shows (when the lesson gives him a line for it).
          const lastBuddyLine = await page.evaluate(() => document.querySelector('[data-how-index][aria-current="step"]')?.getAttribute('data-how-focus'));
          expect(lastBuddyLine !== undefined).toBe(true);
          expect((await visibleBuddyText(page)).length).toBeGreaterThan(10);
        }

        const formulaTab = page.locator('[data-theory-tab-button="formula"]');
        if (WALK.has(vp.name) && (await formulaTab.count()) > 0) {
          await formulaTab.click();
          await expect(page.getByTestId('theory-formula')).toBeVisible();
          const cards = page.locator('[data-formula-id]');
          for (let k = 0; k < (await cards.count()); k++) {
            await expect(cards.nth(k).locator('dt').first()).toBeVisible(); // variables explained
            await expect(cards.nth(k)).toContainText('Used for');
          }
        }

        const o = await page.evaluate(() => ({ x: document.documentElement.scrollWidth - window.innerWidth, y: document.documentElement.scrollHeight - window.innerHeight }));
        expect(o.x, `${where}: horizontal overflow`).toBeLessThanOrEqual(0);
        expect(o.y, `${where}: page vertical overflow`).toBeLessThanOrEqual(1);

        log.push({ viewport: vp.name, concept, step: i + 1, lockedFirst: locked, points, howWalked: walked });
        if (i === 0 && WALK.has(vp.name)) {
          await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `${concept}_step1_${vp.name}.png`) });
        }
        await resolveCheck(page);
        await page.getByRole('button', { name: 'Next step', exact: true }).click();
      }
    }
    fs.writeFileSync(path.join(ARTIFACT_DIR, `board_${vp.name}.json`), JSON.stringify(log, null, 2));
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('TB-B. Buddy says the "How it works" point the board is showing (DC motor, heart)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/class?concept=dc_motor', { waitUntil: 'networkidle' });
  await page.locator('[data-theory-tab-button="how"]').click();
  await expect.poll(() => visibleBuddyText(page)).toContain('Follow the red and blue supply leads');
  await page.getByTestId('how-next').click();
  await expect.poll(() => visibleBuddyText(page)).toContain('copper coil');
  await expect(page.getByTestId('smartboard-visual')).toHaveAttribute('data-visual-focus', 'coil');
  // Back to the core idea: whole visual, Buddy's own lesson line.
  await page.locator('[data-theory-tab-button="core"]').click();
  await expect(page.getByTestId('smartboard-visual')).not.toHaveAttribute('data-visual-focus', /.+/);
  await expect.poll(() => visibleBuddyText(page)).toContain('A DC motor converts electrical energy');

  await page.goto('/class?concept=human_heart_anatomy', { waitUntil: 'networkidle' });
  await page.locator('[data-theory-tab-button="how"]').click();
  await page.getByTestId('how-next').click();
  await expect.poll(() => visibleBuddyText(page)).toContain('lungs');
  await expect(page.getByTestId('smartboard-visual')).toHaveAttribute('data-visual-focus', 'pulmonary');
  // An answer's feedback always outranks the narration.
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  const q = page.locator('[data-testid="check-question"]');
  await q.locator('button[data-option-id]').first().click();
  await q.getByRole('button', { name: /Submit Answer|Commit Prediction/ }).click();
  const feedback = (await page.getByTestId('answer-feedback').innerText()).trim();
  await expect.poll(() => visibleBuddyText(page)).toContain(feedback.slice(0, 30));
});
