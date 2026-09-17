import { describe, expect, it, vi } from "vitest";
import type { AuthService } from "./auth.ts";
import { ProgressService } from "./progress.ts";

describe("progress service validation", () => {
  it("rejects unknown lessons before authentication or SQL", async () => {
    const query = vi.fn();
    const session = vi.fn();
    const service = new ProgressService({ query } as never, { session } as unknown as AuthService);
    await expect(service.get("token", "unknown-lesson")).rejects.toMatchObject({ status: 404, code: "UNKNOWN_LESSON" });
    expect(session).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects unsupported fields, versions, steps, and payloads before writing", async () => {
    const query = vi.fn();
    const service = new ProgressService({ query } as never, { session: vi.fn(async () => ({ id: "user-1" })) } as unknown as AuthService);
    const base = { schemaVersion: 1, contentVersion: 1, baseRevision: 0, progress: {
      currentStepId: "intro", completedStepIds: [], checkpointPassed: false, completedAt: null,
    } };
    await expect(service.put("token", "stage-01-lesson-01", { ...base, extra: true })).rejects.toMatchObject({ code: "INVALID_PROGRESS" });
    await expect(service.put("token", "stage-01-lesson-01", { ...base, schemaVersion: 2 })).rejects.toMatchObject({ code: "UNSUPPORTED_PROGRESS_VERSION" });
    await expect(service.put("token", "stage-01-lesson-01", { ...base, progress: { ...base.progress, currentStepId: "future" } })).rejects.toMatchObject({ code: "INVALID_PROGRESS" });
    expect(query).not.toHaveBeenCalled();
  });
});
