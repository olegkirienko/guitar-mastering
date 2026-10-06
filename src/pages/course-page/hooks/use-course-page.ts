import { useCourseProgress } from '@/hooks/use-course-progress/use-course-progress';
import type { CourseLessonView } from '@/pages/course-page/types';
import { groupByStage } from '@/pages/course-page/utils/group-by-stage';
import { courseLessons } from '@/progress/course/constants';
import { resolveResumePath } from '@/progress/core/utils/resolve-resume-path';

export function useCoursePage() {
  const course = useCourseProgress();
  const itemOf = (lessonId: string) => course.items.find((item) => item.lessonId === lessonId);
  const lessons: CourseLessonView[] = courseLessons.map((lesson, index) => {
    const item = itemOf(lesson.lessonId);
    const previous = courseLessons[index - 1];
    const locked = Boolean(previous) && !itemOf(previous?.lessonId ?? '')?.progress.completedAt;
    const reachable = locked ? [] : lesson.reachableSteps(item?.progress ?? null);
    return {
      routeId: lesson.routeId,
      title: lesson.title,
      stageLabel: lesson.stageLabel,
      status: locked ? 'locked' : !item ? 'not-started' : item.progress.completedAt ? 'completed' : 'in-progress',
      currentStepId: item && !locked ? lesson.currentStep(item.progress) : undefined,
      steps: lesson.steps.map((step) => ({
        ...step,
        href: `/lessons/${lesson.routeId}/${step.id}`,
        reachable: reachable.includes(step.id),
      })),
    };
  });
  return { course, lessons, stages: groupByStage(lessons), resumePath: resolveResumePath(course.items, courseLessons) };
}
