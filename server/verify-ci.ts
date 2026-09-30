import { pathToFileURL } from "node:url";

const REPOSITORY = "olegkirienko/guitar-mastering";
const WORKFLOW = "ci.yml";
const API_ROOT = `https://api.github.com/repos/${REPOSITORY}/actions`;
const REQUEST_TIMEOUT_MS = 10_000;
const MINIMUM_REMAINING_REQUESTS = 100;
const REQUIRED_STEPS = [
  "Install dependencies",
  "Lint and typecheck",
  "Unit and foundation acceptance tests",
  "Browser regression tests",
  "PostgreSQL integration tests",
  "Build production artifact",
] as const;
// Waits between jobs reads while GitHub still serves incomplete step data:
// reads happen at 0, 15, 45, 105, and 225 seconds.
const STEP_REREAD_WAITS_MS = [15_000, 30_000, 60_000, 120_000] as const;
const MAX_JOB_READS = STEP_REREAD_WAITS_MS.length + 1;

type Fetch = typeof fetch;
type Wait = (milliseconds: number) => Promise<void>;
type Log = (message: string) => void;

const sleep: Wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

interface WorkflowRun {
  id: number;
  run_attempt: number;
  status: string;
  conclusion: string | null;
  event: string;
  head_branch: string | null;
  head_sha: string;
}

interface WorkflowRunsResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

interface WorkflowJobStep {
  name: string;
  conclusion: string | null;
}

interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  steps: WorkflowJobStep[];
}

interface WorkflowJobsResponse {
  total_count: number;
  jobs: WorkflowJob[];
}

export class CiVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CiVerificationError";
  }
}

function fail(message: string): never {
  throw new CiVerificationError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") fail(`GitHub response has an invalid ${key}.`);
  return value;
}

function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value !== null && typeof value !== "string") fail(`GitHub response has an invalid ${key}.`);
  return value;
}

function requiredId(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (!Number.isSafeInteger(value) || (value as number) <= 0) fail(`GitHub response has an invalid ${key}.`);
  return value as number;
}

function parseCount(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(`GitHub response has an invalid ${key}.`);
  return value as number;
}

function parseWorkflowRuns(value: unknown): WorkflowRunsResponse {
  if (!isRecord(value) || !Array.isArray(value.workflow_runs)) {
    return fail("GitHub workflow-runs response is malformed.");
  }

  const workflowRuns = value.workflow_runs.map((entry) => {
    if (!isRecord(entry)) return fail("GitHub workflow-runs response is malformed.");
    return {
      id: requiredId(entry, "id"),
      run_attempt: requiredId(entry, "run_attempt"),
      status: requiredString(entry, "status"),
      conclusion: nullableString(entry, "conclusion"),
      event: requiredString(entry, "event"),
      head_branch: nullableString(entry, "head_branch"),
      head_sha: requiredString(entry, "head_sha"),
    };
  });
  const totalCount = parseCount(value, "total_count");
  if (totalCount !== workflowRuns.length) fail("GitHub workflow-runs pagination is uncertain.");
  return { total_count: totalCount, workflow_runs: workflowRuns };
}

function parseWorkflowJobs(value: unknown): WorkflowJobsResponse {
  if (!isRecord(value) || !Array.isArray(value.jobs)) {
    return fail("GitHub workflow-jobs response is malformed.");
  }

  const jobs = value.jobs.map((entry) => {
    if (!isRecord(entry) || !Array.isArray(entry.steps)) {
      return fail("GitHub workflow-jobs response is malformed.");
    }
    const steps = entry.steps.map((step) => {
      if (!isRecord(step)) return fail("GitHub workflow-jobs response is malformed.");
      return {
        name: requiredString(step, "name"),
        conclusion: nullableString(step, "conclusion"),
      };
    });
    return {
      id: requiredId(entry, "id"),
      name: requiredString(entry, "name"),
      status: requiredString(entry, "status"),
      conclusion: nullableString(entry, "conclusion"),
      steps,
    };
  });
  const totalCount = parseCount(value, "total_count");
  if (totalCount !== jobs.length) fail("GitHub workflow-jobs pagination is uncertain.");
  return { total_count: totalCount, jobs };
}

function assertResponseMetadata(response: Response): void {
  if (response.url && !response.url.startsWith(`${API_ROOT}/`)) {
    fail("GitHub API returned an unexpected response URL.");
  }
  const link = response.headers.get("link");
  if (link && /(?:^|,)\s*<[^>]+>\s*;[^,]*\brel\s*=\s*["']?next["']?/i.test(link)) {
    fail("GitHub API response has an unexpected next page.");
  }
  if (response.headers.get("x-ratelimit-resource") !== "core") {
    fail("GitHub API response has invalid rate-limit metadata.");
  }
  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const remaining = remainingHeader === null ? Number.NaN : Number(remainingHeader);
  if (!Number.isSafeInteger(remaining) || remaining < MINIMUM_REMAINING_REQUESTS) {
    fail("GitHub API rate-limit headroom is below the required minimum.");
  }
}

async function requestJson(url: URL, token: string, fetchImplementation: Fetch): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImplementation(url, {
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "user-agent": "guitar-mastering-ci-verifier",
          "x-github-api-version": "2022-11-28",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      if (attempt === 0) continue;
      return fail("GitHub API request failed after one retry.");
    }

    if (response.status >= 500 && response.status <= 599 && attempt === 0) continue;
    if (response.status !== 200) fail(`GitHub API request failed with status ${response.status}.`);
    assertResponseMetadata(response);
    try {
      return await response.json();
    } catch {
      return fail("GitHub API returned malformed JSON.");
    }
  }
  return fail("GitHub API request failed.");
}

