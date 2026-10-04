const legacyKeyPrefix = 'guitar-mastering:';

// Progress and preferences now live only on the server. This removes the copies that older
// releases kept in this browser; delete it once it has shipped for at least one release.
export function clearLegacyStorage(target?: Pick<Storage, 'length' | 'key' | 'removeItem'>) {
  try {
    // Reading localStorage itself throws when site data is blocked.
    const storage = target ?? globalThis.localStorage;
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(legacyKeyPrefix)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Blocked storage holds nothing to clean up.
  }
}
