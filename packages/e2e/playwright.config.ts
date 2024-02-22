import path from "path";

import { defineConfig, devices } from "@playwright/test";
import { ChromaticConfig } from "@chromatic-com/playwright";

/** https://playwright.dev/docs/test-configuration. */
export default defineConfig<ChromaticConfig>({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [[process.env.CI ? "github" : "html"], ["line"]],
  use: {
    baseURL: "http://localhost:5173",
    disableAutoSnapshot: true,
  },
  webServer: {
    reuseExistingServer: true,
    command: "yarn start:e2e",
    cwd: path.join(__dirname, "../../"),
    port: 5173,
    env: {
      VITE_COVERAGE: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
