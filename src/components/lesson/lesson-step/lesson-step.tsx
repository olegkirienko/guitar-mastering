import { useLessonStep } from '@/components/lesson/lesson-step/hooks/use-lesson-step';
import type { LessonStepProps } from '@/components/lesson/lesson-step/types';

export function LessonStep({ title, intro, shouldFocus = false, children }: LessonStepProps) {
  const { headingRef, titleId } = useLessonStep({ shouldFocus });
  return <section className="rounded-xl border border-secondary bg-primary p-6 shadow-xs sm:p-8" aria-labelledby={titleId}>
    <h2 ref={headingRef} id={titleId} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">{title}</h2>
    {intro && <p className="mt-3 max-w-2xl text-base leading-7 text-tertiary">{intro}</p>}
    <div className="mt-6">{children}</div>
  </section>;
}
