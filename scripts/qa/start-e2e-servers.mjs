import { spawn } from "node:child_process";
const webPort = process.env.E2E_WEB_PORT ?? "3100";
const command = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";
const children = [
  spawn(command, ["/d", "/s", "/c", "pnpm --filter @homeschool/api dev"], { cwd: process.cwd(), env: process.env, stdio: "ignore", shell: false }),
  spawn(command, ["/d", "/s", "/c", "pnpm --filter @homeschool/web dev:e2e"], { cwd: process.cwd(), env: { ...process.env, PORT: webPort }, stdio: "ignore", shell: false })
];

for (const child of children) {
  child.on("error", (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (code && process.exitCode == null) process.exitCode = code;
  });
}

function stop() {
  for (const child of children) child.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await new Promise(() => {});
