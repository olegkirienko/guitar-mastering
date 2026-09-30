// Prints the compact GitHub and Railway facts that delivery verification needs
// for one merged SHA. Raw provider JSON and logs are processed here and never
// printed, so the agent sees a few hundred bytes instead of tens of kilobytes.
//
// Usage: node scripts/railway-delivery-evidence.mjs --sha <full-40-hex-sha>
// Exit code 0 means every fact was found; 1 means a fact is missing or failed.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Production identity pinned in docs/operations/railway-ci-cd.md.
const REPOSITORY = "olegkirienko/guitar-mastering";
const RAILWAY_SCOPE = [
  "--project", "112644ba-cb91-443b-ae4b-73a0d6f74b69",
  "--environment", "994fd373-dd1d-4073-8b7f-116e77d898fa",
  "--service", "4d0a3739-0beb-4ea9-9a7e-7a9f3494708e",
];
const LOG_LINE_LIMIT = "5000";
const MAX_DEPLOY_EVENTS = 12;
const MAX_MESSAGE_LENGTH = 240;

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const shaIndex = args.indexOf("--sha");
const sha = shaIndex === -1 ? undefined : args[shaIndex + 1];

if (!sha || !/^[0-9a-f]{40}$/.test(sha)) {
  console.error("Pass the exact merged commit as --sha <full 40-hex SHA>.");
  process.exit(2);
}

let missing = 0;
const report = (line) => process.stdout.write(`${line}\n`);
const fail = (line) => {
  missing += 1;
  report(`MISSING ${line}`);
};

const redact = (text) => text
  .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]")
  .replace(/\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY))=\S+/g, "$1=[redacted]");
const clip = (text) => {
  const clean = redact(String(text).replace(/\s+/g, " ").trim());
  return clean.length > MAX_MESSAGE_LENGTH ? `${clean.slice(0, MAX_MESSAGE_LENGTH)}…` : clean;
};

async function command(file, commandArgs) {
  const { stdout } = await run(file, commandArgs, {
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 64 * 1024 * 1024,
    timeout: 120_000,
  });
  return stdout;
}

const parseJsonLines = (text) => text.split("\n").flatMap((line) => {
  try {
    return line.trim() ? [JSON.parse(line)] : [];
  } catch {
    return [];
  }
});

async function githubValidateRun() {
  const runs = JSON.parse(await command("gh", [
    "run", "list",
    "--repo", REPOSITORY,
    "--workflow", "Validate",
    "--branch", "main",
    "--event", "push",
    "--commit", sha,
    "--limit", "5",
    "--json", "databaseId,headSha,event,status,conclusion,createdAt,updatedAt",
  ]));
  const exact = runs.filter((entry) => entry.headSha === sha);
  if (exact.length === 0) return fail(`github.validate push run for ${sha}`);
  for (const entry of exact) {
    report(`github.validate run=${entry.databaseId} event=${entry.event} status=${entry.status} conclusion=${entry.conclusion} created=${entry.createdAt} updated=${entry.updatedAt} sha=${entry.headSha}`);
  }
  if (!exact.some((entry) => entry.conclusion === "success")) fail("github.validate successful run");
}

async function railwayDeployment() {
  const deployments = JSON.parse(await command("railway", ["deployment", "list", ...RAILWAY_SCOPE, "--json"]));
  const matches = deployments.filter((deployment) => deployment.meta?.commitHash === sha);
  if (matches.length === 0) {
    fail(`railway.deployment for ${sha} among the ${deployments.length} newest deployments`);
    return undefined;
  }
  for (const deployment of matches) {
    const meta = deployment.meta ?? {};
    report(`railway.deployment id=${deployment.id} status=${deployment.status} created=${deployment.createdAt} repo=${meta.repo} branch=${meta.branch} reason=${meta.reason} image=${meta.imageDigest ?? "none"} sha=${meta.commitHash}`);
  }
  const successful = matches.find((deployment) => deployment.status === "SUCCESS");
  if (!successful) fail("railway.deployment with status SUCCESS");
  return successful ?? matches[0];
}

async function railwayLogs(deploymentId) {
  const build = parseJsonLines(await command("railway", ["logs", deploymentId, "--build", "--lines", LOG_LINE_LIMIT, "--json", ...RAILWAY_SCOPE]));
  const firstBuild = build.map((entry) => entry.timestamp).filter(Boolean).sort()[0];
  if (firstBuild) report(`railway.build lines=${build.length} first=${firstBuild}`);
  else fail("railway.build first log timestamp");

  const deploy = parseJsonLines(await command("railway", ["logs", deploymentId, "--deployment", "--lines", LOG_LINE_LIMIT, "--json", ...RAILWAY_SCOPE]));
  const events = deploy.filter((entry) => /CI verification|migrations? (?:to run|complete)|error|fail/i.test(entry.message ?? "")
    || entry.event === "server_started"
    || (entry.route ?? "").includes("readiness"));
  for (const entry of events.slice(0, MAX_DEPLOY_EVENTS)) {
    const fields = [
      entry.event && `event=${entry.event}`,
      entry.deploymentVersion && `deploymentVersion=${entry.deploymentVersion}`,
      entry.route && `route=${entry.route}`,
      entry.status && `status=${entry.status}`,
      entry.outcome && `outcome=${entry.outcome}`,
    ].filter(Boolean).join(" ");
    report(`railway.deploy ${entry.timestamp} ${entry.level ?? ""} ${fields} ${clip(entry.message ?? "")}`.trimEnd());
  }
  if (events.length > MAX_DEPLOY_EVENTS) report(`railway.deploy … ${events.length - MAX_DEPLOY_EVENTS} more matching events omitted`);

  const checks = [
    ["CI verification passed", deploy.some((entry) => /CI verification passed/.test(entry.message ?? ""))],
    ["Migrations complete!", deploy.some((entry) => /Migrations complete!/.test(entry.message ?? ""))],
    ["server_started for this SHA", deploy.some((entry) => entry.event === "server_started" && entry.deploymentVersion === sha)],
    ["readiness success", deploy.some((entry) => (entry.route ?? "").includes("readiness") && entry.outcome === "success")],
  ];
  for (const [label, found] of checks) {
    if (!found) fail(`railway.deploy ${label}`);
  }
}

try {
  await githubValidateRun();
  const deployment = await railwayDeployment();
  if (deployment) await railwayLogs(deployment.id);
  else fail("railway release-path logs (no deployment to read)");
} catch (error) {
  fail(`provider query failed: ${clip(error.stderr || error.message)}`);
}

report(missing === 0 ? "RESULT all delivery facts found" : `RESULT ${missing} fact(s) missing; do not treat absence as success`);
process.exit(missing === 0 ? 0 : 1);
