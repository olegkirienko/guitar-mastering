import { describe, expect, it } from 'vitest';
import { clearLegacyStorage } from '../src/utils/clear-legacy-storage.ts';

function memoryStorage(entries: [string, string][]) {
  const values = new Map(entries);
  return {
    get length() { return values.size; },
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => { values.delete(key); },
    values,
  };
}

describe('legacy storage cleanup', () => {
  it('removes every key of this app, including per-account copies, and keeps other keys', () => {
    const storage = memoryStorage([
      ['guitar-mastering:stage-01-lesson-01', '{}'],
      ['guitar-mastering:user:user-1:stage-01-lesson-02', '{}'],
      ['guitar-mastering:user:user-1:stage-01-lesson-01:guest-import', 'x'],
      ['guitar-mastering:lesson-preferences', '{}'],
      ['other-app', 'kept'],
    ]);
    clearLegacyStorage(storage);
    expect([...storage.values.keys()]).toEqual(['other-app']);
  });

  it('does not throw when storage is blocked', () => {
    const blocked = {
      get length(): number { throw new Error('blocked'); },
      key: () => null,
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(() => clearLegacyStorage(blocked)).not.toThrow();
  });
});
