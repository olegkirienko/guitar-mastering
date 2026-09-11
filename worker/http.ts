export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

const apiHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function jsonResponse(
  body: unknown,
  status: number,
  requestId: string,
  headers?: HeadersInit,
): Response {
  return Response.json(body, {
    status,
    headers: {
      ...apiHeaders,
      "X-Request-Id": requestId,
      ...headers,
    },
  });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  requestId: string,
  headers?: HeadersInit,
): Response {
  const body: ApiErrorBody = {
    error: { code, message, requestId },
  };

  return jsonResponse(body, status, requestId, headers);
}
