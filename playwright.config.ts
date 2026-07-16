import { defineConfig } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT ?? 3100);
const apiPort = Number(process.env.E2E_API_PORT ?? 4100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${webPort}`;
const databaseUrl = process.env.E2E_DATABASE_URL ?? "";

if (!/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(baseURL)) {
  throw new Error(`E2E_BASE_URL must target localhost, received: ${baseURL}`);
}
if (!databaseUrl || !/(?:test|qa)/i.test(new URL(databaseUrl).pathname)) {
  throw new Error("E2E_DATABASE_URL is required and its database name must contain test or qa");
}

export default defineConfig({
  testDir: "./e2e",
  outputDir: "artifacts/playwright-results",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "artifacts/playwright-report", open: "never" }],
    ["json", { outputFile: "artifacts/playwright-results.json" }]
  ],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 8_000,
    navigationTimeout: 15_000
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1366, height: 768 } }
    }
  ],
  webServer: {
    command: "node scripts/qa/start-e2e-servers.mjs",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "test",
      API_PORT: String(apiPort),
      E2E_WEB_PORT: String(webPort),
      E2E_API_PORT: String(apiPort),
      WEB_ORIGIN: baseURL,
      DATABASE_URL: databaseUrl,
      JWT_SECRET: process.env.E2E_JWT_SECRET ?? "qa-local-only-secret-change-me",
      STORAGE_DRIVER: "local",
      STORAGE_LOCAL_ROOT: "../../tmp/e2e-storage",
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}/api`,
      NEXT_PUBLIC_ENABLE_DEMO_DATA: "false"
    }
  }
});
