import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.ts";
import { assertNoLegacyPasswordHashes, AuthService } from "./auth.ts";
import { loadConfig } from "./config.ts";
import { createPool } from "./database.ts";
import { applicationLogger } from "./logger.ts";
import { createShutdown } from "./shutdown.ts";
import { assertPasswordCapability } from "./password.ts";
import { ProgressService } from "./progress.ts";

const config = loadConfig();
const pool = createPool(config);
await assertPasswordCapability();
await assertNoLegacyPasswordHashes(pool);
const auth = new AuthService(pool, config);
const progress = new ProgressService(pool, auth);
const distDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const app = createApp({
  pool,
  distDirectory,
  deploymentVersion: config.deploymentVersion,
  logger: applicationLogger,
  auth,
  publicOrigin: config.publicOrigin,
  secureCookies: config.secureCookies,
  trustedProxyHops: config.trustedProxyHops,
  progress,
});
const server = app.listen(config.port, "0.0.0.0", () => {
  applicationLogger({
    event: "server_started",
    port: config.port,
    appEnv: config.appEnv,
    deploymentVersion: config.deploymentVersion,
  });
});
const shutdown = createShutdown({
  server,
  pool,
  timeoutMs: config.shutdownTimeoutMs,
  logger: applicationLogger,
  drain: () => auth.passwords.closeAndDrain(),
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    void shutdown(signal).then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}
