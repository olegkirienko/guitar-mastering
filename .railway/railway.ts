import { defineRailway, preserve, project, service } from "railway/iac";

// This repository owns only the existing production web service. The database,
// volume, and PITR bucket are managed outside this named partial.
export const partial = "guitar-mastering-web-production";

export default defineRailway((ctx) => {
  if (
    ctx.projectId !== "112644ba-cb91-443b-ae4b-73a0d6f74b69" ||
    ctx.environmentId !== "994fd373-dd1d-4073-8b7f-116e77d898fa"
  ) {
    throw new Error("Railway IaC is restricted to the existing production environment");
  }

  const web = service("guitar-mastering-web-production", {
    build: {
      builder: "RAILPACK",
      buildEnvironment: "V3",
      buildCommand: "pnpm install --frozen-lockfile && pnpm build",
    },
    deploy: {
      preDeployCommand: ["pnpm db:migrate"],
      startCommand: "pnpm start",
      healthcheckPath: "/api/v1/readiness",
      healthcheckTimeout: 120,
      restartPolicyMaxRetries: 3,
    },
    env: {
      APP_ENV: preserve(),
      ARGON2_MAX_ACTIVE: preserve(),
      ARGON2_MAX_QUEUE: preserve(),
      DATABASE_URL: preserve(),
      // Retain the static fallback until a GitHub-triggered deployment proves
      // Railway's built-in RAILWAY_GIT_COMMIT_SHA metadata end to end.
      DEPLOYMENT_VERSION: preserve(),
      NODE_ENV: preserve(),
      PG_CONNECTION_TIMEOUT_MS: preserve(),
      PG_POOL_MAX: preserve(),
      PG_STATEMENT_TIMEOUT_MS: preserve(),
      PG_TRANSACTION_TIMEOUT_MS: preserve(),
      PUBLIC_ORIGIN: preserve(),
      RATE_LIMIT_HMAC_KEY: preserve(),
      SECURE_COOKIES: preserve(),
      SHUTDOWN_TIMEOUT_MS: preserve(),
      TRUSTED_PROXY_HOPS: preserve(),
    },
  });

  return project("guitar-mastering", { resources: [web] });
});
