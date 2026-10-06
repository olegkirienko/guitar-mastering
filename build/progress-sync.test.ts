import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProgressApi } from '../src/progress/core/utils/progress-api.ts';
import { mergeProgress } from '../src/progress/core/utils/merge-progress.ts';
import { ProgressSyncQueue } from '../src/progress/core/utils/progress-sync-queue.ts';
import { resetLessonProgress } from '../src/progress/use-lesson-progress/utils/reset-lesson-progress.ts';
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
  it('stops the queue only after the save in flight has settled, and takes no more work', async () => {
    let release!: () => void;
    const inFlight = new Promise<void>((resolve) => { release = resolve; });
    let settled = false;
    const save = vi.fn(async (request) => {
      await inFlight;
      settled = true;
      return { lessonId: 'stage-01-lesson-01', ...request, revision: 1, updatedAt: '2026-09-16T00:00:00.000Z' };
    });
    const queue = new ProgressSyncQueue(save, 1, 1);
    queue.enqueue(progress('string'));

    const stopped = queue.stop();
    // Work queued or retried after the stop never reaches the server.
    queue.enqueue(progress('air'));
    queue.retry();
    release();
    await stopped;
    expect(settled).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]?.[0]).toMatchObject({ progress: { currentStepId: 'string' } });
  });

  it('resets a lesson through its own endpoint and answers with what is left', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [{ lessonId: 'lesson-one' }] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(createProgressApi().reset('lesson two')).resolves.toEqual([{ lessonId: 'lesson-one' }]);
    const [input, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(input).toBe('/api/v1/progress/lesson%20two/reset');
    expect(init.method).toBe('POST');
  });

  it('reports a refused reset through the shared error type', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'UNKNOWN_LESSON', message: 'Lesson is not available.' } }), {
      status: 404, headers: { 'content-type': 'application/json' },
    })));
    await expect(createProgressApi().reset('lesson-nope')).rejects.toMatchObject({ code: 'UNKNOWN_LESSON' });
  });

  it('clears the lesson only after the save in flight has settled', async () => {
    let release!: () => void;
    const inFlight = new Promise<void>((resolve) => { release = resolve; });
    const calls: string[] = [];
    const save = vi.fn(async (request) => {
      await inFlight;
      calls.push('save');
      return { lessonId: 'stage-01-lesson-01', ...request, revision: 6, updatedAt: '2026-10-06T00:00:00.000Z' };
    });
    const queue = new ProgressSyncQueue(save, 1, 1, 5);
    queue.enqueue(progress('string', ['intro']));
    const rebuild = vi.fn(() => null);

    const reset = resetLessonProgress({
      queue,
      clear: async () => { calls.push('clear'); },
      rebuild,
      progress: () => progress('string', ['intro']),
    });
    release();
    await reset;

    expect(calls).toEqual(['save', 'clear']);
    expect(rebuild).not.toHaveBeenCalled();
  });

  it('keeps the lesson savable when the clear fails, from the revision the stopped queue reached', async () => {
    let release!: () => void;
    const inFlight = new Promise<void>((resolve) => { release = resolve; });
    const save = vi.fn(async (request) => {
      await inFlight;
      return { lessonId: 'stage-01-lesson-01', ...request, revision: 6, updatedAt: '2026-10-06T00:00:00.000Z' };
    });
    const queue = new ProgressSyncQueue(save, 1, 1, 5);
    queue.enqueue(progress('string', ['intro']));
    const resumed = vi.fn(async (request) => ({ lessonId: 'stage-01-lesson-01', ...request, revision: 7, updatedAt: '2026-10-06T00:00:01.000Z' }));
    const revisions: number[] = [];

    const reset = resetLessonProgress({
      queue,
      clear: async () => { throw new Error('offline'); },
      rebuild: (revision) => {
        revisions.push(revision);
        return new ProgressSyncQueue(resumed, 1, 1, revision);
      },
      progress: () => progress('air', ['intro', 'string']),
    });
    // An edit made while the reset runs is dropped by the stop, so the fresh queue has to take it again.
    queue.enqueue(progress('air', ['intro', 'string']));
    release();

    await expect(reset).rejects.toThrow('offline');
    // The save in flight raised the revision to 6; starting the fresh queue at 5 would cost a conflict.
    expect(revisions).toEqual([6]);
    await vi.waitFor(() => expect(resumed).toHaveBeenCalledTimes(1));
    expect(resumed.mock.calls[0]?.[0]).toMatchObject({ progress: { currentStepId: 'air' }, baseRevision: 6 });
  });
});
