import type { AddressInfo } from "node:net";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.ts";

let distDirectory: string;
const servers: Array<ReturnType<ReturnType<typeof createApp>["listen"]>> = [];

async function start(pool: { query(queryText: string): Promise<unknown> }, secureCookies = false) {
  const app = createApp({ pool, distDirectory, deploymentVersion: "test-version", logger: vi.fn(), secureCookies });
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

beforeEach(async () => {
  distDirectory = await mkdtemp(path.join(tmpdir(), "guitar-mastering-server-"));
  await mkdir(path.join(distDirectory, "assets"));
  await writeFile(path.join(distDirectory, "index.html"), "<main>SPA shell</main>");
  await writeFile(path.join(distDirectory, "assets", "app-hash.js"), "export {};");
});

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("Node web service", () => {
  it("reports liveness without touching PostgreSQL", async () => {
    const query = vi.fn(async () => undefined);
    const origin = await start({ query });
    const response = await fetch(`${origin}/api/v1/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
    expect(query).not.toHaveBeenCalled();
  });

  it("uses a bounded PostgreSQL probe for readiness", async () => {
    const query = vi.fn(async () => ({ rows: [{ ready: 1 }] }));
    const origin = await start({ query });
    const response = await fetch(`${origin}/api/v1/readiness`);

    expect(response.status).toBe(200);
    expect(query).toHaveBeenCalledWith("SELECT 1 AS ready");
  });

  it("redacts database failures behind the stable JSON error envelope", async () => {
    const origin = await start({ query: vi.fn(async () => { throw new Error("postgresql://secret"); }) });
    const response = await fetch(`${origin}/api/v1/readiness`);
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toContain("SERVICE_UNAVAILABLE");
    expect(body).not.toContain("postgresql://secret");
  });

  it("keeps unknown and unsupported API requests in JSON", async () => {
    const origin = await start({ query: vi.fn(async () => undefined) });
    const wrongMethod = await fetch(`${origin}/api/v1/health`, { method: "POST" });
    const missing = await fetch(`${origin}/api/v1/auth/login`);

    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("allow")).toBe("GET");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("application/json");
    await expect(missing.json()).resolves.toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("serves immutable assets and revalidated SPA fallbacks", async () => {
    const origin = await start({ query: vi.fn(async () => undefined) });
    const asset = await fetch(`${origin}/assets/app-hash.js`);
    const spa = await fetch(`${origin}/lesson/deep-link`);

    expect(asset.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(spa.headers.get("cache-control")).toBe("no-cache");
    expect(await spa.text()).toContain("SPA shell");
  });

  it("sets browser security policy headers and enables HSTS only for secure deployments", async () => {
    const localOrigin = await start({ query: vi.fn(async () => undefined) });
    const local = await fetch(localOrigin);
    expect(local.headers.get("content-security-policy-report-only")).toContain("frame-ancestors 'none'");
    expect(local.headers.get("permissions-policy")).toBe("camera=(), geolocation=(), microphone=()");
    expect(local.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(local.headers.get("x-content-type-options")).toBe("nosniff");
    expect(local.headers.get("strict-transport-security")).toBeNull();

    const productionOrigin = await start({ query: vi.fn(async () => undefined) }, true);
    const production = await fetch(productionOrigin);
    expect(production.headers.get("strict-transport-security")).toBe("max-age=31536000; includeSubDomains");
  });
});
