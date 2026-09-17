import type { AddressInfo } from "node:net";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthService } from "./auth.ts";
import { createApp } from "./app.ts";
import { ProgressError, type ProgressService } from "./progress.ts";

const servers: Array<ReturnType<ReturnType<typeof createApp>["listen"]>> = [];
let distDirectory: string;

function fakeAuth(): AuthService {
  return { session: vi.fn(async () => null) } as unknown as AuthService;
}

async function start(progress: ProgressService) {
  const app = createApp({
    pool: { query: vi.fn(async () => undefined) }, distDirectory, deploymentVersion: "test", logger: vi.fn(),
    auth: fakeAuth(), progress, publicOrigin: "https://guitar.example", secureCookies: true,
  });
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeEach(async () => {
  distDirectory = await mkdtemp(path.join(tmpdir(), "guitar-progress-routes-"));
  await writeFile(path.join(distDirectory, "index.html"), "SPA");
});
afterEach(async () => Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve())))));

describe("progress HTTP boundary", () => {
  it("returns authenticated progress with no-store caching and the session cookie", async () => {
    const list = vi.fn(async () => []);
    const origin = await start({ list } as unknown as ProgressService);
    const response = await fetch(`${origin}/api/v1/progress`, { headers: { cookie: "__Host-gm_session=session-token" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(list).toHaveBeenCalledWith("session-token");
    await expect(response.json()).resolves.toEqual({ items: [] });
  });

  it("returns the current item in a stable revision-conflict envelope", async () => {
    const current = { lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1, progress: {}, revision: 2, updatedAt: "2026-09-16T00:00:00.000Z" };
    const put = vi.fn(async () => { throw new ProgressError(409, "REVISION_CONFLICT", "Changed.", current as never); });
    const origin = await start({ put } as unknown as ProgressService);
    const response = await fetch(`${origin}/api/v1/progress/stage-01-lesson-01`, {
      method: "PUT", headers: { origin: "https://guitar.example", "content-type": "application/json" }, body: "{}",
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "REVISION_CONFLICT", current: { revision: 2 } } });
  });

  it("enforces origin, media type, and progress route methods", async () => {
    const origin = await start({ put: vi.fn() } as unknown as ProgressService);
    expect((await fetch(`${origin}/api/v1/progress/stage-01-lesson-01`, {
      method: "PUT", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}",
    })).status).toBe(403);
    expect((await fetch(`${origin}/api/v1/progress/stage-01-lesson-01`, {
      method: "PUT", headers: { origin: "https://guitar.example", "content-type": "text/plain" }, body: "{}",
    })).status).toBe(415);
    const unsupported = await fetch(`${origin}/api/v1/progress/stage-01-lesson-01`, { method: "DELETE" });
    expect(unsupported.status).toBe(405);
    expect(unsupported.headers.get("allow")).toBe("GET, PUT");
  });
});
