interface LessonStepNavAction {
  label: string;
  onClick: () => void;
}

export interface LessonStepNavProps {
  // Both are optional: the first step has no back, and a step reveals next only once it is complete.
  back?: LessonStepNavAction;
  next?: LessonStepNavAction;
}
