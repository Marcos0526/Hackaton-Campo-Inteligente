import { defineConfig, devices } from "@playwright/test";

/**
 * PWA checks need a production build because the service worker is only
 * registered when NODE_ENV=production.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /pwa\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    colorScheme: "light",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
