import { defineConfig } from '@playwright/test';
import path from 'node:path';
process.env.E2E_DATABASE_PATH = path.resolve('test-results/e2e.sqlite');
export default defineConfig({
  testDir: './tests/e2e', workers: 1, fullyParallel: false, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4178', trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote']
    } : {}, viewport: { width: 1280, height: 900 } },
  webServer: {
    command: `"${process.execPath}" scripts/e2e-server.mjs`, url: 'http://127.0.0.1:4178/api/health',
    reuseExistingServer: false, timeout: 30000
  }
});
