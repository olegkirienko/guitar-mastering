import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { type LessonProgressAdapter, type ProgressValue, type SyncSnapshot } from '@/progress/core/types';
import { ProgressApiError, createProgressApi } from '@/progress/core/utils/progress-api';
import { ProgressSyncQueue } from '@/progress/core/utils/progress-sync-queue';
import { idleSync } from '@/progress/use-lesson-progress/constants';
import type { LessonProgressController } from '@/progress/use-lesson-progress/types';

export function useLessonProgress<StepId extends string, Local extends ProgressValue<StepId>>(
  adapter: LessonProgressAdapter<StepId, Local>,
): LessonProgressController<Local> {
  const auth = useAuth();
  const apiRef = useRef(createProgressApi<ProgressValue<StepId>>());
  const initial = useRef(adapter.read(adapter.guestStorageKey));
  const [progress, setProgressState] = useState(initial.current.progress);
  const [storageAvailable, setStorageAvailable] = useState(initial.current.storageAvailable);
  const [sync, setSync] = useState<SyncSnapshot>(idleSync);
  const [importGuestProgress, setImportGuestProgress] = useState(false);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const progressRef = useRef(progress);
  const storageKeyRef = useRef(adapter.guestStorageKey);
  const userIdRef = useRef<string | null>(null);
  const queueRef = useRef<ProgressSyncQueue<ProgressValue<StepId>> | null>(null);
  const guestProgressRef = useRef(initial.current.progress);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const replaceProgress = useCallback((next: Local, key = storageKeyRef.current) => {
    progressRef.current = next;
    setProgressState(next);
    if (!adapter.write(key, next)) setStorageAvailable(false);
  }, [adapter]);

  const mergeWithCurrent = useCallback((synced: ProgressValue<StepId>) => {
    const parsed = adapter.parse(synced);
    return adapter.merge(progressRef.current, adapter.toSynced(parsed));
  }, [adapter]);

  const createQueue = useCallback((userId: string, revision: number) => {
    unsubscribeRef.current?.();
    const queue = new ProgressSyncQueue<ProgressValue<StepId>>(async (request) => {
      if (userIdRef.current !== userId) throw new Error('Progress synchronization stopped after account change.');
      const effective = mergeWithCurrent(request.progress);
      if (adapter.fingerprint(effective) !== JSON.stringify(request.progress)) {
        replaceProgress(effective, adapter.userStorageKey(userId));
        request = { ...request, progress: adapter.toSynced(effective) };
      }
      try {
        return await apiRef.current.save(adapter.lessonId, request);
      } catch (error) {
        if (!(error instanceof ProgressApiError) || error.code !== 'REVISION_CONFLICT' || !error.current) throw error;
        if (userIdRef.current !== userId) throw error;
        const merged = adapter.merge(mergeWithCurrent(request.progress), error.current.progress);
        replaceProgress(merged, adapter.userStorageKey(userId));
        return apiRef.current.save(adapter.lessonId, {
          schemaVersion: adapter.schemaVersion,
          contentVersion: adapter.contentVersion,
          progress: adapter.toSynced(merged),
          baseRevision: error.current.revision,
        });
      }
    }, adapter.schemaVersion, adapter.contentVersion, revision);
    queueRef.current = queue;
    unsubscribeRef.current = queue.subscribe(setSync);
    return queue;
  }, [adapter, mergeWithCurrent, replaceProgress]);

  useEffect(() => {
    let active = true;
    const user = auth.state === 'authenticated' ? auth.user : null;
    queueRef.current = null;
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    if (!user) {
      userIdRef.current = null;
      setSync(idleSync);
      setImportGuestProgress(false);
      storageKeyRef.current = adapter.guestStorageKey;
      const guest = adapter.read(adapter.guestStorageKey);
      guestProgressRef.current = guest.progress;
      progressRef.current = guest.progress;
      setProgressState(guest.progress);
      setStorageAvailable(guest.storageAvailable);
      return () => { active = false; };
    }

    const userId = user.id;
    const userKey = adapter.userStorageKey(userId);
    const cached = adapter.read(userKey);
    const guest = adapter.read(adapter.guestStorageKey);
    userIdRef.current = userId;
    storageKeyRef.current = userKey;
    guestProgressRef.current = guest.progress;
    progressRef.current = cached.progress;
    setProgressState(cached.progress);
    setStorageAvailable(cached.storageAvailable && guest.storageAvailable);
    setSync({ status: 'pending', revision: 0, error: null });
    try {
      const priorDecision = localStorage.getItem(adapter.importDecisionKey(userId));
      setImportGuestProgress(adapter.hasMeaningfulProgress(guest.progress) && priorDecision !== adapter.fingerprint(guest.progress));
    } catch {
      setStorageAvailable(false);
      setImportGuestProgress(adapter.hasMeaningfulProgress(guest.progress));
    }

    void apiRef.current.get(adapter.lessonId).then((remote) => {
      if (!active || userIdRef.current !== userId) return;
      const merged = adapter.merge(progressRef.current, remote.progress);
      replaceProgress(merged, userKey);
      const queue = createQueue(userId, remote.revision);
      if (adapter.fingerprint(merged) !== JSON.stringify(remote.progress)) {
        queue.enqueue(adapter.toSynced(merged));
      } else {
        setSync({ status: 'synced', revision: remote.revision, error: null });
      }
    }).catch((error: unknown) => {
      if (!active || userIdRef.current !== userId) return;
      if (error instanceof ProgressApiError && error.code === 'PROGRESS_NOT_FOUND') {
        const queue = createQueue(userId, 0);
        if (adapter.hasMeaningfulProgress(progressRef.current)) queue.enqueue(adapter.toSynced(progressRef.current));
        else setSync(idleSync);
        return;
      }
      setSync({ status: 'error', revision: 0, error: error instanceof Error ? error.message : 'Не вдалося завантажити прогрес.' });
    });

    return () => {
      active = false;
      if (userIdRef.current === userId) {
        userIdRef.current = null;
        queueRef.current = null;
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
      }
    };
  }, [adapter, auth.state, auth.user, bootstrapAttempt, createQueue, replaceProgress]);

  useEffect(() => () => unsubscribeRef.current?.(), []);

  const setProgress: Dispatch<SetStateAction<Local>> = useCallback((update) => {
    const next = typeof update === 'function' ? update(progressRef.current) : update;
    replaceProgress(next);
    if (userIdRef.current) queueRef.current?.enqueue(adapter.toSynced(next));
  }, [adapter, replaceProgress]);

  const recordImportDecision = useCallback(() => {
    if (!userIdRef.current) return;
    try {
      localStorage.setItem(adapter.importDecisionKey(userIdRef.current), adapter.fingerprint(guestProgressRef.current));
    } catch {
      setStorageAvailable(false);
    }
    setImportGuestProgress(false);
  }, [adapter]);

  const confirmGuestImport = useCallback(() => {
    const merged = adapter.merge(progressRef.current, adapter.toSynced(guestProgressRef.current));
    replaceProgress(merged);
    queueRef.current?.enqueue(adapter.toSynced(merged));
    recordImportDecision();
  }, [adapter, recordImportDecision, replaceProgress]);

  const clearCurrentAccountCache = useCallback(() => {
    const userId = userIdRef.current;
    if (!userId) return false;
    try {
      localStorage.removeItem(adapter.userStorageKey(userId));
      localStorage.removeItem(adapter.importDecisionKey(userId));
      return true;
    } catch {
      setStorageAvailable(false);
      return false;
    }
  }, [adapter]);

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
