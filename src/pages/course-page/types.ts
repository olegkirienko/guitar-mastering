import type { LessonStepLink } from '@/components/lesson/lesson-step-list/types';

export type CourseLessonStatus = 'locked' | 'not-started' | 'in-progress' | 'completed';

export type CourseLessonView = {
  routeId: string;
  title: string;
  stageLabel: string;
  status: CourseLessonStatus;
  steps: LessonStepLink[];
  currentStepId?: string;
};

export type CourseStageView = {
  label: string;
  completed: number;
  total: number;
  lessons: CourseLessonView[];
};
