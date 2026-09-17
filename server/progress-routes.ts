import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { readSessionCookie } from "./auth-routes.ts";
import { sendApiError } from "./http.ts";
import { ProgressError, type ProgressService } from "./progress.ts";

export function createProgressRouter(progress: ProgressService, secureCookies: boolean): Router {
  const router = Router();
  router.get("/progress", async (request, response) => {
    response.json({ items: await progress.list(readSessionCookie(request, secureCookies)) });
  });
  router.get("/progress/:lessonId", async (request, response) => {
    response.json({ item: await progress.get(readSessionCookie(request, secureCookies), request.params.lessonId!) });
  });
  router.put("/progress/:lessonId", async (request, response) => {
    response.json({ item: await progress.put(readSessionCookie(request, secureCookies), request.params.lessonId!, request.body) });
  });
  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    const requestId = response.locals.requestId as string;
    if (error instanceof ProgressError) {
      sendApiError(response, error.status, error.code, error.message, requestId, error.current ? { current: error.current } : undefined);
      return;
    }
    if (error instanceof Error) {
      sendApiError(response, 503, "PROGRESS_UNAVAILABLE", "Progress is temporarily unavailable.", requestId);
      return;
    }
    next(error);
  });
  return router;
}
