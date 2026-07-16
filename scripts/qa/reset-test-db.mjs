import { spawnSync } from "node:child_process";

const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error("E2E_DATABASE_URL is required");
const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.replace(/^\//, "");
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
if (!localHosts.has(parsed.hostname) || !/(?:test|qa)/i.test(databaseName)) {
  throw new Error(`Refusing to reset non-test database ${parsed.hostname}/${databaseName}`);
}
if (process.env.E2E_RESET_DATABASE !== "RESET_TEST_DATABASE") {
  throw new Error("Set E2E_RESET_DATABASE=RESET_TEST_DATABASE to reset the QA database");
}

function run(args, extraEnv = {}) {
  const packageManager = process.env.npm_execpath;
  const windowsFallback = !packageManager && process.platform === "win32";
  const command = packageManager ? process.execPath : windowsFallback ? process.env.ComSpec : "pnpm";
  const commandArgs = packageManager
    ? [packageManager, ...args]
    : windowsFallback
      ? ["/d", "/s", "/c", `pnpm ${args.join(" ")}`]
      : args;
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, ...extraEnv },
    stdio: "inherit",
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["--filter", "@homeschool/api", "prisma:generate"]);
run(["--filter", "@homeschool/api", "prisma:deploy"]);
run(["--filter", "@homeschool/api", "prisma:seed"], {
  NODE_ENV: "test",
  DEMO_SEED_CONFIRM: "RESET_LOCAL_DEMO",
  STORAGE_DRIVER: "local"
});
