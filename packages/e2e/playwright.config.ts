import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';

/** https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [process.env.CI ? 'github' : 'html'],
    ['line'],
    [
      '@argos-ci/playwright/reporter',
      {
        uploadToArgos: !!process.env.CI,
        token: process.env.ARGOS_TOKEN,
      },
    ],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',
    screenshot: 'on',
  },
  webServer: {
    reuseExistingServer: true,
    command: 'yarn start:e2e',
    cwd: fileURLToPath(new URL('../../', import.meta.url).toString()),
    port: 5173,
    env: {
      VITE_COVERAGE: '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
