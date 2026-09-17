import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import {
  createProgressApi,
  ProgressApiError,
  ProgressSyncQueue,
  type ProgressValue,
  type SyncSnapshot,
} from '@/progress/core';
import {
  hasMeaningfulLessonOneProgress,
  lessonOneContentVersion,
  lessonOneGuestStorageKey,
  lessonOneId,
  lessonOneImportDecisionKey,
  lessonOneProgressFingerprint,
  lessonOneSchemaVersion,
  lessonOneUserStorageKey,
  mergeLessonOneProgress,
  parseLessonOneProgress,
  readLessonOneProgress,
  toSyncedLessonOneProgress,
  writeLessonOneProgress,
  type LessonOneProgress,
} from '@/progress/lesson-one';
import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01';

const idleSync: SyncSnapshot = { status: 'idle', revision: 0, error: null };
const progressApi = createProgressApi<ProgressValue<LessonOneStepId>>();

type LessonOneProgressController = {
  progress: LessonOneProgress;
  setProgress: Dispatch<SetStateAction<LessonOneProgress>>;
  storageAvailable: boolean;
  sync: SyncSnapshot;
  accountState: 'guest' | 'loading' | 'authenticated' | 'unavailable';
  importGuestProgress: boolean;
  confirmGuestImport(): void;
  keepGuestProgressSeparate(): void;
  clearCurrentAccountCache(): boolean;
  retrySync(): void;
};

