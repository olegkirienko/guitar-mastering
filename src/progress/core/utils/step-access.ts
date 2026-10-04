import type { ProgressValue } from '@/progress/core/types';

// Reach follows the lesson's own normalization: a step is reachable exactly
// when normalizing a progress that requests it keeps it as the current step.
export function isStepReachable<StepId extends string, Local extends ProgressValue<StepId>>(
  progress: Local,
  stepId: string,
  stepOrder: readonly StepId[],
  normalize: (progress: Local) => Local,
): stepId is StepId {
  if (!stepOrder.includes(stepId as StepId)) return false;
  return normalize({ ...progress, currentStepId: stepId as StepId }).currentStepId === stepId;
}

export function highestReachableStep<StepId extends string, Local extends ProgressValue<StepId>>(
  progress: Local,
  stepOrder: readonly StepId[],
  normalize: (progress: Local) => Local,
): StepId {
  const last = stepOrder[stepOrder.length - 1] as StepId;
  return normalize({ ...progress, currentStepId: last }).currentStepId;
}
