import type { LessonStepLink } from '@/components/lesson/lesson-step-list/types';

export interface LessonShellProps {
  stageLabel: string;
  title: string;
  estimatedTime: string;
  progressStops: readonly string[];
  currentStop: number;
  steps: readonly LessonStepLink[];
  currentStepId: string;
  children: React.ReactNode;
}
