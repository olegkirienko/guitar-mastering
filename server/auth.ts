import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { ServerConfig } from "./config.ts";
import { AuthBusyError, hashPassword, PasswordWorkService, performDummyPasswordWork, verifyPassword } from "./password.ts";

const SESSION_MS = 30 * 24 * 60 * 60 * 1_000;
const USERNAME = /^[A-Za-z0-9._-]{3,32}$/;

export const AVATAR_IDS = ["cedar", "ocean", "sunset", "forest"] as const;
export interface ProfileView { firstName: string | null; lastName: string | null; avatarId: string | null }
export interface UserView { id: string; username: string; profile: ProfileView }
export interface SessionResult { user: UserView; token: string }
export class AuthError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function normalizedUsername(value: unknown): string {
  if (typeof value !== "string" || !USERNAME.test(value)) {
    throw new AuthError(422, "INVALID_FIELDS", "Check the highlighted fields.", { username: "Use 3–32 letters, numbers, dots, underscores, or hyphens." });
  }
  return value.toLowerCase();
}

function validPassword(value: unknown): string {
  if (typeof value !== "string" || [...value].length < 12 || [...value].length > 128 || Buffer.byteLength(value) > 1_024) {
    throw new AuthError(422, "INVALID_FIELDS", "Check the highlighted fields.", { password: "Use 12–128 characters." });
  }
  return value;
}

function optionalProfileName(value: unknown, field: "firstName" | "lastName"): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new AuthError(422, "INVALID_FIELDS", "Check the highlighted fields.", { [field]: "Enter up to 80 characters or leave this blank." });
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if ([...trimmed].length > 80) throw new AuthError(422, "INVALID_FIELDS", "Check the highlighted fields.", { [field]: "Enter up to 80 characters." });
  return trimmed;
}

function profileView(row: { first_name?: string | null; last_name?: string | null; avatar_id?: string | null }): ProfileView {
  return { firstName: row.first_name ?? null, lastName: row.last_name ?? null, avatarId: row.avatar_id ?? null };
}

function tokenHash(token: string): Buffer { return createHash("sha256").update(token, "base64url").digest(); }
function limiterHash(secret: string, value: string): Buffer { return createHmac("sha256", secret).update(value).digest(); }

interface PasswordOperations {
  hash(password: string): Promise<string>;
  verify(password: string, encoded: string): Promise<boolean>;
  dummy(password: string): Promise<void>;
}

const defaultPasswordOperations: PasswordOperations = {
  hash: hashPassword,
  verify: verifyPassword,
  dummy: performDummyPasswordWork,
};

