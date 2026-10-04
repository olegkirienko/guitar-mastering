import type { LessonStepLink } from '@/components/lesson/lesson-step-list/types';

export type LessonRoute<StepId extends string> =
  | { kind: 'loading' }
  | { kind: 'unavailable'; retry(): void }
  | { kind: 'redirect'; to: string }
  | { kind: 'ready'; stepId: StepId; steps: LessonStepLink[] };
