export const APPLICATION_ID = "guitar-mastering";

export type RequestOutcome = "success" | "client_error" | "server_error";

export type LogEntry =
  | {
      event: "request_completed";
      requestId: string;
      route: string;
      method: string;
      status: number;
      durationMs: number;
      deploymentVersion: string;
      outcome: RequestOutcome;
    }
  | {
      event: "server_started";
      port: number;
      appEnv: string;
      deploymentVersion: string;
    }
  | {
      event: "shutdown_started" | "shutdown_complete";
      signal: NodeJS.Signals;
    };

export type ApplicationLogger = (entry: LogEntry) => void;

type LogWriter = (line: string) => void;

export function requestOutcome(status: number): RequestOutcome {
  if (status >= 500) return "server_error";
  if (status >= 400) return "client_error";
  return "success";
}

function safeLogRecord(entry: LogEntry): Record<string, unknown> {
  const base = { application: APPLICATION_ID, event: entry.event };

  switch (entry.event) {
    case "request_completed":
      return {
        ...base,
        requestId: entry.requestId,
        route: entry.route,
        method: entry.method,
        status: entry.status,
        durationMs: entry.durationMs,
        deploymentVersion: entry.deploymentVersion,
        outcome: entry.outcome,
      };
    case "server_started":
      return {
        ...base,
        port: entry.port,
        appEnv: entry.appEnv,
        deploymentVersion: entry.deploymentVersion,
      };
    case "shutdown_started":
    case "shutdown_complete":
      return { ...base, signal: entry.signal };
  }
}

export function createJsonLogger(writeLine: LogWriter = (line) => console.log(line)): ApplicationLogger {
  return (entry) => writeLine(JSON.stringify(safeLogRecord(entry)));
}

export const applicationLogger = createJsonLogger();
