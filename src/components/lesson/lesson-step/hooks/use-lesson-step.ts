import type { LessonStepProps } from '@/components/lesson/lesson-step/types';
import { useEffect, useId, useRef } from 'react';

export function useLessonStep({ shouldFocus }: Pick<LessonStepProps, 'shouldFocus'>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useEffect(() => { if (shouldFocus) headingRef.current?.focus(); }, [shouldFocus]);

  return { headingRef, titleId };
}
