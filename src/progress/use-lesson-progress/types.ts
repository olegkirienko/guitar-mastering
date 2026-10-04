import type { Dispatch, SetStateAction } from 'react';
import type { SyncSnapshot } from '@/progress/core/types';

export type LessonProgressController<Local> = {
  progress: Local;
  setProgress: Dispatch<SetStateAction<Local>>;
  // True once the server copy (or its failure) has been applied.
  loaded: boolean;
  storageAvailable: boolean;
  sync: SyncSnapshot;
  accountState: 'guest' | 'loading' | 'authenticated' | 'unavailable';
  importGuestProgress: boolean;
  confirmGuestImport(): void;
  keepGuestProgressSeparate(): void;
  clearCurrentAccountCache(): boolean;
  retrySync(): void;
};
