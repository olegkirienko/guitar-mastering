import { Pool } from "pg";
import { runner } from "node-pg-migrate";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuthService } from "./auth.ts";
import { loadConfig } from "./config.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const requirePostgres = process.env.REQUIRE_POSTGRES_TESTS === "true";
const describePostgres = databaseUrl ? describe : describe.skip;
if (requirePostgres && !databaseUrl) throw new Error("TEST_DATABASE_URL is required when REQUIRE_POSTGRES_TESTS=true.");

describePostgres("authentication PostgreSQL acceptance", () => {
  const testDatabaseUrl = databaseUrl ?? "postgresql://unused:unused@127.0.0.1:1/unused";
  const pool = new Pool({ connectionString: testDatabaseUrl, max: 20 });
  const config = loadConfig({
    NODE_ENV: "test", APP_ENV: "test", DATABASE_URL: testDatabaseUrl,
    PUBLIC_ORIGIN: "http://localhost:5173", DEPLOYMENT_VERSION: "test", SECURE_COOKIES: "false",
    RATE_LIMIT_HMAC_KEY: "integration-test-key-at-least-32-bytes", ARGON2_MAX_ACTIVE: "2", ARGON2_MAX_QUEUE: "20",
  });

  beforeAll(async () => {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await runner({ databaseUrl: databaseUrl!, dir: "server/migrations", direction: "up", migrationsTable: "pgmigrations", advisoryLockMode: "wait", singleTransaction: true, verbose: false, log: () => undefined });
  });
  beforeEach(async () => pool.query("TRUNCATE users, auth_rate_limits CASCADE"));
  afterAll(async () => pool.end());

  it("allows only one concurrent canonical username registration", async () => {
    const auth = new AuthService(pool, config);
    const results = await Promise.allSettled([
      auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a"),
      auth.register({ username: "player.one", password: "correct horse guitar" }, "network-b"),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(({ status }) => status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ status: 409, code: "USERNAME_UNAVAILABLE" });
    await expect(pool.query("SELECT count(*)::int AS count FROM users")).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it("keeps failures non-enumerating and sessions restart-safe, revocable, and digest-only", async () => {
    const first = new AuthService(pool, config);
    const registered = await first.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const restarted = new AuthService(pool, config);
    await expect(restarted.session(registered.token)).resolves.toEqual(registered.user);
    for (const username of ["Player.One", "Missing.User"]) {
      await expect(restarted.login({ username, password: "wrong horse guitar" }, "network-a"))
        .rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    }
    const stored = await pool.query<{ token_hash: Buffer }>("SELECT token_hash FROM sessions");
    expect(stored.rows[0]?.token_hash.toString("utf8")).not.toContain(registered.token);
    await restarted.logout(registered.token);
    await restarted.logout(registered.token);
    await expect(restarted.session(registered.token)).resolves.toBeNull();
  });

  it("rotates an incoming session and treats expired sessions as unauthenticated", async () => {
    const auth = new AuthService(pool, config);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const loggedIn = await auth.login(
      { username: "Player.One", password: "correct horse guitar" }, "network-a", registered.token,
    );
    await expect(auth.session(registered.token)).resolves.toBeNull();
    await expect(auth.session(loggedIn.token)).resolves.toEqual(registered.user);
    await pool.query("UPDATE sessions SET created_at = now() - interval '2 seconds', expires_at = now() - interval '1 second'");
    await expect(auth.session(loggedIn.token)).resolves.toBeNull();
  });

  it("serializes concurrent cap changes and never commits over ten active sessions", async () => {
    const auth = new AuthService(pool, config);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    await Promise.all(Array.from({ length: 10 }, () => auth.login(
      { username: "Player.One", password: "correct horse guitar" }, "network-a",
    )));
    const count = await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM sessions WHERE user_id = $1 AND expires_at > now()", [registered.user.id]);
    expect(count.rows[0]?.count).toBe(10);
  });

  it("deletes the account and all owned rows only after password confirmation", async () => {
    const auth = new AuthService(pool, config);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    await pool.query(`INSERT INTO lesson_progress(user_id, lesson_id, schema_version, content_version, progress, revision, updated_at)
      VALUES ($1, 'stage-01-lesson-01', 1, 1, '{}', 1, now())`, [registered.user.id]);
    await expect(auth.deleteAccount(registered.token, { password: "wrong horse guitar" })).rejects.toMatchObject({ status: 401 });
    await auth.deleteAccount(registered.token, { password: "correct horse guitar" });
    await expect(pool.query("SELECT count(*)::int AS count FROM users")).resolves.toMatchObject({ rows: [{ count: 0 }] });
    await expect(pool.query("SELECT count(*)::int AS count FROM sessions")).resolves.toMatchObject({ rows: [{ count: 0 }] });
    await expect(pool.query("SELECT count(*)::int AS count FROM profiles")).resolves.toMatchObject({ rows: [{ count: 0 }] });
    await expect(pool.query("SELECT count(*)::int AS count FROM lesson_progress")).resolves.toMatchObject({ rows: [{ count: 0 }] });
  });

  it("persists trimmed optional profile fields and rejects unknown avatars", async () => {
    const auth = new AuthService(pool, config);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    await expect(auth.updateProfile(undefined, { firstName: "Леся" })).rejects.toMatchObject({ status: 401, code: "UNAUTHENTICATED" });
    await expect(auth.updateProfile(registered.token, { avatarId: "remote-url" })).rejects.toMatchObject({
      status: 422, code: "INVALID_FIELDS", fields: { avatarId: "Choose an available avatar." },
    });
    await expect(auth.updateProfile(registered.token, { firstName: "  Леся  ", lastName: " Українка ", avatarId: "forest" }))
      .resolves.toEqual({ firstName: "Леся", lastName: "Українка", avatarId: "forest" });
    await expect(auth.session(registered.token)).resolves.toMatchObject({
      profile: { firstName: "Леся", lastName: "Українка", avatarId: "forest" },
    });
    await expect(auth.updateProfile(registered.token, { firstName: null })).resolves.toEqual({
      firstName: null, lastName: "Українка", avatarId: "forest",
    });
  });

  it("preserves disjoint concurrent profile subset updates", async () => {
    const auth = new AuthService(pool, config);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");

    await Promise.all([
      auth.updateProfile(registered.token, { firstName: "Леся" }),
      auth.updateProfile(registered.token, { avatarId: "forest" }),
    ]);

    await expect(auth.session(registered.token)).resolves.toMatchObject({
      profile: { firstName: "Леся", lastName: null, avatarId: "forest" },
    });
  });

  it("persists atomic limiter thresholds across service restarts and bounds expired-row cleanup", async () => {
    const first = new AuthService(pool, config);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(first.login({ username: "Missing.User", password: "wrong horse guitar" }, "network-a"))
        .rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    }
    const restarted = new AuthService(pool, config);
    for (let attempt = 5; attempt < 10; attempt += 1) {
      await expect(restarted.login({ username: "Missing.User", password: "wrong horse guitar" }, "network-a"))
        .rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    }
    await expect(restarted.login({ username: "Missing.User", password: "wrong horse guitar" }, "network-a"))
      .rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
    const dimensions = await pool.query<{ action: string; key_hash: Buffer; request_count: number }>(
      "SELECT action, key_hash, request_count FROM auth_rate_limits WHERE expires_at > now() ORDER BY action",
    );
    expect(dimensions.rows.map(({ action, request_count }) => [action, request_count])).toEqual([
      ["login:network", 10], ["login:username", 11],
    ]);
    expect(dimensions.rows.every(({ key_hash }) => key_hash.length === 32)).toBe(true);

    await pool.query(`INSERT INTO auth_rate_limits(action, key_hash, window_started_at, request_count, expires_at)
      SELECT 'expired', decode(md5(value::text), 'hex'), now() - interval '5 minutes', 1, now() - interval '1 minute'
      FROM generate_series(1, 150) AS value`);
    await expect(restarted.login({ username: "Another.User", password: "wrong horse guitar" }, "network-b"))
      .rejects.toMatchObject({ status: 401 });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const expired = await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM auth_rate_limits WHERE expires_at < now()");
      if ((expired.rows[0]?.count ?? 150) <= 50) break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const expired = await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM auth_rate_limits WHERE expires_at < now()");
    expect(expired.rows[0]?.count).toBeLessThanOrEqual(50);
  }, 20_000);

  it("rolls back registration when a PostgreSQL statement fails", async () => {
    await pool.query(`CREATE OR REPLACE FUNCTION reject_profile_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'injected statement failure'; END; $$`);
    await pool.query("CREATE TRIGGER reject_profile_insert BEFORE INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION reject_profile_insert()");
    try {
      const auth = new AuthService(pool, config);
      await expect(auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a"))
        .rejects.toThrow("injected statement failure");
      await expect(pool.query("SELECT count(*)::int AS count FROM users")).resolves.toMatchObject({ rows: [{ count: 0 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM profiles")).resolves.toMatchObject({ rows: [{ count: 0 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM sessions")).resolves.toMatchObject({ rows: [{ count: 0 }] });
    } finally {
      await pool.query("DROP TRIGGER IF EXISTS reject_profile_insert ON profiles");
      await pool.query("DROP FUNCTION IF EXISTS reject_profile_insert()");
    }
  });

  it("creates no session or account mutation when verification work fails", async () => {
    const auth = new AuthService(pool, config);
    const registered = await auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a");
    const failure = new Error("injected native KDF failure");
    const failing = new AuthService(pool, config, {
      hash: async () => { throw failure; },
      verify: async () => { throw failure; },
      dummy: async () => { throw failure; },
    });
    await expect(failing.login({ username: "Player.One", password: "correct horse guitar" }, "network-a"))
      .rejects.toBe(failure);
    await expect(failing.deleteAccount(registered.token, { password: "correct horse guitar" })).rejects.toBe(failure);
    await expect(pool.query("SELECT count(*)::int AS count FROM users")).resolves.toMatchObject({ rows: [{ count: 1 }] });
    await expect(pool.query("SELECT count(*)::int AS count FROM sessions")).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it("creates no rows when the PostgreSQL pool cannot provide a connection", async () => {
    const constrained = new Pool({ connectionString: testDatabaseUrl, max: 1, connectionTimeoutMillis: 100 });
    const blocker = await constrained.connect();
    try {
      const auth = new AuthService(constrained, config);
      await expect(auth.register({ username: "Player.One", password: "correct horse guitar" }, "network-a"))
        .rejects.toThrow(/timeout exceeded when trying to connect/);
      await expect(pool.query("SELECT count(*)::int AS count FROM users")).resolves.toMatchObject({ rows: [{ count: 0 }] });
      await expect(pool.query("SELECT count(*)::int AS count FROM sessions")).resolves.toMatchObject({ rows: [{ count: 0 }] });
    } finally {
      blocker.release();
      await constrained.end();
    }
  });
});
