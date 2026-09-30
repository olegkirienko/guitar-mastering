// Read-only guard for a post-merge production retry. It prevents a redeploy of
// the merged SHA from rolling production back after newer code was merged or
// deployed (docs/technical-designs/delivery-retry-hardening.md).
//
// Usage: node scripts/delivery-retry-guard.mjs --mode pre|post --sha <merged-sha> [--retry-deployment <id>]
// Exit code 0 means clear, 1 means stop, and 2 means invalid usage.
import { execFile } from "node:child_process";
import { parseArgs, promisify } from "node:util";

// Production identity pinned in docs/operations/railway-ci-cd.md.
const REPOSITORY = "olegkirienko/guitar-mastering";
const RAILWAY_SCOPE = [
  "--project", "112644ba-cb91-443b-ae4b-73a0d6f74b69",
  "--environment", "994fd373-dd1d-4073-8b7f-116e77d898fa",
  "--service", "4d0a3739-0beb-4ea9-9a7e-7a9f3494708e",
];
const RETRY_CANDIDATE_STATUSES = new Set(["FAILED", "CRASHED"]);
const IN_PROGRESS_STATUSES = new Set(["QUEUED", "WAITING", "INITIALIZING", "BUILDING", "DEPLOYING"]);

const stop = (kind, reason) => ({ clear: false, kind, reason });

export function retryGuardDecision({ mode, sha, mainSha, deployments, retryDeploymentId }) {
  if (mode !== "pre" && mode !== "post") throw new TypeError("mode must be \"pre\" or \"post\".");
  if (mode === "pre" && retryDeploymentId !== undefined) {
    throw new TypeError("The pre-check does not accept a retry deployment ID.");
  }
  if (!sha) return stop("temporary", "missing merged SHA");
  if (!mainSha) return stop("temporary", "missing main head");
  if (!Array.isArray(deployments) || deployments.length === 0) return stop("temporary", "missing deployments");
  if (deployments.some((deployment) => !Number.isFinite(Date.parse(deployment?.createdAt)))) {
    return stop("temporary", "missing createdAt");
  }

  const newest = deployments.reduce((latest, deployment) => (
    Date.parse(deployment.createdAt) > Date.parse(latest.createdAt) ? deployment : latest
  ));
  if (mainSha !== sha) return stop("permanent", `main advanced to ${mainSha}`);
  if (newest.commitHash !== sha) return stop("permanent", `newer deployment ${newest.id} for ${newest.commitHash ?? "unknown commit"}`);

  if (mode === "post") {
    if (retryDeploymentId !== undefined && newest.id !== retryDeploymentId) {
      return stop("permanent", `newer deployment ${newest.id} for ${sha} is not retry ${retryDeploymentId}`);
    }
    return { clear: true, kind: "clear", reason: `newest deployment ${newest.id} is for ${sha} (${newest.status})` };
  }

  if (newest.status === "SUCCESS") return stop("permanent", "latest deployment already SUCCESS");
  if (IN_PROGRESS_STATUSES.has(newest.status)) return stop("temporary", `deployment ${newest.status}`);
  if (!RETRY_CANDIDATE_STATUSES.has(newest.status)) return stop("permanent", `deployment ${newest.status}`);
  return { clear: true, kind: "clear", reason: `retry candidate ${newest.id} is ${newest.status} for ${sha}` };
}

async function command(file, args) {
  const { stdout } = await promisify(execFile)(file, args, {
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 64 * 1024 * 1024,
    timeout: 60_000,
  });
  return stdout;
}

// Strict usage parsing: an unknown, repeated, empty, or missing option value is
// invalid usage, so a mistyped --retry-deployment can never silently unbind a
// post-check.
export function parseUsage(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: { mode: { type: "string" }, sha: { type: "string" }, "retry-deployment": { type: "string" } },
      strict: true,
      allowPositionals: false,
      tokens: true,
    });
  } catch {
    return undefined;
  }
  const seen = new Set();
  for (const token of parsed.tokens) {
    if (token.kind !== "option") continue;
    if (seen.has(token.name) || !token.value || token.value.startsWith("-")) return undefined;
    seen.add(token.name);
  }
  const { mode, sha, "retry-deployment": retryDeploymentId } = parsed.values;
  if ((mode !== "pre" && mode !== "post") || !/^[0-9a-f]{40}$/.test(sha ?? "")) return undefined;
  if (mode === "pre" && retryDeploymentId !== undefined) return undefined;
  return { mode, sha, retryDeploymentId };
}

async function main() {
  const usage = parseUsage(process.argv.slice(2));
  if (!usage) {
    console.error("Usage: --mode pre|post --sha <full 40-hex SHA> [--retry-deployment <id>] (post only).");
    process.exit(2);
  }
  const { mode, sha, retryDeploymentId } = usage;

  let decision;
  try {
    const mainSha = (await command("gh", ["api", `repos/${REPOSITORY}/commits/main`, "--jq", ".sha"])).trim();
    const deployments = JSON.parse(await command("railway", ["deployment", "list", ...RAILWAY_SCOPE, "--json"]))
      .map((deployment) => ({
        id: deployment.id,
        status: deployment.status,
        createdAt: deployment.createdAt,
        commitHash: deployment.meta?.commitHash,
      }));
    decision = retryGuardDecision({ mode, sha, mainSha, deployments, retryDeploymentId });
  } catch (error) {
    const detail = String(error.stderr || error.message).replace(/\s+/g, " ").slice(0, 200);
    decision = stop("temporary", `provider query failed: ${detail}`);
  }
  process.stdout.write(`retry-guard mode=${mode} ${decision.clear ? "CLEAR" : "STOP"} kind=${decision.kind} reason=${decision.reason}\n`);
  process.exit(decision.clear ? 0 : 1);
}

if (import.meta.main) await main();
