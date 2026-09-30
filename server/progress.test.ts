import { describe, expect, it, vi } from "vitest";
import type { AuthService } from "./auth.ts";
import { ProgressCatalog } from "./progress-catalog.ts";
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

  it("validates each lesson against its injected catalog entry", async () => {
    const query = vi.fn();
    const catalog = new ProgressCatalog({
      "lesson-one": { schemaVersion: 1, contentVersion: 2, stepIds: ["one-start", "one-end"] },
      "lesson-two": { schemaVersion: 3, contentVersion: 4, stepIds: ["two-start", "two-end"] },
    });
    const service = new ProgressService(
      { query } as never,
      { session: vi.fn(async () => ({ id: "user-1" })) } as unknown as AuthService,
      catalog,
    );
    const body = (schemaVersion: number, contentVersion: number, currentStepId: string) => ({
      schemaVersion,
      contentVersion,
      baseRevision: 0,
      progress: { currentStepId, completedStepIds: [], checkpointPassed: false, completedAt: null },
    });

    await expect(service.put("token", "lesson-one", body(1, 2, "two-start"))).rejects.toMatchObject({ code: "INVALID_PROGRESS" });
    await expect(service.put("token", "lesson-two", body(1, 2, "two-start"))).rejects.toMatchObject({ code: "UNSUPPORTED_PROGRESS_VERSION" });
    await expect(service.put("token", "lesson-two", body(3, 4, "one-start"))).rejects.toMatchObject({ code: "INVALID_PROGRESS" });
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ["empty lesson ID", { "": { schemaVersion: 1, contentVersion: 1, stepIds: ["start"] } }],
    ["negative schema version", { lesson: { schemaVersion: -1, contentVersion: 1, stepIds: ["start"] } }],
    ["fractional content version", { lesson: { schemaVersion: 1, contentVersion: 1.5, stepIds: ["start"] } }],
    ["empty step list", { lesson: { schemaVersion: 1, contentVersion: 1, stepIds: [] } }],
    ["empty step ID", { lesson: { schemaVersion: 1, contentVersion: 1, stepIds: [" "] } }],
    ["duplicate step IDs", { lesson: { schemaVersion: 1, contentVersion: 1, stepIds: ["start", "start"] } }],
  ])("rejects an invalid catalog with %s", (_label, definition) => {
    expect(() => new ProgressCatalog(definition)).toThrow(TypeError);
  });
});
