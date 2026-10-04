import { courseLessons } from '@/progress/course/constants';
import type { CourseLesson } from '@/progress/course/types';
import type { ProgressItem } from '@/progress/core/types';

// A lesson opens once the lesson before it in course order has completedAt.
export function isLessonOpen(routeId: string, items: readonly ProgressItem[], lessons: readonly CourseLesson[] = courseLessons): boolean {
  const previous = lessons[lessons.findIndex((lesson) => lesson.routeId === routeId) - 1];
  return !previous || items.some((item) => item.lessonId === previous.lessonId && item.progress.completedAt !== null);
}
