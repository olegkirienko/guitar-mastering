export type LessonAudioStatus = 'idle' | 'ready' | 'unavailable' | 'blocked';

export interface SoundPartial {
  frequency: number;
  strength: number;
}

// A sound given as its own frequencies: what to add up, and how it starts and ends.
export interface PartialsSound {
  partials: readonly SoundPartial[];
  attackSeconds: number;
  // `null` holds the sound at full strength instead of letting it fall.
  decaySeconds: number | null;
  durationSeconds: number;
}

export interface LessonTwoAudio {
  enabled: boolean;
  status: LessonAudioStatus;
  enable(): Promise<boolean>;
  playTone(frequency: number, gain: number): void;
  playPluck(frequency: number, gain?: number): void;
  // A tone that glides from one frequency to another with no steps in between.
  playSweep(from: number, to: number, seconds: number, gain: number): void;
  playPartials(sound: PartialsSound, gain?: number): void;
  stop(): void;
}
