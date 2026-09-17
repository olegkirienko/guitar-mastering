import { describe, expect, it } from "vitest";
import { APPLICATION_ID, createJsonLogger, requestOutcome } from "./logger.ts";

describe("application logger", () => {
  it("emits parseable request JSON with stable bounded fields", () => {
    const lines: string[] = [];
    const logger = createJsonLogger((line) => lines.push(line));

    logger({
      event: "request_completed",
      requestId: "request-id",
      route: "/api/*",
      method: "POST",
      status: 503,
      durationMs: 12.5,
      deploymentVersion: "commit-sha",
      outcome: requestOutcome(503),
    });

    expect(JSON.parse(lines[0])).toEqual({
      application: APPLICATION_ID,
      event: "request_completed",
      requestId: "request-id",
      route: "/api/*",
      method: "POST",
      status: 503,
      durationMs: 12.5,
      deploymentVersion: "commit-sha",
      outcome: "server_error",
    });
  });

  it("allowlists lifecycle fields and excludes secret-bearing extras", () => {
    const lines: string[] = [];
    const logger = createJsonLogger((line) => lines.push(line));
    const entry = {
      event: "server_started" as const,
      port: 3000,
      appEnv: "production",
      deploymentVersion: "commit-sha",
      databaseUrl: "postgresql://user:secret@database/app",
      publicOrigin: "https://secret.example",
      body: { password: "correct horse battery staple" },
      error: new Error("thrown secret"),
    };

    logger(entry);

    const parsed = JSON.parse(lines[0]);
    expect(parsed).toEqual({
      application: APPLICATION_ID,
      event: "server_started",
      port: 3000,
      appEnv: "production",
      deploymentVersion: "commit-sha",
    });
    expect(lines[0]).not.toMatch(/postgresql|secret\.example|password|thrown secret/);
  });

  it.each([
    [200, "success"],
    [399, "success"],
    [400, "client_error"],
    [499, "client_error"],
    [500, "server_error"],
  ] as const)("maps status %i to %s", (status, expected) => {
    expect(requestOutcome(status)).toBe(expected);
  });
});
