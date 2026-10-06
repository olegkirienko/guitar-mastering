import { CourseLesson } from '@/pages/course-page/components/course-lesson/course-lesson';
import type { CourseStageView } from '@/pages/course-page/types';
import { useId } from 'react';

export function CourseStage({ stage }: { stage: CourseStageView }) {
  // The label carries spaces and a separator, so the heading id comes from React, not from the text.
  const headingId = useId();

  return <section aria-labelledby={headingId}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 id={headingId} className="text-lg font-semibold tracking-tight text-primary">{stage.label}</h2>
      <p className="text-sm text-tertiary">{stage.completed} з {stage.total} уроків</p>
    </div>
    <div className="mt-5 space-y-5">
      {stage.lessons.map((lesson) => <CourseLesson key={lesson.routeId} lesson={lesson} />)}
    </div>
  </section>;
}
