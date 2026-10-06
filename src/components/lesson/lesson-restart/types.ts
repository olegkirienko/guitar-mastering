export type LessonRestartProps = {
  // Clears this lesson and every lesson after it, then returns to the first step; rejects on failure.
  onConfirm: () => Promise<void>;
};
