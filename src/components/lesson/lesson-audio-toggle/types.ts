export type LessonAudioToggleProps = {
  audioEnabled: boolean;
  // True when the browser refused to start audio and the learner can try again.
  blocked: boolean;
  message: string | null;
  onToggle: () => void;
};
