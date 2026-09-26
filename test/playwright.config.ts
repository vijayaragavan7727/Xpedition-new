import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'classroomVisualDiagnostic.spec.ts',
  timeout: 300000,
  workers: 1,
  use: {
    channel: 'chrome',
    headless: true,
    trace: 'off',
    screenshot: 'off',
  },
  outputDir: path.join(__dirname, 'artifacts', 'classroom-visual-diagnostic', 'test-results'),
});
