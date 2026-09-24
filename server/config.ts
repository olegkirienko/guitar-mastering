export type AppEnvironment = "local" | "test" | "preview" | "production";

export interface ServerConfig {
  port: number;
  databaseUrl: string;
  nodeEnv: "development" | "test" | "production";
  appEnv: AppEnvironment;
  publicOrigin: string;
  deploymentVersion: string;
  secureCookies: boolean;
  rateLimitHmacKey: string;
  poolMax: number;
  connectionTimeoutMs: number;
  statementTimeoutMs: number;
  transactionTimeoutMs: number;
  argon2MaxActive: number;
  argon2MaxQueue: number;
  trustedProxyHops: number;
  shutdownTimeoutMs: number;
}

type Environment = Record<string, string | undefined>;

function required(environment: Environment, key: string): string {
  const value = environment[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function deploymentVersion(environment: Environment): string {
  const railwayGitCommitSha = environment.RAILWAY_GIT_COMMIT_SHA;
  if (railwayGitCommitSha) {
    if (!/^[0-9a-f]{40}$/i.test(railwayGitCommitSha)) {
      throw new Error("RAILWAY_GIT_COMMIT_SHA must be a full 40-character Git commit SHA.");
    }
    return railwayGitCommitSha;
  }
  return required(environment, "DEPLOYMENT_VERSION");
}

function integer(
  environment: Environment,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = environment[key];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${key} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

function boolean(environment: Environment, key: string): boolean {
  const value = required(environment, key);
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${key} must be either true or false.`);
}

function oneOf<const T extends readonly string[]>(
  environment: Environment,
  key: string,
  values: T,
): T[number] {
  const value = required(environment, key);
  if (!values.includes(value)) {
    throw new Error(`${key} must be one of: ${values.join(", ")}.`);
  }
  return value as T[number];
}

export function loadConfig(environment: Environment = process.env): ServerConfig {
  const nodeEnv = oneOf(environment, "NODE_ENV", ["development", "test", "production"] as const);
  const appEnv = oneOf(environment, "APP_ENV", ["local", "test", "preview", "production"] as const);
  const publicOrigin = required(environment, "PUBLIC_ORIGIN");
  const secureCookies = boolean(environment, "SECURE_COOKIES");
  if ((appEnv === "preview" || appEnv === "production") && !environment.TRUSTED_PROXY_HOPS) {
    throw new Error("TRUSTED_PROXY_HOPS is required for deployed environments after ingress verification.");
  }

  let origin: URL;
  try {
    origin = new URL(publicOrigin);
  } catch {
    throw new Error("PUBLIC_ORIGIN must be an absolute URL.");
  }

  if (origin.origin !== publicOrigin || origin.username || origin.password) {
    throw new Error("PUBLIC_ORIGIN must contain only an origin with no credentials or path.");
  }
  if (appEnv === "production" && (origin.protocol !== "https:" || !secureCookies)) {
    throw new Error("Production requires an HTTPS PUBLIC_ORIGIN and secure cookies.");
  }

  const rateLimitHmacKey = required(environment, "RATE_LIMIT_HMAC_KEY");
  if (Buffer.byteLength(rateLimitHmacKey, "utf8") < 32) {
    throw new Error("RATE_LIMIT_HMAC_KEY must contain at least 32 UTF-8 bytes.");
  }

  const databaseUrl = required(environment, "DATABASE_URL");
  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    if (parsedDatabaseUrl.protocol !== "postgres:" && parsedDatabaseUrl.protocol !== "postgresql:") {
      throw new Error();
    }
  } catch {
    throw new Error("DATABASE_URL must be an absolute PostgreSQL connection URL.");
  }

  return {
    port: integer(environment, "PORT", 3000, 1, 65_535),
    databaseUrl,
    nodeEnv,
    appEnv,
    publicOrigin,
    deploymentVersion: deploymentVersion(environment),
    secureCookies,
    rateLimitHmacKey,
    poolMax: integer(environment, "PG_POOL_MAX", 10, 1, 50),
    connectionTimeoutMs: integer(environment, "PG_CONNECTION_TIMEOUT_MS", 3_000, 100, 30_000),
    statementTimeoutMs: integer(environment, "PG_STATEMENT_TIMEOUT_MS", 5_000, 100, 60_000),
    transactionTimeoutMs: integer(environment, "PG_TRANSACTION_TIMEOUT_MS", 10_000, 100, 120_000),
    argon2MaxActive: integer(environment, "ARGON2_MAX_ACTIVE", 2, 1, 16),
    argon2MaxQueue: integer(environment, "ARGON2_MAX_QUEUE", 8, 0, 100),
    trustedProxyHops: integer(environment, "TRUSTED_PROXY_HOPS", 0, 0, 2),
    shutdownTimeoutMs: integer(environment, "SHUTDOWN_TIMEOUT_MS", 10_000, 1_000, 60_000),
  };
}
