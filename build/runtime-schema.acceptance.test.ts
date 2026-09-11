import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..");

interface D1Result {
  results: Array<Record<string, unknown>>;
  success: boolean;
}

interface TargetBuild {
  html: string;
  javascript: string;
}

let temporaryRoot: string;
const builds = new Map<"pages" | "worker", TargetBuild>();
let schemaResults: D1Result[];

async function runPnpm(
  args: string[],
  environment: Record<string, string> = {},
): Promise<string> {
  const { stdout } = await execFileAsync("pnpm", args, {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      CI: "true",
      XDG_CONFIG_HOME: path.join(temporaryRoot, "xdg-config"),
      ...environment,
    },
    maxBuffer: 10 * 1024 * 1024,
  });

  return stdout;
}

async function buildTarget(target: "pages" | "worker"): Promise<TargetBuild> {
  const outputDirectory = path.join(temporaryRoot, `dist-${target}`);

  await runPnpm(
    [
      "exec",
      "vite",
      "build",
      "test-fixtures/deployment-gate",
      "--config",
      "vite.config.ts",
      "--outDir",
      outputDirectory,
      "--emptyOutDir",
    ],
    { VITE_DEPLOY_TARGET: target },
  );

  const assetDirectory = path.join(outputDirectory, "assets");
  const javascriptFile = (await readdir(assetDirectory)).find((file) => file.endsWith(".js"));

  if (!javascriptFile) {
    throw new Error(`The ${target} acceptance build did not emit JavaScript.`);
  }

  return {
    html: await readFile(path.join(outputDirectory, "index.html"), "utf8"),
    javascript: await readFile(path.join(assetDirectory, javascriptFile), "utf8"),
  };
}

beforeAll(async () => {
  temporaryRoot = await mkdtemp(path.join(tmpdir(), "guitar-mastering-runtime-schema-"));

  builds.set("pages", await buildTarget("pages"));
  builds.set("worker", await buildTarget("worker"));

  const d1Persistence = path.join(temporaryRoot, "d1");
  await runPnpm([
    "exec",
    "wrangler",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--persist-to",
    d1Persistence,
  ]);

  const schemaOutput = await runPnpm([
    "exec",
    "wrangler",
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    d1Persistence,
    "--command",
    [
      "SELECT name, sql FROM sqlite_master WHERE type = 'table'",
      "AND name IN ('users', 'profiles', 'sessions', 'lesson_progress') ORDER BY name;",
      "SELECT name, tbl_name FROM sqlite_master WHERE type = 'index'",
      "AND sql IS NOT NULL ORDER BY name;",
      "PRAGMA foreign_key_list(profiles);",
      "PRAGMA foreign_key_list(sessions);",
      "PRAGMA foreign_key_list(lesson_progress);",
    ].join(" "),
    "--json",
  ]);

  schemaResults = JSON.parse(schemaOutput) as D1Result[];
}, 120_000);

afterAll(async () => {
  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

describe("deployment target acceptance", () => {
  it("builds Pages with its repository base and the real client gate disabled", () => {
    const build = builds.get("pages");

    expect(build?.html).toContain('src="/guitar-mastering/assets/');
    expect(build?.javascript).toContain("__GM_TARGET_PAGES__");
    expect(build?.javascript).toContain("__GM_CAPABILITIES_DISABLED__");
    expect(build?.javascript).not.toContain("__GM_CAPABILITIES_ENABLED__");
  });

  it("builds Worker preview at the root with the real client gate enabled", () => {
    const build = builds.get("worker");

    expect(build?.html).toContain('src="/assets/');
    expect(build?.html).not.toContain("/guitar-mastering/assets/");
    expect(build?.javascript).toContain("__GM_TARGET_WORKER__");
    expect(build?.javascript).toContain("__GM_CAPABILITIES_ENABLED__");
    expect(build?.javascript).not.toContain("__GM_CAPABILITIES_DISABLED__");
  });
});

describe("fresh local D1 migration acceptance", () => {
  it("creates every required strict table and constraint", () => {
    const tables = new Map(
      schemaResults[0].results.map((row) => [String(row.name), String(row.sql)]),
    );

    expect([...tables.keys()]).toEqual(["lesson_progress", "profiles", "sessions", "users"]);

    for (const sql of tables.values()) {
      expect(sql).toMatch(/\) STRICT$/);
    }

    expect(tables.get("users")).toContain("username_normalized TEXT NOT NULL UNIQUE");
    expect(tables.get("users")).toContain("CHECK (updated_at >= created_at)");
    expect(tables.get("profiles")).toContain("first_name TEXT");
    expect(tables.get("sessions")).toContain("CHECK (length(token_hash) = 64)");
    expect(tables.get("sessions")).toContain("CHECK (expires_at > created_at)");
    expect(tables.get("lesson_progress")).toContain("PRIMARY KEY (user_id, lesson_id)");
    expect(tables.get("lesson_progress")).toContain(
      "CHECK (length(CAST(progress_json AS BLOB)) <= 12288)",
    );
    expect(tables.get("lesson_progress")).toContain("CHECK (revision >= 1)");
  });

  it("creates the required supporting indexes", () => {
    expect(schemaResults[1].results).toEqual([
      { name: "lesson_progress_updated_at_idx", tbl_name: "lesson_progress" },
      { name: "sessions_expires_at_idx", tbl_name: "sessions" },
      { name: "sessions_user_id_idx", tbl_name: "sessions" },
    ]);
  });

  it.each([
    ["profiles", 2],
    ["sessions", 3],
    ["lesson_progress", 4],
  ])("enforces cascade ownership for %s", (_table, resultIndex) => {
    expect(schemaResults[resultIndex].results).toEqual([
      expect.objectContaining({
        table: "users",
        from: "user_id",
        to: "id",
        on_delete: "CASCADE",
      }),
    ]);
  });
});
