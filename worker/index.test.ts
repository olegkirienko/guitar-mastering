import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import type { Env } from "./index";

function createEnv(ready: number | Error = 1): Env {
  const first = ready instanceof Error
    ? vi.fn().mockRejectedValue(ready)
    : vi.fn().mockResolvedValue({ ready });

  return {
    ASSETS: {
      fetch: vi.fn().mockResolvedValue(new Response("asset")),
    } as unknown as Fetcher,
    DB: {
      prepare: vi.fn().mockReturnValue({ first }),
    } as unknown as D1Database,
  };
}

describe("Worker routing", () => {
  it("returns health without querying D1", async () => {
    const env = createEnv();
    const response = await worker.fetch!(new Request("https://example.test/api/v1/health"), env);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it("reports readiness after a D1 query", async () => {
    const response = await worker.fetch!(new Request("https://example.test/api/v1/readiness"), createEnv());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ready" });
  });

  it("returns a safe unavailable response when D1 fails", async () => {
    const response = await worker.fetch!(new Request("https://example.test/api/v1/readiness"), createEnv(new Error("secret")));
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toContain("SERVICE_UNAVAILABLE");
    expect(body).not.toContain("secret");
  });

  it("keeps unknown API routes in JSON", async () => {
    const response = await worker.fetch!(new Request("https://example.test/api/v1/missing"), createEnv());

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("rejects unsupported methods with an Allow header", async () => {
    const response = await worker.fetch!(new Request("https://example.test/api/v1/health", { method: "POST" }), createEnv());

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });

  it("delegates non-API requests to static assets", async () => {
    const env = createEnv();
    const response = await worker.fetch!(new Request("https://example.test/lesson"), env);

    expect(await response.text()).toBe("asset");
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
  });
});
