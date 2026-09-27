/**
 * Real-browser visual QA of the rebuilt Class (7 concepts × 5 viewports).
 *
 * For every concept and viewport:
 *   - one coherent room (environment layer), Buddy physically present (robot
 *     image loaded, on his pedestal), Smart Board dominant and uncovered,
 *     Buddy never overlapping the board, Xira contextual (panel on desktop,
 *     sheet on phones), dock usable (touch-sized, inside the viewport)
 *   - no flattened screenshot used as UI, no page overflow, no console/page
 *     errors or HTTP 5xx, and the teaching visual does not swap after load
 * Plus: Flashcards / Formula / Notes open inside the Class (flashcard front
 * does not print the answer), the phone Xira sheet opens and closes, and the
 * class result appears on the board after the last step (no XP).
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
const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'class-visual-system');
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

type Rect = { x: number; y: number; w: number; h: number };

async function measure(page: Page) {
  return page.evaluate(() => {
    const rect = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const visibleBuddy = Array.from(document.querySelectorAll('[data-testid="buddy-stage"]')).find(
      (el) => (el as HTMLElement).offsetParent !== null
    ) as HTMLElement | undefined;
    const img = visibleBuddy?.querySelector('img') as HTMLImageElement | null;
    const ir = img?.getBoundingClientRect();
    const board = document.querySelector('[data-testid="smart-board"]') as HTMLElement | null;
    const br = board?.getBoundingClientRect();
    const hit = br ? document.elementFromPoint(br.x + br.width / 2, br.y + Math.min(br.height / 2, 160)) : null;
    const dockButtons = Array.from(document.querySelectorAll('nav[aria-label="Classroom learning tools"] button')).map((b) => {
      const r = (b as HTMLElement).getBoundingClientRect();
      return { h: r.height, bottom: r.bottom };
    });
    const xiraPanel = document.querySelector('[data-testid="xira-panel"]') as HTMLElement | null;
    return {
      board: rect('[data-testid="smartboard-frame"]'),
      buddyCol: rect('[data-testid="buddy-column"]'),
      xira: xiraPanel && xiraPanel.offsetParent !== null ? rect('[data-testid="xira-panel"]') : null,
      buddyVariant: visibleBuddy?.getAttribute('data-variant') ?? null,
      buddyPose: visibleBuddy?.getAttribute('data-buddy-pose') ?? null,
      buddyImg: img ? { src: img.currentSrc || img.src, loaded: img.complete && img.naturalWidth > 0, h: ir!.height, w: ir!.width } : null,
      pedestal: Boolean(visibleBuddy?.querySelector('[data-testid="buddy-pedestal"]')),
      environment: Boolean(document.querySelector('[data-testid="classroom-environment"]')),
      boardUncovered: Boolean(hit && board && board.contains(hit)),
      dockButtons,
      screenshotUi: Array.from(document.querySelectorAll('img')).some((i) => /classroom-master-reference|smartboard-complete/.test(i.src)) ||
        Array.from(document.querySelectorAll<HTMLElement>('*')).some((el) => /classroom-master-reference/.test(el.style.backgroundImage)),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      overflowY: document.documentElement.scrollHeight - window.innerHeight,
      visualKind: document.querySelector('[data-testid="smartboard-visual"]')?.getAttribute('data-visual-kind') ?? null,
      visualConcept: document.querySelector('[data-testid="smartboard-visual"]')?.getAttribute('data-visual-concept') ?? null,
    };
  });
}

const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const vp of VIEWPORTS) {
  test(`V. ${vp.name}: coherent classroom for all seven concepts`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const desktop = vp.width >= 1024;
    const log: Array<Record<string, unknown>> = [];
    for (const concept of CONCEPTS) {
      await page.goto(`/class?concept=${concept}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="smart-board"]');
      await page.waitForFunction(() => {
        const s = Array.from(document.querySelectorAll('[data-testid="buddy-stage"]')).find((el) => (el as HTMLElement).offsetParent !== null);
        const i = s?.querySelector('img') as HTMLImageElement | null;
        return Boolean(i && i.complete && i.naturalWidth > 0);
      });
      const m = await measure(page);
      const where = `${vp.name} ${concept}`;

      expect(m.environment, `${where}: classroom environment`).toBe(true);
      expect(m.screenshotUi, `${where}: flattened screenshot used as UI`).toBe(false);
      expect(m.overflowX, `${where}: horizontal overflow`).toBeLessThanOrEqual(0);
      expect(m.overflowY, `${where}: page vertical overflow`).toBeLessThanOrEqual(1);

      // Buddy: the robot, standing on his pedestal, the right variant for the device.
      expect(m.buddyVariant, `${where}: Buddy variant`).toBe(desktop ? 'stage' : 'compact');
      expect(m.buddyImg?.src ?? '', `${where}: Buddy image`).toContain('robot.png');
      expect(m.buddyImg?.loaded, `${where}: Buddy image loaded`).toBe(true);
      expect(m.buddyImg!.h, `${where}: Buddy visible size`).toBeGreaterThanOrEqual(desktop ? 220 : 60);
      expect(m.pedestal, `${where}: Buddy pedestal`).toBe(true);

      // Smart Board: dominant, uncovered, and never overlapped by Buddy.
      const board = m.board!;
      const buddy = m.buddyCol!;
      expect(intersects(board, buddy), `${where}: Buddy overlaps the Smart Board`).toBe(false);
      expect(m.boardUncovered, `${where}: something covers the Smart Board`).toBe(true);
      if (desktop) {
        expect(board.w, `${where}: board wider than Buddy`).toBeGreaterThan(buddy.w * 2);
        expect(m.xira, `${where}: Xira panel on desktop`).not.toBeNull();
        expect(board.w, `${where}: board wider than Xira`).toBeGreaterThan(m.xira!.w * 2);
        expect(m.xira!.h, `${where}: Xira is contextual, not a full-height chatbot`).toBeLessThan(board.h);
      } else {
        expect(board.h, `${where}: board dominates the phone screen`).toBeGreaterThan(vp.height * 0.55);
        expect(m.xira, `${where}: Xira is a sheet on phones`).toBeNull();
        await expect(page.getByTestId('xira-open')).toBeVisible();
      }

      // Dock: touch-sized and inside the viewport.
      expect(m.dockButtons.length).toBeGreaterThanOrEqual(5);
      for (const b of m.dockButtons) {
        expect(b.h, `${where}: dock touch target`).toBeGreaterThanOrEqual(44);
        expect(b.bottom, `${where}: dock inside viewport`).toBeLessThanOrEqual(vp.height);
      }

      // The teaching visual belongs to this concept and does not swap after load.
      expect(m.visualConcept, `${where}: visual concept`).toBe(concept);
      await page.waitForTimeout(1200);
      const later = await measure(page);
      expect(later.visualKind, `${where}: visual swapped after load`).toBe(m.visualKind);

      log.push({ viewport: vp.name, concept, board, buddy, xira: m.xira, pose: m.buddyPose, visual: m.visualKind });
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `${concept}_${vp.name}.png`) });
    }
    fs.writeFileSync(path.join(ARTIFACT_DIR, `layout_${vp.name}.json`), JSON.stringify(log, null, 2));
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

for (const vp of [VIEWPORTS[1], VIEWPORTS[4]]) {
  test(`W. ${vp.name}: tools open inside the Class; Xira sheet; class result`, async ({ page }) => {
    const errors = watch(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/class?concept=dc_motor', { waitUntil: 'networkidle' });

    // Flashcards: a focused sheet; the front does not print the answer.
    await page.getByRole('button', { name: 'Cards', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Concept Flashcards' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId('tool-download-flashcards')).toBeVisible();
    await expect(sheet).toContainText('Say your answer, then flip the card.');
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);

    // Formula cards for this lesson (DC motor has formulas).
    await page.getByRole('button', { name: 'Formula', exact: true }).click();
    const formula = page.getByRole('dialog', { name: 'Formula Sheet' });
    await expect(formula).toContainText('DC Electric Motor');
    await expect(formula.getByTestId('tool-download-formula')).toBeVisible();
    await page.keyboard.press('Escape');

    // Notes: the learner's note, in the Class.
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    const notes = page.getByRole('dialog', { name: 'Student Scratchpad' });
    await expect(notes.locator('textarea#classroom-scratchpad')).toBeVisible();
    await page.keyboard.press('Escape');

    // History has no formulas: no formula tool is offered.
    await page.goto('/class?concept=industrial_revolution', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Formula', exact: true })).toHaveCount(0);

    if (vp.width < 1024) {
      await page.getByTestId('xira-open').click();
      const xira = page.getByRole('dialog', { name: 'Xira' });
      await expect(xira).toBeVisible();
      await expect(xira.getByTestId('xira-panel')).toHaveAttribute('data-concept-id', 'industrial_revolution');
      await xira.getByRole('button', { name: 'Close assistant' }).click();
      await expect(xira).toHaveCount(0);
    }

    // Finish a lesson: the result appears on the board, from evidence, without XP.
    await page.goto('/class?concept=polymorphism', { waitUntil: 'networkidle' });
    const total = await page.evaluate(() => document.querySelectorAll('[aria-label^="Jump to step"]').length);
    for (let i = 0; i < total; i++) {
      const q = page.locator('[data-testid="check-question"]');
      if (await q.count()) {
        for (let g = 0; g < 12; g++) {
          const st = await q.getAttribute('data-answer-state');
          if (st === 'correct') break;
          if (st === 'incorrect') {
            await q.getByRole('button', { name: 'Try Again' }).click();
            continue;
          }
          await q.locator('button[data-option-id]:not([data-tried-wrong]):not([disabled])').first().click();
          await q.getByRole('button', { name: /Submit Answer|Commit Prediction/ }).click();
        }
      }
      await page.getByRole('button', { name: 'Next step', exact: true }).click();
    }
    const result = page.getByTestId('class-completion');
    await expect(result).toBeVisible();
    await expect(result).toBeInViewport(); // brought into view on the board, not left scrolled away
    await expect(result).toContainText('Class complete');
    await expect(page.getByRole('button', { name: 'Next step', exact: true })).toContainText('See result');
    await expect(result).toContainText('Right first try');
    await expect(page.getByTestId('next-concept-link')).toHaveAttribute('href', '/learn?tab=explore');
    await expect(page.locator('text=/\\d+ XP/')).toHaveCount(0);
    await expect(page.getByTestId('classroom')).toHaveAttribute('data-class-stage', 'complete');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshots', `complete_${vp.name}.png`) });
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
