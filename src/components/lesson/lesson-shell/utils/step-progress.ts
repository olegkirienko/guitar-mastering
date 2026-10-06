import type { LessonStepLink } from '@/components/lesson/lesson-step-list/types';

// The derivation needs only the identity and the caption fallback of a step.
type StepSummary = Pick<LessonStepLink, 'id' | 'title'>;

export interface StepProgress {
  // Zero-based position of the current step; an unknown step id clamps to the first one.
  index: number;
  total: number;
  caption: string;
}

export function deriveStepProgress(steps: readonly StepSummary[], currentStepId: string, stepLabels: Record<string, string>): StepProgress {
  const index = Math.max(steps.findIndex((step) => step.id === currentStepId), 0);
  return { index, total: steps.length, caption: stepLabels[currentStepId] ?? steps[index]?.title ?? '' };
}
