import { Router } from "express";
import { isIP } from "node:net";
import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "./auth.ts";
import { AuthError, isAuthBusy } from "./auth.ts";
import { sendApiError } from "./http.ts";

interface AuthRouterOptions {
  auth: AuthService;
  publicOrigin: string;
  secureCookies: boolean;
}

function cookieName(secure: boolean): string { return secure ? "__Host-gm_session" : "gm_session"; }
export function readSessionCookie(request: Request, secure: boolean): string | undefined {
  const name = cookieName(secure);
  for (const item of (request.headers.cookie ?? "").split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return parts.join("=");
  }
  return undefined;
}

function setSessionCookie(response: Response, token: string, secure: boolean): void {
  response.cookie(cookieName(secure), token, {
    secure, httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1_000,
  });
}

function clearSessionCookie(response: Response, secure: boolean): void {
  response.clearCookie(cookieName(secure), { secure, httpOnly: true, sameSite: "lax", path: "/" });
}

export function coarseNetworkPrefix(address: string | undefined): string {
  if (!address) return "unknown";
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1];
  const candidate = mapped ?? address.split("%")[0]!;
  if (isIP(candidate) === 4) return `${candidate.split(".").slice(0, 3).join(".")}.0/24`;
  if (isIP(candidate) !== 6) return "unknown";
  const [left = "", right = ""] = candidate.split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const parts = [...leftParts, ...Array(8 - leftParts.length - rightParts.length).fill("0"), ...rightParts]
    .map((part) => Number.parseInt(part || "0", 16));
  return `${parts[0]!.toString(16)}:${parts[1]!.toString(16)}:${parts[2]!.toString(16)}:${(parts[3]! & 0xff00).toString(16)}::/56`;
}

export function createAuthRouter({ auth, publicOrigin, secureCookies }: AuthRouterOptions): Router {
  const router = Router();
  router.use((_request, response, next) => {
    response.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    next();
  });
  router.use((request, response, next) => {
    if (request.method === "GET") return next();
    if (request.get("origin") !== publicOrigin) {
      sendApiError(response, 403, "ORIGIN_FORBIDDEN", "Request origin is not allowed.", response.locals.requestId as string);
      return;
    }
    if (!request.is("application/json")) {
      sendApiError(response, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.", response.locals.requestId as string);
      return;
    }
    next();
  });

  router.post("/auth/register", async (request, response) => {
    const result = await auth.register(request.body, coarseNetworkPrefix(request.ip));
    setSessionCookie(response, result.token, secureCookies);
    response.status(201).json({ user: result.user });
  });
  router.post("/auth/login", async (request, response) => {
    const result = await auth.login(request.body, coarseNetworkPrefix(request.ip), readSessionCookie(request, secureCookies));
    setSessionCookie(response, result.token, secureCookies);
    response.json({ user: result.user });
  });
  router.post("/auth/logout", async (request, response) => {
    await auth.logout(readSessionCookie(request, secureCookies));
    clearSessionCookie(response, secureCookies);
    response.status(204).end();
  });
  router.get("/session", async (request, response) => {
    response.json({ user: await auth.session(readSessionCookie(request, secureCookies)) });
  });
  router.patch("/profile", async (request, response) => {
    response.json({ profile: await auth.updateProfile(readSessionCookie(request, secureCookies), request.body) });
  });
  router.delete("/account", async (request, response) => {
    await auth.deleteAccount(readSessionCookie(request, secureCookies), request.body);
    clearSessionCookie(response, secureCookies);
    response.status(204).end();
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    const requestId = response.locals.requestId as string;
    if (error instanceof AuthError) {
      sendApiError(response, error.status, error.code, error.message, requestId, { fields: error.fields });
      return;
    }
    if (isAuthBusy(error)) {
      sendApiError(response, 503, "AUTH_BUSY", "Authentication is temporarily busy.", requestId, { headers: { "Retry-After": "1" } });
      return;
    }
    if (error instanceof Error) {
      sendApiError(response, 503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.", requestId);
      return;
    }
    next(error);
  });
  return router;
}
