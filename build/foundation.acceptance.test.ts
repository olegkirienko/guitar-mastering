import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..");
let build: { html: string; javascript: string };

beforeAll(async () => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "guitar-mastering-production-"));
  const outputDirectory = path.join(temporaryRoot, "dist");
  await execFileAsync(path.resolve(repositoryRoot, "node_modules/.bin/vite"), [
    "build", "test-fixtures/deployment-gate",
    "--config", "vite.config.ts", "--outDir", outputDirectory, "--emptyOutDir",
  ], {
    cwd: repositoryRoot,
    env: { ...process.env, CI: "true" },
    maxBuffer: 10 * 1024 * 1024,
  });
  const javascriptFile = (await readdir(path.join(outputDirectory, "assets")))
    .find((file) => file.endsWith(".js"));
  if (!javascriptFile) throw new Error("Production build did not emit JavaScript.");
  build = {
    html: await readFile(path.join(outputDirectory, "index.html"), "utf8"),
    javascript: await readFile(path.join(outputDirectory, "assets", javascriptFile), "utf8"),
  };
}, 120_000);

describe("production artifact acceptance", () => {
  it("gates traffic on database readiness", async () => {
    const railwayConfig = await readFile(path.join(repositoryRoot, ".railway/railway.ts"), "utf8");
    expect(railwayConfig).toContain('healthcheckPath: "/api/v1/readiness"');
  });

  it("uses the same-origin root and enables account capabilities", () => {
    expect(build.html).toContain('src="/assets/');
    expect(build.javascript).toContain("__GM_TARGET_RAILWAY__");
    expect(build.javascript).toContain("__GM_CAPABILITIES_ENABLED__");
  });

  it("keeps CI validation-only and builds the production artifact", async () => {
    const workflow = await readFile(path.join(repositoryRoot, ".github/workflows/ci.yml"), "utf8");
    expect(workflow).toContain("pnpm build");
    expect(workflow).toMatch(/\n  pull_request:\s*\n  push:\s*\n    branches:\s*\n      - main\s*\n/);
    expect(workflow).not.toContain("workflow_dispatch");
    expect(workflow).not.toContain("concurrency:");
    expect(workflow).not.toContain("deploy-pages");
    expect(workflow).not.toContain("wrangler");
  });
});
