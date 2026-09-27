import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * Class concept-identity browser suite.
 *
 * Runs against an already-running server (default http://localhost:3200,
 * e.g. `npm run build && npx next start -p 3200`). Override with CLASS_E2E_BASE_URL.
 * Uses the system Chromium when PLAYWRIGHT_CHROMIUM_PATH is set.
 */
export default defineConfig({
  testDir: __dirname,
  testMatch: ['classConceptIdentity.spec.ts', 'classTeachingFlow.spec.ts'],
  timeout: 600000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.CLASS_E2E_BASE_URL || 'http://localhost:3200',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  outputDir: path.join(__dirname, 'artifacts', 'class-concept-identity', 'test-results'),
});
