import type { OvertoneMixerContent } from '@/components/lesson/overtone-mixer/types';
import type { SpectrumBarsContent } from '@/components/lesson/spectrum-bars/types';
import type { OvertoneLevel, OvertoneMultiple, TimbrePresetId, TimbreSound, WaveWords } from '@/data/lessons/stage-01-lesson-04-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

// One mode per screen; later screens of the lesson add their own.
export type TimbreLabMode = 'overtones' | 'spectrum';

export interface TimbreLabModeConfig {
  multiples: readonly OvertoneMultiple[];
  levels: readonly OvertoneLevel[];
  // The sum alone, or the sum over the thin lines it is made of.
  showPartials: boolean;
}

export interface TimbreLabPresets {
  label: string;
  options: readonly { id: TimbrePresetId; label: string }[];
  resetLabel: string;
}

export interface TimbreLabContent {
  title: string;
  note: string;
  mixer: OvertoneMixerContent;
  waveLabel: string;
  listenLabel: string;
  levels: Readonly<Record<OvertoneLevel, string>>;
  // The consequence of every change, announced without moving the focus. The words
  // are per screen: a wave is only called an overtone once the screen has named it.
  status: { overtone: string; preset: string; reset: string; samePitch: string };
  // A screen that has not named the spectrum yet leaves these out.
  spectrum?: SpectrumBarsContent;
  presets?: TimbreLabPresets;
}

export interface TimbreLabProps {
  mode: TimbreLabMode;
  content: TimbreLabContent;
  words: WaveWords;
  sound: TimbreSound;
  // The sound «Скинути» goes back to.
  start: TimbreSound;
  onChange: (sound: TimbreSound) => void;
  audio: LessonTwoAudio;
}
