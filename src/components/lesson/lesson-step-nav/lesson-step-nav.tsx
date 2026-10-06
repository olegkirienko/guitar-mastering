import type { LessonStepNavProps } from '@/components/lesson/lesson-step-nav/types';
import { Button } from '@/components/base/buttons/button';
import { ArrowLeft, ArrowRight } from '@untitledui/icons';

export function LessonStepNav({ back, next }: LessonStepNavProps) {
  if (!back && !next) return null;

  return <div className="flex flex-wrap items-center gap-3">
    {back && <Button color="link-gray" size="lg" iconLeading={ArrowLeft} onClick={back.onClick}>{back.label}</Button>}
    {next && <Button size="lg" iconTrailing={ArrowRight} onClick={next.onClick}>{next.label}</Button>}
  </div>;
}
