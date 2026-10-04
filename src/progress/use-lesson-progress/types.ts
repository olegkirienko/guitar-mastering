import type { Dispatch, SetStateAction } from 'react';
import type { SyncSnapshot } from '@/progress/core/types';

export type LessonProgressController<Local> = {
  progress: Local;
  setProgress: Dispatch<SetStateAction<Local>>;
  // True once the server copy, or its absence, has been applied.
  loaded: boolean;
  // True when the server copy could not be loaded; retrySync loads it again.
  loadFailed: boolean;
  sync: SyncSnapshot;
  retrySync(): void;
};
