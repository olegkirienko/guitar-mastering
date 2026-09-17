import { copyFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { runner } from "node-pg-migrate";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL;
const requirePostgres = process.env.REQUIRE_POSTGRES_TESTS === "true";
const describePostgres = databaseUrl ? describe : describe.skip;

if (requirePostgres && !databaseUrl) {
  throw new Error("TEST_DATABASE_URL is required when REQUIRE_POSTGRES_TESTS=true.");
}

async function migrate(directory = path.resolve("server/migrations")) {
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is unavailable.");
  return runner({
    databaseUrl,
    dir: directory,
    direction: "up",
    migrationsTable: "pgmigrations",
    advisoryLockMode: "wait",
    singleTransaction: true,
    verbose: false,
    log: () => undefined,
  });
}

describePostgres("PostgreSQL migrations", () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });

  beforeEach(async () => {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates every baseline table, constraint, index, and cascade", async () => {
    await migrate();
    const tables = await pool.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const indexes = await pool.query<{ indexname: string }>(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
      ORDER BY indexname
    `);
    const foreignKeys = await pool.query<{ child: string }>(`
      SELECT conrelid::regclass::text AS child
      FROM pg_constraint
      WHERE contype = 'f' AND confdeltype = 'c'
      ORDER BY child
    `);
    const constraints = await pool.query<{ constraint_name: string }>(`
      SELECT conname AS constraint_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conname
    `);
    const columns = await pool.query<{ table_name: string; column_name: string; data_type: string }>(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name <> 'pgmigrations'
      ORDER BY table_name, ordinal_position
    `);

    expect(tables.rows.map(({ table_name }) => table_name)).toEqual([
      "auth_rate_limits",
      "lesson_progress",
      "pgmigrations",
      "profiles",
      "sessions",
      "users",
    ]);
    expect(indexes.rows.map(({ indexname }) => indexname)).toEqual(expect.arrayContaining([
      "auth_rate_limits_expires_at_idx",
      "sessions_expires_at_idx",
      "sessions_user_id_idx",
      "users_username_normalized_key",
    ]));
    expect(foreignKeys.rows.map(({ child }) => child)).toEqual([
      "lesson_progress",
      "profiles",
      "sessions",
    ]);
    expect(constraints.rows.map(({ constraint_name }) => constraint_name)).toEqual([
      "auth_rate_limits_count",
      "auth_rate_limits_expiry",
      "auth_rate_limits_pkey",
      "lesson_progress_content_version",
      "lesson_progress_object",
      "lesson_progress_pkey",
      "lesson_progress_revision",
      "lesson_progress_schema_version",
      "lesson_progress_size",
      "lesson_progress_user_id_fkey",
      "pgmigrations_pkey",
      "profiles_first_name_length",
      "profiles_last_name_length",
      "profiles_pkey",
      "profiles_user_id_fkey",
      "sessions_expiry",
      "sessions_pkey",
      "sessions_token_hash_length",
      "sessions_user_id_fkey",
      "users_pkey",
      "users_updated_after_created",
      "users_username_length",
      "users_username_normalized_key",
      "users_username_normalized_length",
    ]);
    expect(columns.rows).toEqual(expect.arrayContaining([
      { table_name: "users", column_name: "id", data_type: "uuid" },
      { table_name: "sessions", column_name: "token_hash", data_type: "bytea" },
      { table_name: "lesson_progress", column_name: "progress", data_type: "jsonb" },
      { table_name: "auth_rate_limits", column_name: "window_started_at", data_type: "timestamp with time zone" },
    ]));
  });

  it("is repeat-safe and serializes concurrent runners with an advisory lock", async () => {
    const [first, second] = await Promise.all([migrate(), migrate()]);
    const third = await migrate();
    const applied = await pool.query<{ count: string }>("SELECT count(*) FROM pgmigrations");

    expect(first.length + second.length).toBe(1);
    expect(third).toHaveLength(0);
    expect(applied.rows[0]?.count).toBe("1");
  });

  it("rolls back the complete pending set when a migration fails", async () => {
    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "guitar-mastering-migrations-"));
    await copyFile(
      path.resolve("server/migrations/001_baseline.cjs"),
      path.join(temporaryDirectory, "001_baseline.cjs"),
    );
    await writeFile(
      path.join(temporaryDirectory, "002_failure.cjs"),
      "exports.up = (pgm) => pgm.sql('CREATE TABLE rollback_probe(id integer); SELECT missing_column FROM rollback_probe;'); exports.down = false;\n",
    );

    await expect(migrate(temporaryDirectory)).rejects.toThrow();
    const result = await pool.query<{ relation: string | null }>(
      "SELECT to_regclass('public.users')::text AS relation",
    );
    expect(result.rows[0]?.relation).toBeNull();
  });
});
