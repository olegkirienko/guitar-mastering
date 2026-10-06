import type { Dispatch, SetStateAction } from 'react';
import type { ProgressValue, SyncSnapshot } from '@/progress/core/types';
import type { ProgressSyncQueue } from '@/progress/core/utils/progress-sync-queue';

export type LessonProgressController<Local> = {
  progress: Local;
  setProgress: Dispatch<SetStateAction<Local>>;
  // True once the server copy, or its absence, has been applied.
  loaded: boolean;
  // True when the server copy could not be loaded; retrySync loads it again.
  loadFailed: boolean;
  sync: SyncSnapshot;
  retrySync(): void;
  // Clears this lesson and every lesson after it, then reloads this one; rejects when the reset fails.
  reset(): Promise<void>;
};

export type ResetLessonProgressOptions<Value extends ProgressValue> = {
  // The queue in use; it is stopped before anything is cleared and is never used again afterwards.
  queue: ProgressSyncQueue<Value> | null;
  // Clears this lesson and the ones after it on the server.
  clear(): Promise<unknown>;
  // Builds the queue the lesson keeps saving through when the clear fails; null when the account changed.
  rebuild(revision: number): ProgressSyncQueue<Value> | null;
  // The progress to save again, read at the moment the clear fails.
  progress(): Value;
};