type StepObservation =
  | { state: "passed" }
  | { state: "incomplete"; observed: string }
  | { state: "failed"; observed: string };

// Missing steps and null conclusions are step data GitHub has not finished
// publishing; any other non-success value is final and fails at once.
function observeStep(steps: WorkflowJobStep[], name: string): StepObservation {
  const matches = steps.filter((step) => step.name === name);
  if (matches.length === 0) return { state: "incomplete", observed: "missing" };
  if (matches.length > 1) return { state: "failed", observed: "duplicated" };
  const { conclusion } = matches[0];
  if (conclusion === "success") return { state: "passed" };
  if (conclusion === null) return { state: "incomplete", observed: "conclusion null" };
  return { state: "failed", observed: `conclusion ${conclusion}` };
}

async function readValidateJob(jobsUrl: URL, token: string, fetchImplementation: Fetch): Promise<WorkflowJob> {
  const jobs = parseWorkflowJobs(await requestJson(jobsUrl, token, fetchImplementation));
  if (jobs.jobs.length !== 1 || jobs.jobs[0].name !== "validate") {
    fail("The matching workflow run must contain exactly one validate job.");
  }
  const job = jobs.jobs[0];
  if (job.status !== "completed" || job.conclusion !== "success") {
    fail("The validate job did not complete successfully.");
  }
  return job;
}

export async function verifyCi(
  environment: NodeJS.ProcessEnv,
  fetchImplementation: Fetch = fetch,
  wait: Wait = sleep,
  log: Log = console.log,
): Promise<{ bypassed: boolean; runId?: number; jobId?: number }> {
  const required = environment.GITHUB_CI_GATE_REQUIRED;
  if (required === "false") return { bypassed: true };
  if (required !== "true") fail("GITHUB_CI_GATE_REQUIRED must be explicitly true or false.");

  const sha = environment.RAILWAY_GIT_COMMIT_SHA;
  if (!sha || !/^[0-9a-f]{40}$/i.test(sha)) {
    fail("RAILWAY_GIT_COMMIT_SHA must be a full 40-character Git commit SHA.");
  }
  const token = environment.GITHUB_ACTIONS_READ_TOKEN;
  if (!token) fail("GITHUB_ACTIONS_READ_TOKEN is required; anonymous fallback is disabled.");

  const runsUrl = new URL(`${API_ROOT}/workflows/${WORKFLOW}/runs`);
  runsUrl.searchParams.set("branch", "main");
  runsUrl.searchParams.set("event", "push");
  runsUrl.searchParams.set("head_sha", sha);
  runsUrl.searchParams.set("per_page", "100");
  const runs = parseWorkflowRuns(await requestJson(runsUrl, token, fetchImplementation));
  const run = runs.workflow_runs.find((candidate) => (
    candidate.status === "completed" &&
    candidate.conclusion === "success" &&
    candidate.run_attempt === 1 &&
    candidate.event === "push" &&
    candidate.head_branch === "main" &&
    candidate.head_sha.toLowerCase() === sha.toLowerCase()
  ));
  if (!run) fail("No successful completed Validate workflow run matches the deployment SHA.");

  const jobsUrl = new URL(`${API_ROOT}/runs/${run.id}/jobs`);
  jobsUrl.searchParams.set("filter", "latest");
  jobsUrl.searchParams.set("per_page", "100");
  let pinnedJobId: number | undefined;
  for (let read = 1; read <= MAX_JOB_READS; read += 1) {
    const job = await readValidateJob(jobsUrl, token, fetchImplementation);
    pinnedJobId ??= job.id;
    if (job.id !== pinnedJobId) fail("The validate job identity changed between reads.");

    let incomplete: { step: string; observed: string } | undefined;
    for (const requiredStep of REQUIRED_STEPS) {
      const observation = observeStep(job.steps, requiredStep);
      if (observation.state === "failed") {
        fail(`Required validation step did not succeed: ${requiredStep} (${observation.observed}).`);
      }
      if (observation.state === "incomplete") incomplete ??= { step: requiredStep, observed: observation.observed };
    }
    if (!incomplete) return { bypassed: false, runId: run.id, jobId: job.id };

    if (read === MAX_JOB_READS) {
      fail(`Required validation step did not succeed: ${incomplete.step} (${incomplete.observed} after ${MAX_JOB_READS} job reads).`);
    }
    const waitMs = STEP_REREAD_WAITS_MS[read - 1];
    log(`CI step data incomplete: ${incomplete.step} (${incomplete.observed}); re-reading in ${waitMs / 1000} s (read ${read}/${MAX_JOB_READS}).`);
    await wait(waitMs);
  }
  return fail("GitHub step data could not be verified.");
}

async function main(): Promise<void> {
  try {
    const result = await verifyCi(process.env);
    if (result.bypassed) {
      console.log("CI verification bypassed by explicit bootstrap setting.");
    } else {
      console.log(`CI verification passed for workflow run ${result.runId} and job ${result.jobId}.`);
    }
  } catch (error) {
    const message = error instanceof CiVerificationError ? error.message : "Unexpected CI verification failure.";
    console.error(`CI verification failed: ${message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
