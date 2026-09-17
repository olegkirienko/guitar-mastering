import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..");
const builds = new Map<"pages" | "railway", { html: string; javascript: string }>();

async function buildTarget(target: "pages" | "railway") {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), `guitar-mastering-${target}-`));
  const outputDirectory = path.join(temporaryRoot, "dist");
  await execFileAsync(path.resolve(repositoryRoot, "node_modules/.bin/vite"), [
    "build", "test-fixtures/deployment-gate",
    "--config", "vite.config.ts", "--outDir", outputDirectory, "--emptyOutDir",
  ], {
    cwd: repositoryRoot,
    env: { ...process.env, CI: "true", VITE_DEPLOY_TARGET: target },
    maxBuffer: 10 * 1024 * 1024,
  });
  const javascriptFile = (await readdir(path.join(outputDirectory, "assets")))
    .find((file) => file.endsWith(".js"));
  if (!javascriptFile) throw new Error(`${target} build did not emit JavaScript.`);
  return {
    html: await readFile(path.join(outputDirectory, "index.html"), "utf8"),
    javascript: await readFile(path.join(outputDirectory, "assets", javascriptFile), "utf8"),
  };
}

beforeAll(async () => {
  builds.set("pages", await buildTarget("pages"));
  builds.set("railway", await buildTarget("railway"));
}, 120_000);

describe("deployment target acceptance", () => {
  it("gates Railway traffic on database readiness", async () => {
    const railwayConfig = JSON.parse(await readFile(path.join(repositoryRoot, "railway.json"), "utf8"));
    expect(railwayConfig.deploy.healthcheckPath).toBe("/api/v1/readiness");
  });

  it("keeps GitHub Pages as a manual rollback artifact after cutover", async () => {
    const workflow = await readFile(path.join(repositoryRoot, ".github/workflows/deploy.yml"), "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s+push:/m);
  });

  it("keeps Pages account-free under missing, invalid, and explicit Pages targets", () => {
    const build = builds.get("pages");
    expect(build?.html).toContain('src="/guitar-mastering/assets/');
    expect(build?.javascript).toContain("__GM_TARGET_PAGES__");
    expect(build?.javascript).toContain("__GM_CAPABILITIES_DISABLED__");
  });

  it("enables only the Railway target at the same-origin root", () => {
    const build = builds.get("railway");
    expect(build?.html).toContain('src="/assets/');
    expect(build?.javascript).toContain("__GM_TARGET_RAILWAY__");
    expect(build?.javascript).toContain("__GM_CAPABILITIES_ENABLED__");
  });
});
