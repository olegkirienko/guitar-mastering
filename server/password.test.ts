import { describe, expect, it, vi } from "vitest";
import { AuthBusyError, hashPassword, passwordRecordStatus, PasswordWorkService, verifyPassword } from "./password.ts";

describe("v4 password policy", () => {
  it("writes and verifies only the strict canonical v4 format", async () => {
    const encoded = await hashPassword("correct horse guitar");
    expect(encoded).toMatch(/^v4\$argon2id\$m=19456,t=2,p=1,dk=32\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
    await expect(verifyPassword("correct horse guitar", encoded)).resolves.toBe(true);
    await expect(verifyPassword("wrong horse guitar", encoded)).resolves.toBe(false);
    await expect(verifyPassword("correct horse guitar", encoded.replace("m=19456", "m=8192"))).resolves.toBe(false);
  });

  it("verifies an independently fixed exact-policy vector", async () => {
    const fixed = "v4$argon2id$m=19456,t=2,p=1,dk=32$AAECAwQFBgcICQoLDA0ODw$ZY3pWwt3IFMrc5msmx0G9OcjBJmvLyHzVhyPTRvzfMg";
    await expect(verifyPassword("fixed policy password", fixed)).resolves.toBe(true);
    await expect(verifyPassword("fixed policy passw0rd", fixed)).resolves.toBe(false);
    expect(passwordRecordStatus(fixed)).toBe("current");
  });

  it.each([
    "", "v3$argon2id$m=19456,t=2,p=1,dk=32$AAECAwQFBgcICQoLDA0ODw$ZY3pWwt3IFMrc5msmx0G9OcjBJmvLyHzVhyPTRvzfMg",
    "v4$argon2i$m=19456,t=2,p=1,dk=32$AAECAwQFBgcICQoLDA0ODw$ZY3pWwt3IFMrc5msmx0G9OcjBJmvLyHzVhyPTRvzfMg",
    "v4$argon2id$t=2,m=19456,p=1,dk=32$AAECAwQFBgcICQoLDA0ODw$ZY3pWwt3IFMrc5msmx0G9OcjBJmvLyHzVhyPTRvzfMg",
    "v4$argon2id$m=19456,t=2,p=1,dk=32,x=1$AAECAwQFBgcICQoLDA0ODw$ZY3pWwt3IFMrc5msmx0G9OcjBJmvLyHzVhyPTRvzfMg",
    "v4$argon2id$m=19456,t=2,p=1,dk=32$AAECAwQFBgcICQoLDA0ODw=$ZY3pWwt3IFMrc5msmx0G9OcjBJmvLyHzVhyPTRvzfMg",
    "v4$argon2id$m=19456,t=2,p=1,dk=32$AAECAwQFBgcICQoLDA0ODw$short",
  ])("rejects malformed or unsupported password record %s", async (encoded) => {
    expect(passwordRecordStatus(encoded)).toBe("unusable");
    await expect(verifyPassword("fixed policy password", encoded)).resolves.toBe(false);
  });

  it("bounds FIFO work, rejects excess work, and recovers after errors", async () => {
    const service = new PasswordWorkService(1, 1);
    let release!: () => void;
    const first = service.run(() => new Promise<void>((resolve) => { release = resolve; }));
    const secondWork = vi.fn(async () => { throw new Error("expected"); });
    const second = service.run(secondWork);
    await expect(service.run(async () => undefined)).rejects.toBeInstanceOf(AuthBusyError);
    release();
    await first;
    await expect(second).rejects.toThrow("expected");
    expect(secondWork).toHaveBeenCalledOnce();
    await expect(service.run(async () => "recovered")).resolves.toBe("recovered");
  });

  it("stops new admission and drains accepted work", async () => {
    const service = new PasswordWorkService(1, 0);
    let release!: () => void;
    const work = service.run(() => new Promise<void>((resolve) => { release = resolve; }));
    const drained = service.closeAndDrain();
    await expect(service.run(async () => undefined)).rejects.toBeInstanceOf(AuthBusyError);
    release();
    await Promise.all([work, drained]);
  });
});
