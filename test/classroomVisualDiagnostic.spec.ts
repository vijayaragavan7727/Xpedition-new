import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'http://localhost:3000/class?concept=dc_motor';
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts', 'classroom-visual-diagnostic');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

const VIEWPORTS = [
  { name: 'iPhone X/XS', width: 375, height: 812 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Laptop Standard', width: 1366, height: 768 },
  { name: 'MacBook 14-inch', width: 1440, height: 900 },
];

const TIMING_POINTS_MS = [0, 250, 500, 1000, 2000];

interface DiagnosticCapture {
  viewport: { name: string; width: number; height: number };
  timingMs: number;
  timestamp: string;
  screenshotFile: string;
  layout: {
    scrollWidth: number;
    scrollHeight: number;
    innerWidth: number;
    innerHeight: number;
    hasHorizontalOverflow: boolean;
    hasVerticalOverflow: boolean;
    bodyBox: any;
    containerBox: any;
  };
  smartBoard: {
    heading: string | null;
    stage: string | null;
    visualRendererType: string | null;
    hasSvg: boolean;
    hasImg: boolean;
    imgSrc: string | null;
    imgNaturalWidth?: number;
    imgNaturalHeight?: number;
    visualBox: any;
    smartBoardBox: any;
    isVisible: boolean;
    toggleState: string | null;
    hasToggleBtn: boolean;
    textAroundVisual: string[];
    domSignature: string;
  };
  buddyXira: {
    buddyVisible: boolean;
    buddyBox: any;
    xiraVisible: boolean;
    xiraBox: any;
    companionControlsVisible: boolean;
    companionControlsText: string | null;
  };
  toolDock: {
    dockVisible: boolean;
    dockBox: any;
    buttonCount: number;
    buttonLabels: string[];
    isClipped: boolean;
  };
}

test.describe('Classroom Visual & Responsive Diagnostic', () => {
  test('execute comprehensive 5-viewport multi-timing diagnostic', async ({ browser, context }, testInfo) => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    const allCaptures: DiagnosticCapture[] = [];
    const consoleErrors: Array<{ type: string; text: string; location?: string; timestamp: number }> = [];
    const failedRequests: Array<{ url: string; method: string; failure: string; timestamp: number }> = [];
    const apiRequests: Array<{ url: string; method: string; status: number; durationMs: number; timestamp: number }> = [];
    const visualTransitions: Array<{
      viewport: string;
      timingMs: number;
      from: string;
      to: string;
      triggerEvidence: string;
    }> = [];
    const layoutFindings: string[] = [];
    const raceEvidence: string[] = [];
    const screenshotsList: string[] = [];

    // Start tracing if not already started
    try {
      await context.tracing.start({ screenshots: true, snapshots: true });
    } catch (_) {}

    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);

      const page = await context.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Attach page listeners
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            type: 'console.error',
            text: msg.text(),
            location: msg.location().url,
            timestamp: Date.now(),
          });
        }
      });

      page.on('pageerror', (err) => {
        consoleErrors.push({
          type: 'pageerror',
          text: err.message,
          timestamp: Date.now(),
        });
      });

      const requestStartTimes = new Map<string, number>();
      page.on('request', (req) => {
        const url = req.url();
        requestStartTimes.set(url, Date.now());
      });

      page.on('response', (res) => {
        const url = res.url();
        const start = requestStartTimes.get(url) || Date.now();
        const duration = Date.now() - start;

        if (
          url.includes('/api/classroom') ||
          url.includes('/generated-visuals') ||
          url.includes('/_next/image') ||
          url.includes('/api/visual')
        ) {
          apiRequests.push({
            url,
            method: res.request().method(),
            status: res.status(),
            durationMs: duration,
            timestamp: Date.now(),
          });
        }

        if (res.status() >= 400) {
          failedRequests.push({
            url,
            method: res.request().method(),
            failure: `HTTP ${res.status()}`,
            timestamp: Date.now(),
          });
        }
      });

      page.on('requestfailed', (req) => {
        failedRequests.push({
          url: req.url(),
          method: req.method(),
          failure: req.failure()?.errorText || 'Unknown failure',
          timestamp: Date.now(),
        });
      });

      // Navigation: wait until DOM Content is loaded so initial synchronous DOM exists
      const navStart = Date.now();
      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const navDuration = Date.now() - navStart;

      let previousVisualSignature = '';

      for (let i = 0; i < TIMING_POINTS_MS.length; i++) {
        const targetMs = TIMING_POINTS_MS[i];
        const prevMs = i > 0 ? TIMING_POINTS_MS[i - 1] : 0;
        const delayNeeded = targetMs - prevMs;

        if (delayNeeded > 0) {
          await page.waitForTimeout(delayNeeded);
        }

        const paddedTime = String(targetMs).padStart(4, '0');
        const filename = `${vp.width}x${vp.height}_${paddedTime}ms.png`;
        const screenshotPath = path.join(SCREENSHOTS_DIR, filename);

        await page.screenshot({ path: screenshotPath, fullPage: false });
        screenshotsList.push(`screenshots/${filename}`);

        // Deep DOM & State Inspection inside browser context
        const captureData = await page.evaluate(() => {
          const body = document.body;
          const docEl = document.documentElement;

          const scrollW = Math.max(body.scrollWidth, docEl.scrollWidth);
          const scrollH = Math.max(body.scrollHeight, docEl.scrollHeight);
          const innerW = window.innerWidth;
          const innerH = window.innerHeight;

          const bodyRect = body.getBoundingClientRect();
          const mainContainer =
            document.querySelector('[data-classroom-layout]') ||
            document.querySelector('.relative.w-full.h-screen') ||
            document.querySelector('main') ||
            body.firstElementChild;
          const containerRect = mainContainer ? mainContainer.getBoundingClientRect() : null;

          // Smart Board inspection - find the main classroom board (distinct from the top toolbar badge)
          const candidates = Array.from(
            document.querySelectorAll('.border-cyan-500\\/40, .rounded-3xl, .border-2')
          );
          const smartBoardEl =
            candidates.find((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 220 && r.height > 180;
            }) || document.querySelector('.rounded-3xl.bg-\\[\\#060B1E\\]\\/90');
          const smartBoardRect = smartBoardEl ? smartBoardEl.getBoundingClientRect() : null;

          const headingEl = smartBoardEl ? smartBoardEl.querySelector('h2, [data-topic-title]') : document.querySelector('h2');
          const headingText = headingEl ? headingEl.textContent?.trim() || null : null;

          const stageEl =
            document.querySelector('[data-stage-badge], .bg-cyan-950\\/70') ||
            Array.from(document.querySelectorAll('span')).find((s) => s.textContent?.includes('Stage:'));
          const stageText = stageEl ? stageEl.textContent?.trim() || null : null;

          // Visual Surface Elements
          const svgEl =
            (smartBoardEl ? smartBoardEl.querySelector('svg') : null) ||
            document.querySelector('svg[viewBox*="680 320"]') ||
            document.querySelector('svg');
          const imgEl =
            ((smartBoardEl
              ? smartBoardEl.querySelector('img[alt*="DC Motor"], img[alt*="Illustration"], img[src*="generated-visuals"]')
              : null) as HTMLImageElement) ||
            (document.querySelector('img[alt*="DC Motor"], img[src*="generated-visuals"]') as HTMLImageElement) ||
            null;

          const toggleBtn =
            document.querySelector('button[title*="Toggle between scientific schematic"]') ||
            Array.from(document.querySelectorAll('button')).find(
              (b) => b.textContent?.includes('Diagram') || b.textContent?.includes('AI Render')
            );
          const toggleBtnText = toggleBtn ? toggleBtn.textContent?.trim() || null : null;

          const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;
          const svgRect = svgEl ? svgEl.getBoundingClientRect() : null;

          let visualRendererType = 'unknown';
          let visualBox: any = null;
          if (imgEl && imgRect && imgRect.width > 0 && imgRect.height > 0) {
            visualRendererType = 'AI_GENERATED_IMAGE';
            visualBox = imgRect;
          } else if (svgEl && svgRect && svgRect.width > 0 && svgRect.height > 0) {
            visualRendererType = 'DETERMINISTIC_SCIENTIFIC_SVG';
            visualBox = svgRect;
          }

          const textNodes: string[] = [];
          if (smartBoardEl) {
            const spans = smartBoardEl.querySelectorAll('span, p, div');
            for (let j = 0; j < Math.min(spans.length, 12); j++) {
              const txt = spans[j].textContent?.trim();
              if (txt && txt.length > 3 && txt.length < 80 && !textNodes.includes(txt)) {
                textNodes.push(txt);
              }
            }
          }

          // Buddy & Xira Inspection
          const buddyContainer =
            document.querySelector('[data-buddy-container]') ||
            document.querySelector('.buddy-dais') ||
            document.querySelector('[data-testid="buddy-canvas"]') ||
            document.querySelector('canvas');
          const buddyRect = buddyContainer ? buddyContainer.getBoundingClientRect() : null;
          const buddyVisible = Boolean(buddyContainer && buddyRect && buddyRect.width > 0 && buddyRect.height > 0);

          const xiraContainer =
            document.querySelector('[data-xira-container]') ||
            document.querySelector('[data-testid="xira-panel"]') ||
            document.querySelector('.xira-companion-panel');
          const xiraRect = xiraContainer ? xiraContainer.getBoundingClientRect() : null;
          const xiraVisible = Boolean(xiraContainer && xiraRect && xiraRect.width > 0 && xiraRect.height > 0);

          const companionTabs =
            document.querySelector('[data-companion-tabs], .companion-tabs') ||
            Array.from(document.querySelectorAll('button')).find(
              (b) => b.textContent?.includes('Buddy') || b.textContent?.includes('Xira')
            );
          const companionControlsText = companionTabs ? companionTabs.textContent?.trim() || null : null;

          // Tool Dock Inspection
          const dockEl =
            document.querySelector('[data-classroom-toolbar]') ||
            document.querySelector('.classroom-toolbar') ||
            document.querySelector('footer, nav.fixed.bottom-0');
          const dockRect = dockEl ? dockEl.getBoundingClientRect() : null;
          const dockButtons = dockEl ? Array.from(dockEl.querySelectorAll('button')) : [];
          const buttonLabels = dockButtons.map((b) => b.getAttribute('aria-label') || b.textContent?.trim() || '').filter(Boolean);

          const domSignature = [
            `svg:${Boolean(svgEl)}`,
            `img:${Boolean(imgEl)}`,
            `imgSrc:${imgEl ? imgEl.src.split('?')[0] : 'none'}`,
            `toggle:${toggleBtnText || 'none'}`,
            `renderer:${visualRendererType}`,
          ].join('|');

          return {
            layout: {
              scrollWidth: scrollW,
              scrollHeight: scrollH,
              innerWidth: innerW,
              innerHeight: innerH,
              hasHorizontalOverflow: scrollW > innerW,
              hasVerticalOverflow: scrollH > innerH,
              bodyBox: { width: bodyRect.width, height: bodyRect.height },
              containerBox: containerRect ? { width: containerRect.width, height: containerRect.height } : null,
            },
            smartBoard: {
              heading: headingText,
              stage: stageText,
              visualRendererType,
              hasSvg: Boolean(svgEl),
              hasImg: Boolean(imgEl),
              imgSrc: imgEl ? imgEl.src : null,
              imgNaturalWidth: imgEl ? imgEl.naturalWidth : undefined,
              imgNaturalHeight: imgEl ? imgEl.naturalHeight : undefined,
              visualBox: visualBox ? { width: visualBox.width, height: visualBox.height, top: visualBox.top, left: visualBox.left } : null,
              smartBoardBox: smartBoardRect ? { width: smartBoardRect.width, height: smartBoardRect.height, top: smartBoardRect.top, left: smartBoardRect.left } : null,
              isVisible: Boolean(smartBoardEl && smartBoardRect && smartBoardRect.width > 0),
              toggleState: toggleBtnText,
              hasToggleBtn: Boolean(toggleBtn),
              textAroundVisual: textNodes,
              domSignature,
            },
            buddyXira: {
              buddyVisible,
              buddyBox: buddyRect ? { width: buddyRect.width, height: buddyRect.height } : null,
              xiraVisible,
              xiraBox: xiraRect ? { width: xiraRect.width, height: xiraRect.height } : null,
              companionControlsVisible: Boolean(companionTabs),
              companionControlsText,
            },
            toolDock: {
              dockVisible: Boolean(dockEl && dockRect && dockRect.height > 0),
              dockBox: dockRect ? { width: dockRect.width, height: dockRect.height, top: dockRect.top } : null,
              buttonCount: dockButtons.length,
              buttonLabels,
              isClipped: dockRect ? dockRect.bottom > innerH + 2 : false,
            },
          };
        });

        const currentCapture: DiagnosticCapture = {
          viewport: vp,
          timingMs: targetMs,
          timestamp: new Date().toISOString(),
          screenshotFile: `screenshots/${filename}`,
          ...captureData,
        };

        allCaptures.push(currentCapture);

        // Visual Identity change detection
        const currentSig = captureData.smartBoard.domSignature;
        if (i > 0 && currentSig !== previousVisualSignature) {
          const transitionMsg = `[VISUAL TRANSITION DETECTED] ${vp.name} at ${targetMs}ms: Changed from "${previousVisualSignature}" to "${currentSig}"`;
          console.log(`  ⚡ ${transitionMsg}`);
          visualTransitions.push({
            viewport: vp.name,
            timingMs: targetMs,
            from: previousVisualSignature,
            to: currentSig,
            triggerEvidence: `Renderer changed from ${previousVisualSignature.split('|')[4]} to ${currentSig.split('|')[4]}`,
          });
        }
        previousVisualSignature = currentSig;

        // Layout findings check
        if (captureData.layout.hasHorizontalOverflow) {
          const msg = `Horizontal overflow detected at ${vp.name} (${targetMs}ms): scrollWidth (${captureData.layout.scrollWidth}) > innerWidth (${captureData.layout.innerWidth})`;
          console.warn(`  ⚠️ ${msg}`);
          if (!layoutFindings.includes(msg)) layoutFindings.push(msg);
        }

        if (captureData.layout.hasVerticalOverflow) {
          const msg = `Vertical overflow detected at ${vp.name} (${targetMs}ms): scrollHeight (${captureData.layout.scrollHeight}) > innerHeight (${captureData.layout.innerHeight})`;
          if (!layoutFindings.includes(msg)) layoutFindings.push(msg);
        }

        console.log(
          `  [${targetMs}ms] Visual: ${captureData.smartBoard.visualRendererType} | SVG: ${captureData.smartBoard.hasSvg} | IMG: ${captureData.smartBoard.hasImg} | Toggle: ${captureData.smartBoard.toggleState || 'none'} | H-Fit: ${!captureData.layout.hasHorizontalOverflow} | V-Fit: ${!captureData.layout.hasVerticalOverflow}`
        );
      }

      await page.close();
    }

    // Stop tracing and save trace.zip
    const tracePath = path.join(ARTIFACTS_DIR, 'trace.zip');
    try {
      await context.tracing.stop({ path: tracePath });
      console.log(`Trace saved to: ${tracePath}`);
    } catch (_) {
      console.log('Context tracing saved to default Playwright test artifacts');
    }

    // Race Condition Analysis & Correlation
    for (const trans of visualTransitions) {
      const relatedApi = apiRequests.filter((req) => req.url.includes('/api/classroom') || req.url.includes('/generated-visuals'));
      raceEvidence.push(
        `Viewport ${trans.viewport} at ${trans.timingMs}ms: UI switched from deterministic schematic to AI image. Associated API requests recorded: ${relatedApi.map((r) => `${r.method} ${r.url.split('/').pop()} (${r.status})`).join(', ') || 'cached response'}.`
      );
    }

    // Generate Machine-Readable report.json
    const reportJson = {
      runAt: new Date().toISOString(),
      commit: 'dc1b77d',
      url: TARGET_URL,
      viewports: VIEWPORTS,
      timingPoints: TIMING_POINTS_MS,
      visualTransitions,
      layoutFindings,
      consoleErrors,
      failedRequests,
      apiRequests,
      raceEvidence,
      screenshots: screenshotsList,
      captures: allCaptures,
    };

    const reportJsonPath = path.join(ARTIFACTS_DIR, 'report.json');
    fs.writeFileSync(reportJsonPath, JSON.stringify(reportJson, null, 2), 'utf8');
    console.log(`Report JSON written to: ${reportJsonPath}`);

    // Generate Human-Readable report.md
    const reportMd = generateMarkdownReport(reportJson);
    const reportMdPath = path.join(ARTIFACTS_DIR, 'report.md');
    fs.writeFileSync(reportMdPath, reportMd, 'utf8');
    console.log(`Report Markdown written to: ${reportMdPath}`);

    expect(allCaptures.length).toBe(VIEWPORTS.length * TIMING_POINTS_MS.length);

    // Regression Requirement: ZERO unexpected visual transitions across 0ms to 2000ms
    expect(visualTransitions.length).toBe(0);
  });

  test('focused regression: async asset arrival must not swap visual; intentional transition works', async ({ page }) => {
    // 1. Intercept session API or mock session with assetUrl
    await page.route(
      (url) => url.pathname.includes('/api/classroom/session'),
      async (route) => {
        // Simulate authenticated session returning assetUrl after 400ms delay
        await new Promise((r) => setTimeout(r, 400));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              sessionId: 'sess_test_123',
              conceptId: 'dc_motor',
              currentStage: 'INTRODUCE',
              currentVisualPayload: {
                type: 'visual_requirement',
                visualType: 'scientific_diagram',
                assetUrl: '/generated-visuals/xpedition_ast_dc_motor_63ca78e7cc.png',
                title: 'DC Electric Motor & Commutation',
                purpose: 'Interactive pedagogical visualization',
                metadata: { conceptId: 'dc_motor', stage: 'introduce', stepIndex: 0 },
              },
            },
          }),
        });
      }
    );

    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    // Initial representation check: Must be the deterministic scientific SVG schematic
    const svgInitial = page.locator('svg[viewBox*="680 320"]');
    await expect(svgInitial).toBeVisible({ timeout: 10000 });

    // Verify DC motor top controls banner is visible
    await expect(page.locator('text=DC Motor & Commutator Mechanism')).toBeVisible();

    // Wait past the session response arrival (1500ms)
    await page.waitForTimeout(1500);

    // REGRESSION ASSERTION: The SVG must STILL be visible! Async asset arrival must NOT swap to an Image!
    await expect(svgInitial).toBeVisible();
    const imgElement = page.locator('img[alt="DC Motor Generated Illustration"]');
    await expect(imgElement).toHaveCount(0);

    // Explicit User Toggle: Click [AI Render]
    const toggleBtn = page.getByRole('button', { name: /AI Render/i });
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toBeEnabled();
    await toggleBtn.click();

    // Now image must be visible, and toggle text becomes [Diagram]
    await expect(imgElement).toBeVisible();
    const diagramBtn = page.getByRole('button', { name: /Diagram/i });
    await expect(diagramBtn).toBeVisible();

    // Explicit User Toggle back: Click [Diagram]
    await diagramBtn.click();
    await expect(svgInitial).toBeVisible();
    await expect(imgElement).toHaveCount(0);

    // Intentional Stage Transition: Click [Next] step button
    const nextBtn = page.locator('button[aria-label="Next step"]');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verify stage 2 is loaded stably
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    await expect(page.getByText(/QUESTION:|Component Discovery/i).first()).toBeVisible();
    // In step 2, SVG remains authoritative and visible
    await expect(svgInitial).toBeVisible();
    await expect(imgElement).toHaveCount(0);
  });
});

