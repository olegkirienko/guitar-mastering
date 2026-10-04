import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProgressApi } from '../src/progress/core/utils/progress-api.ts';
import { mergeProgress } from '../src/progress/core/utils/merge-progress.ts';
import { ProgressSyncQueue } from '../src/progress/core/utils/progress-sync-queue.ts';
import { type ProgressValue } from '../src/progress/core/types.ts';

type Step = 'intro' | 'string' | 'air' | 'checkpoint' | 'complete';
const order: readonly Step[] = ['intro', 'string', 'air', 'checkpoint', 'complete'];
const progress = (currentStepId: Step, completedStepIds: Step[] = []): ProgressValue<Step> => ({
  currentStepId, completedStepIds, checkpointPassed: completedStepIds.includes('checkpoint'), completedAt: null,
});

afterEach(() => vi.unstubAllGlobals());

describe('progress sync core', () => {
  it('keeps the local position, merges reach monotonically, and keeps the earliest completion', () => {
    expect(mergeProgress(
      { ...progress('air', ['intro', 'string']), completedAt: '2026-09-16T12:00:00.000Z' },
      { ...progress('checkpoint', ['intro', 'air', 'checkpoint']), completedAt: '2026-09-15T12:00:00.000Z' },
      order,
    )).toEqual({
      currentStepId: 'air',
      completedStepIds: ['intro', 'string', 'air', 'checkpoint'],
      checkpointPassed: true,
      completedAt: '2026-09-15T12:00:00.000Z',
    });
    expect(mergeProgress(progress('string', ['intro', 'string', 'air']), progress('air', ['intro', 'string', 'air']), order).currentStepId).toBe('string');
  });

  it('coalesces queued writes, exposes status, and retries the latest failure', async () => {
    let release!: () => void;
    const first = new Promise<void>((resolve) => { release = resolve; });
    const save = vi.fn()
      .mockImplementationOnce(async (request) => {
        await first;
        return { lessonId: 'stage-01-lesson-01', ...request, revision: 1, updatedAt: '2026-09-16T00:00:00.000Z' };
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementationOnce(async (request) => ({ lessonId: 'stage-01-lesson-01', ...request, revision: 2, updatedAt: '2026-09-16T00:00:01.000Z' }));
    const queue = new ProgressSyncQueue(save, 1, 1);
    queue.enqueue(progress('string'));
    queue.enqueue(progress('air'));
    queue.enqueue(progress('checkpoint'));
    release();
    await vi.waitFor(() => expect(queue.snapshot.status).toBe('error'));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]?.[0]).toMatchObject({ progress: { currentStepId: 'checkpoint' }, baseRevision: 1 });
    queue.retry();
    await vi.waitFor(() => expect(queue.snapshot).toEqual({ status: 'synced', revision: 2, error: null }));
  });

  it('keeps API targets and queue revisions independent across lessons', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const lessonId = String(input).endsWith('lesson-two') ? 'lesson-two' : 'lesson-one';
      const body = JSON.parse(String(init?.body)) as { progress: ProgressValue<Step>; baseRevision: number };
      return {
        ok: true,
        json: async () => ({ item: {
          lessonId,
          schemaVersion: 1,
          contentVersion: 1,
          progress: body.progress,
          revision: body.baseRevision + 1,
          updatedAt: '2026-09-30T00:00:00.000Z',
        } }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const api = createProgressApi<ProgressValue<Step>>();
    const firstQueue = new ProgressSyncQueue<ProgressValue<Step>>((request) => api.save('lesson-one', request), 1, 1, 3);
    const secondQueue = new ProgressSyncQueue<ProgressValue<Step>>((request) => api.save('lesson-two', request), 1, 1, 8);

    firstQueue.enqueue(progress('string'));
    secondQueue.enqueue(progress('air'));

    await vi.waitFor(() => expect(firstQueue.snapshot).toEqual({ status: 'synced', revision: 4, error: null }));
    await vi.waitFor(() => expect(secondQueue.snapshot).toEqual({ status: 'synced', revision: 9, error: null }));
    expect(fetchMock.mock.calls.map(([input]) => input)).toEqual([
      '/api/v1/progress/lesson-one',
      '/api/v1/progress/lesson-two',
    ]);
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).baseRevision)).toEqual([3, 8]);
  });
});
