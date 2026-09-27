import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * HOSTED Supabase application-level verification (docs/hosted-supabase-verification.md).
 * Requires the six hosted variables in this shell AND the app started with the
 * same variables (default http://localhost:3400, override XP_HOSTED_APP_URL).
 * Without the variables every test is skipped as BLOCKED.
 */
export default defineConfig({
  testDir: __dirname,
  testMatch: 'phase4HostedApp.spec.ts',
  timeout: 180000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.XP_HOSTED_APP_URL || 'http://localhost:3400',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  outputDir: path.join(__dirname, 'artifacts', 'hosted-supabase', 'test-results'),
});
