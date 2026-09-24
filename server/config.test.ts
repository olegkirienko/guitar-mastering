import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.ts";

const validEnvironment = {
  NODE_ENV: "production",
  APP_ENV: "production",
  PORT: "8080",
  DATABASE_URL: "postgresql://user:password@postgres.internal:5432/app",
  PUBLIC_ORIGIN: "https://guitar.example",
  DEPLOYMENT_VERSION: "commit-sha",
  SECURE_COOKIES: "true",
  RATE_LIMIT_HMAC_KEY: "a-development-key-with-at-least-32-bytes",
  TRUSTED_PROXY_HOPS: "1",
};

describe("server configuration", () => {
  it("loads required values and bounded defaults", () => {
    expect(loadConfig(validEnvironment)).toMatchObject({
      port: 8080,
      appEnv: "production",
      deploymentVersion: "commit-sha",
      secureCookies: true,
      poolMax: 10,
      statementTimeoutMs: 5_000,
      transactionTimeoutMs: 10_000,
      argon2MaxActive: 2,
      argon2MaxQueue: 8,
    });
  });

  it("prefers the full Railway Git commit SHA for deployment logs", () => {
    const railwayGitCommitSha = "3e933bdb80eff22cb4edd5ab132dd979dea901cb";

    expect(loadConfig({ ...validEnvironment, RAILWAY_GIT_COMMIT_SHA: railwayGitCommitSha }))
      .toMatchObject({ deploymentVersion: railwayGitCommitSha });
  });

  it("keeps DEPLOYMENT_VERSION as the non-Git deployment fallback", () => {
    expect(loadConfig({ ...validEnvironment, RAILWAY_GIT_COMMIT_SHA: undefined }))
      .toMatchObject({ deploymentVersion: "commit-sha" });
  });

  it("rejects malformed Railway Git commit metadata instead of logging it", () => {
    expect(() => loadConfig({ ...validEnvironment, RAILWAY_GIT_COMMIT_SHA: "short-sha" }))
      .toThrow("RAILWAY_GIT_COMMIT_SHA must be a full 40-character Git commit SHA.");
  });

  it("requires the static fallback when Railway Git metadata is absent", () => {
    expect(() => loadConfig({
      ...validEnvironment,
      RAILWAY_GIT_COMMIT_SHA: undefined,
      DEPLOYMENT_VERSION: undefined,
    })).toThrow("Missing required environment variable: DEPLOYMENT_VERSION");
  });

  it("fails closed when deployed configuration is incomplete", () => {
    expect(() => loadConfig({ ...validEnvironment, DATABASE_URL: undefined }))
      .toThrow("Missing required environment variable: DATABASE_URL");
  });

  it("rejects non-PostgreSQL database URLs", () => {
    expect(() => loadConfig({ ...validEnvironment, DATABASE_URL: "https://database.example" }))
      .toThrow("DATABASE_URL must be an absolute PostgreSQL connection URL.");
  });

  it.each([
    { PUBLIC_ORIGIN: "http://guitar.example" },
    { SECURE_COOKIES: "false" },
  ])("requires HTTPS and secure cookies in production", (override) => {
    expect(() => loadConfig({ ...validEnvironment, ...override }))
      .toThrow("Production requires an HTTPS PUBLIC_ORIGIN and secure cookies.");
  });

  it("rejects malformed and secret-bearing public origins", () => {
    expect(() => loadConfig({ ...validEnvironment, PUBLIC_ORIGIN: "https://user:pass@guitar.example" }))
      .toThrow("PUBLIC_ORIGIN must contain only an origin");
  });

  it("rejects out-of-policy resource bounds", () => {
    expect(() => loadConfig({ ...validEnvironment, PG_POOL_MAX: "500" }))
      .toThrow("PG_POOL_MAX must be an integer between 1 and 50");
  });

  it("requires an explicit trusted ingress boundary when deployed", () => {
    expect(() => loadConfig({ ...validEnvironment, APP_ENV: "preview", TRUSTED_PROXY_HOPS: undefined }))
      .toThrow("TRUSTED_PROXY_HOPS is required for deployed environments");
  });
});
