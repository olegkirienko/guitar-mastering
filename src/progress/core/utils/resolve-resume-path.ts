import type { ProgressItem } from '@/progress/core/types';

export type ResumeLesson = { lessonId: string; routeId: string };

function newest(items: readonly ProgressItem[]): ProgressItem | undefined {
  return items.reduce<ProgressItem | undefined>(
    (latest, item) => !latest || Date.parse(item.updatedAt) > Date.parse(latest.updatedAt) ? item : latest,
    undefined,
  );
}

export function resolveResumePath(items: readonly ProgressItem[], lessonOrder: readonly ResumeLesson[]): string {
  const routeIds = new Map(lessonOrder.map((lesson) => [lesson.lessonId, lesson.routeId]));
  const known = items.filter((item) => routeIds.has(item.lessonId));
  const pathOf = (item: ProgressItem) => `/lessons/${routeIds.get(item.lessonId)}/${item.progress.currentStepId}`;
  const firstLesson = lessonOrder[0];
  if (known.length === 0) return firstLesson ? `/lessons/${firstLesson.routeId}/intro` : '/course';

  // 1. The most recently touched unfinished lesson; revisiting a finished one does not move the learner.
  const inProgress = newest(known.filter((item) => item.progress.completedAt === null));
  if (inProgress) return pathOf(inProgress);

  // 2. The first lesson not started yet whose predecessor is completed.
  const byId = new Map(known.map((item) => [item.lessonId, item]));
  const next = lessonOrder.find((lesson, index) => {
    if (byId.has(lesson.lessonId)) return false;
    const previous = lessonOrder[index - 1];
    return !previous || byId.get(previous.lessonId)?.progress.completedAt != null;
  });
  if (next) return `/lessons/${next.routeId}/intro`;

  // 3. Everything available is completed: the most recently touched lesson.
  const latest = newest(known);
  return latest ? pathOf(latest) : '/course';
}
