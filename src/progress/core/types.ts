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

export type LessonProgressAdapter<StepId extends string, Local extends ProgressValue<StepId>> = {
  lessonId: string;
  schemaVersion: number;
  contentVersion: number;
  guestStorageKey: string;
  userStorageKey(userId: string): string;
  importDecisionKey(userId: string): string;
  read(key: string): { progress: Local; storageAvailable: boolean };
  write(key: string, progress: Local): boolean;
  parse(value: unknown): Local;
  toSynced(progress: Local): ProgressValue<StepId>;
  merge(local: Local, remote: ProgressValue<StepId>): Local;
  hasMeaningfulProgress(progress: Local): boolean;
  fingerprint(progress: Local): string;
};

export type ApiErrorBody<Value extends ProgressValue> = {
  error?: { code?: string; message?: string; current?: ProgressItem<Value> };
};

export type SyncStatus = 'idle' | 'pending' | 'synced' | 'error';

export type SyncSnapshot = { status: SyncStatus; revision: number; error: string | null };
