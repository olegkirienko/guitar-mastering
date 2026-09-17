import { argon2, randomBytes, timingSafeEqual } from "node:crypto";

const POLICY = { memory: 19_456, passes: 2, parallelism: 1, tagLength: 32 } as const;
const FORMAT = /^v4\$argon2id\$m=19456,t=2,p=1,dk=32\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/;
const DUMMY_SALT = Buffer.from("Z3VpdGFyLW1hc3RlcmluZw", "base64url");

export type PasswordRecordStatus = "current" | "unusable";

export class AuthBusyError extends Error {}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2("argon2id", { message: password, nonce: salt, ...POLICY }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

export class PasswordWorkService {
  private active = 0;
  private readonly queue: Array<() => void> = [];
  private accepting = true;
  private drainResolve?: () => void;
  private readonly maxActive: number;
  private readonly maxQueue: number;

  constructor(maxActive: number, maxQueue: number) {
    this.maxActive = maxActive;
    this.maxQueue = maxQueue;
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (!this.accepting || (this.active >= this.maxActive && this.queue.length >= this.maxQueue)) {
      throw new AuthBusyError();
    }
    if (this.active >= this.maxActive) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    } else {
      this.active += 1;
    }
    try {
      return await work();
    } finally {
      const next = this.queue.shift();
      if (next) next();
      else this.active -= 1;
      if (!this.accepting && this.active === 0 && this.queue.length === 0) this.drainResolve?.();
    }
  }

  closeAndDrain(): Promise<void> {
    this.accepting = false;
    if (this.active === 0 && this.queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => { this.drainResolve = resolve; });
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const tag = await derive(password, salt);
  return `v4$argon2id$m=19456,t=2,p=1,dk=32$${salt.toString("base64url")}$${tag.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const match = FORMAT.exec(encoded);
  if (!match) {
    await derive(password, DUMMY_SALT);
    return false;
  }
  const salt = Buffer.from(match[1]!, "base64url");
  const expected = Buffer.from(match[2]!, "base64url");
  if (salt.toString("base64url") !== match[1] || expected.toString("base64url") !== match[2]) {
    await derive(password, DUMMY_SALT);
    return false;
  }
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected);
}

export function passwordRecordStatus(encoded: string): PasswordRecordStatus {
  return FORMAT.test(encoded) ? "current" : "unusable";
}

export async function performDummyPasswordWork(password: string): Promise<void> {
  await derive(password, DUMMY_SALT);
}

export async function assertPasswordCapability(): Promise<void> {
  const tag = await derive("startup-capability-check", DUMMY_SALT);
  if (tag.length !== POLICY.tagLength) throw new Error("Exact Argon2id policy is unavailable.");
}
