import type { AddressInfo } from "node:net";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthService } from "./auth.ts";
import { AuthError } from "./auth.ts";
import { createApp } from "./app.ts";
import type { ApplicationLogger } from "./logger.ts";
import { AuthBusyError } from "./password.ts";

const servers: Array<ReturnType<ReturnType<typeof createApp>["listen"]>> = [];
let distDirectory: string;

async function start(auth: AuthService, trustedProxyHops = 0, logger: ApplicationLogger = vi.fn()) {
  const app = createApp({
    pool: { query: vi.fn(async () => undefined) }, distDirectory, deploymentVersion: "test",
    logger, auth, publicOrigin: "https://guitar.example", secureCookies: true, trustedProxyHops,
  });
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeEach(async () => {
  distDirectory = await mkdtemp(path.join(tmpdir(), "guitar-auth-routes-"));
  await writeFile(path.join(distDirectory, "index.html"), "SPA");
});
afterEach(async () => Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve())))));

function fakeAuth(overrides: Partial<Record<keyof AuthService, unknown>> = {}): AuthService {
  return {
    register: vi.fn(async () => ({ user: { id: "u1", username: "Player.One", profile: { firstName: null, lastName: null, avatarId: null } }, token: "secret-token" })),
    login: vi.fn(async () => ({ user: { id: "u1", username: "Player.One", profile: { firstName: null, lastName: null, avatarId: null } }, token: "new-token" })),
    logout: vi.fn(async () => undefined), session: vi.fn(async () => null), deleteAccount: vi.fn(async () => undefined),
    updateProfile: vi.fn(async () => ({ firstName: "Леся", lastName: null, avatarId: "forest" })),
    ...overrides,
  } as unknown as AuthService;
}

describe("authentication HTTP boundary", () => {
  it("sets a secure host-only HttpOnly session cookie without exposing the token", async () => {
    const origin = await start(fakeAuth());
    const response = await fetch(`${origin}/api/v1/auth/register`, {
      method: "POST", headers: { origin: "https://guitar.example", "content-type": "application/json" },
      body: JSON.stringify({ username: "Player.One", password: "correct horse guitar" }),
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toMatch(/^__Host-gm_session=secret-token; Max-Age=2592000; Path=\/; Expires=.*; HttpOnly; Secure; SameSite=Lax$/);
    expect(await response.text()).not.toContain("secret-token");
  });

  it("rejects untrusted origins, wrong media types, malformed JSON, and oversized bodies", async () => {
    const origin = await start(fakeAuth());
    const send = (headers: Record<string, string>, body: string) => fetch(`${origin}/api/v1/auth/login`, { method: "POST", headers, body });
    expect((await send({ origin: "https://evil.example", "content-type": "application/json" }, "{}")).status).toBe(403);
    expect((await send({ origin: "https://guitar.example", "content-type": "text/plain" }, "{}")).status).toBe(415);
    expect((await send({ origin: "https://guitar.example", "content-type": "application/json" }, "{")).status).toBe(400);
    expect((await send({ origin: "https://guitar.example", "content-type": "application/json" }, JSON.stringify({ value: "x".repeat(17_000) }))).status).toBe(413);
  });

  it("keeps validation errors stable and does not trust spoofed forwarding by default", async () => {
    const register = vi.fn(async (_body: unknown, _network: string) => { throw new AuthError(422, "INVALID_FIELDS", "Check fields.", { username: "Invalid." }); });
    const origin = await start(fakeAuth({ register }));
    const response = await fetch(`${origin}/api/v1/auth/register`, {
      method: "POST", headers: { origin: "https://guitar.example", "content-type": "application/json", "x-forwarded-for": "203.0.113.10" }, body: "{}",
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_FIELDS", fields: { username: "Invalid." } } });
    expect(register.mock.calls[0]?.[1]).toBe("127.0.0.0/24");
  });

  it("trusts only the configured nearest ingress hop", async () => {
    const register = vi.fn(async (_body: unknown, _network: string) => ({ user: { id: "u1", username: "Player.One" }, token: "token" }));
    const origin = await start(fakeAuth({ register }), 1);
    await fetch(`${origin}/api/v1/auth/register`, {
      method: "POST",
      headers: { origin: "https://guitar.example", "content-type": "application/json", "x-forwarded-for": "198.51.100.99, 203.0.113.10" },
      body: JSON.stringify({ username: "Player.One", password: "correct horse guitar" }),
    });
    expect(register.mock.calls[0]?.[1]).toBe("203.0.113.0/24");
  });

  it("logs the original API route after a mounted auth router returns an admission-control 503", async () => {
    const logger = vi.fn<ApplicationLogger>();
    const register = vi.fn(async () => { throw new AuthBusyError(); });
    const origin = await start(fakeAuth({ register }), 0, logger);

    const response = await fetch(`${origin}/api/v1/auth/register`, {
      method: "POST",
      headers: { origin: "https://guitar.example", "content-type": "application/json" },
      body: JSON.stringify({ username: "Player.One", password: "correct horse guitar" }),
    });

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("1");
    expect(logger).toHaveBeenCalledOnce();
    expect(logger).toHaveBeenCalledWith({
      event: "request_completed",
      requestId: response.headers.get("x-request-id"),
      route: "/api/*",
      method: "POST",
      status: 503,
      durationMs: expect.any(Number),
      deploymentVersion: "test",
      outcome: "server_error",
    });
  });

  it("updates only an authenticated catalog profile and exposes no cacheable response", async () => {
    const updateProfile = vi.fn(async () => ({ firstName: "Леся", lastName: null, avatarId: "forest" }));
    const origin = await start(fakeAuth({ updateProfile }));
    const response = await fetch(`${origin}/api/v1/profile`, {
      method: "PATCH",
      headers: { origin: "https://guitar.example", "content-type": "application/json", cookie: "__Host-gm_session=session-token" },
      body: JSON.stringify({ firstName: " Леся ", avatarId: "forest" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(updateProfile).toHaveBeenCalledWith("session-token", { firstName: " Леся ", avatarId: "forest" });
    await expect(response.json()).resolves.toEqual({ profile: { firstName: "Леся", lastName: null, avatarId: "forest" } });
  });
});
