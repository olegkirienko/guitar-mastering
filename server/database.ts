import { Pool } from "pg";
import type { ServerConfig } from "./config.ts";

export interface ReadinessPool {
  query(queryText: string): Promise<unknown>;
}

export interface ApplicationPool extends ReadinessPool {
  end(): Promise<void>;
}

export function createPool(config: ServerConfig): Pool {
  return new Pool({
    connectionString: config.databaseUrl,
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    statement_timeout: config.statementTimeoutMs,
    idle_in_transaction_session_timeout: config.transactionTimeoutMs,
    options: `-c transaction_timeout=${config.transactionTimeoutMs}`,
    application_name: "guitar-mastering",
  });
}
