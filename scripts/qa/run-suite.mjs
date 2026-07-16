import { spawnSync } from "node:child_process";

const packageManager = process.env.npm_execpath;
const command = packageManager ? process.execPath : process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const steps = [
  ["lint", ["lint"]],
  ["unit/integration", ["test"]],
  ["build", ["build"]],
  ["prisma validate", ["--filter", "@homeschool/api", "exec", "prisma", "validate"]],
  ["prisma generate", ["db:generate"]],
  ["database reset", ["qa:db:reset"]],
  ["browser E2E", ["qa:e2e"]]
];
const failures = [];
for (const [name, args] of steps) {
  const commandArgs = packageManager ? [packageManager, ...args] : args;
  const result = spawnSync(command, commandArgs, { cwd: process.cwd(), env: process.env, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) failures.push(name);
}
if (failures.length) {
  process.stderr.write(`QA suite failed or was blocked: ${failures.join(", ")}\n`);
  process.exitCode = 1;
}