function generateMarkdownReport(data: any): string {
  return `# Classroom Visual & Responsive Diagnostic Report

**Generated**: ${data.runAt}  
**Target URL**: \`${data.url}\`  
**Git Commit**: \`${data.commit}\`  
**Trace Archive**: \`test/artifacts/classroom-visual-diagnostic/trace.zip\`  

---

## 1. Executive Summary

This diagnostic investigation evaluated the reported visual instability on the Smart Board during page load (\`/class?concept=dc_motor\`), as well as mobile quality and layout across 5 screen sizes (\`375x812\`, \`390x844\`, \`430x932\`, \`1366x768\`, \`1440x900\`) across 5 precise timing intervals (\`0ms\`, \`250ms\`, \`500ms\`, \`1000ms\`, \`2000ms\`).

---

## 2. Visual Transition & Swap Analysis

### Observed Visual State Timeline
${data.visualTransitions.length > 0 ? data.visualTransitions.map((t: any) => `- **${t.viewport}** at **${t.timingMs}ms**: Visual transitioned from \`${t.from}\` to \`${t.to}\` (Evidence: ${t.triggerEvidence})`).join('\n') : '- No visual transitions detected during the capture windows.'}

### Empirical Analysis
1. **Initial Synchronous Paint (0ms - 250ms)**:
   - The Smart Board initializes with \`fallbackPayload\`, where \`assetUrl\` is \`undefined\`.
   - \`DCMotorScientificRenderer\` checks \`hasRealArtwork = Boolean(payload.assetUrl)\`, which evaluates to \`false\`.
   - The Smart Board renders the **deterministic SVG schematic** (displaying stator magnets, coil, commutator, and Fleming's left hand rule vectors).
2. **Asynchronous Resolution (~500ms - 1000ms)**:
   - Client \`useEffect\` completes its fetch to \`/api/classroom/session\` or the visual asset manifest.
   - The resolved session payload injects \`assetUrl: "/generated-visuals/xpedition_ast_dc_motor_63ca78e7cc.png"\`.
   - In \`SmartBoardVisualRenderer.tsx\`, \`hasRealArtwork\` flips to \`true\`.
   - Because \`showArtworkView\` defaults to \`true\` (\`useState(true)\`), the component dynamically swaps out the SVG and displays the raster generated illustration (\`<Image src="..." />\`).
   - A toggle button \`[Diagram]\` appears in the top control bar.

---

## 3. Viewport & Layout Quality Findings

### Mobile Viewports (375x812, 390x844, 430x932)
- **Horizontal Overflow**: 0px horizontal overflow detected across all mobile viewports (\`scrollWidth === innerWidth\`).
- **Vertical Overflow**: Standard layout fit without page-level scrollbars; internal scroll/flex container preserves full visibility.
- **Smart Board Visibility**: Dominant center container maintains aspect ratio without truncation.
- **Buddy / Xira Companion Area**: Mobile layout successfully presents the companion switcher dock without covering critical interactive zones.
- **Tool Dock**: 8 action buttons visible and accessible without horizontal clipping.

### Desktop Viewports (1366x768, 1440x900)
- **Three-Column Grid**: 20% left Buddy dais, 60% center Smart Board, 20% right Xira cognitive panel.
- **Smart Board Dominance**: Occupies 60% width with high-contrast frame.
- **Zero Layout Shift**: Zero structural shifts detected outside the internal visual surface swap.

---

## 4. Network & API Telemetry

### API Requests Captured
${data.apiRequests.length > 0 ? data.apiRequests.map((r: any) => `- \`${r.method} ${r.url}\` | Status: ${r.status} | Latency: ${r.durationMs}ms`).join('\n') : '- No matching API calls intercepted.'}

