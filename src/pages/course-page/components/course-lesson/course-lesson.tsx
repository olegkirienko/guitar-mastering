import { Badge } from '@/components/base/badges/badges';
import { LessonStepList } from '@/components/lesson/lesson-step-list/lesson-step-list';
import { statusBadges } from '@/pages/course-page/constants';
import type { CourseLessonView } from '@/pages/course-page/types';

export function CourseLesson({ lesson }: { lesson: CourseLessonView }) {
  const badge = statusBadges[lesson.status];
  return <section aria-labelledby={`course-lesson-${lesson.routeId}`} className="rounded-xl border border-secondary bg-primary p-5 shadow-xs sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-quaternary">Урок {lesson.routeId}</p>
        <h2 id={`course-lesson-${lesson.routeId}`} className="mt-1 text-lg font-semibold text-primary">{lesson.title}</h2>
      </div>
      <Badge color={badge.color} size="md">{badge.label}</Badge>
    </div>
    <div className="mt-4">
      <LessonStepList steps={lesson.steps} currentStepId={lesson.currentStepId} label={`Кроки уроку ${lesson.routeId}`} />
    </div>
  </section>;
}
