import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { retryGuardDecision } from "../scripts/delivery-retry-guard.mjs";

const sha = "732e2bb18e30802fb9d20910ed8d6f8d52937430";
const newerSha = "9a550e529057f7a34f023d32eee1d735d00d8127";
const failed = { id: "failed-1", status: "FAILED", createdAt: "2026-09-30T13:59:45.782Z", commitHash: sha };
const older = { id: "older-1", status: "SUCCESS", createdAt: "2026-09-30T09:15:51.041Z", commitHash: newerSha };

describe("delivery retry guard", () => {
  it("clears a pre-check only for the newest FAILED or CRASHED deployment of the merged SHA", () => {
    for (const status of ["FAILED", "CRASHED"]) {
      expect(retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [older, { ...failed, status }] }))
        .toMatchObject({ clear: true, kind: "clear" });
    }
  });

  it("picks the newest deployment by createdAt regardless of list order or commit", () => {
    const newer = { id: "newer-1", status: "BUILDING", createdAt: "2026-09-30T14:05:00.000Z", commitHash: newerSha };
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [newer, failed] }))
      .toEqual({ clear: false, kind: "permanent", reason: `newer deployment newer-1 for ${newerSha}` });
  });

  it("stops the pre-check permanently when main advanced or the deployment already succeeded", () => {
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: newerSha, deployments: [failed] }))
      .toEqual({ clear: false, kind: "permanent", reason: `main advanced to ${newerSha}` });
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [{ ...failed, status: "SUCCESS" }] }))
      .toEqual({ clear: false, kind: "permanent", reason: "latest deployment already SUCCESS" });
  });

  it("stops the pre-check temporarily while a deployment is in progress or a fact is missing", () => {
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [{ ...failed, status: "DEPLOYING" }] }))
      .toEqual({ clear: false, kind: "temporary", reason: "deployment DEPLOYING" });
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [] }))
      .toMatchObject({ clear: false, kind: "temporary", reason: "missing deployments" });
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [{ ...failed, createdAt: "" }] }))
      .toMatchObject({ clear: false, kind: "temporary", reason: "missing createdAt" });
    expect(retryGuardDecision({ mode: "pre", sha, mainSha: "", deployments: [failed] }))
      .toMatchObject({ clear: false, reason: "missing main head" });
  });

  it("rejects a retry deployment ID in pre mode and an implicit mode", () => {
    expect(() => retryGuardDecision({ mode: "pre", sha, mainSha: sha, deployments: [failed], retryDeploymentId: "x" }))
      .toThrow("does not accept a retry deployment ID");
    expect(() => retryGuardDecision({ mode: undefined as never, sha, mainSha: sha, deployments: [failed] }))
      .toThrow("mode must be");
  });

  it("clears a post-check with or without the ID when the merged SHA is newest and main is unchanged", () => {
    const retry = { id: "retry-1", status: "SUCCESS", createdAt: "2026-09-30T14:14:31.654Z", commitHash: sha };
    expect(retryGuardDecision({ mode: "post", sha, mainSha: sha, deployments: [failed, retry], retryDeploymentId: "retry-1" }).clear).toBe(true);
    expect(retryGuardDecision({ mode: "post", sha, mainSha: sha, deployments: [failed, retry] }).clear).toBe(true);
    expect(retryGuardDecision({ mode: "post", sha, mainSha: sha, deployments: [{ ...retry, status: "FAILED" }] }).clear).toBe(true);
  });

  it("stops a post-check when a newer deployment, an advanced main, or another retry appears", () => {
    const retry = { id: "retry-1", status: "SUCCESS", createdAt: "2026-09-30T14:14:31.654Z", commitHash: sha };
    const newer = { id: "newer-2", status: "SUCCESS", createdAt: "2026-09-30T14:20:00.000Z", commitHash: newerSha };
    expect(retryGuardDecision({ mode: "post", sha, mainSha: sha, deployments: [retry, newer], retryDeploymentId: "retry-1" }))
      .toMatchObject({ clear: false, reason: `newer deployment newer-2 for ${newerSha}` });
    expect(retryGuardDecision({ mode: "post", sha, mainSha: newerSha, deployments: [retry] }))
      .toMatchObject({ clear: false, reason: `main advanced to ${newerSha}` });
    expect(retryGuardDecision({ mode: "post", sha, mainSha: sha, deployments: [retry], retryDeploymentId: "other" }))
      .toMatchObject({ clear: false, kind: "permanent" });
  });

  const guardScript = fileURLToPath(new URL("../scripts/delivery-retry-guard.mjs", import.meta.url));
  // PATH holds only node, so no provider can be contacted.
  const runCli = (args: string[]) => spawnSync(process.execPath, [guardScript, ...args], {
    env: { PATH: path.dirname(process.execPath) },
    encoding: "utf8",
  });

  it("rejects invalid CLI usage with exit 2 before contacting any provider", () => {
    for (const args of [
      ["--mode", "post", "--sha", sha, "--retry-deployment"],
      ["--mode", "post", "--sha", sha, "--retry-deploymnet", "abc"],
      ["--mode", "post", "--sha", sha, "--extra", "junk"],
      ["--mode", "post", "--sha", sha, "positional"],
      ["--mode", "post", "--mode", "pre", "--sha", sha],
      ["--mode", "post", "--sha", sha, "--retry-deployment", ""],
      ["--mode", "post", "--sha", sha, "--retry-deployment", "--mode"],
      ["--mode", "pre", "--sha", sha, "--retry-deployment", "abc"],
      ["--mode", "later", "--sha", sha],
      ["--mode", "pre", "--sha", "short"],
    ]) {
      const result = runCli(args);
      expect(result.status, args.join(" ")).toBe(2);
      expect(result.stdout).toBe("");
    }
  });

  it("stops with exit 1 when valid usage cannot reach the providers", () => {
    const result = runCli(["--", "--mode", "post", "--sha", sha, "--retry-deployment", "retry-1"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^retry-guard mode=post STOP kind=temporary reason=provider query failed/);
  });
});
