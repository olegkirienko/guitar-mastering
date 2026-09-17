import type { Response } from "express";

interface ErrorOptions {
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  current?: unknown;
}

export function sendApiError(
  response: Response,
  status: number,
  code: string,
  message: string,
  requestId: string,
  options: ErrorOptions = {},
): void {
  response.status(status);
  response.set({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Request-Id": requestId,
    ...options.headers,
  });
  response.json({
    error: {
      code,
      message,
      ...(options.fields ? { fields: options.fields } : {}),
      ...(options.current ? { current: options.current } : {}),
      requestId,
    },
  });
}
