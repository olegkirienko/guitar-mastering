import type { ProgressValue } from '@/progress/core/types';

export function mergeProgress<StepId extends string>(
  local: ProgressValue<StepId>,
  remote: ProgressValue<StepId>,
  stepOrder: readonly StepId[],
): ProgressValue<StepId> {
  const completedStepIds = stepOrder.filter((step) => local.completedStepIds.includes(step) || remote.completedStepIds.includes(step));
  const completionTimes = [local.completedAt, remote.completedAt].filter((value): value is string => value !== null);
  return {
    // The position is the latest action, so the local step wins; reach (completed steps) only grows.
    currentStepId: local.currentStepId,
    completedStepIds,
    checkpointPassed: local.checkpointPassed || remote.checkpointPassed,
    completedAt: completionTimes.length === 0
      ? null
      : completionTimes.reduce((earliest, value) => Date.parse(value) < Date.parse(earliest) ? value : earliest),
  };
}
