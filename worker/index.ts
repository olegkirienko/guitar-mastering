import { apiError, jsonResponse } from "./http";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const routes = new Set(["/api/v1/health", "/api/v1/readiness"]);

async function handleApi(request: Request, env: Env, requestId: string): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (!routes.has(pathname)) {
    return apiError(404, "NOT_FOUND", "API route not found.", requestId);
  }

  if (request.method !== "GET") {
    return apiError(405, "METHOD_NOT_ALLOWED", "Method not allowed.", requestId, {
      Allow: "GET",
    });
  }

  if (pathname === "/api/v1/health") {
    return jsonResponse({ status: "ok", requestId }, 200, requestId);
  }

  try {
    const result = await env.DB.prepare("SELECT 1 AS ready").first<{ ready: number }>();

    if (result?.ready !== 1) {
      return apiError(503, "SERVICE_UNAVAILABLE", "Persistence is unavailable.", requestId);
    }

    return jsonResponse({ status: "ready", requestId }, 200, requestId);
  } catch {
    return apiError(503, "SERVICE_UNAVAILABLE", "Persistence is unavailable.", requestId);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith("/api/")) {
      return handleApi(request, env, crypto.randomUUID());
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
