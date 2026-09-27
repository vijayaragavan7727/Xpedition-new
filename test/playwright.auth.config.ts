import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * AUTHENTICATED browser run (Phase 4).
 *
 * Requires a production build pointed at the local auth stub:
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54400 NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-anon-key npm run build
 *   MOCK_VISUAL_GENERATION=true XPEDITION_INTEGRATION_SIGNING_SECRET=<32+ chars> npx next start -p 3300
 * The stub is NOT Supabase: it lets the real app run with two signed-in identities.
 */
process.env.CLASS_E2E_AUTH = 'stub';

export default defineConfig({
  testDir: __dirname,
  testMatch: ['classConceptIdentity.spec.ts', 'phase4LearnerSwitch.spec.ts', 'appEntryRouting.spec.ts'],
  globalSetup: require.resolve('./support/stubAuthGlobalSetup'),
  timeout: 600000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.CLASS_E2E_AUTH_BASE_URL || 'http://localhost:3300',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  outputDir: path.join(__dirname, 'artifacts', 'phase4-auth', 'test-results'),
});
