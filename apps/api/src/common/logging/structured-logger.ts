import { ConsoleLogger, Injectable, type LogLevel } from "@nestjs/common";

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  setLogLevels(levels: LogLevel[]) { super.setLogLevels(levels); }
  log(message: unknown, context?: string) { this.write("info", message, context); }
  warn(message: unknown, context?: string) { this.write("warn", message, context); }
  error(message: unknown, stack?: string, context?: string) { this.write("error", message, context, stack); }
  debug(message: unknown, context?: string) { this.write("debug", message, context); }
  verbose(message: unknown, context?: string) { this.write("verbose", message, context); }

  private write(level: string, message: unknown, context?: string, stack?: string) {
    const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, context, message: typeof message === "string" ? message : JSON.stringify(message), ...(stack ? { stack } : {}) });
    (level === "error" ? process.stderr : process.stdout).write(`${entry}\n`);
  }
}
