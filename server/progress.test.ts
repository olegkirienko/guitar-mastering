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

  it("registers Lesson 2 in production with its own eight steps", async () => {
    const query = vi.fn();
    const unauthenticated = new ProgressService({ query } as never, { session: vi.fn(async () => null) } as unknown as AuthService);
    await expect(unauthenticated.get("token", "stage-01-lesson-02")).rejects.toMatchObject({ status: 401, code: "UNAUTHENTICATED" });

    const service = new ProgressService({ query } as never, { session: vi.fn(async () => ({ id: "user-1" })) } as unknown as AuthService);
    const base = { schemaVersion: 1, contentVersion: 1, baseRevision: 0, progress: {
      currentStepId: "repeats", completedStepIds: ["intro", "string"], checkpointPassed: false, completedAt: null,
    } };
    await expect(service.put("token", "stage-01-lesson-02", { ...base, progress: { ...base.progress, currentStepId: "air" } }))
      .rejects.toMatchObject({ code: "INVALID_PROGRESS" });
    await expect(service.put("token", "stage-01-lesson-02", { ...base, progress: { ...base.progress, audioEnabled: true } }))
      .rejects.toMatchObject({ code: "INVALID_PROGRESS" });
    await expect(service.put("token", "stage-01-lesson-01", { ...base, progress: { ...base.progress, currentStepId: "repeats" } }))
      .rejects.toMatchObject({ code: "INVALID_PROGRESS" });
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

describe("progress reset", () => {
  const catalog = new ProgressCatalog({
    "lesson-one": { schemaVersion: 1, contentVersion: 1, stepIds: ["start"] },
    "lesson-two": { schemaVersion: 1, contentVersion: 1, stepIds: ["start"] },
    "lesson-three": { schemaVersion: 1, contentVersion: 1, stepIds: ["start"] },
  });

  function service(query: ReturnType<typeof vi.fn>, session = vi.fn(async () => ({ id: "user-1" }))) {
    return new ProgressService({ query } as never, { session } as unknown as AuthService, catalog);
  }

  it("deletes the lesson and the ones after it, for that user only", async () => {
    const query = vi.fn(async () => ({ rows: [] }));
    await service(query).reset("token", "lesson-two");
    const [deleteSql, deleteParameters] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(deleteSql).toContain("DELETE FROM lesson_progress");
    expect(deleteSql).toContain("user_id = $1");
    expect(deleteParameters).toEqual(["user-1", ["lesson-two", "lesson-three"]]);
  });

  it("answers with the progress that is left", async () => {
    const row = {
      lesson_id: "lesson-one", schema_version: 1, content_version: 1, revision: 2,
      updated_at: new Date("2026-10-06T00:00:00.000Z"),
      progress: { currentStepId: "start", completedStepIds: [], checkpointPassed: false, completedAt: null },
    };
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [row] });
    await expect(service(query).reset("token", "lesson-two")).resolves.toMatchObject([{ lessonId: "lesson-one", revision: 2 }]);
  });

  it("rejects an unknown lesson before authentication or SQL", async () => {
    const query = vi.fn();
    const session = vi.fn();
    await expect(service(query, session).reset("token", "lesson-four")).rejects.toMatchObject({ status: 404, code: "UNKNOWN_LESSON" });
    expect(session).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects a request without a session before SQL", async () => {
    const query = vi.fn();
    const service = new ProgressService({ query } as never, { session: vi.fn(async () => null) } as unknown as AuthService, catalog);
    await expect(service.reset("token", "lesson-two")).rejects.toMatchObject({ status: 401, code: "UNAUTHENTICATED" });
    expect(query).not.toHaveBeenCalled();
  });

  it("deletes nothing but still answers when the lesson has no stored progress", async () => {
    const query = vi.fn(async () => ({ rows: [] }));
    await expect(service(query).reset("token", "lesson-three")).resolves.toEqual([]);
    expect((query.mock.calls[0] as unknown as [string, unknown[]])[1]).toEqual(["user-1", ["lesson-three"]]);
  });
});
