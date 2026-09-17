export type ProgressValue<StepId extends string = string> = {
  currentStepId: StepId;
  completedStepIds: StepId[];
  checkpointPassed: boolean;
  completedAt: string | null;
};

export type ProgressItem<Value extends ProgressValue = ProgressValue> = {
  lessonId: string;
  schemaVersion: number;
  contentVersion: number;
  progress: Value;
  revision: number;
  updatedAt: string;
};

export type SaveProgress<Value extends ProgressValue> = {
  schemaVersion: number;
  contentVersion: number;
  progress: Value;
  baseRevision: number;
};

type ApiErrorBody<Value extends ProgressValue> = {
  error?: { code?: string; message?: string; current?: ProgressItem<Value> };
};

export class ProgressApiError<Value extends ProgressValue = ProgressValue> extends Error {
  constructor(readonly code: string, message: string, readonly current?: ProgressItem<Value>) {
    super(message);
  }
}

async function responseValue<Value extends ProgressValue, Result>(response: Response): Promise<Result> {
  const body = await response.json().catch(() => null) as (ApiErrorBody<Value> & Result) | null;
  if (!response.ok) {
    throw new ProgressApiError(
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.message ?? 'Не вдалося синхронізувати прогрес.',
      body?.error?.current,
    );
  }
  return body as Result;
}

export function createProgressApi<Value extends ProgressValue = ProgressValue>() {
  return {
    async list(): Promise<ProgressItem<Value>[]> {
      const response = await fetch('/api/v1/progress');
      return (await responseValue<Value, { items: ProgressItem<Value>[] }>(response)).items;
    },
    async get(lessonId: string): Promise<ProgressItem<Value>> {
      const response = await fetch(`/api/v1/progress/${encodeURIComponent(lessonId)}`);
      return (await responseValue<Value, { item: ProgressItem<Value> }>(response)).item;
    },
    async save(lessonId: string, value: SaveProgress<Value>): Promise<ProgressItem<Value>> {
      let response: Response;
      try {
        response = await fetch(`/api/v1/progress/${encodeURIComponent(lessonId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
      } catch {
        throw new ProgressApiError('NETWORK_ERROR', 'Не вдалося зв’язатися із сервером.');
      }
      return (await responseValue<Value, { item: ProgressItem<Value> }>(response)).item;
    },
  };
}

export function mergeProgress<StepId extends string>(
  local: ProgressValue<StepId>,
  remote: ProgressValue<StepId>,
  stepOrder: readonly StepId[],
): ProgressValue<StepId> {
  const rank = (step: StepId) => stepOrder.indexOf(step);
  const completedStepIds = stepOrder.filter((step) => local.completedStepIds.includes(step) || remote.completedStepIds.includes(step));
  const completionTimes = [local.completedAt, remote.completedAt].filter((value): value is string => value !== null);
  return {
    currentStepId: rank(local.currentStepId) >= rank(remote.currentStepId) ? local.currentStepId : remote.currentStepId,
    completedStepIds,
    checkpointPassed: local.checkpointPassed || remote.checkpointPassed,
    completedAt: completionTimes.length === 0
      ? null
      : completionTimes.reduce((earliest, value) => Date.parse(value) < Date.parse(earliest) ? value : earliest),
  };
}

export type SyncStatus = 'idle' | 'pending' | 'synced' | 'error';
export type SyncSnapshot = { status: SyncStatus; revision: number; error: string | null };

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
