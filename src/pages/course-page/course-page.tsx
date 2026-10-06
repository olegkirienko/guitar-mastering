import { ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { PageSkeleton } from '@/components/page-skeleton/page-skeleton';
import { ServerUnavailable } from '@/components/server-unavailable/server-unavailable';
import { CourseStage } from '@/pages/course-page/components/course-stage/course-stage';
import { useCoursePage } from '@/pages/course-page/hooks/use-course-page';

export function CoursePage() {
  const { course, stages, resumePath } = useCoursePage();
  if (course.status === 'error') return <ServerUnavailable onRetry={course.retry} />;
  if (course.status !== 'ready') return <PageSkeleton />;
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-primary">Курс</h1>
        <p className="mt-2 text-sm leading-6 text-tertiary">Повертайся до будь-якого кроку, який уже відкрив.</p>
      </div>
      <Button href={resumePath} size="lg" iconTrailing={ArrowRight}>Продовжити</Button>
    </div>
    <div className="mt-8 space-y-10">
      {stages.map((stage) => <CourseStage key={stage.label} stage={stage} />)}
    </div>
  </main>;
}
