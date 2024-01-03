import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';

/** https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: process.env.CI
    ? {
        command: 'yarn dev:vite',
        cwd: fileURLToPath(new URL('../frontend/', import.meta.url).toString()),
        port: 5173,
        env: {
          VITE_COVERAGE: '1',
        },
      }
    : undefined,
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
