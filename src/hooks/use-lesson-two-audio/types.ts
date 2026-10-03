export type LessonAudioStatus = 'idle' | 'ready' | 'unavailable' | 'blocked';

export interface LessonTwoAudio {
  enabled: boolean;
  status: LessonAudioStatus;
  enable(): Promise<boolean>;
  playTone(frequency: number, gain: number): void;
  playPluck(frequency: number): void;
  stop(): void;
}
