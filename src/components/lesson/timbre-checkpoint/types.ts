import type { TimbreLabContent } from '@/components/lesson/timbre-lab/types';
import type { EnvelopeWords, PairResult, PairSoundId, WaveWords } from '@/data/lessons/stage-01-lesson-04-model/types';
import type { LessonTwoAudio } from '@/hooks/use-lesson-two-audio/types';

export interface TimbreCheckpointTab {
  id: PairSoundId;
  label: string;
  // The same sound in the one-line summary above the tabs: «А — 220 Гц, Б — 330 Гц».
  short: string;
}

export interface TimbreCheckpointQuestion {
  id: string;
  question: string;
  choices: readonly { id: string; label: string; feedback: string }[];
  correctChoiceId: string;
}

export interface TimbreCheckpointContent {
  taskTitle: string;
  taskGoal: string;
  summaryLabel: string;
  tabs: readonly TimbreCheckpointTab[];
  checkLabel: string;
  // What «Перевірити» says. `differentPitch` is followed by the two pitches, so the
  // learner reads which sound is where instead of being told to look again.
  results: Readonly<Record<PairResult, string>>;
  questionsTitle: string;
  questions: readonly TimbreCheckpointQuestion[];
  passed: string;
}

export interface TimbreCheckpointProps {
  content: TimbreCheckpointContent;
  lab: TimbreLabContent;
  words: WaveWords;
  envelopeWords: EnvelopeWords;
  audio: LessonTwoAudio;
  passed: boolean;
  onPass: () => void;
}
