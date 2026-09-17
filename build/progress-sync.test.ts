import { describe, expect, it, vi } from 'vitest';
import { mergeProgress, ProgressSyncQueue, type ProgressValue } from '../src/progress/core.ts';

type Step = 'intro' | 'string' | 'air' | 'checkpoint' | 'complete';
const order: readonly Step[] = ['intro', 'string', 'air', 'checkpoint', 'complete'];
const progress = (currentStepId: Step, completedStepIds: Step[] = []): ProgressValue<Step> => ({
  currentStepId, completedStepIds, checkpointPassed: completedStepIds.includes('checkpoint'), completedAt: null,
});

describe('progress sync core', () => {
  it('merges monotonic progress and keeps the earliest completion', () => {
    expect(mergeProgress(
      { ...progress('air', ['intro', 'string']), completedAt: '2026-09-16T12:00:00.000Z' },
      { ...progress('checkpoint', ['intro', 'air', 'checkpoint']), completedAt: '2026-09-15T12:00:00.000Z' },
      order,
    )).toEqual({
      currentStepId: 'checkpoint',
      completedStepIds: ['intro', 'string', 'air', 'checkpoint'],
      checkpointPassed: true,
      completedAt: '2026-09-15T12:00:00.000Z',
    });
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
});
