export type CourseStep = { id: string; title: string };

export type CourseLesson = {
  routeId: string;
  lessonId: string;
  title: string;
  steps: readonly CourseStep[];
  // Parses a stored progress value with the lesson's own rules and lists the steps it can open.
  reachableSteps(progress: unknown): string[];
  currentStep(progress: unknown): string;
};