async function transaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export class AuthService {
  readonly passwords: PasswordWorkService;
  private readonly pool: Pool;
  private readonly config: ServerConfig;
  private readonly passwordOperations: PasswordOperations;
  constructor(pool: Pool, config: ServerConfig, passwordOperations: PasswordOperations = defaultPasswordOperations) {
    this.pool = pool;
    this.config = config;
    this.passwordOperations = passwordOperations;
    this.passwords = new PasswordWorkService(config.argon2MaxActive, config.argon2MaxQueue);
  }

  private async rateLimit(action: "register" | "login", username: string, network: string): Promise<void> {
    const limits = action === "register" ? [5, 20] : [10, 30];
    const window = new Date(Math.floor(Date.now() / 60_000) * 60_000);
    for (const [index, value] of [username, network].entries()) {
      const result = await this.pool.query<{ request_count: number }>(`
        INSERT INTO auth_rate_limits(action, key_hash, window_started_at, request_count, expires_at)
        VALUES ($1, $2, $3, 1, $3::timestamptz + interval '2 minutes')
        ON CONFLICT (action, key_hash, window_started_at) DO UPDATE
        SET request_count = auth_rate_limits.request_count + 1
        RETURNING request_count
      `, [`${action}:${index === 0 ? "username" : "network"}`, limiterHash(this.config.rateLimitHmacKey, value), window]);
      if ((result.rows[0]?.request_count ?? limits[index]!) > limits[index]!) {
        throw new AuthError(429, "RATE_LIMITED", "Too many attempts. Try again later.");
      }
    }
    void this.pool.query("DELETE FROM auth_rate_limits WHERE ctid IN (SELECT ctid FROM auth_rate_limits WHERE expires_at < now() LIMIT 100)").catch(() => undefined);
  }

  async register(body: unknown, network: string): Promise<SessionResult> {
    const record = body as Record<string, unknown> | null;
    const username = typeof record?.username === "string" ? record.username : record?.username;
    const normalized = normalizedUsername(username);
    const password = validPassword(record?.password);
    await this.rateLimit("register", normalized, network);
    return this.passwords.run(async () => {
      const passwordHash = await this.passwordOperations.hash(password);
      try {
        return await transaction(this.pool, async (client) => {
          const id = randomUUID();
          const created = await client.query<{ id: string; username: string }>(`
            INSERT INTO users(id, username, username_normalized, password_hash, created_at, updated_at)
            VALUES ($1, $2, $3, $4, now(), now()) RETURNING id, username
          `, [id, username, normalized, passwordHash]);
          await client.query("INSERT INTO profiles(user_id, updated_at) VALUES ($1, now())", [id]);
          const token = await this.createSession(client, id);
          return { user: { ...created.rows[0]!, profile: profileView({}) }, token };
        });
      } catch (error) {
        if ((error as { code?: string }).code === "23505") throw new AuthError(409, "USERNAME_UNAVAILABLE", "That username is unavailable.");
        throw error;
      }
    });
  }

  async login(body: unknown, network: string, incomingToken?: string): Promise<SessionResult> {
    const record = body as Record<string, unknown> | null;
    const normalized = normalizedUsername(record?.username);
    const password = validPassword(record?.password);
    await this.rateLimit("login", normalized, network);
    return this.passwords.run(async () => {
      const found = await this.pool.query<{ id: string; username: string; password_hash: string; first_name: string | null; last_name: string | null; avatar_id: string | null }>(
        `SELECT u.id, u.username, u.password_hash, p.first_name, p.last_name, p.avatar_id
         FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.username_normalized = $1`, [normalized],
      );
      const user = found.rows[0];
      const valid = user ? await this.passwordOperations.verify(password, user.password_hash) : (await this.passwordOperations.dummy(password), false);
      if (!user || !valid) throw new AuthError(401, "INVALID_CREDENTIALS", "Invalid username or password.");
      return transaction(this.pool, async (client) => {
        await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
        if (incomingToken) await client.query("DELETE FROM sessions WHERE token_hash = $1 AND expires_at > now()", [tokenHash(incomingToken)]);
        await client.query("DELETE FROM sessions WHERE user_id = $1 AND expires_at <= now()", [user.id]);
        const token = await this.createSession(client, user.id);
        await client.query(`DELETE FROM sessions WHERE token_hash IN (
          SELECT token_hash FROM sessions WHERE user_id = $1 AND expires_at > now() AND token_hash <> $2
          ORDER BY created_at DESC, token_hash DESC OFFSET 9
        )`, [user.id, tokenHash(token)]);
        return { user: { id: user.id, username: user.username, profile: profileView(user) }, token };
      });
    });
  }

  private async createSession(client: PoolClient, userId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");
    await client.query("INSERT INTO sessions(token_hash, user_id, created_at, expires_at) VALUES ($1, $2, now(), $3)", [tokenHash(token), userId, new Date(Date.now() + SESSION_MS)]);
    return token;
  }

  async session(token?: string): Promise<UserView | null> {
    if (!token) return null;
    const result = await this.pool.query<{ id: string; username: string; first_name: string | null; last_name: string | null; avatar_id: string | null }>(`
      SELECT u.id, u.username, p.first_name, p.last_name, p.avatar_id
      FROM sessions s JOIN users u ON u.id = s.user_id JOIN profiles p ON p.user_id = u.id
      WHERE s.token_hash = $1 AND s.expires_at > now()`, [tokenHash(token)]);
    const user = result.rows[0];
    return user ? { id: user.id, username: user.username, profile: profileView(user) } : null;
  }

  async updateProfile(token: string | undefined, body: unknown): Promise<ProfileView> {
    const user = await this.session(token);
    if (!user) throw new AuthError(401, "UNAUTHENTICATED", "Authentication is required.");
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AuthError(422, "INVALID_FIELDS", "Check the highlighted fields.");
    }
    const record = body as Record<string, unknown>;
    const allowed = new Set(["firstName", "lastName", "avatarId"]);
    if (Object.keys(record).length === 0 || Object.keys(record).some((key) => !allowed.has(key))) {
      throw new AuthError(422, "INVALID_FIELDS", "Provide at least one supported profile field.");
    }
    const assignments: string[] = [];
    const values: unknown[] = [user.id];
    const assign = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };
    if ("firstName" in record) assign("first_name", optionalProfileName(record.firstName, "firstName"));
    if ("lastName" in record) assign("last_name", optionalProfileName(record.lastName, "lastName"));
    if ("avatarId" in record) {
      if (record.avatarId !== null && (typeof record.avatarId !== "string" || !(AVATAR_IDS as readonly string[]).includes(record.avatarId))) {
        throw new AuthError(422, "INVALID_FIELDS", "Check the highlighted fields.", { avatarId: "Choose an available avatar." });
      }
      assign("avatar_id", record.avatarId);
    }
    const updated = await this.pool.query<{ first_name: string | null; last_name: string | null; avatar_id: string | null }>(`
      UPDATE profiles SET ${assignments.join(", ")}, updated_at = now()
      WHERE user_id = $1 RETURNING first_name, last_name, avatar_id
    `, values);
    if (!updated.rows[0]) throw new AuthError(401, "UNAUTHENTICATED", "Authentication is required.");
    return profileView(updated.rows[0]);
  }

  async logout(token?: string): Promise<void> {
    if (token) await this.pool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
  }

  async deleteAccount(token: string | undefined, body: unknown): Promise<void> {
    const user = await this.session(token);
    if (!user) throw new AuthError(401, "UNAUTHENTICATED", "Authentication is required.");
    const password = validPassword((body as Record<string, unknown> | null)?.password);
    await this.passwords.run(async () => {
      const result = await this.pool.query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
      const valid = result.rows[0]
        ? await this.passwordOperations.verify(password, result.rows[0].password_hash)
        : (await this.passwordOperations.dummy(password), false);
      if (!valid) {
        throw new AuthError(401, "INVALID_CREDENTIALS", "Invalid username or password.");
      }
      await transaction(this.pool, async (client) => {
        await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
        await client.query("DELETE FROM users WHERE id = $1", [user.id]);
      });
    });
  }
}

export function isAuthBusy(error: unknown): error is AuthBusyError { return error instanceof AuthBusyError; }

export async function assertNoLegacyPasswordHashes(pool: Pool): Promise<void> {
  const result = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM users WHERE password_hash LIKE 'v1$%' OR password_hash LIKE 'v2$%' OR password_hash LIKE 'v3$%') AS exists",
  );
  if (result.rows[0]?.exists) throw new Error("Legacy experimental password hashes require an explicit migration decision.");
}
