export type LessonStepLink = {
  id: string;
  title: string;
  href: string;
  reachable: boolean;
};

export interface LessonStepListProps {
  steps: readonly LessonStepLink[];
  currentStepId?: string;
  label: string;
}
