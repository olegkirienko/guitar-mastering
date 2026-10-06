import type { LessonStepLink } from '@/components/lesson/lesson-step-list/types';

export interface LessonShellProps {
  stageLabel: string;
  title: string;
  estimatedTime: string;
  // One short caption per step id; the step title is used when a key is missing.
  stepLabels: Record<string, string>;
  steps: readonly LessonStepLink[];
  currentStepId: string;
  children: React.ReactNode;
}