export function useLessonOneProgress(): LessonOneProgressController {
  const auth = useAuth();
  const initial = useRef(readLessonOneProgress(lessonOneGuestStorageKey));
  const [progress, setProgressState] = useState(initial.current.progress);
  const [storageAvailable, setStorageAvailable] = useState(initial.current.storageAvailable);
  const [sync, setSync] = useState<SyncSnapshot>(idleSync);
  const [importGuestProgress, setImportGuestProgress] = useState(false);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const progressRef = useRef(progress);
  const storageKeyRef = useRef(lessonOneGuestStorageKey);
  const userIdRef = useRef<string | null>(null);
  const queueRef = useRef<ProgressSyncQueue<ProgressValue<LessonOneStepId>> | null>(null);
  const guestProgressRef = useRef(initial.current.progress);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const replaceProgress = useCallback((next: LessonOneProgress, key = storageKeyRef.current) => {
    progressRef.current = next;
    setProgressState(next);
    if (!writeLessonOneProgress(key, next)) setStorageAvailable(false);
  }, []);

  const createQueue = useCallback((userId: string, revision: number) => {
    unsubscribeRef.current?.();
    const queue = new ProgressSyncQueue<ProgressValue<LessonOneStepId>>(async (request) => {
      const requestedLocal = parseLessonOneProgress({
        ...request.progress,
        audioEnabled: progressRef.current.audioEnabled,
        prefersStatic: progressRef.current.prefersStatic,
      });
      const effective = mergeLessonOneProgress(requestedLocal, toSyncedLessonOneProgress(progressRef.current));
      if (lessonOneProgressFingerprint(effective) !== JSON.stringify(request.progress)) {
        if (userIdRef.current === userId) replaceProgress(effective, lessonOneUserStorageKey(userId));
        request = { ...request, progress: toSyncedLessonOneProgress(effective) };
      }
      try {
        return await progressApi.save(lessonOneId, request);
      } catch (error) {
        if (!(error instanceof ProgressApiError) || error.code !== 'REVISION_CONFLICT' || !error.current) throw error;
        const local = parseLessonOneProgress({
          ...request.progress,
          audioEnabled: progressRef.current.audioEnabled,
          prefersStatic: progressRef.current.prefersStatic,
        });
        const merged = mergeLessonOneProgress(local, error.current.progress);
        if (userIdRef.current === userId) replaceProgress(merged, lessonOneUserStorageKey(userId));
        return progressApi.save(lessonOneId, {
          schemaVersion: lessonOneSchemaVersion,
          contentVersion: lessonOneContentVersion,
          progress: toSyncedLessonOneProgress(merged),
          baseRevision: error.current.revision,
        });
      }
    }, lessonOneSchemaVersion, lessonOneContentVersion, revision);
    queueRef.current = queue;
    unsubscribeRef.current = queue.subscribe(setSync);
    return queue;
  }, [replaceProgress]);

  useEffect(() => {
    let active = true;
    const user = auth.state === 'authenticated' ? auth.user : null;
    if (!user) {
      userIdRef.current = null;
      queueRef.current = null;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setSync(idleSync);
      setImportGuestProgress(false);
      storageKeyRef.current = lessonOneGuestStorageKey;
      const guest = readLessonOneProgress(lessonOneGuestStorageKey);
      guestProgressRef.current = guest.progress;
      progressRef.current = guest.progress;
      setProgressState(guest.progress);
      setStorageAvailable(guest.storageAvailable);
      return () => { active = false; };
    }

    const userId = user.id;
    const userKey = lessonOneUserStorageKey(userId);
    const cached = readLessonOneProgress(userKey);
    const guest = readLessonOneProgress(lessonOneGuestStorageKey);
    userIdRef.current = userId;
    storageKeyRef.current = userKey;
    guestProgressRef.current = guest.progress;
    progressRef.current = cached.progress;
    setProgressState(cached.progress);
    setStorageAvailable(cached.storageAvailable && guest.storageAvailable);
    setSync({ status: 'pending', revision: 0, error: null });
    try {
      const priorDecision = localStorage.getItem(lessonOneImportDecisionKey(userId));
      setImportGuestProgress(hasMeaningfulLessonOneProgress(guest.progress) && priorDecision !== lessonOneProgressFingerprint(guest.progress));
    } catch {
      setStorageAvailable(false);
      setImportGuestProgress(hasMeaningfulLessonOneProgress(guest.progress));
    }

    void progressApi.get(lessonOneId).then((remote) => {
      if (!active || userIdRef.current !== userId) return;
      const merged = mergeLessonOneProgress(progressRef.current, remote.progress);
      replaceProgress(merged, userKey);
      const queue = createQueue(userId, remote.revision);
      if (lessonOneProgressFingerprint(merged) !== JSON.stringify(remote.progress)) {
        queue.enqueue(toSyncedLessonOneProgress(merged));
      } else {
        setSync({ status: 'synced', revision: remote.revision, error: null });
      }
    }).catch((error: unknown) => {
      if (!active || userIdRef.current !== userId) return;
      if (error instanceof ProgressApiError && error.code === 'PROGRESS_NOT_FOUND') {
        const queue = createQueue(userId, 0);
        if (hasMeaningfulLessonOneProgress(progressRef.current)) queue.enqueue(toSyncedLessonOneProgress(progressRef.current));
        else setSync(idleSync);
        return;
      }
      setSync({ status: 'error', revision: 0, error: error instanceof Error ? error.message : 'Не вдалося завантажити прогрес.' });
    });

    return () => { active = false; };
  }, [auth.state, auth.user, bootstrapAttempt, createQueue, replaceProgress]);

  useEffect(() => () => unsubscribeRef.current?.(), []);

  const setProgress: Dispatch<SetStateAction<LessonOneProgress>> = useCallback((update) => {
    const next = typeof update === 'function' ? update(progressRef.current) : update;
    replaceProgress(next);
    if (userIdRef.current) queueRef.current?.enqueue(toSyncedLessonOneProgress(next));
  }, [replaceProgress]);

  const recordImportDecision = useCallback(() => {
    if (!userIdRef.current) return;
    try {
      localStorage.setItem(lessonOneImportDecisionKey(userIdRef.current), lessonOneProgressFingerprint(guestProgressRef.current));
    } catch {
      setStorageAvailable(false);
    }
    setImportGuestProgress(false);
  }, []);

  const confirmGuestImport = useCallback(() => {
    const merged = mergeLessonOneProgress(progressRef.current, toSyncedLessonOneProgress(guestProgressRef.current));
    replaceProgress(merged);
    queueRef.current?.enqueue(toSyncedLessonOneProgress(merged));
    recordImportDecision();
  }, [recordImportDecision, replaceProgress]);

  const clearCurrentAccountCache = useCallback(() => {
    const userId = userIdRef.current;
    if (!userId) return false;
    try {
      localStorage.removeItem(lessonOneUserStorageKey(userId));
      localStorage.removeItem(lessonOneImportDecisionKey(userId));
      return true;
    } catch {
      setStorageAvailable(false);
      return false;
    }
  }, []);

  return {
    progress,
    setProgress,
    storageAvailable,
    sync,
    accountState: auth.state,
    importGuestProgress,
    confirmGuestImport,
    keepGuestProgressSeparate: recordImportDecision,
    clearCurrentAccountCache,
    retrySync: () => {
      if (queueRef.current?.snapshot.status === 'error') queueRef.current.retry();
      else setBootstrapAttempt((attempt) => attempt + 1);
    },
  };
}