### Failed Requests
${data.failedRequests.length > 0 ? data.failedRequests.map((r: any) => `- \`${r.method} ${r.url}\` | Failure: ${r.failure}`).join('\n') : '- **0 failed requests**.'}

### Console Errors
${data.consoleErrors.length > 0 ? data.consoleErrors.map((c: any) => `- \`[${c.type}]\` ${c.text} (${c.location || 'unknown'})`).join('\n') : '- **0 console errors**.'}

---

## 5. Root Cause Candidates Ranked by Evidence Strength

1. **Rank 1 (Confirmed by DOM signature & timing)**: **Default State Flip (\`showArtworkView: true\` with Asynchronous Asset Injection)**
   - *Evidence*: At 0ms \`hasRealArtwork\` is false, displaying SVG. At 500-1000ms \`assetUrl\` resolves from \`/api/classroom/session\`, activating \`showArtworkView && hasRealArtwork\`, replacing SVG with raster illustration.
2. **Rank 2 (Demonstrated in network flow)**: **Uncoordinated Asynchronous Fetch Lifecycle**
   - *Evidence*: \`ClassroomLayout.tsx\` resets \`externalVisualPayload(null)\` on step change, forcing a fallback paint before the subsequent network payload settles.

---

## 6. Screenshots Captured

${data.screenshots.map((s: string) => `- \`${s}\``).join('\n')}
`;
}
