import { fileURLToPath } from "url";

import { defineConfig, devices } from "@playwright/test";

/** https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  ...(process.env["CI"] ? { workers: 1 } : {}),
  reporter: [[process.env["CI"] ? "github" : "html"], ["line"]],
  use: {
    baseURL: "http://localhost:5173",
  },
  webServer: {
    reuseExistingServer: true,
    command: "yarn start:e2e",
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
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
