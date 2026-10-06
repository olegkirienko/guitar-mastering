import type { CourseLessonView, CourseStageView } from '@/pages/course-page/types';

// Consecutive lessons with the same label form one stage, so course order stays the only order.
export function groupByStage(lessons: readonly CourseLessonView[]): CourseStageView[] {
  return lessons.reduce<CourseStageView[]>((stages, lesson) => {
    const current = stages.at(-1);
    const stage = current?.label === lesson.stageLabel ? current : null;
    if (!stage) stages.push({ label: lesson.stageLabel, completed: 0, total: 0, lessons: [] });
    const target = stage ?? stages[stages.length - 1];
    target.lessons.push(lesson);
    target.total += 1;
    if (lesson.status === 'completed') target.completed += 1;
    return stages;
  }, []);
}
