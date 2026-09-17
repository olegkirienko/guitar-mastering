import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { AuthService } from "./auth.ts";
import { loadConfig } from "./config.ts";

describe("authentication admission boundary", () => {
  it("returns busy after rate limiting but before identifier lookup", async () => {
    const query = vi.fn(async (_sql: string, _values?: unknown[]) => ({ rows: [{ request_count: 1 }] }));
    const config = loadConfig({
      NODE_ENV: "test", APP_ENV: "test", DATABASE_URL: "postgresql://unused:unused@localhost/unused",
      PUBLIC_ORIGIN: "http://localhost:5173", DEPLOYMENT_VERSION: "test", SECURE_COOKIES: "false",
      RATE_LIMIT_HMAC_KEY: "unit-test-key-that-is-at-least-32-bytes", ARGON2_MAX_ACTIVE: "1", ARGON2_MAX_QUEUE: "0",
    });
    const auth = new AuthService({ query } as unknown as Pool, config);
    let release!: () => void;
    const occupied = auth.passwords.run(() => new Promise<void>((resolve) => { release = resolve; }));

    await expect(auth.login({ username: "Missing.User", password: "correct horse guitar" }, "203.0.113.10"))
      .rejects.toMatchObject({ name: "Error" });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("FROM users"))).toBe(false);
    expect(query.mock.calls.slice(0, 2).every(([, values]) => Buffer.isBuffer(values?.[1]))).toBe(true);
    release();
    await occupied;
  });

  it("does not mutate users or sessions when password work fails", async () => {
    const query = vi.fn(async (_sql: string, _values?: unknown[]) => ({ rows: [{ request_count: 1 }] }));
    const config = loadConfig({
      NODE_ENV: "test", APP_ENV: "test", DATABASE_URL: "postgresql://unused:unused@localhost/unused",
      PUBLIC_ORIGIN: "http://localhost:5173", DEPLOYMENT_VERSION: "test", SECURE_COOKIES: "false",
      RATE_LIMIT_HMAC_KEY: "unit-test-key-that-is-at-least-32-bytes", ARGON2_MAX_ACTIVE: "1", ARGON2_MAX_QUEUE: "0",
    });
    const failure = new Error("native KDF failed");
    const auth = new AuthService({ query } as unknown as Pool, config, {
      hash: vi.fn(async () => { throw failure; }),
      verify: vi.fn(async () => { throw failure; }),
      dummy: vi.fn(async () => { throw failure; }),
    });

    await expect(auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a")).rejects.toBe(failure);
    expect(query.mock.calls.some(([sql]) => /INSERT INTO users|INSERT INTO sessions/.test(String(sql)))).toBe(false);
  });
});
