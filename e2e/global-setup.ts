import { execFileSync } from "node:child_process";

export default async function globalSetup() {
  const databaseUrl = process.env.E2E_DATABASE_URL;
  if (!databaseUrl) throw new Error("E2E_DATABASE_URL is required");
  const parsed = new URL(databaseUrl);
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(parsed.hostname) || !/(?:test|qa)/i.test(parsed.pathname)) {
    throw new Error("Playwright refuses to use a non-local or non-test database");
  }
  if (process.env.E2E_RESET_DATABASE !== "RESET_TEST_DATABASE") {
    throw new Error("E2E_RESET_DATABASE=RESET_TEST_DATABASE is required for deterministic fixtures");
  }
  execFileSync(process.execPath, ["scripts/qa/reset-test-db.mjs"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });
}
