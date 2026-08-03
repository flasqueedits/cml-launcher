import { app } from "electron";
import log from "electron-log/main";
import path, { join } from "node:path";
import { mkdirSync } from "node:fs";

log.initialize();

log.transports.file.level = "info";
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.resolvePathFn = () => {
  const dir = app.getPath("userData");
  mkdirSync(dir, { recursive: true });
  return join(dir, "logs", "main.log");
};

class Logger {
  private readonly sinks: ((line: string, level: string) => void)[] = [];

  useSink(fn: (line: string, level: string) => void) {
    this.sinks.push(fn);
    return () => {
      const i = this.sinks.indexOf(fn);
      if (i >= 0) this.sinks.splice(i, 1);
    };
  }

  info(msg: string) {
    log.info(msg);
    this.sinks.forEach((s) => s(msg, "info"));
  }

  warn(msg: string) {
    log.warn(msg);
    this.sinks.forEach((s) => s(msg, "warn"));
  }

  error(msg: string) {
    log.error(msg);
    this.sinks.forEach((s) => s(msg, "error"));
  }

  gameLine(line: string) {
    this.sinks.forEach((s) => s(line, "game"));
  }
}

export const logger = new Logger();
export function getResourcesDir() {
  return join(app.getPath("userData"), "minecraft");
}
export const isDev = !!process.env.VITE_DEV_SERVER_URL;
export { path };