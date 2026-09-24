import { describe, expect, it, vi } from "vitest";
import { verifyCi } from "./verify-ci.ts";

const sha = "3e933bdb80eff22cb4edd5ab132dd979dea901cb";
const environment = {
  GITHUB_CI_GATE_REQUIRED: "true",
  GITHUB_ACTIONS_READ_TOKEN: "test-token-never-logged",
  RAILWAY_GIT_COMMIT_SHA: sha,
};
const steps = [
  "Install dependencies",
  "Lint and typecheck",
  "Unit and foundation acceptance tests",
  "Browser regression tests",
  "PostgreSQL integration tests",
  "Build production artifact",
].map((name) => ({ name, conclusion: "success" }));

function jsonResponse(body: unknown, options: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    headers: {
      "content-type": "application/json",
      "x-ratelimit-resource": "core",
      "x-ratelimit-remaining": "4998",
      ...options.headers,
    },
  });
}

function successfulFetch() {
  return vi.fn<typeof fetch>()
    .mockResolvedValueOnce(jsonResponse({
      total_count: 1,
      workflow_runs: [{
        id: 35587159315,
        run_attempt: 1,
        status: "completed",
        conclusion: "success",
        event: "push",
        head_branch: "main",
        head_sha: sha,
      }],
    }))
    .mockResolvedValueOnce(jsonResponse({
      total_count: 1,
      jobs: [{ id: 101, name: "validate", status: "completed", conclusion: "success", steps }],
    }));
}

describe("exact-SHA CI verifier", () => {
  it("accepts the pinned push run, validate job, and required successful steps", async () => {
    const fetchMock = successfulFetch();

    await expect(verifyCi(environment, fetchMock)).resolves.toEqual({
      bypassed: false,
      runId: 35587159315,
      jobId: 101,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [runsUrl, runsOptions] = fetchMock.mock.calls[0];
    expect(String(runsUrl)).toContain("workflows/ci.yml/runs?branch=main&event=push&head_sha=");
    expect(String(runsUrl)).toContain("per_page=100");
    expect(runsOptions?.redirect).toBe("manual");
    expect(new Headers(runsOptions?.headers).get("authorization")).toBe("Bearer test-token-never-logged");
  });

  it("bypasses only for the explicit bootstrap false value", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    await expect(verifyCi({ GITHUB_CI_GATE_REQUIRED: "false" }, fetchMock))
      .resolves.toEqual({ bypassed: true });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(verifyCi({}, fetchMock)).rejects.toThrow("must be explicitly true or false");
  });

  it("requires a full Railway SHA and authenticated access", async () => {
    await expect(verifyCi({ ...environment, RAILWAY_GIT_COMMIT_SHA: "short" }))
      .rejects.toThrow("full 40-character");
    await expect(verifyCi({ ...environment, GITHUB_ACTIONS_READ_TOKEN: undefined }))
      .rejects.toThrow("anonymous fallback is disabled");
  });

  it.each([
    ["wrong SHA", { head_sha: "0000000000000000000000000000000000000000" }],
    ["wrong event", { event: "workflow_dispatch" }],
    ["failed conclusion", { conclusion: "failure" }],
    ["unfinished run", { status: "in_progress", conclusion: null }],
    ["manual rerun", { run_attempt: 2 }],
  ])("rejects a %s workflow run", async (_label, override) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      total_count: 1,
      workflow_runs: [{
        id: 1,
        run_attempt: 1,
        status: "completed",
        conclusion: "success",
        event: "push",
        head_branch: "main",
        head_sha: sha,
        ...override,
      }],
    }));
    await expect(verifyCi(environment, fetchMock)).rejects.toThrow("No successful completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects missing, duplicated, skipped, or failed required steps", async () => {
    for (const badSteps of [
      steps.slice(1),
      [...steps, steps[0]],
      steps.map((step) => step.name === "Browser regression tests" ? { ...step, conclusion: "skipped" } : step),
      steps.map((step) => step.name === "Build production artifact" ? { ...step, conclusion: "failure" } : step),
    ]) {
      const fetchMock = successfulFetch();
      fetchMock.mockReset()
        .mockResolvedValueOnce(jsonResponse({ total_count: 1, workflow_runs: [{ id: 1, run_attempt: 1, status: "completed", conclusion: "success", event: "push", head_branch: "main", head_sha: sha }] }))
        .mockResolvedValueOnce(jsonResponse({ total_count: 1, jobs: [{ id: 2, name: "validate", status: "completed", conclusion: "success", steps: badSteps }] }));
      await expect(verifyCi(environment, fetchMock)).rejects.toThrow("Required validation step did not succeed");
    }
  });

  it.each([
    ["low rate-limit headroom", { "x-ratelimit-remaining": "99" }],
    ["wrong rate-limit resource", { "x-ratelimit-resource": "search" }],
    ["pagination", { link: '<https://api.github.com/example?page=2>; rel="next"' }],
  ])("fails closed on %s", async (_label, headers) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ total_count: 0, workflow_runs: [] }, { headers }));
    await expect(verifyCi(environment, fetchMock)).rejects.toThrow();
  });

  it("rejects count uncertainty and malformed JSON", async () => {
    const countMismatch = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ total_count: 2, workflow_runs: [] }));
    await expect(verifyCi(environment, countMismatch)).rejects.toThrow("pagination is uncertain");

    const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response("not-json", {
      status: 200,
      headers: { "x-ratelimit-resource": "core", "x-ratelimit-remaining": "4998" },
    }));
    await expect(verifyCi(environment, malformed)).rejects.toThrow("malformed JSON");
  });

  it("retries one network error or 5xx but never retries authentication or rate-limit failures", async () => {
    const networkRetry = successfulFetch();
    networkRetry.mockReset()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(jsonResponse({ total_count: 1, workflow_runs: [{ id: 1, run_attempt: 1, status: "completed", conclusion: "success", event: "push", head_branch: "main", head_sha: sha }] }))
      .mockResolvedValueOnce(jsonResponse({ total_count: 1, jobs: [{ id: 2, name: "validate", status: "completed", conclusion: "success", steps }] }));
    await expect(verifyCi(environment, networkRetry)).resolves.toMatchObject({ bypassed: false });
    expect(networkRetry).toHaveBeenCalledTimes(3);

    for (const status of [401, 403, 429]) {
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("denied", { status }));
      await expect(verifyCi(environment, fetchMock)).rejects.toThrow(`status ${status}`);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });
});
