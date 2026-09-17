import type { Server } from "node:http";
import type { ApplicationPool } from "./database.ts";
import { applicationLogger } from "./logger.ts";
import type { ApplicationLogger } from "./logger.ts";

interface ShutdownOptions {
  server: Server;
  pool: ApplicationPool;
  timeoutMs: number;
  logger?: ApplicationLogger;
  drain?: () => Promise<void>;
}

export function createShutdown({ server, pool, timeoutMs, logger = applicationLogger, drain }: ShutdownOptions) {
  let shutdown: Promise<void> | undefined;

  return (signal: NodeJS.Signals): Promise<void> => {
    shutdown ??= (async () => {
      logger({ event: "shutdown_started", signal });
      const timeout = setTimeout(() => server.closeAllConnections(), timeoutMs);
      timeout.unref();
      const draining = drain?.();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeIdleConnections();
      });
      clearTimeout(timeout);
      await draining;
      await pool.end();
      logger({ event: "shutdown_complete", signal });
    })();
    return shutdown;
  };
}
