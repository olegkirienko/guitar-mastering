import type { ProgressValue } from '@/progress/core/types';
import type { ResetLessonProgressOptions } from '@/progress/use-lesson-progress/types';

// The queue stops first, so no save is in flight when the clear runs. When the clear fails nothing
// was cleared, so the lesson keeps saving through a fresh queue: it starts from the revision the
// stopped queue reached, including the save it was flushing, and takes the current progress again,
// because stopping discarded whatever was still waiting behind that save.
export async function resetLessonProgress<Value extends ProgressValue>(
  { queue, clear, rebuild, progress }: ResetLessonProgressOptions<Value>,
): Promise<void> {
  await queue?.stop();
  try {
    await clear();
  } catch (error) {
    rebuild(queue?.snapshot.revision ?? 0)?.enqueue(progress());
    throw error;
  }
}
