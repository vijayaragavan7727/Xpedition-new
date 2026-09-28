import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * Passport browser suite. /passport is a protected learner route, so this runs
 * against a DEVELOPMENT server with the explicit local auth bypass, e.g.
 *   NEXT_PUBLIC_XPEDITION_DEV_AUTH_BYPASS=1 npx next dev -p 3300
 * Override the URL with PASSPORT_E2E_BASE_URL.
 */
export default defineConfig({
  testDir: __dirname,
  testMatch: ['passport.spec.ts'],
  timeout: 300000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PASSPORT_E2E_BASE_URL || 'http://localhost:3300',
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  outputDir: path.join(__dirname, 'artifacts', 'passport', 'test-results'),
});
