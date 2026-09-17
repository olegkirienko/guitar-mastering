import { Pool } from "pg";
import { runner } from "node-pg-migrate";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuthService } from "./auth.ts";
import { loadConfig } from "./config.ts";
import { ProgressService } from "./progress.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const requirePostgres = process.env.REQUIRE_POSTGRES_TESTS === "true";
const describePostgres = databaseUrl ? describe : describe.skip;
if (requirePostgres && !databaseUrl) throw new Error("TEST_DATABASE_URL is required when REQUIRE_POSTGRES_TESTS=true.");

describePostgres("progress PostgreSQL acceptance", () => {
  const testDatabaseUrl = databaseUrl ?? "postgresql://unused:unused@127.0.0.1:1/unused";
  const pool = new Pool({ connectionString: testDatabaseUrl, max: 10 });
  const config = loadConfig({
    NODE_ENV: "test", APP_ENV: "test", DATABASE_URL: testDatabaseUrl,
    PUBLIC_ORIGIN: "http://localhost:5173", DEPLOYMENT_VERSION: "test", SECURE_COOKIES: "false",
    RATE_LIMIT_HMAC_KEY: "integration-test-key-at-least-32-bytes", ARGON2_MAX_ACTIVE: "2", ARGON2_MAX_QUEUE: "20",
  });
  const passwordOperations = { hash: async () => "test-hash", verify: async () => true, dummy: async () => undefined };
  const payload = (baseRevision: number, currentStepId = "intro") => ({
    schemaVersion: 1, contentVersion: 1, baseRevision,
    progress: { currentStepId, completedStepIds: currentStepId === "intro" ? [] : ["intro"], checkpointPassed: false, completedAt: null },
  });

  beforeAll(async () => {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await runner({ databaseUrl: databaseUrl!, dir: "server/migrations", direction: "up", migrationsTable: "pgmigrations", advisoryLockMode: "wait", singleTransaction: true, verbose: false, log: () => undefined });
  });
  beforeEach(async () => pool.query("TRUNCATE users, auth_rate_limits CASCADE"));
  afterAll(async () => pool.end());

  it("isolates users and lists, reads, inserts, and updates versioned progress", async () => {
    const auth = new AuthService(pool, config, passwordOperations);
    const first = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const second = await auth.register({ username: "Player.Two", password: "correct horse guitar" }, "network-b");
    const progress = new ProgressService(pool, auth);
    const inserted = await progress.put(first.token, "stage-01-lesson-01", payload(0));
    expect(inserted.revision).toBe(1);
    await expect(progress.get(first.token, "stage-01-lesson-01")).resolves.toEqual(inserted);
    await expect(progress.list(second.token)).resolves.toEqual([]);
    const updated = await progress.put(first.token, "stage-01-lesson-01", payload(1, "string"));
    expect(updated).toMatchObject({ revision: 2, progress: { currentStepId: "string" } });
    await expect(progress.list(first.token)).resolves.toEqual([updated]);
  });

  it("allows one optimistic writer and returns durable current data to the loser", async () => {
    const auth = new AuthService(pool, config, passwordOperations);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const progress = new ProgressService(pool, auth);
    await progress.put(registered.token, "stage-01-lesson-01", payload(0));
    const results = await Promise.allSettled([
      progress.put(registered.token, "stage-01-lesson-01", payload(1, "string")),
      progress.put(registered.token, "stage-01-lesson-01", payload(1, "air")),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(({ status }) => status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ status: 409, code: "REVISION_CONFLICT", current: { revision: 2 } });
  });

  it("requires authentication and never exposes another account's progress", async () => {
    const auth = new AuthService(pool, config, passwordOperations);
    const first = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const second = await auth.register({ username: "Player.Two", password: "correct horse guitar" }, "network-b");
    const progress = new ProgressService(pool, auth);
    await progress.put(first.token, "stage-01-lesson-01", payload(0));
    await expect(progress.get(undefined, "stage-01-lesson-01")).rejects.toMatchObject({ status: 401, code: "UNAUTHENTICATED" });
    await expect(progress.get(second.token, "stage-01-lesson-01")).rejects.toMatchObject({ status: 404, code: "PROGRESS_NOT_FOUND" });
  });

  it("rejects catalog and value boundaries without changing durable progress", async () => {
    const auth = new AuthService(pool, config, passwordOperations);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const progress = new ProgressService(pool, auth);
    const original = await progress.put(registered.token, "stage-01-lesson-01", payload(0, "string"));
    const invalidPayloads = [
      { ...payload(1, "string"), schemaVersion: 2 },
      { ...payload(1, "string"), contentVersion: 2 },
      { ...payload(1, "string"), progress: { ...payload(1, "string").progress, currentStepId: "future" } },
      { ...payload(1, "string"), progress: { ...payload(1, "string").progress, completedStepIds: ["intro", "future"] } },
      { ...payload(1, "string"), progress: { ...payload(1, "string").progress, completedStepIds: ["intro", "intro"] } },
      { ...payload(1, "string"), progress: { ...payload(1, "string").progress, completedAt: "not-a-date" } },
    ];

    await expect(progress.put(registered.token, "unknown-lesson", payload(0))).rejects.toMatchObject({
      status: 404,
      code: "UNKNOWN_LESSON",
    });
    for (const invalid of invalidPayloads) {
      await expect(progress.put(registered.token, "stage-01-lesson-01", invalid)).rejects.toMatchObject({ status: 422 });
    }

    await expect(progress.get(registered.token, "stage-01-lesson-01")).resolves.toEqual(original);
    await expect(pool.query<{ count: number }>("SELECT count(*)::int AS count FROM lesson_progress")).resolves.toMatchObject({
      rows: [{ count: 1 }],
    });
  });

  it("enforces the PostgreSQL progress size constraint without replacing valid data", async () => {
    const auth = new AuthService(pool, config, passwordOperations);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const progress = new ProgressService(pool, auth);
    const original = await progress.put(registered.token, "stage-01-lesson-01", payload(0));
    const oversized = JSON.stringify({ padding: "x".repeat(13_000) });

    await expect(pool.query(
      "UPDATE lesson_progress SET progress = $1::jsonb, revision = revision + 1 WHERE user_id = $2 AND lesson_id = $3",
      [oversized, registered.user.id, "stage-01-lesson-01"],
    )).rejects.toMatchObject({ code: "23514", constraint: "lesson_progress_size" });

    await expect(progress.get(registered.token, "stage-01-lesson-01")).resolves.toEqual(original);
  });
});
