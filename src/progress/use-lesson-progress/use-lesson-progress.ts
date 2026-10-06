import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { type LessonProgressAdapter, type ProgressValue, type SyncSnapshot } from '@/progress/core/types';
import { ProgressApiError, createProgressApi } from '@/progress/core/utils/progress-api';
import { ProgressSyncQueue } from '@/progress/core/utils/progress-sync-queue';
import { idleSync } from '@/progress/use-lesson-progress/constants';
import type { LessonProgressController } from '@/progress/use-lesson-progress/types';

// Lesson progress lives on the server and in React state only; nothing is kept in browser storage.
export function useLessonProgress<StepId extends string, Local extends ProgressValue<StepId>>(
  adapter: LessonProgressAdapter<StepId, Local>,
): LessonProgressController<Local> {
  const auth = useAuth();
  const userId = auth.state === 'authenticated' ? auth.user?.id ?? null : null;
  const apiRef = useRef(createProgressApi<ProgressValue<StepId>>());
  const [progress, setProgressState] = useState(adapter.defaultProgress);
  const [sync, setSync] = useState<SyncSnapshot>(idleSync);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const progressRef = useRef(progress);
  const userIdRef = useRef<string | null>(null);
  const queueRef = useRef<ProgressSyncQueue<ProgressValue<StepId>> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const replaceProgress = useCallback((next: Local) => {
    progressRef.current = next;
    setProgressState(next);
  }, []);

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
        replaceProgress(effective);
        request = { ...request, progress: adapter.toSynced(effective) };
      }
      try {
        return await apiRef.current.save(adapter.lessonId, request);
      } catch (error) {
        if (!(error instanceof ProgressApiError) || error.code !== 'REVISION_CONFLICT' || !error.current) throw error;
        if (userIdRef.current !== userId) throw error;
        const merged = adapter.merge(mergeWithCurrent(request.progress), error.current.progress);
        replaceProgress(merged);
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
    queueRef.current = null;
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    userIdRef.current = userId;
    replaceProgress(adapter.defaultProgress);
    setLoaded(false);
    setLoadFailed(false);

    if (!userId) {
      setSync(idleSync);
      return () => { active = false; };
    }

    setSync({ status: 'pending', revision: 0, error: null });
    void apiRef.current.get(adapter.lessonId).then((remote) => {
      if (!active || userIdRef.current !== userId) return;
      const parsed = adapter.parse(remote.progress);
      replaceProgress(parsed);
      const queue = createQueue(userId, remote.revision);
      // Parsing can repair a stored value; the repaired copy is written back.
      if (adapter.fingerprint(parsed) !== JSON.stringify(remote.progress)) queue.enqueue(adapter.toSynced(parsed));
      else setSync({ status: 'synced', revision: remote.revision, error: null });
      setLoaded(true);
    }).catch((error: unknown) => {
      if (!active || userIdRef.current !== userId) return;
      if (error instanceof ProgressApiError && error.code === 'PROGRESS_NOT_FOUND') {
        createQueue(userId, 0);
        setSync(idleSync);
        setLoaded(true);
        return;
      }
      setLoadFailed(true);
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
  }, [adapter, userId, bootstrapAttempt, createQueue, replaceProgress]);

  useEffect(() => () => unsubscribeRef.current?.(), []);

  const setProgress: Dispatch<SetStateAction<Local>> = useCallback((update) => {
    const next = typeof update === 'function' ? update(progressRef.current) : update;
    replaceProgress(next);
    queueRef.current?.enqueue(adapter.toSynced(next));
  }, [adapter, replaceProgress]);

  const retrySync = useCallback(() => {
    if (queueRef.current?.snapshot.status === 'error') queueRef.current.retry();
    else setBootstrapAttempt((attempt) => attempt + 1);
  }, []);

  // Clears this lesson and every lesson after it. The queue stops first, so no save is in flight
  // when the delete runs; afterwards the bootstrap reads the lesson again and builds a fresh queue.
  const reset = useCallback(async () => {
    const userId = userIdRef.current;
    const revision = queueRef.current?.snapshot.revision ?? 0;
    await queueRef.current?.stop();
    queueRef.current = null;
    try {
      await apiRef.current.reset(adapter.lessonId);
    } catch (error) {
      // Nothing was cleared, so the lesson keeps its progress and saves again through a fresh queue.
      if (userId && userIdRef.current === userId) createQueue(userId, revision);
      throw error;
    }
    setBootstrapAttempt((attempt) => attempt + 1);
  }, [adapter, createQueue]);

  return { progress, setProgress, loaded, loadFailed, sync, retrySync, reset };
}
