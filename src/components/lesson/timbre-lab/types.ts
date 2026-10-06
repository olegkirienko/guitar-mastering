import type { OvertoneMixerContent } from '@/components/lesson/overtone-mixer/types';
import type { SpectrumBarsContent } from '@/components/lesson/spectrum-bars/types';
import type { EnvelopeControlsContent } from '@/components/lesson/timbre-lab/components/envelope-controls/types';
import type { EnvelopeWords, OvertoneLevel, OvertoneMultiple, TimbrePresetId, TimbreSound, WaveWords } from '@/data/lessons/stage-01-lesson-04-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

// One mode per screen; later screens of the lesson add their own.
export type TimbreLabMode = 'overtones' | 'spectrum' | 'envelope' | 'full';

export interface TimbreLabModeConfig {
  multiples: readonly OvertoneMultiple[];
  levels: readonly OvertoneLevel[];
  // The sum alone, or the sum over the thin lines it is made of.
  showPartials: boolean;
  // An experiment about something else keeps the mix visible but out of reach, so the
  // learner can see for themselves that it did not move.
  lockedOvertones: boolean;
}

export interface TimbreLabPresets {
  label: string;
  options: readonly { id: TimbrePresetId; label: string }[];
  resetLabel: string;
  // What the announcement says when one of these buttons is used.
  status: { preset: string; reset: string };
}

export interface TimbreLabContent {
  title: string;
  note: string;
  mixer: OvertoneMixerContent;
  listenLabel: string;
  levels: Readonly<Record<OvertoneLevel, string>>;
  // The consequence of every change, announced without moving the focus. The words
  // are per screen: a wave is only called an overtone once the screen has named it.
  status: { overtone: string; samePitch: string };
  // Only the checkpoint lets the pitch itself be chosen; every other screen fixes it,
  // so that nothing there can move the pitch while a question is about the timbre.
  fundamental?: { label: string; status: string };
  // Each screen shows only the drawings and controls its own question is about.
  waveLabel?: string;
  spectrum?: SpectrumBarsContent;
  envelope?: EnvelopeControlsContent;
  presets?: TimbreLabPresets;
}

export interface TimbreLabProps {
  mode: TimbreLabMode;
  content: TimbreLabContent;
  words: WaveWords;
  envelopeWords: EnvelopeWords;
  sound: TimbreSound;
  // The sound «Скинути» goes back to.
  start: TimbreSound;
  onChange: (sound: TimbreSound) => void;
  audio: LessonTwoAudio;
}
