import { randomUUID } from "node:crypto";
import path from "node:path";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { ReadinessPool } from "./database.ts";
import type { AuthService } from "./auth.ts";
import { createAuthRouter } from "./auth-routes.ts";
import { createProgressRouter } from "./progress-routes.ts";
import type { ProgressService } from "./progress.ts";
import { sendApiError } from "./http.ts";
import { applicationLogger, requestOutcome } from "./logger.ts";
import type { ApplicationLogger } from "./logger.ts";

interface AppOptions {
  pool: ReadinessPool;
  distDirectory: string;
  deploymentVersion: string;
  logger?: ApplicationLogger;
  auth?: AuthService;
  publicOrigin?: string;
  secureCookies?: boolean;
  trustedProxyHops?: number;
  progress?: ProgressService;
}

const apiRoutes = new Set(["/api/v1/health", "/api/v1/readiness"]);

export function createApp({ pool, distDirectory, deploymentVersion, logger = applicationLogger, auth, publicOrigin, secureCookies = false, trustedProxyHops = 0, progress }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustedProxyHops);

  app.use((_request, response, next) => {
    response.set({
      "Content-Security-Policy-Report-Only": [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self'",
        "font-src 'self' data:",
        "frame-ancestors 'none'",
        "img-src 'self' data:",
        "object-src 'none'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
      ].join("; "),
      "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    });
    if (secureCookies) {
      response.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = performance.now();
    const requestId = randomUUID();
    const route = apiRoutes.has(request.path) ? request.path : request.path.startsWith("/api/") ? "/api/*" : "/*";
    response.locals.requestId = requestId;
    response.set("X-Request-Id", requestId);
    response.on("finish", () => {
      logger({
        event: "request_completed",
        requestId,
        route,
        method: request.method,
        status: response.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        deploymentVersion,
        outcome: requestOutcome(response.statusCode),
      });
    });
    next();
  });

  app.get("/api/v1/health", (_request, response) => {
    response.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.json({ status: "ok", requestId: response.locals.requestId as string });
  });

  app.get("/api/v1/readiness", async (_request, response) => {
    const requestId = response.locals.requestId as string;
    try {
      await pool.query("SELECT 1 AS ready");
      response.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      response.json({ status: "ready", requestId });
    } catch {
      sendApiError(response, 503, "SERVICE_UNAVAILABLE", "Persistence is unavailable.", requestId);
    }
  });

  if (auth && publicOrigin) {
    const authMethods = new Map([
      ["/api/v1/auth/register", "POST"], ["/api/v1/auth/login", "POST"],
      ["/api/v1/auth/logout", "POST"], ["/api/v1/session", "GET"], ["/api/v1/profile", "PATCH"],
      ["/api/v1/account", "DELETE"],
    ]);
    app.use((request, response, next) => {
      const allowed = authMethods.get(request.path)
        ?? (request.path === "/api/v1/progress" ? "GET" : /^\/api\/v1\/progress\/[^/]+$/.test(request.path) ? "GET, PUT" : undefined);
      if (!allowed || request.method === allowed) return next();
      if (allowed.includes(request.method)) return next();
      sendApiError(response, 405, "METHOD_NOT_ALLOWED", "Method not allowed.", response.locals.requestId as string, { headers: { Allow: allowed } });
    });
    app.use("/api/v1", express.json({ limit: "16kb", strict: true }), createAuthRouter({ auth, publicOrigin, secureCookies }));
    if (progress) app.use("/api/v1", createProgressRouter(progress, secureCookies));
  }

  app.use((request, response, next) => {
    if (!apiRoutes.has(request.path)) return next();
    sendApiError(
      response,
      405,
      "METHOD_NOT_ALLOWED",
      "Method not allowed.",
      response.locals.requestId as string,
      { headers: { Allow: "GET" } },
    );
  });

  app.use((request, response, next) => {
    if (request.path !== "/api" && !request.path.startsWith("/api/")) return next();
    sendApiError(
      response,
      404,
      "NOT_FOUND",
      "API route not found.",
      response.locals.requestId as string,
    );
  });

  app.use(express.static(distDirectory, {
    index: false,
    setHeaders(response, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }));

  app.use((request, response, next) => {
    if (request.method !== "GET" && request.method !== "HEAD") return next();
    response.set("Cache-Control", "no-cache");
    response.sendFile(path.join(distDirectory, "index.html"), (error) => {
      if (error && !response.headersSent) next(error);
    });
  });

  app.use((_request, response) => {
    sendApiError(
      response,
      404,
      "NOT_FOUND",
      "Resource not found.",
      response.locals.requestId as string,
    );
  });

  app.use((_error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (response.headersSent) return;
    const error = _error as { type?: string; status?: number };
    if (error.type === "entity.too.large" || error.status === 413) {
      sendApiError(response, 413, "BODY_TOO_LARGE", "Request body is too large.", response.locals.requestId as string);
      return;
    }
    if (error.type === "entity.parse.failed") {
      sendApiError(response, 400, "MALFORMED_JSON", "Request body is malformed.", response.locals.requestId as string);
      return;
    }
    sendApiError(
      response,
      500,
      "INTERNAL_ERROR",
      "Something went wrong.",
      response.locals.requestId as string,
    );
  });

  return app;
}
