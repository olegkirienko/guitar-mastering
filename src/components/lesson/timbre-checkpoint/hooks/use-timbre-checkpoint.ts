import { useRef, useState } from 'react';
import type { TimbreCheckpointProps } from '@/components/lesson/timbre-checkpoint/types';
import { checkpointStarts } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { PairSoundId, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';
import { checkPair, checkpointPassed } from '@/data/lessons/stage-01-lesson-04-model/utils/checkpoint';

export function useTimbreCheckpoint({ content, passed, onPass }: Pick<TimbreCheckpointProps, 'content' | 'passed' | 'onPass'>) {
  // Session-only, like Lesson 3: only `checkpointPassed` is saved, never the sounds
  // the learner built or how many times they checked them.
  const [sounds, setSounds] = useState<Record<PairSoundId, TimbreSound>>(checkpointStarts);
  const [solved, setSolved] = useState(passed);
  const [checkStatus, setCheckStatus] = useState('');
  const [correctQuestionIds, setCorrectQuestionIds] = useState<readonly string[]>([]);
  const reported = useRef(passed);
  const questionIds = content.questions.map((question) => question.id);
  const pitches = content.tabs.map((tab) => `${tab.short} — ${sounds[tab.id].fundamental} Гц`).join(', ');

  const report = (isSolved: boolean, correct: readonly string[]) => {
    if (reported.current || !checkpointPassed(isSolved, correct, questionIds)) return;
    reported.current = true;
    onPass();
  };

  // The result belongs to the pair that was checked. Editing a sound takes it back, so
  // the checkpoint can never be passed on a pair the learner has since taken apart, and
  // the line under the button never describes sounds that are no longer there.
  const changeSound = (id: PairSoundId, next: TimbreSound) => {
    setSounds((current) => ({ ...current, [id]: next }));
    setSolved(false);
    setCheckStatus('');
  };

  const check = () => {
    const result = checkPair(sounds.a, sounds.b);
    setCheckStatus(result === 'differentPitch' ? `${content.results.differentPitch} ${pitches}.` : content.results[result]);
    if (result !== 'solved') return;
    setSolved(true);
    report(true, correctQuestionIds);
  };

  const answerQuestion = (id: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    const next = Array.from(new Set([...correctQuestionIds, id]));
    setCorrectQuestionIds(next);
    report(solved, next);
  };

  return {
    sounds,
    summary: `${content.summaryLabel} ${pitches}.`,
    changeSound,
    check,
    checkStatus,
    answerQuestion,
    isPassed: passed || checkpointPassed(solved, correctQuestionIds, questionIds),
  };
}
