import { spawnSync } from "node:child_process";

if (!process.env.E2E_DATABASE_URL) throw new Error("E2E_DATABASE_URL is required");
if (process.env.E2E_RESET_DATABASE !== "RESET_TEST_DATABASE") {
  throw new Error("E2E_RESET_DATABASE=RESET_TEST_DATABASE is required");
}

const reset = spawnSync(process.execPath, ["scripts/qa/reset-test-db.mjs"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});
if (reset.error) throw reset.error;
if (reset.status !== 0) process.exit(reset.status ?? 1);

const packageManager = process.env.npm_execpath;
const windowsFallback = !packageManager && process.platform === "win32";
const command = packageManager ? process.execPath : windowsFallback ? process.env.ComSpec : "pnpm";
const requested = process.argv.slice(2);
const args = packageManager
  ? [packageManager, "exec", "playwright", "test", ...requested]
  : windowsFallback
    ? ["/d", "/s", "/c", `pnpm exec playwright test ${requested.join(" ")}`]
    : ["exec", "playwright", "test", ...requested];
const result = spawnSync(command, args, { cwd: process.cwd(), env: process.env, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
