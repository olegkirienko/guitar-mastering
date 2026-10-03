import type { ProgressItem, ProgressValue, SaveProgress, SyncSnapshot } from '@/progress/core/types';

export class ProgressSyncQueue<Value extends ProgressValue> {
  private queued: Value | null = null;
  private running = false;
  private lastFailed: Value | null = null;
  private snapshotValue: SyncSnapshot;
  private readonly listeners = new Set<(snapshot: SyncSnapshot) => void>();

  constructor(
    private readonly saveRemote: (value: SaveProgress<Value>) => Promise<ProgressItem<Value>>,
    private readonly schemaVersion: number,
    private readonly contentVersion: number,
    revision = 0,
  ) {
    this.snapshotValue = { status: 'idle', revision, error: null };
  }

  get snapshot(): SyncSnapshot { return this.snapshotValue; }

  subscribe(listener: (snapshot: SyncSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshotValue);
    return () => this.listeners.delete(listener);
  }

  enqueue(value: Value): void {
    this.queued = value;
    this.lastFailed = null;
    this.publish({ status: 'pending', revision: this.snapshotValue.revision, error: null });
    void this.flush();
  }

  retry(): void {
    if (!this.lastFailed) return;
    this.queued = this.lastFailed;
    this.lastFailed = null;
    this.publish({ status: 'pending', revision: this.snapshotValue.revision, error: null });
    void this.flush();
  }

  private publish(snapshot: SyncSnapshot): void {
    this.snapshotValue = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  private async flush(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queued) {
        const value = this.queued;
        this.queued = null;
        try {
          const saved = await this.saveRemote({
            schemaVersion: this.schemaVersion,
            contentVersion: this.contentVersion,
            progress: value,
            baseRevision: this.snapshotValue.revision,
          });
          this.publish({ status: this.queued ? 'pending' : 'synced', revision: saved.revision, error: null });
        } catch (error) {
          this.lastFailed = this.queued ?? value;
          this.queued = null;
          this.publish({
            status: 'error',
            revision: this.snapshotValue.revision,
            error: error instanceof Error ? error.message : 'Не вдалося синхронізувати прогрес.',
          });
        }
      }
    } finally {
      this.running = false;
      if (this.queued) void this.flush();
    }
  }
}
