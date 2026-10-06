export type CourseStep = { id: string; title: string };

export type CourseLesson = {
  routeId: string;
  lessonId: string;
  title: string;
  // The stage the lesson belongs to, taken from the lesson content so the label has one source.
  stageLabel: string;
  steps: readonly CourseStep[];
  // Parses a stored progress value with the lesson's own rules and lists the steps it can open.
  reachableSteps(progress: unknown): string[];
  currentStep(progress: unknown): string;
};
