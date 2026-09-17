import { createServer } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { createShutdown } from "./shutdown.ts";

describe("graceful shutdown", () => {
  it("stops accepting requests and closes the pool once", async () => {
    const server = createServer((_request, response) => response.end("ok"));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const end = vi.fn(async () => undefined);
    const shutdown = createShutdown({
      server,
      pool: { query: vi.fn(async () => undefined), end },
      timeoutMs: 1_000,
      logger: vi.fn(),
    });

    await Promise.all([shutdown("SIGTERM"), shutdown("SIGTERM")]);

    expect(end).toHaveBeenCalledOnce();
    expect(server.listening).toBe(false);
  });
});
